from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.api import upload_router, chat_router

app = FastAPI(
    title="Evident API",
    version="1.0.0"
)

# Allowed frontend origins
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(upload_router)
app.include_router(chat_router)


@app.get("/")
async def root():
    return {
        "message": "Evident API Running"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy"
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