"""Embedding as a Service: OpenAI-compatible API 向量化与缓存。

使用 OpenAI SDK 调用 /v1/embeddings 接口获取文本向量，
支持 DeepSeek / OpenAI / Ollama 等所有 OpenAI 兼容提供商。

保留 DB 缓存层（EmbeddingCache）以减少重复文本的编码开销。
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
from typing import Optional

from openai import AsyncOpenAI

from backend.config import settings
from backend.db import session_context
from backend.repositories.crud import create_embedding_cache, get_embedding_cache

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# OpenAI 客户端单例（懒加载）
# ---------------------------------------------------------------------------
_client: Optional[AsyncOpenAI] = None
_embedding_model: str = ""


def _get_client() -> tuple[AsyncOpenAI, str]:
    """获取 AsyncOpenAI 客户端与嵌入模型名（单例）。"""
    global _client, _embedding_model
    if _client is None:
        api_key = settings.llm.api_key
        base_url = settings.llm.base_url or None
        # 嵌入模型：优先使用 embedding.model，否则用 LLM 模型
        _embedding_model = settings.embedding.model or settings.llm.model

        # 确保 base_url 以 /v1 结尾
        if base_url:
            base_url = base_url.rstrip("/")
            if not base_url.endswith("/v1"):
                base_url = base_url + "/v1"

        _client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url,
            timeout=settings.llm.request_timeout,
            max_retries=2,
        )
        logger.info(
            "Embedding client initialized: base_url=%s model=%s",
            base_url or "https://api.openai.com/v1",
            _embedding_model,
        )
    return _client, _embedding_model


# ---------------------------------------------------------------------------
# 公共接口
# ---------------------------------------------------------------------------
async def get_embedding(text: str, model: Optional[str] = None) -> list[float]:
    """获取文本的 embedding 向量，优先命中 EmbeddingCache。

    Args:
        text: 待向量化的文本。
        model: 嵌入模型名（可选，默认使用配置中的模型）。

    Returns:
        向量列表。
    """
    client, default_model = _get_client()
    use_model = model or default_model
    text_hash = hashlib.sha256(text.encode()).hexdigest()

    # 1. 查缓存
    if settings.embedding.cache_enabled:
        async with session_context() as session:
            cached = await get_embedding_cache(session, text_hash, use_model)
            if cached is not None:
                logger.debug("embedding cache hit: model=%s hash=%s text=%r", use_model, text_hash[:12], text[:30])
                return json.loads(cached.vector_json)

    # 2. 未命中则调用 API
    logger.debug("embedding cache miss: model=%s hash=%s text=%r", use_model, text_hash[:12], text[:30])
    t0 = time.perf_counter()
    response = await client.embeddings.create(
        model=use_model,
        input=text,
    )
    encode_ms = (time.perf_counter() - t0) * 1000
    vector = response.data[0].embedding
    logger.info("[embed] API call: %.1fms | dim=%d | text=%r", encode_ms, len(vector), text[:30])

    # 3. 写缓存
    if settings.embedding.cache_enabled:
        async with session_context() as session:
            await create_embedding_cache(session, text_hash, text, vector, use_model)

    return vector


async def get_embeddings_batch(texts: list[str], model: Optional[str] = None) -> list[list[float]]:
    """批量获取文本 embedding。

    逐条查缓存命中的文本直接复用；未命中的文本合并送 API 一次性批量编码，
    再逐条写缓存。

    Args:
        texts: 文本列表。
        model: 嵌入模型名（可选）。

    Returns:
        向量列表，顺序与输入一致。
    """
    if not texts:
        return []

    client, default_model = _get_client()
    use_model = model or default_model
    cache_enabled = settings.embedding.cache_enabled

    # 1. 逐条查缓存
    results: list[Optional[list[float]]] = [None] * len(texts)
    hashes = [hashlib.sha256(t.encode()).hexdigest() for t in texts]
    if cache_enabled:
        for i, text_hash in enumerate(hashes):
            async with session_context() as session:
                cached = await get_embedding_cache(session, text_hash, use_model)
                if cached is not None:
                    results[i] = json.loads(cached.vector_json)

    # 2. 收集未命中的索引，批量调用 API
    miss_indices = [i for i, v in enumerate(results) if v is None]
    hit_count = len(texts) - len(miss_indices)
    if miss_indices:
        miss_texts = [texts[i] for i in miss_indices]
        logger.info(
            "[embed-batch] total=%d cache_hit=%d miss=%d | model=%s",
            len(texts), hit_count, len(miss_indices), use_model,
        )
        t0 = time.perf_counter()
        response = await client.embeddings.create(
            model=use_model,
            input=miss_texts,
        )
        encode_ms = (time.perf_counter() - t0) * 1000
        # API 返回顺序与输入一致
        miss_vectors = [item.embedding for item in response.data]
        logger.info(
            "[embed-batch] API call: %.1fms | %d texts | %.2fms/text",
            encode_ms, len(miss_texts), encode_ms / max(len(miss_texts), 1),
        )

        # 3. 回填结果并写缓存
        for idx, vec in zip(miss_indices, miss_vectors):
            results[idx] = vec
        if cache_enabled:
            for idx in miss_indices:
                async with session_context() as session:
                    await create_embedding_cache(
                        session, hashes[idx], texts[idx], results[idx], use_model
                    )

    return results  # type: ignore[return-value]
