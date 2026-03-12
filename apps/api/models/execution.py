import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from database import Base


class Execution(Base):
    __tablename__ = "executions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False)
    intent = Column(Text, nullable=False)
    script = Column(Text, nullable=True)
    result = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    fingerprint = Column(String(64), nullable=True)
    execution_time_ms = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
