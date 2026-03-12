import asyncio
from typing import Optional


class SandboxInstance:
    def __init__(self, sandbox_id: str):
        self.sandbox_id = sandbox_id
        self.is_warm = True
        self.last_used = asyncio.get_event_loop().time()


class SandboxPool:
    def __init__(self, max_size: int = 5):
        self.max_size = max_size
        self.pool: list[SandboxInstance] = []
        self._lock = asyncio.Lock()

    async def acquire(self) -> SandboxInstance:
        async with self._lock:
            for sandbox in self.pool:
                if sandbox.is_warm:
                    sandbox.is_warm = False
                    return sandbox

            if len(self.pool) < self.max_size:
                sandbox = await self._create_sandbox()
                self.pool.append(sandbox)
                sandbox.is_warm = False
                return sandbox

            oldest = min(self.pool, key=lambda s: s.last_used)
            await self._destroy_sandbox(oldest)
            self.pool.remove(oldest)

            sandbox = await self._create_sandbox()
            self.pool.append(sandbox)
            sandbox.is_warm = False
            return sandbox

    async def release(self, sandbox: SandboxInstance) -> None:
        async with self._lock:
            sandbox.is_warm = True
            sandbox.last_used = asyncio.get_event_loop().time()

    async def _create_sandbox(self) -> SandboxInstance:
        sandbox_id = f"sandbox-{len(self.pool) + 1}"
        return SandboxInstance(sandbox_id=sandbox_id)

    async def _destroy_sandbox(self, sandbox: SandboxInstance) -> None:
        pass

    async def cleanup(self) -> None:
        async with self._lock:
            for sandbox in self.pool:
                await self._destroy_sandbox(sandbox)
            self.pool.clear()
