from datetime import datetime
from typing import Optional

from sqlalchemy import update
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from backend.models import LLMConfig
from backend.schemas import LLMConfigCreate, LLMConfigUpdate


def _new_uuid() -> str:
    import uuid

    return str(uuid.uuid4())


async def list_llm_configs(session: AsyncSession) -> list[LLMConfig]:
    stmt = select(LLMConfig).order_by(LLMConfig.created_at)
    result = await session.exec(stmt)
    return list(result.all())


async def get_llm_config(session: AsyncSession, config_id: str) -> Optional[LLMConfig]:
    return await session.get(LLMConfig, config_id)


async def get_active_llm_config(session: AsyncSession) -> Optional[LLMConfig]:
    stmt = select(LLMConfig).where(LLMConfig.is_active.is_(True))
    result = await session.exec(stmt)
    return result.first()


async def create_llm_config(session: AsyncSession, data: LLMConfigCreate) -> LLMConfig:
    config = LLMConfig(
        id=_new_uuid(),
        name=data.name,
        base_url=data.base_url,
        api_key=data.api_key,
        model=data.model,
        is_active=False,
    )
    session.add(config)
    await session.commit()
    await session.refresh(config)
    return config


async def update_llm_config(
    session: AsyncSession,
    config_id: str,
    data: LLMConfigUpdate,
) -> Optional[LLMConfig]:
    config = await get_llm_config(session, config_id)
    if config is None:
        return None

    if data.name is not None:
        config.name = data.name
    if data.base_url is not None:
        config.base_url = data.base_url
    if data.api_key is not None and data.api_key != "":
        config.api_key = data.api_key
    if data.model is not None:
        config.model = data.model

    config.updated_at = datetime.utcnow()
    session.add(config)
    await session.commit()
    await session.refresh(config)
    return config


async def delete_llm_config(session: AsyncSession, config_id: str) -> bool:
    config = await get_llm_config(session, config_id)
    if config is None:
        return False
    await session.delete(config)
    await session.commit()
    return True


async def activate_llm_config(session: AsyncSession, config_id: str) -> Optional[LLMConfig]:
    config = await get_llm_config(session, config_id)
    if config is None:
        return None

    await session.exec(update(LLMConfig).values(is_active=False))

    config.is_active = True
    config.updated_at = datetime.utcnow()
    session.add(config)
    await session.commit()
    await session.refresh(config)
    return config
