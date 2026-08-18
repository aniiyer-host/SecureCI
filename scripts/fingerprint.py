import hashlib


def generate_fingerprint(*parts):
    """
    Generate a deterministic SHA-256 fingerprint
    from a sequence of identifying fields.
    """

    normalized = "|".join(
        str(part).strip().lower()
        for part in parts
        if part is not None
    )

    return hashlib.sha256(
        normalized.encode("utf-8")
    ).hexdigest()