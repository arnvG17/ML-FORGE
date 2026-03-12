import asyncio
import time
from typing import AsyncGenerator

from core.session_manager import SessionManager
from core.output_parser import parse_output


class Executor:
    def __init__(self, session_manager: SessionManager):
        self.session_manager = session_manager

    async def execute(
        self, session_id: str, script: str
    ) -> AsyncGenerator[dict, None]:
        async for result in self.session_manager.exec_full(session_id, script):
            yield result

    async def execute_delta(
        self, session_id: str, layer: int, params: dict
    ) -> AsyncGenerator[dict, None]:
        async for result in self.session_manager.exec_delta(
            session_id, layer, params
        ):
            yield result
