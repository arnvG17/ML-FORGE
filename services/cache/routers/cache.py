from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional

from core.fingerprint import compute_fingerprint
from core.store import CacheStore
from core.lookup import lookup, lookup_by_fingerprint
from core.library import get_library

router = APIRouter()
cache_store = CacheStore()


class StoreRequest(BaseModel):
    intent: str
    domain: str
    algorithm: Optional[str] = None
    script: str
    schema: Optional[dict] = None
    sample_output: Optional[dict] = None


class LookupResponse(BaseModel):
    fingerprint: str
    script: str
    schema: dict
    sample_output: dict


@router.get("/lookup")
async def cache_lookup(
    intent: str = Query(...),
    domain: str = Query("general"),
    algorithm: Optional[str] = Query(None),
):
    result = await lookup(intent, domain, algorithm)
    if result is None:
        return {"found": False}
    return {"found": True, "entry": result}


@router.get("/lookup/{fingerprint}")
async def cache_lookup_by_fingerprint(fingerprint: str):
    result = await lookup_by_fingerprint(fingerprint)
    if result is None:
        return {"found": False}
    return {"found": True, "entry": result}


@router.post("/store")
async def cache_store_entry(request: StoreRequest):
    fingerprint = compute_fingerprint(
        request.intent, request.domain, request.algorithm
    )
    await cache_store.store(
        fingerprint=fingerprint,
        script=request.script,
        schema=request.schema,
        sample_output=request.sample_output,
    )
    return {"fingerprint": fingerprint, "stored": True}


@router.get("/library")
async def cache_library(limit: int = Query(20, ge=1, le=100)):
    results = await get_library(limit)
    return {"tools": results, "count": len(results)}
