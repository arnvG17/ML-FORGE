import re
import json
from typing import Optional


def extract_output_schema(script: str) -> Optional[dict]:
    controls = extract_controls(script)
    metrics_keys = extract_metrics_keys(script)

    return {
        "controls": controls,
        "metrics_keys": metrics_keys,
    }


def extract_controls(script: str) -> list[dict]:
    controls = []

    pattern = r'FORGE_OUTPUT_SCHEMA\s*=\s*(\{.*?\})'
    match = re.search(pattern, script, re.DOTALL)

    if match:
        try:
            schema = json.loads(match.group(1))
            if "controls" in schema:
                return schema["controls"]
        except json.JSONDecodeError:
            pass

    slider_pattern = r'\{\s*"id"\s*:\s*"([^"]+)"\s*,\s*"type"\s*:\s*"slider"'
    for m in re.finditer(slider_pattern, script):
        controls.append({
            "id": m.group(1),
            "type": "slider",
        })

    dropdown_pattern = r'\{\s*"id"\s*:\s*"([^"]+)"\s*,\s*"type"\s*:\s*"dropdown"'
    for m in re.finditer(dropdown_pattern, script):
        controls.append({
            "id": m.group(1),
            "type": "dropdown",
        })

    return controls


def extract_metrics_keys(script: str) -> list[str]:
    keys = []

    pattern = r'"metrics"\s*:\s*\{([^}]*)\}'
    match = re.search(pattern, script)

    if match:
        inner = match.group(1)
        key_pattern = r'"([^"]+)"\s*:'
        keys = re.findall(key_pattern, inner)

    return keys


def extract_python_code(response: str) -> str:
    code_blocks = re.findall(r'```python\s*(.*?)```', response, re.DOTALL)

    if code_blocks:
        return code_blocks[0].strip()

    code_blocks = re.findall(r'```\s*(.*?)```', response, re.DOTALL)
    if code_blocks:
        return code_blocks[0].strip()

    return response.strip()
