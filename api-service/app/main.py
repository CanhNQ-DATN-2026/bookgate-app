from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .core.config import settings
from .api.v1.router import api_router
from .services.storage import storage_service

app = FastAPI(
    title="Bookgate API Service",
    description="Role-based digital library / online bookstore",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS - allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


# Catch unhandled exceptions so the response still goes through CORSMiddleware.
# Without this, ServerErrorMiddleware (outermost) returns 500 before CORS headers
# are added, causing the browser to see a CORS error instead of the real error.
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    print(f"[error] Unhandled exception on {request.method} {request.url}: {exc!r}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


@app.on_event("startup")
async def startup_event():
    storage_service.ensure_bucket()


@app.get("/health")
def health_check():
    return {"status": "ok"}
