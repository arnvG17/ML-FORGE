import json
from typing import AsyncGenerator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from models.execution_request import ExecutionRequest
from models.execution_result import ExecutionResult
from core.session_manager import SessionManager

router = APIRouter()
session_manager = SessionManager()


@router.post("")
async def execute(request: ExecutionRequest) -> ExecutionResult:
    result = await session_manager.exec_full_sync(
        session_id=request.session_id,
        script=request.script,
    )
    return result


@router.get("/stream/{exec_id}")
async def execute_stream(exec_id: str):
    async def event_stream():
        async for chunk in session_manager.exec_full(
            session_id=exec_id,
            script="",
        ):
            yield f"data: {json.dumps(chunk)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.post("/delta")
async def execute_delta(request: ExecutionRequest) -> ExecutionResult:
    result_chunks = []
    async for chunk in session_manager.exec_delta(
        session_id=request.session_id,
        layer=request.layer or 1,
        params=request.params or {},
    ):
        result_chunks.append(chunk)

    if result_chunks:
        last = result_chunks[-1]
        return ExecutionResult(**last)

    return ExecutionResult(errors=["No output received"])


@router.delete("/{session_id}")
async def destroy_session(session_id: str):
    await session_manager.destroy(session_id)
    return {"status": "destroyed", "session_id": session_id}
