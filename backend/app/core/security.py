import hashlib
import json
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
from app.core.config import settings

# Graceful fallback if pyjwt is not installed in local environment
try:
    import jwt
    HAS_PYJWT = True
except ImportError:
    HAS_PYJWT = False

def hash_password(password: str) -> str:
    """Simple robust password hashing using sha256 + salt for compatibility."""
    salt = "incidentiq_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(subject: str | Any, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire.timestamp(), "sub": str(subject)}

    if HAS_PYJWT:
        return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    # Fallback JWT encoder using standard library
    header = base64.b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
    payload = base64.b64encode(json.dumps(to_encode).encode()).decode().rstrip("=")
    signature = hashlib.sha256(f"{header}.{payload}.{settings.SECRET_KEY}".encode()).hexdigest()
    return f"{header}.{payload}.{signature}"

def decode_access_token(token: str) -> Optional[dict]:
    try:
        if HAS_PYJWT:
            return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        parts = token.split(".")
        if len(parts) != 3:
            return None
        payload_b64 = parts[1] + "=="
        decoded_bytes = base64.b64decode(payload_b64)
        payload = json.loads(decoded_bytes.decode('utf-8'))
        return payload
    except Exception:
        return None
