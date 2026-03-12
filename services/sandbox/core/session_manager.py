import json
import asyncio
import subprocess
import time
from typing import AsyncGenerator, Optional
from dataclasses import dataclass, field

from core.sandbox_pool import SandboxPool, SandboxInstance
from core.output_parser import parse_output
from models.execution_result import ExecutionResult


@dataclass
class SandboxSession:
    session_id: str
    sandbox: SandboxInstance
    current_script: Optional[str] = None
    layers: dict = field(default_factory=dict)


class SessionManager:
    def __init__(self):
        self.sessions: dict[str, SandboxSession] = {}
        self.pool = SandboxPool()

    async def get_or_create(self, session_id: str) -> SandboxSession:
        if session_id in self.sessions:
            return self.sessions[session_id]

        sandbox = await self.pool.acquire()
        session = SandboxSession(
            session_id=session_id,
            sandbox=sandbox,
        )
        self.sessions[session_id] = session
        return session

    async def exec_full(
        self, session_id: str, script: str
    ) -> AsyncGenerator[dict, None]:
        session = await self.get_or_create(session_id)
        session.current_script = script

        start_time = time.time()

        try:
            process = await asyncio.create_subprocess_exec(
                "python", "-c", script,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout_data = b""
            stderr_data = b""

            if process.stdout:
                stdout_data = await asyncio.wait_for(
                    process.stdout.read(), timeout=30
                )
            if process.stderr:
                stderr_data = await asyncio.wait_for(
                    process.stderr.read(), timeout=30
                )

            await process.wait()

            elapsed = (time.time() - start_time) * 1000
            stdout_str = stdout_data.decode("utf-8", errors="replace")
            stderr_str = stderr_data.decode("utf-8", errors="replace")

            result = parse_output(stdout_str)
            result["stdout"] = stdout_str
            result["stderr"] = stderr_str
            result["execution_time_ms"] = round(elapsed, 2)

            yield result

        except asyncio.TimeoutError:
            yield {
                "metrics": {},
                "plots": {},
                "controls": [],
                "errors": ["Execution timed out (30s limit)"],
                "execution_time_ms": 30000,
            }
        except Exception as e:
            yield {
                "metrics": {},
                "plots": {},
                "controls": [],
                "errors": [str(e)],
                "execution_time_ms": round((time.time() - start_time) * 1000, 2),
            }

    async def exec_full_sync(
        self, session_id: str, script: str
    ) -> ExecutionResult:
        async for result in self.exec_full(session_id, script):
            return ExecutionResult(**result)
        return ExecutionResult(errors=["No output received"])

    async def exec_delta(
        self, session_id: str, layer: int, params: dict
    ) -> AsyncGenerator[dict, None]:
        session = await self.get_or_create(session_id)

        if not session.current_script:
            yield {
                "metrics": {},
                "plots": {},
                "controls": [],
                "errors": ["No script loaded for this session"],
            }
            return

        modified_script = session.current_script
        for var_name, value in params.items():
            import re

            pattern = rf"^({var_name}\s*=\s*)(.+)$"
            if isinstance(value, str):
                replacement = rf'\1"{value}"'
            else:
                replacement = rf"\1{value}"
            modified_script = re.sub(
                pattern, replacement, modified_script, flags=re.MULTILINE
            )

        async for result in self.exec_full(session_id, modified_script):
            yield result

    async def destroy(self, session_id: str) -> None:
        if session_id in self.sessions:
            session = self.sessions.pop(session_id)
            await self.pool.release(session.sandbox)
