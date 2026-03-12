from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SessionCreate(BaseModel):
    name: str = "Untitled Session"


class SessionUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    last_algorithm: Optional[str] = None


class SessionResponse(BaseModel):
    id: str
    name: str
    user_id: str
    status: str
    last_algorithm: Optional[str]
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
