from pydantic import BaseModel
from typing import Optional


class CacheLookupRequest(BaseModel):
    intent: str
    domain: str = "general"
    algorithm: Optional[str] = None


class CacheStoreRequest(BaseModel):
    intent: str
    domain: str
    algorithm: Optional[str] = None
    script: str
    schema: Optional[dict] = None
    sample_output: Optional[dict] = None


class CacheResponse(BaseModel):
    found: bool
    fingerprint: Optional[str] = None
    script: Optional[str] = None
