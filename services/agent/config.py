from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    redis_url: str = "redis://localhost:6379/0"
    agent_host: str = "0.0.0.0"
    agent_port: int = 8001
    model_name: str = "claude-sonnet-4-20250514"
    max_tokens: int = 4096

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
