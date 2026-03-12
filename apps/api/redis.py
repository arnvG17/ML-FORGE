"""
In-memory fallback when Redis is not available.
"""

_store: dict[str, str] = {}


class MemoryRedis:
    """Minimal Redis-like interface backed by a dict."""

    async def get(self, key: str):
        return _store.get(key)

    async def set(self, key: str, value: str, ex: int = None):
        _store[key] = value

    async def delete(self, key: str):
        _store.pop(key, None)

    async def hset(self, key: str, mapping: dict):
        _store[key] = str(mapping)

    async def hgetall(self, key: str):
        return _store.get(key, {})


redis_client = MemoryRedis()


async def get_redis():
    return redis_client
