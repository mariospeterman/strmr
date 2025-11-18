from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    livekit_url: str = Field(..., env="LIVEKIT_HOST")
    livekit_api_key: str = Field(..., env="LIVEKIT_API_KEY")
    livekit_api_secret: str = Field(..., env="LIVEKIT_API_SECRET")
    stripe_secret_key: str = Field(..., env="STRIPE_SECRET_KEY")
    hume_api_key: str = Field(..., env="HUME_API_KEY")
    beyond_presence_api_key: str = Field(..., env="BEYOND_PRESENCE_API_KEY")
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")
    qdrant_url: str = Field("http://localhost:6333", env="QDRANT_URL")
    qdrant_api_key: str | None = Field(None, env="QDRANT_API_KEY")

    class Config:
        env_file = "../../.env"


def get_settings() -> Settings:
    return Settings()
