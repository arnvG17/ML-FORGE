from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.auth import RegisterRequest, LoginRequest, AuthResponse, RefreshRequest
from services.auth_service import (
    register_user,
    authenticate_user,
    create_access_token,
    decode_access_token,
)

router = APIRouter()


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        user = await register_user(db, request.name, request.email, request.password)
        token = create_access_token(str(user.id), user.email)
        return AuthResponse(
            access_token=token,
            user_id=str(user.id),
            email=user.email,
            name=user.name,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(str(user.id), user.email)
    return AuthResponse(
        access_token=token,
        user_id=str(user.id),
        email=user.email,
        name=user.name,
    )


@router.post("/refresh", response_model=AuthResponse)
async def refresh(request: RefreshRequest):
    payload = decode_access_token(request.access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    token = create_access_token(payload["sub"], payload.get("email", ""))
    return AuthResponse(
        access_token=token,
        user_id=payload["sub"],
        email=payload.get("email", ""),
        name="",
    )
