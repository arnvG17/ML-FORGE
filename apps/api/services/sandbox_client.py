from typing import AsyncGenerator, Optional

import httpx
from config import settings


class SandboxClient:
    def __init__(self):
        self.base_url = settings.sandbox_service_url

    async def execute(self, session_id: str, script: str) -> dict:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self.base_url}/execute",
                json={"session_id": session_id, "script": script},
            )
            response.raise_for_status()
            return response.json()

    async def execute_delta(
        self, session_id: str, layer: int, params: dict
    ) -> dict:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self.base_url}/execute/delta",
                json={
                    "session_id": session_id,
                    "script": "",
                    "layer": layer,
                    "params": params,
                },
            )
            response.raise_for_status()
            return response.json()

    async def destroy(self, session_id: str) -> None:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.delete(f"{self.base_url}/execute/{session_id}")


sandbox_client = SandboxClient()
