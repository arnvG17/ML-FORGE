import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Text, Integer
from database import Base


class CachedTool(Base):
    __tablename__ = "cached_tools"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    fingerprint = Column(String(64), unique=True, nullable=False, index=True)
    intent = Column(Text, nullable=False)
    domain = Column(String(50), nullable=False)
    algorithm = Column(String(100), nullable=True)
    script = Column(Text, nullable=False)
    schema = Column(Text, nullable=True)
    sample_output = Column(Text, nullable=True)
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
