"""EAS 相似度计算: 余弦相似度、技能匹配与等级分类。"""

import logging
import time

import numpy as np

from backend.eas.embedder import get_embedding

logger = logging.getLogger(__name__)


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """计算两个向量的余弦相似度，裁剪到 [0, 1]。

    Args:
        vec_a: 向量 A。
        vec_b: 向量 B。

    Returns:
        余弦相似度，0-1 浮点数；任一为零向量时返回 0.0。
    """
    a = np.asarray(vec_a, dtype=np.float64)
    b = np.asarray(vec_b, dtype=np.float64)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    sim = float(np.dot(a, b) / (norm_a * norm_b))
    return max(0.0, min(1.0, sim))


async def compute_skill_similarities(skills: list[str], jd_text: str) -> dict[str, float]:
    """计算每个技能与 JD 文本的余弦相似度。

    Args:
        skills: 技能名称列表。
        jd_text: 职位描述文本。

    Returns:
        {skill_name: similarity} 字典。
    """
    t_start = time.perf_counter()

    # 1. JD 向量化
    t0 = time.perf_counter()
    jd_vec = await get_embedding(jd_text)
    jd_ms = (time.perf_counter() - t0) * 1000
    logger.info("[eas] JD embedding: %.1fms | text_len=%d", jd_ms, len(jd_text))

    # 2. 逐技能向量化 + 相似度计算
    result: dict[str, float] = {}
    t_skills = time.perf_counter()
    for skill in skills:
        t1 = time.perf_counter()
        skill_vec = await get_embedding(skill)
        sim = cosine_similarity(skill_vec, jd_vec)
        result[skill] = sim
        skill_ms = (time.perf_counter() - t1) * 1000
        logger.info("[eas] skill=%r sim=%.4f | %.1fms", skill, sim, skill_ms)
    skills_ms = (time.perf_counter() - t_skills) * 1000

    total_ms = (time.perf_counter() - t_start) * 1000
    logger.info(
        "[eas] compute_skill_similarities done: %d skills | JD=%.1fms skills=%.1fms total=%.1fms",
        len(skills), jd_ms, skills_ms, total_ms,
    )
    return result


def compute_overall_similarity(skill_similarities: dict[str, float]) -> int:
    """计算技能相似度的整体得分。

    所有技能相似度求平均，乘以 100，四舍五入为整数。

    Args:
        skill_similarities: {skill_name: similarity} 字典。

    Returns:
        0-100 整数得分；空输入返回 0。
    """
    if not skill_similarities:
        return 0
    avg = sum(skill_similarities.values()) / len(skill_similarities)
    return round(avg * 100)


def classify_similarity(score: float) -> str:
    """根据相似度分数分类技能匹配等级。

    Args:
        score: 相似度分数（0-1）。

    Returns:
        "full"（>=0.8）、"partial"（>=0.5 且 <0.8）或 "missing"（<0.5）。
    """
    if score >= 0.8:
        return "full"
    if score >= 0.5:
        return "partial"
    return "missing"
