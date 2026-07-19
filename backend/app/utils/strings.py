from uuid import uuid4


def make_slug(length: int | None = None):
    resolved_length = length if length is not None else 6
    return uuid4().hex[:resolved_length]
