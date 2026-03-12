import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from models.session import Session


async def create_session(
    db: AsyncSession, user_id: str, name: str = "Untitled Session"
) -> Session:
    session = Session(
        id=uuid.uuid4(),
        name=name,
        user_id=user_id,
    )
    db.add(session)
    await db.flush()
    return session


async def get_sessions(db: AsyncSession, user_id: str) -> list[Session]:
    result = await db.execute(
        select(Session)
        .where(Session.user_id == user_id)
        .order_by(Session.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_session(
    db: AsyncSession, session_id: str, user_id: str
) -> Optional[Session]:
    result = await db.execute(
        select(Session).where(
            Session.id == session_id, Session.user_id == user_id
        )
    )
    return result.scalar_one_or_none()


async def update_session(
    db: AsyncSession,
    session_id: str,
    user_id: str,
    name: Optional[str] = None,
    status: Optional[str] = None,
    last_algorithm: Optional[str] = None,
) -> Optional[Session]:
    values = {}
    if name is not None:
        values["name"] = name
    if status is not None:
        values["status"] = status
    if last_algorithm is not None:
        values["last_algorithm"] = last_algorithm

    if values:
        await db.execute(
            update(Session)
            .where(Session.id == session_id, Session.user_id == user_id)
            .values(**values)
        )
        await db.flush()

    return await get_session(db, session_id, user_id)


async def delete_session(db: AsyncSession, session_id: str, user_id: str) -> bool:
    result = await db.execute(
        delete(Session).where(
            Session.id == session_id, Session.user_id == user_id
        )
    )
    return result.rowcount > 0
