from fastapi import APIRouter, Depends, Query
from typing import Optional

from middleware.auth_middleware import get_current_user

router = APIRouter()


@router.get("/lookup")
async def cache_lookup(
    intent: str = Query(...),
    domain: str = Query("general"),
    algorithm: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    # Standalone fallback: no external cache service needed
    return {"found": False}


@router.post("/store")
async def cache_store(
    body: dict,
    user: dict = Depends(get_current_user),
):
    return {"stored": True, "fingerprint": "standalone-mode"}
