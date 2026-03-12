from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth_middleware import get_current_user
from schemas.session import SessionCreate, SessionUpdate, SessionResponse
from services.session_service import (
    create_session,
    get_sessions,
    get_session,
    update_session,
    delete_session,
)

router = APIRouter()


@router.get("", response_model=list[SessionResponse])
async def list_sessions(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sessions = await get_sessions(db, user["user_id"])
    return [
        SessionResponse(
            id=str(s.id),
            name=s.name,
            user_id=str(s.user_id),
            status=s.status,
            last_algorithm=s.last_algorithm,
            created_at=s.created_at.isoformat(),
            updated_at=s.updated_at.isoformat(),
        )
        for s in sessions
    ]


@router.post("", response_model=SessionResponse)
async def create(
    request: SessionCreate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await create_session(db, user["user_id"], request.name)
    return SessionResponse(
        id=str(session.id),
        name=session.name,
        user_id=str(session.user_id),
        status=session.status,
        last_algorithm=session.last_algorithm,
        created_at=session.created_at.isoformat(),
        updated_at=session.updated_at.isoformat(),
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get(
    session_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await get_session(db, session_id, user["user_id"])
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponse(
        id=str(session.id),
        name=session.name,
        user_id=str(session.user_id),
        status=session.status,
        last_algorithm=session.last_algorithm,
        created_at=session.created_at.isoformat(),
        updated_at=session.updated_at.isoformat(),
    )


@router.patch("/{session_id}", response_model=SessionResponse)
async def update(
    session_id: str,
    request: SessionUpdate,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await update_session(
        db,
        session_id,
        user["user_id"],
        name=request.name,
        status=request.status,
        last_algorithm=request.last_algorithm,
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponse(
        id=str(session.id),
        name=session.name,
        user_id=str(session.user_id),
        status=session.status,
        last_algorithm=session.last_algorithm,
        created_at=session.created_at.isoformat(),
        updated_at=session.updated_at.isoformat(),
    )


@router.delete("/{session_id}")
async def remove(
    session_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_session(db, session_id, user["user_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "deleted"}
