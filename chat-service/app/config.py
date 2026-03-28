from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    OPENAI_API_KEY: str
    API_SERVICE_URL: str = "http://bookgate-api-service:8000"
    CORS_ORIGINS: str = "https://bookgate.example.com"

    def get_cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    model_config = {"env_file": ".env"}


settings = Settings()
