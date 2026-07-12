from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.services.auth_service import AuthService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    print("=== DECODING JWT ===")
    print("Received token prefix:", token[:15] + "...")
    try:
        payload = AuthService.decode_token(token)
        print("Decoded token payload:", payload)
        user_identifier = payload.get("sub")
        if not user_identifier:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing user sub identifier",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except ValueError as e:
        print("JWT decode failed:", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Support sub containing either email or MongoDB ObjectID
    if "@" in user_identifier:
        print(f"Looking up user by email: {user_identifier}")
        user = await AuthService.get_user_by_email(user_identifier)
    else:
        print(f"Looking up user by ID: {user_identifier}")
        user = await AuthService.get_user_by_id(user_identifier)

    print("Found user in database:", user is not None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user
