from app.users.services.auth import requires_user
from fastapi import Depends, APIRouter
from typing import Any, TYPE_CHECKING
from collections.abc import Callable
from fastapi.routing import APIRoute


# verbose name to make it easier for autocomplete
def public_route[T: Callable](func: T) -> T:
    func.__is_public__ = True  # ty:ignore[unresolved-attribute]
    return func

class SatisAPIRoute(APIRoute):
    def __init__(
        self, path: str, endpoint: Callable[..., Any], *args: Any, **kwargs: Any
    ) -> None:
        is_public = getattr(endpoint, "__is_public__", False)

        if not is_public:
            dependencies = list(kwargs.pop("dependencies", None) or [])
            dependencies.insert(0, Depends(requires_user))
            kwargs["dependencies"] = dependencies

        super().__init__(path, endpoint, *args, **kwargs)

class SatisAPIRouter(APIRouter):
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        kwargs.setdefault("route_class", SatisAPIRoute)
        super().__init__(*args, **kwargs)
