from fastapi import APIRouter

from app.users.schemas.user import (
    CurrentSessionDumpSchema,
    UserDumpSchemaWithSessionInfo,
)
from app.users.services.auth import (
    get_current_valid_token_or_none,
)
from app.users.services.user import get_user_by_id


router = APIRouter(
    prefix="/users",
    responses={404: {"description": "Not found"}},
)


@router.get("/current-session")
def current_session_get() -> CurrentSessionDumpSchema:
    token = get_current_valid_token_or_none()
    if token is None:
        return CurrentSessionDumpSchema(user=None)
    else:
        user = get_user_by_id(token.user_id)
        return CurrentSessionDumpSchema(
            user=UserDumpSchemaWithSessionInfo(
                id=user.id,
                email=user.email,
                started_at=token.created_at,
                expires_at=token.expires_at,
            ),
        )
