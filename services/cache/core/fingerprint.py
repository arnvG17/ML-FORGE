import hashlib


def compute_fingerprint(intent: str, domain: str, algorithm: str | None = None) -> str:
    data = f"{intent.lower().strip()}:{domain}:{algorithm or 'none'}"
    return hashlib.sha256(data.encode()).hexdigest()[:16]
