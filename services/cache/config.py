from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://forge:forge@localhost:5432/forge"
    redis_url: str = "redis://localhost:6379/0"
    cache_host: str = "0.0.0.0"
    cache_port: int = 8003
    cache_ttl: int = 86400 * 7

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
