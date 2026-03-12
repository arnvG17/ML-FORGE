import json
from typing import Optional

import redis.asyncio as aioredis
from config import settings


class CacheStore:
    def __init__(self):
        self.client: Optional[aioredis.Redis] = None

    async def _get_client(self) -> aioredis.Redis:
        if self.client is None:
            self.client = aioredis.from_url(
                settings.redis_url,
                decode_responses=True,
            )
        return self.client

    def _key(self, fingerprint: str) -> str:
        return f"forge:cache:{fingerprint}"

    async def store(
        self,
        fingerprint: str,
        script: str,
        schema: dict | None = None,
        sample_output: dict | None = None,
    ) -> None:
        client = await self._get_client()
        data = {
            "script": script,
            "schema": json.dumps(schema or {}),
            "sample_output": json.dumps(sample_output or {}),
        }
        await client.hset(self._key(fingerprint), mapping=data)
        await client.expire(self._key(fingerprint), settings.cache_ttl)

        await client.zincrby("forge:cache:popularity", 1, fingerprint)

    async def get(self, fingerprint: str) -> Optional[dict]:
        client = await self._get_client()
        data = await client.hgetall(self._key(fingerprint))

        if not data:
            return None

        return {
            "fingerprint": fingerprint,
            "script": data.get("script", ""),
            "schema": json.loads(data.get("schema", "{}")),
            "sample_output": json.loads(data.get("sample_output", "{}")),
        }
