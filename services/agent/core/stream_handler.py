import json
from typing import AsyncGenerator

from anthropic import AsyncAnthropic
from config import settings


async def stream_llm_response(
    system_prompt: str,
    user_prompt: str,
    messages: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    message_list = []

    if messages:
        for msg in messages:
            message_list.append({
                "role": msg["role"],
                "content": msg["content"],
            })

    message_list.append({"role": "user", "content": user_prompt})

    async with client.messages.stream(
        model=settings.model_name,
        max_tokens=settings.max_tokens,
        system=system_prompt,
        messages=message_list,
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def generate_full_response(
    system_prompt: str,
    user_prompt: str,
    messages: list[dict] | None = None,
) -> str:
    collected = []
    async for token in stream_llm_response(system_prompt, user_prompt, messages):
        collected.append(token)
    return "".join(collected)
