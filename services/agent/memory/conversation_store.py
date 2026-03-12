import json
from typing import Optional

import redis.asyncio as redis
from config import settings


class ConversationStore:
    def __init__(self):
        self.client: Optional[redis.Redis] = None

    async def _get_client(self) -> redis.Redis:
        if self.client is None:
            self.client = redis.from_url(
                settings.redis_url,
                decode_responses=True,
            )
        return self.client

    def _key(self, session_id: str) -> str:
        return f"forge:conversation:{session_id}"

    async def get_history(self, session_id: str) -> list[dict]:
        client = await self._get_client()
        raw = await client.lrange(self._key(session_id), 0, -1)
        return [json.loads(item) for item in raw]

    async def add_message(
        self, session_id: str, role: str, content: str
    ) -> None:
        client = await self._get_client()
        message = json.dumps({"role": role, "content": content})
        await client.rpush(self._key(session_id), message)
        await client.expire(self._key(session_id), 86400 * 7)

    async def clear_history(self, session_id: str) -> None:
        client = await self._get_client()
        await client.delete(self._key(session_id))
