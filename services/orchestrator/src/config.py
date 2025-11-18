from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    redis_url: str = Field(..., env="REDIS_URL")
    kafka_bootstrap_servers: str = Field("localhost:9092", env="KAFKA_BOOTSTRAP")
    object_store_bucket: str = Field(..., env="OBJECT_STORE_BUCKET")
    livekit_host: str = Field(..., env="LIVEKIT_HOST")
    livekit_api_key: str = Field(..., env="LIVEKIT_API_KEY")
    livekit_api_secret: str = Field(..., env="LIVEKIT_API_SECRET")
    hume_api_key: str = Field(..., env="HUME_API_KEY")
    beyond_presence_api_key: str = Field(..., env="BEYOND_PRESENCE_API_KEY")
    qdrant_url: str = Field("http://localhost:6333", env="QDRANT_URL")
    qdrant_api_key: str | None = Field(None, env="QDRANT_API_KEY")
    openai_api_key: str | None = Field(None, env="OPENAI_API_KEY")
    postgres_url: str = Field(..., env="DATABASE_URL")

    class Config:
        env_file = "../../.env"


def get_settings() -> Settings:
    return Settings()
