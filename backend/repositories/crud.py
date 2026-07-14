import json
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import selectinload
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from backend.models import AnswerScore, DecisionPath, EmbeddingCache, InterviewMessage, InterviewReport, InterviewSession, JobDescription, Resume
from backend.schemas import AnswerScore as AnswerScoreSchema
from backend.schemas import DimensionScore, Experience, InterviewMessage as InterviewMessageSchema
from backend.schemas import InterviewReport as InterviewReportSchema
from backend.schemas import InterviewSession as InterviewSessionSchema
from backend.schemas import ParsedResume, ProgressPoint, Project


def _new_uuid() -> str:
    import uuid

    return str(uuid.uuid4())


async def create_resume(
    session: AsyncSession,
    parsed: ParsedResume,
    raw_text: Optional[str] = None,
) -> Resume:
    resume = Resume(
        id=_new_uuid(),
        name=parsed.name,
        skills=parsed.skills,
        projects=[p.model_dump() for p in parsed.projects],
        experiences=[e.model_dump() for e in parsed.experiences],
        raw_text=raw_text,
    )
    session.add(resume)
    await session.commit()
    await session.refresh(resume)
    return resume


async def create_job_description(session: AsyncSession, text: str) -> JobDescription:
    jd = JobDescription(id=_new_uuid(), text=text)
    session.add(jd)
    await session.commit()
    await session.refresh(jd)
    return jd


async def create_interview_session(
    session: AsyncSession,
    resume_id: str,
    job_description_id: str,
    max_rounds: int = 5,
) -> InterviewSession:
    interview = InterviewSession(
        id=_new_uuid(),
        resume_id=resume_id,
        job_description_id=job_description_id,
        status="ongoing",
        max_rounds=max_rounds,
    )
    session.add(interview)
    await session.commit()
    await session.refresh(interview)
    return interview


async def get_resume(session: AsyncSession, resume_id: str) -> Optional[Resume]:
    stmt = select(Resume).where(Resume.id == resume_id)
    result = await session.exec(stmt)
    return result.first()


async def get_interview_session(session: AsyncSession, session_id: str) -> Optional[InterviewSession]:
    stmt = (
        select(InterviewSession)
        .where(InterviewSession.id == session_id)
        .options(selectinload(InterviewSession.resume))
        .options(selectinload(InterviewSession.job_description))
    )
    result = await session.exec(stmt)
    return result.first()


async def list_interview_sessions(session: AsyncSession, limit: int = 20) -> list[InterviewSession]:
    stmt = (
        select(InterviewSession)
        .options(selectinload(InterviewSession.resume))
        .options(selectinload(InterviewSession.job_description))
        .order_by(InterviewSession.created_at.desc())
        .limit(limit)
    )
    result = await session.exec(stmt)
    return list(result.all())


async def add_message(
    session: AsyncSession,
    session_id: str,
    message: InterviewMessageSchema,
) -> InterviewMessage:
    db_message = InterviewMessage(
        session_id=session_id,
        role=message.role,
        content=message.content,
        type=message.type,
    )
    session.add(db_message)
    await session.commit()
    await session.refresh(db_message)
    return db_message


async def get_messages(session: AsyncSession, session_id: str) -> list[InterviewMessage]:
    stmt = (
        select(InterviewMessage)
        .where(InterviewMessage.session_id == session_id)
        .order_by(InterviewMessage.created_at)
    )
    result = await session.exec(stmt)
    return list(result.all())


async def add_score(
    session: AsyncSession,
    session_id: str,
    score: AnswerScoreSchema,
) -> AnswerScore:
    db_score = AnswerScore(
        session_id=session_id,
        relevance=score.relevance,
        depth=score.depth,
        completeness=score.completeness,
    )
    session.add(db_score)
    await session.commit()
    await session.refresh(db_score)
    return db_score


async def get_scores(session: AsyncSession, session_id: str) -> list[AnswerScore]:
    stmt = select(AnswerScore).where(AnswerScore.session_id == session_id).order_by(AnswerScore.created_at)
    result = await session.exec(stmt)
    return list(result.all())


async def finish_session(session: AsyncSession, session_id: str) -> Optional[InterviewSession]:
    db_session = await get_interview_session(session, session_id)
    if db_session is None:
        return None
    db_session.status = "finished"
    db_session.finished_at = datetime.utcnow()
    session.add(db_session)
    await session.commit()
    await session.refresh(db_session)
    return db_session


async def update_session_progress(
    session: AsyncSession,
    session_id: str,
    current_question_id: Optional[str] = None,
    asked_ids: Optional[list[str]] = None,
) -> None:
    db_session = await get_interview_session(session, session_id)
    if db_session is None:
        return
    if current_question_id is not None:
        db_session.current_question_id = current_question_id
    if asked_ids is not None:
        db_session.asked_ids_json = json.dumps(asked_ids, ensure_ascii=False)
    session.add(db_session)
    await session.commit()


async def save_report(
    session: AsyncSession,
    session_id: str,
    report: InterviewReportSchema,
) -> InterviewReport:
    db_report = InterviewReport(
        session_id=session_id,
        dimensions=[d.model_dump() for d in report.dimensions],
        progress=[p.model_dump() for p in report.progress],
        suggestions=report.suggestions,
    )
    session.add(db_report)
    await session.commit()
    await session.refresh(db_report)
    return db_report


async def get_report(session: AsyncSession, session_id: str) -> Optional[InterviewReport]:
    stmt = select(InterviewReport).where(InterviewReport.session_id == session_id)
    result = await session.exec(stmt)
    return result.first()


def _resume_to_schema(resume: Optional[Resume]) -> ParsedResume:
    if resume is None:
        return ParsedResume(name="Unknown", skills=[], projects=[], experiences=[])
    return ParsedResume(
        name=resume.name,
        skills=resume.skills,
        projects=[Project(**p) for p in resume.projects] if resume.projects else [],
        experiences=[Experience(**e) for e in resume.experiences] if resume.experiences else [],
    )


def _session_to_schema(
    db_session: InterviewSession,
    messages: list[InterviewMessage],
    scores: list[AnswerScore],
) -> InterviewSessionSchema:
    resume = _resume_to_schema(db_session.resume)
    jd_text = db_session.job_description.text if db_session.job_description else ""
    asked_ids = json.loads(db_session.asked_ids_json) if db_session.asked_ids_json else []
    return InterviewSessionSchema(
        id=db_session.id,
        resume=resume,
        jobDescription=jd_text,
        messages=[
            InterviewMessageSchema(role=m.role, content=m.content, type=m.type) for m in messages
        ],
        scores=[
            AnswerScoreSchema(relevance=s.relevance, depth=s.depth, completeness=s.completeness)
            for s in scores
        ],
        status=db_session.status,  # type: ignore[arg-type]
        maxRounds=db_session.max_rounds,
        currentQuestionId=db_session.current_question_id,
        askedIds=asked_ids,
        createdAt=db_session.created_at.isoformat(),
        finishedAt=db_session.finished_at.isoformat() if db_session.finished_at else None,
    )


def _report_to_schema(
    db_report: InterviewReport,
    messages: list[InterviewMessage],
) -> InterviewReportSchema:
    return InterviewReportSchema(
        sessionId=db_report.session_id,
        dimensions=[DimensionScore(**d) for d in db_report.dimensions],
        progress=[ProgressPoint(**p) for p in db_report.progress],
        suggestions=db_report.suggestions,
        transcript=[
            InterviewMessageSchema(role=m.role, content=m.content, type=m.type) for m in messages
        ],
    )


async def create_decision_path(
    session: AsyncSession,
    session_id: str,
    message_id: Optional[str],
    nodes: list[dict],  # [{name, status, note}, ...]
) -> DecisionPath:
    """持久化行为树决策路径"""
    dp = DecisionPath(
        id=_new_uuid(),
        session_id=session_id,
        message_id=message_id,
        nodes_json=json.dumps(nodes, ensure_ascii=False),
    )
    session.add(dp)
    await session.commit()
    await session.refresh(dp)
    return dp


async def get_decision_paths_by_session(
    session: AsyncSession,
    session_id: str,
) -> list[DecisionPath]:
    """获取某会话的所有决策路径，按时间排序"""
    stmt = select(DecisionPath).where(DecisionPath.session_id == session_id).order_by(DecisionPath.created_at)
    result = await session.exec(stmt)
    return list(result.all())


async def get_embedding_cache(
    session: AsyncSession,
    text_hash: str,
    model: str,
) -> Optional[EmbeddingCache]:
    """根据文本哈希和模型名查询 embedding 缓存"""
    stmt = select(EmbeddingCache).where(
        EmbeddingCache.text_hash == text_hash,
        EmbeddingCache.model == model,
    )
    result = await session.exec(stmt)
    return result.first()


async def create_embedding_cache(
    session: AsyncSession,
    text_hash: str,
    text: str,
    vector: list[float],
    model: str,
) -> EmbeddingCache:
    """创建 embedding 缓存记录"""
    cache = EmbeddingCache(
        id=_new_uuid(),
        text_hash=text_hash,
        text=text,
        vector_json=json.dumps(vector, ensure_ascii=False),
        model=model,
    )
    session.add(cache)
    await session.commit()
    await session.refresh(cache)
    return cache

