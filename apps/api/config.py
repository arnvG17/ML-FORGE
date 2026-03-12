from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./forge.db"
    redis_url: str = "memory://"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    jwt_secret: str = "forge-dev-secret-key-change-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 60 * 24
    agent_service_url: str = "http://localhost:8001"
    sandbox_service_url: str = "http://localhost:8002"
    cache_service_url: str = "http://localhost:8003"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
