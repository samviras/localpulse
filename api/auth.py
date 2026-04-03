"""Firebase authentication module"""
import os
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from fastapi import HTTPException, Header
from typing import Optional
from sqlalchemy.orm import Session
from models import User
from datetime import datetime

# Initialize Firebase (uses FIREBASE_CREDENTIALS env var or Google Cloud auth)
try:
    cred_json = os.getenv("FIREBASE_CREDENTIALS")
    if cred_json:
        import json
        cred_dict = json.loads(cred_json)
        cred = credentials.Certificate(cred_dict)
    else:
        # Use application default credentials (for Cloud Run, etc.)
        cred = credentials.ApplicationDefault()
    
    firebase_admin.initialize_app(cred)
except Exception as e:
    print(f"⚠️  Firebase init failed: {e}")
    print("Auth will be disabled. For production, set FIREBASE_CREDENTIALS env var.")

def verify_token(authorization: Optional[str] = Header(None)) -> str:
    """Verify Firebase ID token from Authorization header"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    try:
        # Token format: "Bearer <token>"
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header format")
        
        token = authorization.replace("Bearer ", "")
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def get_or_create_user(uid: str, email: str, db: Session) -> User:
    """Get existing user or create new one"""
    user = db.query(User).filter(User.firebase_uid == uid).first()
    if not user:
        user = User(
            firebase_uid=uid,
            email=email,
            onboarding_complete=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user
