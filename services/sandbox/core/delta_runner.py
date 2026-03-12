import re
from typing import AsyncGenerator


class DeltaRunner:
    LAYER_MARKERS = {
        1: "# === DATA ===",
        2: "# === PROCESSING ===",
        3: "# === MODEL ===",
        4: "# === METRICS ===",
    }

    def split_layers(self, script: str) -> dict[int, str]:
        layers = {}
        current_layer = 0
        current_lines = []

        for line in script.split("\n"):
            for layer_num, marker in self.LAYER_MARKERS.items():
                if marker in line:
                    if current_lines:
                        layers[current_layer] = "\n".join(current_lines)
                    current_layer = layer_num
                    current_lines = [line]
                    break
            else:
                current_lines.append(line)

        if current_lines:
            layers[current_layer] = "\n".join(current_lines)

        return layers

    def rebuild_from_layer(
        self, script: str, from_layer: int, params: dict
    ) -> str:
        layers = self.split_layers(script)

        modified = script
        for var_name, value in params.items():
            pattern = rf"^({var_name}\s*=\s*)(.+)$"
            if isinstance(value, str):
                replacement = rf'\1"{value}"'
            else:
                replacement = rf"\1{value}"
            modified = re.sub(
                pattern, replacement, modified, flags=re.MULTILINE
            )

        return modified
