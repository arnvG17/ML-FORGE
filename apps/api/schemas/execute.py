from pydantic import BaseModel
from typing import Optional


class ExecuteRequest(BaseModel):
    session_id: str
    intent: str


class ExecuteResponse(BaseModel):
    execution_id: str
    session_id: str
    status: str
    script: Optional[str] = None
    result: Optional[dict] = None
