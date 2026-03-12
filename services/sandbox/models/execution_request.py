from pydantic import BaseModel
from typing import Optional


class ExecutionRequest(BaseModel):
    session_id: str
    script: str
    layer: Optional[int] = None
    params: Optional[dict] = None


class ExecutionRequestDelta(BaseModel):
    session_id: str
    layer: int
    params: dict
