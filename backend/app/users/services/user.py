from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.db import db
from app.users.models.user import User
from app.users.services.auth import (
    get_current_valid_token,
    get_current_valid_token_or_none,
)


def get_current_user() -> User:
    token = get_current_valid_token()
    return get_user_by_id(token.user_id)


def get_user_by_id(user_id: int) -> User:
    return db.execute(select(User).where(User.id == user_id)).scalar_one()


def get_current_user_or_none() -> User | None:
    token = get_current_valid_token_or_none()
    if token is None:
        return None
    else:
        return get_user_by_id(token.user_id)


def get_or_create_user_for_email(email: str) -> User:
    db.execute(
        insert(User)
        .values(
            [
                {
                    "email": email,
                    "username": email,
                }
            ]
        )
        .on_conflict_do_nothing(index_elements=["email"])
    )
    return db.execute(select(User).where(User.email == email)).scalar_one()
