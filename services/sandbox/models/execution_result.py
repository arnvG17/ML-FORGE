from pydantic import BaseModel
from typing import Optional


class ExecutionResult(BaseModel):
    metrics: dict = {}
    plots: dict = {}
    controls: list = []
    errors: list = []
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    execution_time_ms: Optional[float] = None
