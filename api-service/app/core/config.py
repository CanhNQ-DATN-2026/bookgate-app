from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str

    # ── JWT ───────────────────────────────────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── S3 ────────────────────────────────────────────────────────────────────
    S3_BUCKET_NAME: str
    AWS_DEFAULT_REGION: str = "ap-southeast-1"

    # ── Seed admin (used by migration job) ────────────────────────────────────
    ADMIN_EMAIL: str = "admin@bookgate.com"
    ADMIN_PASSWORD: str
    ADMIN_FULL_NAME: str = "System Admin"

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: str = "https://bookgate.example.com"

    def get_cors_origins(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    model_config = {"env_file": ".env"}


settings = Settings()
