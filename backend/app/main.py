from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import upload_router, chat_router, documents_router, insights_router, auth_router
from app.database.mongodb import connect_to_mongo, close_mongo_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    import os
    print("Frontend Project (Configured): evident-ai-4a031")
    print("Backend Project (FIREBASE_PROJECT_ID):", os.getenv("FIREBASE_PROJECT_ID"))
    await connect_to_mongo()
    yield
    # Shutdown: Close database connection
    await close_mongo_connection()

app = FastAPI(
    title="Evident API",
    version="1.0.0",
    lifespan=lifespan
)

origins = [
    "http://localhost:5173",
    "https://evident-murex.vercel.app",
    "https://*.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://evident-murex.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(documents_router)
app.include_router(insights_router)
app.include_router(auth_router)

@app.get("/")
async def root():
    return {"message": "Evident API Running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}


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
