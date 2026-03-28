from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # JWT (shared with api-service)
    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    # OpenAI
    OPENAI_API_KEY: str = ""

    # URL of api-service (internal Docker network)
    API_SERVICE_URL: str = "http://api-service:8000"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    def get_cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
