import json
from typing import Optional


def parse_output(stdout: str) -> dict:
    default = {
        "metrics": {},
        "plots": {},
        "controls": [],
        "errors": [],
    }

    if not stdout.strip():
        default["errors"] = ["No output produced"]
        return default

    lines = stdout.strip().split("\n")

    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue

        try:
            parsed = json.loads(line)

            if isinstance(parsed, dict):
                result = {
                    "metrics": parsed.get("metrics", {}),
                    "plots": parsed.get("plots", {}),
                    "controls": parsed.get("controls", []),
                    "errors": parsed.get("errors", []),
                }
                return result
        except json.JSONDecodeError:
            continue

    default["errors"] = ["Could not parse output as JSON"]
    return default


def validate_result(result: dict) -> list[str]:
    warnings = []

    if not isinstance(result.get("metrics"), dict):
        warnings.append("metrics should be a dict")
    if not isinstance(result.get("plots"), dict):
        warnings.append("plots should be a dict")
    if not isinstance(result.get("controls"), list):
        warnings.append("controls should be a list")
    if not isinstance(result.get("errors"), list):
        warnings.append("errors should be a list")

    for control in result.get("controls", []):
        if not isinstance(control, dict):
            warnings.append("Each control must be a dict")
            continue
        required_fields = ["id", "type", "label", "targets_var"]
        for field in required_fields:
            if field not in control:
                warnings.append(f"Control missing field: {field}")

    return warnings
