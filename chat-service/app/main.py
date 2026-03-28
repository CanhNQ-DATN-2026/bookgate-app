from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .config import settings
from .chat import router as chat_router

app = FastAPI(
    title="Bookgate Chat Service",
    description="Stateless AI chat — proxies book catalog from api-service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api/v1/chat", tags=["Chat"])


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    print(f"[error] Unhandled exception on {request.method} {request.url}: {exc!r}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health")
def health_check():
    return {"status": "ok"}
