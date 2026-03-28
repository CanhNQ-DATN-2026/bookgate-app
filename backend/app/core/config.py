from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # MinIO
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin123"
    MINIO_BUCKET_NAME: str = "bookgate"
    MINIO_PUBLIC_URL: str = "http://localhost:9000"
    MINIO_SECURE: bool = False

    # Seed admin
    ADMIN_EMAIL: str = "admin@bookgate.com"
    ADMIN_PASSWORD: str = "admin123"
    ADMIN_FULL_NAME: str = "System Admin"

    # OpenAI
    OPENAI_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    def get_cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"


settings = Settings()
