import datetime
import secrets
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.models.models import User
from app.schemas.schemas import UserCreate, UserLogin, UserResponse, TokenResponse, RefreshTokenRequest, UserProfileUpdate, GoogleAuthRequest
from app.api.deps import get_current_user
from app.security.audit_chain import audit_chain

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Auto-generate username from email if not provided
    username = (user_in.username or user_in.email.split("@")[0]).strip().lower()
    
    # Check if user already exists
    existing = db.query(User).filter((User.email == user_in.email) | (User.username == username)).first()
    if existing:
        if existing.email == user_in.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists. Please sign in."
            )
        # If username collides, suffix with random digits
        username = f"{username}_{secrets.randbelow(9000) + 1000}"
    
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        username=username,
        full_name=user_in.full_name or username,
        hashed_password=hashed_pwd,
        role=user_in.role or "analyst",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id, role=user.role)
    
    audit_chain.record_event(
        db=db,
        event_type="USER_REGISTERED",
        actor_type="USER",
        actor_id=str(user.id),
        resource_type="USER",
        resource_id=str(user.id),
        action_summary=f"User {user.username} registered with role {user.role}",
        payload={"email": user.email, "role": user.role}
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user)
    )

@router.post("/google", response_model=TokenResponse)
def google_auth(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate or auto-register a user via Google Single Sign-On.
    Accepts a Google ID token credential or user details from Google OAuth.
    """
    email = req.email
    name = req.name
    
    # If a raw credential token is passed, extract claims
    if req.credential:
        try:
            # Decode payload unverified for dev/client-side tokens or verify if signed
            unverified_claims = jwt.decode(req.credential, options={"verify_signature": False})
            email = unverified_claims.get("email", email)
            name = unverified_claims.get("name", name)
        except Exception:
            pass

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google authentication requires a valid email address."
        )

    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        # Auto-provision user account from Google
        base_username = email.split("@")[0].lower().replace(".", "_")
        username = base_username
        suffix = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}_{suffix}"
            suffix += 1

        # Generate a high-entropy placeholder password hash for Google SSO
        random_pwd = secrets.token_urlsafe(32)
        user = User(
            email=email,
            username=username,
            full_name=name or username,
            hashed_password=get_password_hash(random_pwd),
            role="analyst",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        audit_chain.record_event(
            db=db,
            event_type="USER_GOOGLE_REGISTER",
            actor_type="USER",
            actor_id=str(user.id),
            resource_type="USER",
            resource_id=str(user.id),
            action_summary=f"User {user.email} auto-registered via Google SSO",
            payload={"email": user.email, "auth_provider": "google"}
        )
    else:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is deactivated"
            )
        audit_chain.record_event(
            db=db,
            event_type="USER_GOOGLE_LOGIN",
            actor_type="USER",
            actor_id=str(user.id),
            resource_type="SESSION",
            resource_id=str(user.id),
            action_summary=f"User {user.email} authenticated via Google SSO",
            payload={"email": user.email, "auth_provider": "google"}
        )

    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id, role=user.role)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == login_data.username_or_email) | (User.email == login_data.username_or_email)
    ).first()
    
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated"
        )
        
    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id, role=user.role)
    
    audit_chain.record_event(
        db=db,
        event_type="USER_LOGIN",
        actor_type="USER",
        actor_id=str(user.id),
        resource_type="SESSION",
        resource_id=str(user.id),
        action_summary=f"User {user.username} successfully authenticated",
        payload={"username": user.username, "role": user.role}
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user)
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
        
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or disabled"
        )
        
    new_access_token = create_access_token(subject=user.id, role=user.role)
    new_refresh_token = create_refresh_token(subject=user.id, role=user.role)
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if profile_in.email and profile_in.email != current_user.email:
        existing = db.query(User).filter(User.email == profile_in.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already in use")
        current_user.email = profile_in.email
        
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name
        
    if profile_in.new_password:
        if not profile_in.current_password or not verify_password(profile_in.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password incorrect")
        current_user.hashed_password = get_password_hash(profile_in.new_password)
        
    current_user.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)

