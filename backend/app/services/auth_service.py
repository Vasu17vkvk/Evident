import datetime
import logging
import os
import requests
import jwt
from passlib.context import CryptContext
from app.database.mongodb import db
from bson import ObjectId
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth

load_dotenv()

logger = logging.getLogger("uvicorn.error")

# Initialize Firebase Admin SDK
try:
    if not firebase_admin._apps:
        firebase_project_id = os.getenv("FIREBASE_PROJECT_ID")
        firebase_client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
        firebase_private_key = os.getenv("FIREBASE_PRIVATE_KEY", "")
        
        # Clean private key strings that are double quoted or contain literal \n characters
        if firebase_private_key.startswith('"') and firebase_private_key.endswith('"'):
            firebase_private_key = firebase_private_key[1:-1]
        firebase_private_key = firebase_private_key.replace("\\n", "\n")

        if firebase_project_id and firebase_client_email and firebase_private_key:
            logger.info(f"[AuthService] Initializing Firebase Admin SDK for project {firebase_project_id}...")
            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": firebase_project_id,
                "private_key": firebase_private_key,
                "client_email": firebase_client_email,
                "token_uri": "https://oauth2.googleapis.com/token",
            })
            firebase_admin.initialize_app(cred)
        else:
            logger.warning("[AuthService] Firebase service account credentials incomplete in environment. Initializing default app...")
            firebase_admin.initialize_app()
            
        print("Initialized Firebase app:", firebase_admin.get_app())
except Exception as e:
    logger.error(f"[AuthService] Firebase Admin SDK initialization failed: {e}")

# Passlib crypt context for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "evident-ai-jwt-super-secret-key-127127")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week expiration

class AuthService:
    @staticmethod
    def hash_password(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"[AuthService] Password verification failed: {e}")
            return False

    @staticmethod
    def create_access_token(data: dict) -> str:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = data.copy()
        payload.update({"exp": expire})
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def generate_token(user_id: str, email: str) -> str:
        return AuthService.create_access_token(data={"sub": email, "user_id": user_id})

    @staticmethod
    def decode_token(token: str) -> dict:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("[AuthService] JWT signature has expired.")
            raise ValueError("Token signature has expired")
        except jwt.PyJWTError as e:
            logger.warning(f"[AuthService] JWT decoding failed: {e}")
            raise ValueError("Invalid credentials token")

    @staticmethod
    async def get_user_by_email(email: str) -> dict | None:
        user = await db.db["users"].find_one({"email": email.strip().lower()})
        if user:
            user["_id"] = str(user["_id"])
        return user

    @staticmethod
    async def get_user_by_id(user_id: str) -> dict | None:
        try:
            oid = ObjectId(user_id)
        except Exception:
            oid = user_id
        
        user = await db.db["users"].find_one({"_id": oid})
        if user:
            user["_id"] = str(user["_id"])
        return user

    @staticmethod
    async def create_user(name: str, email: str, password: str = None, google_id: str = None, photo_url: str = None) -> dict:
        user_data = {
            "name": name.strip(),
            "email": email.strip().lower(),
            "createdAt": datetime.datetime.utcnow(),
            "photoURL": photo_url
        }

        if password:
            user_data["hashedPassword"] = AuthService.hash_password(password)
        if google_id:
            user_data["googleId"] = google_id

        result = await db.db["users"].insert_one(user_data)
        user_data["_id"] = str(result.inserted_id)
        return user_data

    @staticmethod
    async def get_or_create_google_user(email: str, name: str, google_id: str, photo_url: str = None) -> dict:
        # Check by googleId first
        user = await db.db["users"].find_one({"googleId": google_id})
        if not user:
            # Check by email as a backup
            user = await db.db["users"].find_one({"email": email.strip().lower()})
            if user:
                # Associate googleId with existing email account
                await db.db["users"].update_one(
                    {"_id": user["_id"]},
                    {"$set": {"googleId": google_id, "photoURL": photo_url}}
                )
                user["googleId"] = google_id
                user["photoURL"] = photo_url
            else:
                # Create a new user account
                return await AuthService.create_user(name, email, google_id=google_id, photo_url=photo_url)
        
        user["_id"] = str(user["_id"])
        return user

    @staticmethod
    def verify_google_token(id_token: str) -> dict:
        """
        Verify the Google ID Token via Google's tokeninfo API.
        Returns the parsed payload if valid, otherwise raises ValueError.
        """
        try:
            logger.info("[AuthService] Verifying Google ID Token...")
            resp = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}", timeout=10)
            if resp.status_code != 200:
                logger.warning(f"[AuthService] Google token validation rejected: {resp.text}")
                raise ValueError("Invalid Google credentials token")
            
            payload = resp.json()
            # Basic validation checks
            if not payload.get("email") or not payload.get("sub"):
                raise ValueError("Incomplete Google token payload")
                
            return {
                "googleId": payload["sub"],
                "email": payload["email"],
                "name": payload.get("name", payload["email"].split("@")[0]),
                "photoURL": payload.get("picture")
            }
        except Exception as e:
            logger.error(f"[AuthService] Google OAuth verification exception: {e}")
            raise ValueError(f"Google authentication failed: {str(e)}")

    @staticmethod
    async def get_or_create_firebase_user(uid: str, email: str, name: str, photo_url: str = None) -> dict:
        user = await db.db["users"].find_one({"firebaseUid": uid})
        if not user:
            user = await db.db["users"].find_one({"email": email.strip().lower()})
            if user:
                await db.db["users"].update_one(
                    {"_id": user["_id"]},
                    {"$set": {"firebaseUid": uid, "photoURL": photo_url}}
                )
                user["firebaseUid"] = uid
                user["photoURL"] = photo_url
            else:
                user_data = {
                    "name": name.strip(),
                    "email": email.strip().lower(),
                    "firebaseUid": uid,
                    "createdAt": datetime.datetime.utcnow(),
                    "photoURL": photo_url
                }
                result = await db.db["users"].insert_one(user_data)
                user_data["_id"] = str(result.inserted_id)
                return user_data
        
        user["_id"] = str(user["_id"])
        return user

    @staticmethod
    def verify_firebase_token(id_token: str) -> dict:
        """
        Verify the Firebase ID Token using the official Firebase Admin SDK.
        """
        try:
            logger.info("[AuthService] Verifying Firebase ID Token with Admin SDK...")
            decoded = auth.verify_id_token(id_token)
            print("=== DECODED FIREBASE ID TOKEN ===")
            print(f"aud: {decoded.get('aud')}")
            print(f"iss: {decoded.get('iss')}")
            print(f"sub: {decoded.get('sub')}")
            print(f"email: {decoded.get('email')}")
            print(f"uid: {decoded.get('uid')}")
            
            email = decoded.get("email")
            if not email:
                email = f"{decoded['sub']}@evident.ai"

            return {
                "uid": decoded["sub"],
                "email": email,
                "name": decoded.get("name", email.split("@")[0]),
                "photoURL": decoded.get("picture")
            }
        except Exception as e:
            logger.error(f"[AuthService] Firebase Admin SDK verification failed: {e}")
            raise ValueError(f"Firebase token verification failed: {str(e)}")

