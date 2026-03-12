import os
from pathlib import Path


PROMPTS_DIR = Path(__file__).parent.parent / "prompts"
TEMPLATES_DIR = Path(__file__).parent.parent / "templates"


def load_file(path: Path) -> str:
    if path.exists():
        return path.read_text(encoding="utf-8")
    return ""


def build_system_prompt(domain: str) -> str:
    base = load_file(PROMPTS_DIR / "base_system.txt")
    domain_addition = ""

    if domain == "ml":
        domain_addition = load_file(PROMPTS_DIR / "ml_domain.txt")
    else:
        domain_addition = load_file(PROMPTS_DIR / "general_domain.txt")

    return f"{base}\n\n{domain_addition}".strip()


def build_user_prompt(
    intent: str,
    algorithm: str | None = None,
    conversation_context: list[dict] | None = None,
) -> str:
    parts = []

    if conversation_context:
        parts.append("Previous conversation context:")
        for msg in conversation_context[-5:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            parts.append(f"  {role}: {content[:500]}")
        parts.append("")

    if algorithm:
        template = load_file(TEMPLATES_DIR / f"{algorithm}.py.txt")
        if template:
            parts.append(
                f"Reference template for {algorithm}:\n```python\n{template}\n```\n"
            )

    parts.append(f"User request: {intent}")

    return "\n".join(parts)
