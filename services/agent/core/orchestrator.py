import hashlib
import json
from typing import AsyncGenerator

from core.intent_parser import parse_intent
from core.prompt_builder import build_system_prompt, build_user_prompt
from core.stream_handler import stream_llm_response, generate_full_response
from core.schema_extractor import extract_output_schema, extract_python_code
from memory.conversation_store import ConversationStore


class Orchestrator:
    def __init__(self):
        self.conversation_store = ConversationStore()

    async def generate(
        self, session_id: str, intent: str
    ) -> AsyncGenerator[str, None]:
        parsed = parse_intent(intent)
        domain = parsed["domain"]
        algorithm = parsed.get("algorithm")

        history = await self.conversation_store.get_history(session_id)

        system_prompt = build_system_prompt(domain)
        user_prompt = build_user_prompt(
            intent=intent,
            algorithm=algorithm,
            conversation_context=history,
        )

        full_response = []

        async for token in stream_llm_response(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            messages=history,
        ):
            full_response.append(token)
            yield json.dumps({
                "type": "token",
                "content": token,
                "session_id": session_id,
            })

        complete_response = "".join(full_response)

        await self.conversation_store.add_message(
            session_id, "user", intent
        )
        await self.conversation_store.add_message(
            session_id, "assistant", complete_response
        )

        script = extract_python_code(complete_response)
        schema = extract_output_schema(script)
        fingerprint = self._compute_fingerprint(intent, domain, algorithm)

        yield json.dumps({
            "type": "done",
            "content": script,
            "session_id": session_id,
            "domain": domain,
            "fingerprint": fingerprint,
            "schema": schema,
        })

    async def generate_full(self, session_id: str, intent: str) -> dict:
        parsed = parse_intent(intent)
        domain = parsed["domain"]
        algorithm = parsed.get("algorithm")

        history = await self.conversation_store.get_history(session_id)

        system_prompt = build_system_prompt(domain)
        user_prompt = build_user_prompt(
            intent=intent,
            algorithm=algorithm,
            conversation_context=history,
        )

        response = await generate_full_response(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            messages=history,
        )

        await self.conversation_store.add_message(
            session_id, "user", intent
        )
        await self.conversation_store.add_message(
            session_id, "assistant", response
        )

        script = extract_python_code(response)
        fingerprint = self._compute_fingerprint(intent, domain, algorithm)

        return {
            "session_id": session_id,
            "script": script,
            "domain": domain,
            "fingerprint": fingerprint,
        }

    def _compute_fingerprint(
        self, intent: str, domain: str, algorithm: str | None
    ) -> str:
        data = f"{intent}:{domain}:{algorithm or 'none'}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]
