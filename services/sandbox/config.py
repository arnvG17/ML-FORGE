from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    e2b_api_key: str = ""
    sandbox_host: str = "0.0.0.0"
    sandbox_port: int = 8002
    sandbox_timeout: int = 30
    max_pool_size: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
