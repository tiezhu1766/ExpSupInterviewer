"""EAS (Embedding as a Service) 公共接口。"""

from backend.eas.embedder import get_embedding, get_embeddings_batch
from backend.eas.similarity import (
    classify_similarity,
    compute_overall_similarity,
    compute_skill_similarities,
    cosine_similarity,
)

__all__ = [
    "get_embedding",
    "get_embeddings_batch",
    "cosine_similarity",
    "compute_skill_similarities",
    "compute_overall_similarity",
    "classify_similarity",
]
