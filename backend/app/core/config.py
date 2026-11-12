import os
from typing import List

class Settings:
    PROJECT_NAME: str = "VeriTrust"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "veritrust-super-secure-production-master-secret-key-2026-auth")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./veritrust.db")
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    RISK_APPROVAL_THRESHOLD: float = 60.0
    RISK_CRITICAL_THRESHOLD: float = 80.0
    APPROVAL_EXPIRY_MINUTES: int = 60
    
    DEFAULT_ADMIN_EMAIL: str = "admin@veritrust.io"
    DEFAULT_ADMIN_PASSWORD: str = "Admin@123456"
    DEFAULT_ANALYST_EMAIL: str = "analyst@veritrust.io"
    DEFAULT_ANALYST_PASSWORD: str = "Analyst@123456"

settings = Settings()
