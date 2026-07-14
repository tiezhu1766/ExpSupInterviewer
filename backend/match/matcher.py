import logging
import time

from backend.eas.similarity import compute_skill_similarities
from backend.llm.pydantic_agents import match_resume_with_ai
from backend.schemas import MatchItem, MatchResponse, ParsedResume

logger = logging.getLogger(__name__)


def _score_from_status(status: str) -> int:
    return {"full": 100, "partial": 50, "missing": 0}.get(status, 50)


async def match_resume_jd(resume: ParsedResume, jd: str) -> MatchResponse:
    """混合匹配策略：先尝试 EAS 语义相似度，再交由 LLM 综合判断。

    EAS 服务不可用时自动降级为纯 LLM 匹配（matchMode="llm_only"）。
    """
    t_total = time.perf_counter()
    logger.info(
        "[match] start | resume=%s skills=%d jd_len=%d",
        resume.name or "<unnamed>", len(resume.skills), len(jd),
    )

    # 1. 尝试获取 embedding 语义相似度（失败则降级）
    skill_similarities: dict[str, float] | None = None
    t_eas = time.perf_counter()
    try:
        skill_similarities = await compute_skill_similarities(resume.skills, jd)
    except Exception as e:
        logger.warning(
            "EAS similarity unavailable, falling back to LLM-only match: %s", e
        )
        skill_similarities = None
    eas_ms = (time.perf_counter() - t_eas) * 1000
    logger.info("[match] EAS (vector computation): %.1fms", eas_ms)

    # 2. 调用 LLM 匹配（传入相似度数据作为定量参考）
    t_llm = time.perf_counter()
    raw = await match_resume_with_ai(
        resume, jd, skill_similarities=skill_similarities
    )
    llm_ms = (time.perf_counter() - t_llm) * 1000
    logger.info("[match] LLM inference: %.1fms | model=%s", llm_ms, raw.matchMode)

    # 3. 合并 embedding 相似度与 LLM 判断
    t_merge = time.perf_counter()
    items: list[MatchItem] = []
    for item in raw.items:
        if item.score == 0:
            item.score = _score_from_status(item.status)
        if skill_similarities is not None:
            # 用 embedding 数据填充；LLM 返回的 skill 在字典中找不到则为 None
            item.similarity = skill_similarities.get(item.skill)
        items.append(item)
    merge_ms = (time.perf_counter() - t_merge) * 1000

    # 4. 标记匹配模式
    match_mode = "hybrid" if skill_similarities is not None else "llm_only"

    total_ms = (time.perf_counter() - t_total) * 1000
    logger.info(
        "[match] done | mode=%s overallScore=%d items=%d | "
        "EAS=%.1fms LLM=%.1fms merge=%.1fms TOTAL=%.1fms",
        match_mode, raw.overallScore, len(items),
        eas_ms, llm_ms, merge_ms, total_ms,
    )

    return MatchResponse(
        overallScore=raw.overallScore,
        items=items,
        suggestions=raw.suggestions,
        matchMode=match_mode,
    )
