import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession

# 配置 backend.* 日志输出到控制台（uvicorn 默认仅显示自身 logger）
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

logger = logging.getLogger(__name__)


async def _retry_llm_call(coro_factory, attempts: int = 3, base_delay: float = 1.5):
    """重试网络/超时类瞬时错误。3 次尝试，退避 1.5s / 3s。"""
    transient: tuple = (asyncio.TimeoutError, ConnectionError)
    try:
        import httpx
        transient = transient + (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.ConnectError)
    except ImportError:
        pass

    last_exc = None
    for i in range(attempts):
        try:
            return await coro_factory()
        except transient as exc:
            last_exc = exc
            if i == attempts - 1:
                break
            delay = base_delay * (2 ** i)
            logger.warning(
                "LLM call transient failure (attempt %d/%d): %s. Retrying in %.1fs",
                i + 1, attempts, exc, delay,
            )
            await asyncio.sleep(delay)
    raise last_exc

from backend import models
from backend.config import settings
from backend.db import create_db_and_tables, get_session
from backend.interview.graph import generate_report_from_session, run_answer_graph
from backend.interview.question_bank import select_question
from backend.match.matcher import match_resume_jd
from backend.repositories import crud
from backend.repositories.llm_config import (
    activate_llm_config,
    create_llm_config,
    delete_llm_config,
    get_active_llm_config,
    get_llm_config,
    list_llm_configs,
    update_llm_config,
)
from backend.resume.parser import parse_resume_file, parse_resume_text
from backend.schemas import (
    AnswerInput,
    AnswerResponse,
    AnswerScore,
    DecisionNode,
    DecisionPathOut,
    InterviewMessage,
    InterviewReport,
    InterviewSession,
    LLMConfigCreate,
    LLMConfigOut,
    LLMConfigUpdate,
    MatchInput,
    MatchResponse,
    ParsedResume,
    StartInterviewInput,
    StartInterviewResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_db_and_tables()
    yield


app = FastAPI(
    title="ExpSupInterviewer Backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/resume/parse", response_model=ParsedResume)
async def parse_resume_endpoint(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    session: AsyncSession = Depends(get_session),
) -> ParsedResume:
    if text:
        parsed = await _retry_llm_call(lambda: parse_resume_text(text))
        await crud.create_resume(session, parsed, raw_text=text)
        return parsed

    if file:
        content = await file.read()
        filename = file.filename or "resume.pdf"
        parsed = await _retry_llm_call(lambda: parse_resume_file(content, filename))
        await crud.create_resume(session, parsed, raw_text=None)
        return parsed

    raise HTTPException(status_code=422, detail="Either 'file' or 'text' must be provided")


@app.post("/api/match", response_model=MatchResponse)
async def match_endpoint(
    payload: MatchInput,
) -> MatchResponse:
    return await _retry_llm_call(
        lambda: match_resume_jd(payload.resume, payload.jobDescription)
    )


@app.post("/api/match/pdf")
async def match_pdf_endpoint(payload: MatchInput):
    """生成匹配报告 PDF"""
    import logging
    import urllib.parse
    logger = logging.getLogger(__name__)

    try:
        from backend.pdf_generator import MatchReportPDF

        match_result = await _retry_llm_call(
            lambda: match_resume_jd(payload.resume, payload.jobDescription)
        )

        pdf = MatchReportPDF()
        buffer = pdf.generate(payload.resume, payload.jobDescription, match_result)

        filename = f"match_report_{payload.resume.name or 'candidate'}.pdf"
        encoded_filename = urllib.parse.quote(filename)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"},
        )
    except Exception as e:
        logger.exception("PDF generation failed")
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")


@app.get("/api/match/detail", response_model=MatchResponse)
async def match_detail_endpoint(
    resume_id: str,
    jd: str,
    session: AsyncSession = Depends(get_session),
) -> MatchResponse:
    """返回包含语义相似度的详细匹配报告"""
    resume = await crud.get_resume(session, resume_id)
    if resume is None:
        raise HTTPException(status_code=404, detail="Resume not found")
    resume_parsed = crud._resume_to_schema(resume)
    return await match_resume_jd(resume_parsed, jd)


@app.post("/api/interview/start", response_model=StartInterviewResponse)
async def start_interview_endpoint(
    payload: StartInterviewInput,
    session: AsyncSession = Depends(get_session),
) -> StartInterviewResponse:
    resume = await crud.create_resume(session, payload.resume)
    jd = await crud.create_job_description(session, payload.jobDescription)
    interview = await crud.create_interview_session(session, resume.id, jd.id, payload.maxRounds)

    first_question = select_question(
        resume=payload.resume.model_dump(),
        jd=payload.jobDescription,
        asked_ids=[],
    )
    message = InterviewMessage(
        role="interviewer",
        content=first_question.text,
        type="question",
    )
    await crud.add_message(session, interview.id, message)

    return StartInterviewResponse(
        sessionId=interview.id,
        firstQuestion=message,
        questionId=first_question.id,
    )


@app.post("/api/interview/answer", response_model=AnswerResponse)
async def answer_endpoint(
    payload: AnswerInput,
    session: AsyncSession = Depends(get_session),
) -> AnswerResponse:
    db_session = await crud.get_interview_session(session, payload.sessionId)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Interview session not found")

    await crud.add_message(
        session,
        payload.sessionId,
        InterviewMessage(role="candidate", content=payload.answer),
    )

    messages = await crud.get_messages(session, payload.sessionId)
    scores = await crud.get_scores(session, payload.sessionId)

    resume = crud._resume_to_schema(db_session.resume)
    jd_text = db_session.job_description.text if db_session.job_description else ""

    result = await run_answer_graph(
        resume=resume,
        jd=jd_text,
        history=[
            InterviewMessage(role=m.role, content=m.content, type=m.type) for m in messages
        ],
        asked_ids=payload.askedIds,
        current_question_id=payload.currentQuestionId,
        answer=payload.answer,
        round=payload.round,
        max_rounds=payload.maxRounds,
    )

    result_messages = [
        InterviewMessage(role=m["role"], content=m["content"], type=m.get("type"))
        for m in result.get("messages", [])
    ]
    for msg in result_messages:
        await crud.add_message(session, payload.sessionId, msg)

    score_dicts = result.get("scores", [])
    score: Optional[AnswerScore] = None
    if score_dicts:
        score = AnswerScore(**score_dicts[0])
        await crud.add_score(session, payload.sessionId, score)

    decision_path = result.get("decision_path", [])
    if decision_path:
        await crud.create_decision_path(
            session, payload.sessionId, message_id=None, nodes=decision_path
        )

    finished = result.get("finished", False)
    if finished:
        await crud.finish_session(session, payload.sessionId)

    # 保存进度以便恢复
    next_question_id = result.get("next_question_id")
    await crud.update_session_progress(
        session,
        payload.sessionId,
        current_question_id=next_question_id or payload.currentQuestionId,
        asked_ids=payload.askedIds + ([next_question_id] if next_question_id and next_question_id != payload.currentQuestionId else []),
    )
    if next_question_id is None and result.get("need_follow_up"):
        next_question_id = payload.currentQuestionId

    return AnswerResponse(
        messages=result_messages,
        reasoning=result.get("reasoning"),
        scores=score,
        finished=finished,
        nextQuestionId=next_question_id,
        decisionPath=result.get("decision_path", []),
    )


@app.get("/api/interview/{session_id}/report", response_model=InterviewReport)
async def get_report_endpoint(
    session_id: str,
    session: AsyncSession = Depends(get_session),
) -> InterviewReport:
    db_session = await crud.get_interview_session(session, session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Interview session not found")

    existing = await crud.get_report(session, session_id)
    if existing:
        messages = await crud.get_messages(session, session_id)
        return crud._report_to_schema(existing, messages)

    messages = await crud.get_messages(session, session_id)
    scores = await crud.get_scores(session, session_id)
    resume = crud._resume_to_schema(db_session.resume)
    jd_text = db_session.job_description.text if db_session.job_description else ""

    report_dict = await generate_report_from_session(
        session_id=session_id,
        messages=[
            InterviewMessage(role=m.role, content=m.content, type=m.type) for m in messages
        ],
        scores=[
            AnswerScore(relevance=s.relevance, depth=s.depth, completeness=s.completeness)
            for s in scores
        ],
        resume=resume,
        jd=jd_text,
    )
    report = InterviewReport(**report_dict)
    await crud.save_report(session, session_id, report)
    return report


@app.get("/api/interviews", response_model=list[InterviewSession])
async def list_interviews_endpoint(
    limit: int = 20,
    session: AsyncSession = Depends(get_session),
) -> list[InterviewSession]:
    db_sessions = await crud.list_interview_sessions(session, limit)
    result = []
    for db_s in db_sessions:
        messages = await crud.get_messages(session, db_s.id)
        scores = await crud.get_scores(session, db_s.id)
        result.append(crud._session_to_schema(db_s, messages, scores))
    return result


@app.get("/api/interview/{session_id}", response_model=InterviewSession)
async def get_session_endpoint(
    session_id: str,
    session: AsyncSession = Depends(get_session),
) -> InterviewSession:
    db_session = await crud.get_interview_session(session, session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Interview session not found")

    messages = await crud.get_messages(session, session_id)
    scores = await crud.get_scores(session, session_id)
    return crud._session_to_schema(db_session, messages, scores)


@app.get("/api/interview/{session_id}/decisions", response_model=list[DecisionPathOut])
async def list_decisions_endpoint(
    session_id: str,
    session: AsyncSession = Depends(get_session),
) -> list[DecisionPathOut]:
    db_session = await crud.get_interview_session(session, session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Interview session not found")

    decision_paths = await crud.get_decision_paths_by_session(session, session_id)
    return [_decision_path_to_out(dp) for dp in decision_paths]


def _decision_path_to_out(dp: models.DecisionPath) -> DecisionPathOut:
    nodes_data = json.loads(dp.nodes_json) if dp.nodes_json else []
    return DecisionPathOut(
        id=dp.id,
        session_id=dp.session_id,
        message_id=str(dp.message_id) if dp.message_id else None,
        nodes=[DecisionNode(**n) for n in nodes_data],
        created_at=dp.created_at.isoformat(),
    )


def _llm_config_to_out(config: models.LLMConfig) -> LLMConfigOut:
    return LLMConfigOut(
        id=config.id,
        name=config.name,
        base_url=config.base_url,
        api_key=config.api_key,
        model=config.model,
        is_active=config.is_active,
        created_at=config.created_at.isoformat(),
        updated_at=config.updated_at.isoformat(),
    )


@app.get("/api/settings/llm", response_model=list[LLMConfigOut])
async def list_llm_configs_endpoint(
    session: AsyncSession = Depends(get_session),
) -> list[LLMConfigOut]:
    configs = await list_llm_configs(session)
    return [_llm_config_to_out(c) for c in configs]


@app.post("/api/settings/llm", response_model=LLMConfigOut, status_code=201)
async def create_llm_config_endpoint(
    payload: LLMConfigCreate,
    session: AsyncSession = Depends(get_session),
) -> LLMConfigOut:
    config = await create_llm_config(session, payload)
    active = await get_active_llm_config(session)
    if active is None:
        config = await activate_llm_config(session, config.id)
    return _llm_config_to_out(config)


@app.get("/api/settings/llm/{config_id}", response_model=LLMConfigOut)
async def get_llm_config_endpoint(
    config_id: str,
    session: AsyncSession = Depends(get_session),
) -> LLMConfigOut:
    config = await get_llm_config(session, config_id)
    if config is None:
        raise HTTPException(status_code=404, detail="LLM config not found")
    return _llm_config_to_out(config)


@app.put("/api/settings/llm/{config_id}", response_model=LLMConfigOut)
async def update_llm_config_endpoint(
    config_id: str,
    payload: LLMConfigUpdate,
    session: AsyncSession = Depends(get_session),
) -> LLMConfigOut:
    config = await update_llm_config(session, config_id, payload)
    if config is None:
        raise HTTPException(status_code=404, detail="LLM config not found")
    return _llm_config_to_out(config)


@app.delete("/api/settings/llm/{config_id}", status_code=204)
async def delete_llm_config_endpoint(
    config_id: str,
    session: AsyncSession = Depends(get_session),
) -> None:
    deleted = await delete_llm_config(session, config_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="LLM config not found")
    return None


@app.post("/api/settings/llm/{config_id}/activate", response_model=LLMConfigOut)
async def activate_llm_config_endpoint(
    config_id: str,
    session: AsyncSession = Depends(get_session),
) -> LLMConfigOut:
    config = await activate_llm_config(session, config_id)
    if config is None:
        raise HTTPException(status_code=404, detail="LLM config not found")
    return _llm_config_to_out(config)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host=settings.server.host, port=settings.server.port, reload=True)
