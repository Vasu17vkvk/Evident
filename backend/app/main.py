import os
import time
import logging
import logging.config
from dotenv import load_dotenv
load_dotenv()
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.requests import Request

# ── Structured Logging Configuration ──
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "structured": {
            "format": '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}'
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "structured",
            "stream": "ext://sys.stdout"
        }
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO"
    }
}
logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger("evident")

# ── Environment Variable Validation ──
REQUIRED_ENV_VARS = ["MONGODB_URI", "FIREBASE_PROJECT_ID"]
for var in REQUIRED_ENV_VARS:
    if not os.getenv(var):
        logger.error(f"Missing required environment variable: {var}")
        raise ValueError(f"CRITICAL: Environment variable '{var}' is required but not set.")

from app.api import (
    upload_router, chat_router, documents_router, insights_router,
    auth_router, notes_router, dashboard_router, favorites_router,
    activities_router
)
from app.database.mongodb import connect_to_mongo, close_mongo_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    logger.info("Initializing connection to MongoDB...")
    await connect_to_mongo()
    # Create data-isolation indexes on startup
    from app.database.indexes import create_indexes
    await create_indexes()
    yield
    # Shutdown: Close database connection
    logger.info("Closing connection to MongoDB...")
    await close_mongo_connection()

app = FastAPI(
    title="Evident API",
    version="1.0.0",
    lifespan=lifespan
)

# ── CORS Setup ──
cors_origins_env = os.getenv("ALLOWED_CORS_ORIGINS", "")
allowed_origins = [
    origin.strip() for origin in cors_origins_env.split(",") if origin.strip()
] if cors_origins_env else [
    "http://localhost:5173",
    "https://evident-murex.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Custom IP-based Rate Limiter Middleware ──
class RateLimitingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 150, window_secs: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window_secs = window_secs
        self.requests = {}  # ip -> list of timestamps

    async def dispatch(self, request: Request, call_next):
        # Skip rate limits for static/health check endpoints
        if request.url.path in ["/health", "/", "/health/"]:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        if client_ip not in self.requests:
            self.requests[client_ip] = []

        # Filter out timestamps older than our sliding window
        self.requests[client_ip] = [t for t in self.requests[client_ip] if now - t < self.window_secs]

        if len(self.requests[client_ip]) >= self.limit:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )

        self.requests[client_ip].append(now)
        return await call_next(request)

app.add_middleware(RateLimitingMiddleware)

# ── Security Headers Middleware ──
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data: https://fastapi.tiangolo.com; "
            "font-src 'self' https://cdn.jsdelivr.net; "
            "connect-src 'self' https://cdn.jsdelivr.net;"
        )
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ── Custom Exception Handlers ──
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Uncaught exception occurred: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error. Our engineering team has been notified."}
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    logger.error(f"Value validation error occurred: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)}
    )

# ── API Endpoints ──
app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(documents_router)
app.include_router(insights_router)
app.include_router(auth_router)
app.include_router(notes_router)
app.include_router(dashboard_router)
app.include_router(favorites_router)
app.include_router(activities_router)

@app.get("/")
async def root():
    return {"message": "Evident API Running"}

@app.get("/health")
async def health():
    """Improved health endpoint checking MongoDB connection status."""
    mongo_status = "unhealthy"
    try:
        from app.database.mongodb import db
        await db.db.command("ping")
        mongo_status = "healthy"
    except Exception as e:
        mongo_status = f"unhealthy: {str(e)}"

    gemini_status = "configured" if os.getenv("GEMINI_API_KEY") else "unconfigured"
    firebase_status = "configured" if os.getenv("FIREBASE_PROJECT_ID") else "unconfigured"

    overall_status = "healthy" if mongo_status == "healthy" else "unhealthy"
    return {
        "status": overall_status,
        "database": mongo_status,
        "gemini": gemini_status,
        "firebase": firebase_status
    }

@app.get("/ai-test")
async def ai_test():
    try:
        from app.services.ai_service import get_working_model_name
        import google.generativeai as genai

        model_name = get_working_model_name()
        model = genai.GenerativeModel(model_name)
        response = model.generate_content("Hello from Evident")
        
        return {
            "status": "success",
            "model": model_name,
            "response": response.text
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini Test Failed: {str(e)}"
        )
