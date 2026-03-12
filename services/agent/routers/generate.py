from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from core.orchestrator import Orchestrator

router = APIRouter()
orchestrator = Orchestrator()


class GenerateRequest(BaseModel):
    session_id: str
    intent: str


class GenerateResponse(BaseModel):
    session_id: str
    script: str
    domain: str
    fingerprint: str


@router.post("")
async def generate(request: GenerateRequest) -> GenerateResponse:
    result = await orchestrator.generate_full(
        session_id=request.session_id,
        intent=request.intent,
    )
    return GenerateResponse(**result)


@router.post("/stream")
async def generate_stream(request: GenerateRequest):
    async def event_stream():
        async for token in orchestrator.generate(
            session_id=request.session_id,
            intent=request.intent,
        ):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
