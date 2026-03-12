from typing import Optional
from core.store import CacheStore
from core.fingerprint import compute_fingerprint


cache_store = CacheStore()


async def lookup(intent: str, domain: str, algorithm: str | None = None) -> Optional[dict]:
    fingerprint = compute_fingerprint(intent, domain, algorithm)
    return await cache_store.get(fingerprint)


async def lookup_by_fingerprint(fingerprint: str) -> Optional[dict]:
    return await cache_store.get(fingerprint)
