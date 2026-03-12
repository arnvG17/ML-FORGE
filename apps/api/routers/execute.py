import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth_middleware import get_current_user
from schemas.execute import ExecuteRequest, ExecuteResponse

router = APIRouter()


@router.post("", response_model=ExecuteResponse)
async def execute(
    request: ExecuteRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # For standalone mode: return a demo response without calling agent/sandbox services
    try:
        from services.agent_client import agent_client

        agent_result = await agent_client.generate(
            session_id=request.session_id,
            intent=request.intent,
        )
        script = agent_result.get("script", "")

        from services.sandbox_client import sandbox_client

        sandbox_result = await sandbox_client.execute(
            session_id=request.session_id,
            script=script,
        )

        return ExecuteResponse(
            execution_id=str(uuid.uuid4()),
            session_id=request.session_id,
            status="done",
            script=script,
            result=sandbox_result,
        )
    except Exception:
        # Fallback: return a demo response when services aren't running
        return ExecuteResponse(
            execution_id=str(uuid.uuid4()),
            session_id=request.session_id,
            status="done",
            script=f"# Generated for: {request.intent}\nprint('Hello from Forge!')",
            result={
                "metrics": {"status": "demo_mode"},
                "plots": {},
                "controls": [],
                "errors": ["Agent/Sandbox services not running — showing demo response"],
            },
        )


@router.get("/{execution_id}/stream")
async def execute_stream(
    execution_id: str,
    user: dict = Depends(get_current_user),
):
    async def event_stream():
        yield f'data: {{"type": "token", "content": "# Demo mode\\n", "session_id": "{execution_id}"}}\n\n'
        yield f'data: {{"type": "done", "content": "# Demo mode", "session_id": "{execution_id}"}}\n\n'
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
