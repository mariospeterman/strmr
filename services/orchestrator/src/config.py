from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file='../../.env',
        env_file_encoding='utf-8',
        extra='ignore'
    )

    redis_url: str = Field(..., alias='REDIS_URL')
    kafka_bootstrap_servers: str = Field('localhost:9092', alias='KAFKA_BOOTSTRAP')
    object_store_bucket: str = Field(..., alias='OBJECT_STORE_BUCKET')
    livekit_host: str | None = Field(None, alias='LIVEKIT_HOST')
    livekit_url: str | None = Field(None, alias='LIVEKIT_URL')
    livekit_api_key: str = Field(..., alias='LIVEKIT_API_KEY')
    livekit_api_secret: str = Field(..., alias='LIVEKIT_API_SECRET')
    hume_api_key: str = Field(..., alias='HUME_API_KEY')
    beyond_presence_api_key: str = Field(..., alias='BEYOND_PRESENCE_API_KEY')
    qdrant_url: str = Field('http://localhost:6333', alias='QDRANT_URL')
    qdrant_api_key: str | None = Field(None, alias='QDRANT_API_KEY')
    openai_api_key: str | None = Field(None, alias='OPENAI_API_KEY')
    postgres_url: str = Field(..., alias='DATABASE_URL')


def _normalize_host(value: str | None) -> str | None:
    if not value:
        return None
    if value.startswith('wss://'):
        return 'https://' + value.removeprefix('wss://')
    if value.startswith('ws://'):
        return 'http://' + value.removeprefix('ws://')
    return value


def get_settings() -> Settings:
    settings = Settings()
    if not settings.livekit_host:
        settings.livekit_host = _normalize_host(settings.livekit_url)
    else:
        settings.livekit_host = _normalize_host(settings.livekit_host)
    if not settings.livekit_host:
        raise RuntimeError('LIVEKIT_HOST or LIVEKIT_URL must be configured in the environment.')
    return settings
