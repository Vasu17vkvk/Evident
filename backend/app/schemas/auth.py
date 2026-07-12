from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re

class UserRegister(BaseModel):
    email: str = Field(..., description="The user's email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    name: str = Field(..., description="The user's display name")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"[^@]+@[^@]+\.[^@]+", v):
            raise ValueError("Invalid email address format")
        return v

class UserLogin(BaseModel):
    email: str = Field(..., description="The user's email address")
    password: str = Field(..., description="The user's password")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.strip().lower()

class GoogleLoginRequest(BaseModel):
    idToken: str = Field(..., description="Google OAuth ID Token from frontend")

class UserResponse(BaseModel):
    userId: str = Field(..., description="User ID in database")
    email: str
    name: str
    photoURL: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str = Field(..., description="JWT Access Token")
    token_type: str = Field("bearer", description="Token type")
    user: UserResponse

class FirebaseLoginRequest(BaseModel):
    idToken: str = Field(..., description="Firebase Auth ID Token from frontend")

