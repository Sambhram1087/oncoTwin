from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import logging

from app.core.config import get_settings
from app.db.database import Base, engine
from app.api.routes import auth, patients, upload, predict
import app.models  # noqa: F401 - ensures models are registered on Base

settings = get_settings()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("oncotwin")

# Create tables (idempotent). For production Postgres, use Alembic
# migrations instead - see README "Database migrations".
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    description="OncoTwin - AI Neuro-Oncology Digital Twin API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- very small in-memory rate limiter (per-IP, sliding window) ---------
_rate_state: dict[str, list[float]] = {}
RATE_LIMIT = 120  # requests
RATE_WINDOW = 60  # seconds


@app.middleware("http")
async def rate_limit_and_logging(request: Request, call_next):
    start = time.time()
    client_ip = request.client.host if request.client else "unknown"

    window_start = start - RATE_WINDOW
    history = [t for t in _rate_state.get(client_ip, []) if t > window_start]
    if len(history) >= RATE_LIMIT:
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})
    history.append(start)
    _rate_state[client_ip] = history

    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000, 2)
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)")
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(upload.router)
app.include_router(predict.router)


@app.get("/", tags=["health"])
def root():
    return {"name": settings.APP_NAME, "status": "ok"}


@app.get("/api/v1/health", tags=["health"])
def health():
    return {"status": "healthy"}
