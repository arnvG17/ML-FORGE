from typing import Optional

import redis.asyncio as aioredis
from core.store import CacheStore
from config import settings


cache_store = CacheStore()


async def get_library(limit: int = 20) -> list[dict]:
    client = await cache_store._get_client()

    top_fingerprints = await client.zrevrange(
        "forge:cache:popularity", 0, limit - 1, withscores=True
    )

    results = []
    for fingerprint, score in top_fingerprints:
        entry = await cache_store.get(fingerprint)
        if entry:
            entry["usage_count"] = int(score)
            results.append(entry)

    return results
