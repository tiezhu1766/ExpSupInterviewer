"""PydanticAI Agent layer for backend.llm.

Provides PydanticAI agents that return typed Pydantic models directly via
result.output, handling schema instruction, retries and validation internally.

Each agent binds a dedicated system_prompt (extracted from the existing nodes
in resume/parser.py, match/matcher.py and interview/graph.py) and an
output_type (a Pydantic model).
"""
from __future__ import annotations

import logging

import httpx
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from backend.config import settings
from backend.schemas import AnswerScore, InterviewMessage, MatchResponse, ParsedResume

logger = logging.getLogger(__name__)


def _ensure_v1_suffix(base_url: str) -> str:
    """Ensure base_url ends with /v1 for OpenAI-compatible endpoints.

    DeepSeek (and other OpenAI-compatible providers) require the /v1 suffix
    on the base_url. Idempotent: a URL already ending in /v1 is returned as-is.
    """
    base_url = base_url.rstrip("/")
    if not base_url.endswith("/v1"):
        base_url = base_url + "/v1"
    return base_url


async def _get_model() -> OpenAIChatModel:
    """Build an OpenAIChatModel from the YAML settings.

    The database llm_configs table is bypassed so a non-DeepSeek entry cannot
    redirect calls to a provider whose response format breaks PydanticAI.
    """
    api_key = settings.llm.api_key
    base_url = settings.llm.base_url or None
    model = settings.llm.model

    effective_base_url = _ensure_v1_suffix(base_url) if base_url else None
    # Explicit http_client avoids the PydanticAI default httpx timeout (5s
    # connect), which is too tight for cross-region calls to deepseek-v4-flash.
    http_client = httpx.AsyncClient(
        timeout=httpx.Timeout(
            settings.llm.request_timeout, connect=settings.llm.connect_timeout
        )
    )
    provider = OpenAIProvider(
        base_url=effective_base_url,
        api_key=api_key,
        http_client=http_client,
    )
    return OpenAIChatModel(model, provider=provider)


# --------------------------------------------------------------------------
# System prompts (extracted verbatim from existing nodes)
# --------------------------------------------------------------------------

_RESUME_PARSER_PROMPT = (
    "You are a resume parser. Extract structured information from the resume text. "
    "Return valid JSON with name, skills, projects, and experiences."
)

_MATCHER_PROMPT = (
    "You are an expert technical recruiter. Compare the candidate resume with the job description. "
    "For each skill present in the resume, decide if it is fully matched in the JD, partially matched, or missing. "
    "Include missing skills from the JD that the resume does not have. "
    "Return a structured JSON response with overallScore (0-100), items, and suggestions.\n\n"
    "If skill similarity scores are provided, use them as quantitative reference to inform your status classification. "
    "Skills with high similarity (>=0.8) should generally be 'full', medium (0.5-0.8) 'partial', low (<0.5) 'missing'. "
    "You may override based on context."
)

_QUALITY_CLASSIFIER_PROMPT = (
    "You are an expert interviewer. Analyze the candidate's answer to the current question. "
    "Decide if the answer is good or if it needs a follow-up question. "
    "If a follow-up is needed, provide a concise follow-up question and your reasoning. "
    "Classify the answer quality as good, vague, shallow, no_data, or irrelevant."
)

_EVALUATOR_PROMPT = (
    "You are an expert interview evaluator. Score the candidate's answer on three dimensions "
    "from 0 to 10: relevance (how well it answers the question), depth (technical or situational depth), "
    "and completeness (whether the answer covers context, action, and result)."
)

_REPORT_PROMPT = (
    "You are an expert interview report writer. Based on the interview transcript and average scores, "
    "produce a structured report with 4-6 dimension scores (0-10) and 2-4 concise improvement suggestions."
)


# deepseek-v4-flash enables thinking mode by default, which is incompatible
# with the tool_choice PydanticAI uses to express structured output. The
# official workaround (per DeepSeek docs) is to send `thinking.type=disabled`
# in the request body so the model returns tool calls directly.
# Controlled by settings.llm.disable_thinking (default True).
if settings.llm.disable_thinking:
    _DEEPSEEK_MODEL_SETTINGS: dict = {
        "extra_body": {"thinking": {"type": "disabled"}},
    }
else:
    _DEEPSEEK_MODEL_SETTINGS: dict = {}


# --------------------------------------------------------------------------
# Agent factories
# --------------------------------------------------------------------------
# FollowUpDecision and ReportOutput are defined in interview/graph.py and are
# imported lazily inside the factory functions to keep this module decoupled
# from the graph layer at import time.


async def resume_parser_agent() -> Agent[ParsedResume]:
    """Agent that parses resume text into a ParsedResume."""
    model = await _get_model()
    return Agent(
        model=model,
        output_type=ParsedResume,
        system_prompt=_RESUME_PARSER_PROMPT,
        model_settings=_DEEPSEEK_MODEL_SETTINGS,
    )


async def matcher_agent() -> Agent[MatchResponse]:
    """Agent that matches a resume against a JD into a MatchResponse."""
    model = await _get_model()
    return Agent(
        model=model,
        output_type=MatchResponse,
        system_prompt=_MATCHER_PROMPT,
        model_settings=_DEEPSEEK_MODEL_SETTINGS,
    )


async def quality_classifier_agent() -> Agent:
    """Agent that classifies answer quality into a FollowUpDecision."""
    from backend.interview.graph import FollowUpDecision

    model = await _get_model()
    return Agent(
        model=model,
        output_type=FollowUpDecision,
        system_prompt=_QUALITY_CLASSIFIER_PROMPT,
        model_settings=_DEEPSEEK_MODEL_SETTINGS,
    )


async def evaluator_agent() -> Agent[AnswerScore]:
    """Agent that scores an answer into an AnswerScore."""
    model = await _get_model()
    return Agent(
        model=model,
        output_type=AnswerScore,
        system_prompt=_EVALUATOR_PROMPT,
        model_settings=_DEEPSEEK_MODEL_SETTINGS,
    )


async def report_agent() -> Agent:
    """Agent that generates an interview report into a ReportOutput."""
    from backend.interview.graph import ReportOutput

    model = await _get_model()
    return Agent(
        model=model,
        output_type=ReportOutput,
        system_prompt=_REPORT_PROMPT,
        model_settings=_DEEPSEEK_MODEL_SETTINGS,
    )


# --------------------------------------------------------------------------
# Convenience call wrappers
# --------------------------------------------------------------------------


async def parse_resume_with_ai(text: str) -> ParsedResume:
    """Parse resume text into ParsedResume via the PydanticAI agent."""
    agent = await resume_parser_agent()
    result = await agent.run(f"Resume text:\n\n{text[:12000]}")
    return result.output


async def match_resume_with_ai(
    resume: ParsedResume,
    jd: str,
    skill_similarities: dict[str, float] | None = None,
) -> MatchResponse:
    """Match resume against JD via the PydanticAI agent.

    When ``skill_similarities`` is provided, the embedding cosine similarity
    data is appended to the user prompt so the LLM can use it as quantitative
    reference for status classification. When ``None``, behaviour is identical
    to the previous LLM-only flow (backward compatible).
    """
    agent = await matcher_agent()
    user_prompt = (
        f"Resume:\n{resume.model_dump_json(indent=2)}\n\n"
        f"Job Description:\n{jd[:8000]}"
    )
    if skill_similarities:
        sim_lines = "\n".join(
            f"- {skill}: {score:.2f}"
            for skill, score in skill_similarities.items()
        )
        user_prompt += (
            "\n\nSkill similarities (embedding cosine similarity vs JD):\n"
            f"{sim_lines}"
        )
    result = await agent.run(user_prompt)
    return result.output


async def classify_quality_with_ai(
    question: str, answer: str, history: list[dict]
) -> "FollowUpDecision":  # noqa: F821 - resolved lazily below
    """Classify answer quality via the PydanticAI agent.

    Returns a FollowUpDecision (imported from interview.graph) with the
    need_follow_up flag, optional follow-up question, reasoning and quality.
    """
    from backend.interview.graph import FollowUpDecision  # noqa: F401

    history_text = "\n".join(
        f"{m['role']}: {m['content']}" for m in (history or [])
    )
    agent = await quality_classifier_agent()
    user_prompt = (
        f"Current question: {question}\n\n"
        f"Candidate answer: {answer}\n\n"
        f"Conversation history:\n{history_text}"
    )
    result = await agent.run(user_prompt)
    return result.output


async def evaluate_answer_with_ai(
    question: str, answer: str, quality: str
) -> AnswerScore:
    """Score an answer via the PydanticAI agent.

    The `quality` label (good/vague/shallow/no_data/irrelevant) is passed in
    the user prompt rather than the system prompt, since system_prompt is
    static at agent construction time.
    """
    agent = await evaluator_agent()
    user_prompt = (
        f"Question: {question}\n\n"
        f"Candidate answer: {answer}\n\n"
        f"The answer was classified as '{quality}'."
    )
    result = await agent.run(user_prompt)
    return result.output


async def generate_report_with_ai(
    session_id: str,
    messages: list[InterviewMessage],
    scores: list[AnswerScore],
    resume: ParsedResume,
    jd: str,
) -> dict:
    """Generate an interview report via the PydanticAI agent.

    Mirrors the output shape of interview.graph.generate_report_from_session:
    returns a dict with sessionId, dimensions, progress, suggestions, transcript.
    """
    from backend.interview.graph import ReportOutput  # noqa: F401

    transcript = "\n".join(f"{m.role}: {m.content}" for m in messages)
    avg_relevance = sum(s.relevance for s in scores) / len(scores) if scores else 0
    avg_depth = sum(s.depth for s in scores) / len(scores) if scores else 0
    avg_completeness = (
        sum(s.completeness for s in scores) / len(scores) if scores else 0
    )

    agent = await report_agent()
    user_prompt = (
        f"Session ID: {session_id}\n\n"
        f"Average scores - relevance: {avg_relevance:.1f}, "
        f"depth: {avg_depth:.1f}, completeness: {avg_completeness:.1f}\n\n"
        f"Transcript:\n{transcript}\n\n"
        f"Resume:\n{resume.model_dump_json(indent=2)}\n\n"
        f"Job Description:\n{jd}"
    )
    result = await agent.run(user_prompt)
    output = result.output
    return {
        "sessionId": session_id,
        "dimensions": output.dimensions,
        "progress": [],
        "suggestions": output.suggestions,
        "transcript": [m.model_dump() for m in messages],
    }
