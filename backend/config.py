"""统一配置层：从 `backend/config.yaml` 加载全部配置。

配置以 YAML 为单一源（含密钥），同时支持环境变量层级覆盖
（如 `LLM__API_KEY` 覆盖 `llm.api_key`），便于容器化部署。
config.yaml 不入库，config.example.yaml 作为模板入库。
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field
from pydantic_settings import (
    BaseSettings,
    PydanticBaseSettingsSource,
    SettingsConfigDict,
)


# ---------------------------------------------------------------------------
# YAML 路径解析
# ---------------------------------------------------------------------------
# 默认: backend/config.yaml（相对本文件所在目录）。
# 可用 CONFIG_PATH 环境变量覆盖（绝对或相对 CWD）。
_DEFAULT_YAML = Path(__file__).resolve().parent / "config.yaml"
_YAML_PATH = Path(os.getenv("CONFIG_PATH", str(_DEFAULT_YAML))).resolve()


def _yaml_config_path() -> Path:
    return _YAML_PATH


# ---------------------------------------------------------------------------
# 嵌套配置模型
# ---------------------------------------------------------------------------
class ServerSettings(BaseModel):
    host: str = "127.0.0.1"
    port: int = 9400


class LLMSettings(BaseModel):
    api_key: str = ""
    base_url: str = ""
    model: str = "deepseek-v4-flash"
    request_timeout: float = 60.0
    connect_timeout: float = 10.0
    disable_thinking: bool = True


class EmbeddingSettings(BaseModel):
    """嵌入配置：复用 LLM 的 api_key/base_url，仅需指定模型名。"""
    model: str = "text-embedding-3-small"
    cache_enabled: bool = True


class DatabaseSettings(BaseModel):
    url: str = "sqlite+aiosqlite:///./backend/interview.db"


class CorsSettings(BaseModel):
    origins: list[str] = Field(default_factory=lambda: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ])


class PDFSettings(BaseModel):
    font_regular: str = "C:/Windows/Fonts/msyh.ttc"
    font_bold: str = "C:/Windows/Fonts/msyhbd.ttc"


# ---------------------------------------------------------------------------
# YAML 配置源
# ---------------------------------------------------------------------------
class YamlConfigSettingsSource(PydanticBaseSettingsSource):
    """从 YAML 文件加载配置的 pydantic-settings 源。"""

    def __init__(self, settings_cls: type[BaseSettings]):
        super().__init__(settings_cls)
        self._yaml_data: dict[str, Any] = self._load_yaml()

    def _load_yaml(self) -> dict[str, Any]:
        path = _yaml_config_path()
        if not path.exists():
            return {}
        with path.open("r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return data or {}

    def get_field_value(
        self, field: Any, field_name: str
    ) -> tuple[Any, str, bool]:
        value = self._yaml_data.get(field_name)
        return value, field_name, False

    def prepare_field_value(
        self, field_name: str, field: Any, value: Any, value_is_complex: Any
    ) -> Any:
        return value

    def __call__(self) -> dict[str, Any]:
        return self._yaml_data


# ---------------------------------------------------------------------------
# 顶层 Settings
# ---------------------------------------------------------------------------
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_nested_delimiter="__",
        extra="ignore",
        case_sensitive=False,
    )

    server: ServerSettings = Field(default_factory=ServerSettings)
    llm: LLMSettings = Field(default_factory=LLMSettings)
    embedding: EmbeddingSettings = Field(default_factory=EmbeddingSettings)
    database: DatabaseSettings = Field(default_factory=DatabaseSettings)
    cors: CorsSettings = Field(default_factory=CorsSettings)
    pdf: PDFSettings = Field(default_factory=PDFSettings)

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        # 优先级: init > env (LLM__API_KEY 覆盖) > yaml > dotenv > secret
        return (
            init_settings,
            env_settings,
            YamlConfigSettingsSource(settings_cls),
            dotenv_settings,
            file_secret_settings,
        )

    @property
    def cors_origin_list(self) -> list[str]:
        """兼容 main.py 现有调用：返回 CORS origins 列表。"""
        return list(self.cors.origins)


settings = Settings()
