from typing import AsyncGenerator, Optional

import httpx
from config import settings


class AgentClient:
    def __init__(self):
        self.base_url = settings.agent_service_url

    async def generate(self, session_id: str, intent: str) -> dict:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{self.base_url}/generate",
                json={"session_id": session_id, "intent": intent},
            )
            response.raise_for_status()
            return response.json()

    async def generate_stream(
        self, session_id: str, intent: str
    ) -> AsyncGenerator[str, None]:
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/generate/stream",
                json={"session_id": session_id, "intent": intent},
            ) as response:
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        yield data


agent_client = AgentClient()
