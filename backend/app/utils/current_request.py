
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Generator

from fastapi import Request

_request_ctx: ContextVar[Request | None] = ContextVar("current_request", default=None)
def get_current_request() -> Request:
    request = _request_ctx.get()
    if request is None:
        raise RuntimeError("No request found")
    return request

@contextmanager
def current_request_context(request: Request) -> Generator[Request, None, None]:
    previous_request = _request_ctx.set(request)
    try:
        yield request
    finally:
        _request_ctx.reset(previous_request)

