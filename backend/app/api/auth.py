from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import UserRegister, UserLogin, GoogleLoginRequest, TokenResponse, UserResponse, FirebaseLoginRequest
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister):
    # Check if user already exists
    existing = await AuthService.get_user_by_email(payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )
    
    # Create new user
    user = await AuthService.create_user(
        name=payload.name,
        email=payload.email,
        password=payload.password
    )
    
    # Generate token
    token = AuthService.generate_token(user["_id"], user["email"])
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            userId=user["_id"],
            email=user["email"],
            name=user["name"],
            photoURL=user.get("photoURL")
        )
    )

@router.post("/login", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def login(payload: UserLogin):
    user = await AuthService.get_user_by_email(payload.email)
    if not user or not user.get("hashedPassword"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password credentials"
        )
        
    is_valid = AuthService.verify_password(payload.password, user["hashedPassword"])
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password credentials"
        )

    token = AuthService.generate_token(user["_id"], user["email"])
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            userId=user["_id"],
            email=user["email"],
            name=user["name"],
            photoURL=user.get("photoURL")
        )
    )

@router.post("/google", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def google_login(payload: GoogleLoginRequest):
    try:
        # Verify ID Token
        google_profile = AuthService.verify_google_token(payload.idToken)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
        
    # Get or create Google user in database
    user = await AuthService.get_or_create_google_user(
        email=google_profile["email"],
        name=google_profile["name"],
        google_id=google_profile["googleId"],
        photo_url=google_profile.get("photoURL")
    )
    
    token = AuthService.generate_token(user["_id"], user["email"])
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            userId=user["_id"],
            email=user["email"],
            name=user["name"],
            photoURL=user.get("photoURL")
        )
    )

@router.post("/firebase", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def firebase_token_exchange(payload: FirebaseLoginRequest):
    print("=== FIREBASE REQUEST ===")
    print(payload.model_dump())
    try:
        # Verify the Firebase Token
        profile = AuthService.verify_firebase_token(payload.idToken)
        
        # Get or create user associated with this Firebase profile in MongoDB
        user = await AuthService.get_or_create_firebase_user(
            uid=profile["uid"],
            email=profile["email"],
            name=profile["name"],
            photo_url=profile.get("photoURL")
        )
        
        token = AuthService.generate_token(user["_id"], user["email"])
        
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse(
                userId=user["_id"],
                email=user["email"],
                name=user["name"],
                photoURL=user.get("photoURL")
            )
        )
    except Exception as e:
        import traceback
        print("=== FIREBASE EXCHANGE ERROR ===")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
