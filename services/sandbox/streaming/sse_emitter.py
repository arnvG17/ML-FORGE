import json
from typing import AsyncGenerator


async def sse_emitter(data_generator: AsyncGenerator) -> AsyncGenerator[str, None]:
    async for item in data_generator:
        if isinstance(item, dict):
            yield f"data: {json.dumps(item)}\n\n"
        elif isinstance(item, str):
            yield f"data: {item}\n\n"
        else:
            yield f"data: {json.dumps(str(item))}\n\n"
    yield "data: [DONE]\n\n"
