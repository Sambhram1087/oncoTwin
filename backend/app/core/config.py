"""
Application settings.

All values are overridable via environment variables / .env file.
The defaults below are chosen so the whole stack runs locally with
ZERO external accounts (SQLite instead of Supabase Postgres, local
JWT auth instead of Supabase Auth, in-process background tasks
instead of Celery+Redis).

Every one of these has a documented "swap path" to the production
service described in the project brief - see README.md section
"Swapping in the production infrastructure".
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "OncoTwin API"
    ENV: str = "development"

    # --- Database ---------------------------------------------------
    # Local default: SQLite file. Production swap: set DATABASE_URL to
    # your Supabase Postgres connection string, e.g.
    # postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres
    DATABASE_URL: str = "sqlite:///./oncotwin.db"

    # --- Auth ---------------------------------------------------------
    # Local default: self-issued JWTs. Production swap: replace the
    # functions in app/core/security.py with calls to Supabase Auth
    # (supabase-py's `sign_up` / `sign_in_with_password`) and verify
    # the returned Supabase JWT instead of minting our own.
    JWT_SECRET: str = "dev-secret-change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # --- Storage --------------------------------------------------------
    # Local default: files saved to ./storage on disk. Set SUPABASE_URL +
    # SUPABASE_SERVICE_KEY to switch to Supabase Storage automatically
    # (see app/services/storage.py) - required for Render's free tier,
    # since its filesystem is ephemeral and wipes uploads on restart.
    UPLOAD_DIR: str = "./storage/uploads"
    SUPABASE_URL: str | None = None
    SUPABASE_SERVICE_KEY: str | None = None
    SUPABASE_STORAGE_BUCKET: str = "mri-uploads"

    # --- Background jobs --------------------------------------------
    # Local default: FastAPI BackgroundTasks + asyncio (single process).
    # Production swap: replace app/workers/tasks.py's `run_job` with a
    # Celery task (`@celery_app.task`) and point CELERY_BROKER_URL at
    # your Upstash Redis instance. The public interface
    # (`enqueue_processing_job`) stays identical, so nothing else in the
    # codebase needs to change.
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()