import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.db import db
from app.users.models.token import Token
from app.utils.current_request import get_current_request


@dataclass
class DecodedPublicToken:
    public: str
    token: str


def encode_public_token(token: DecodedPublicToken) -> str:
    return f"{token.public}:{token.token}"


def decode_public_token(encoded: str) -> DecodedPublicToken:
    public, token = encoded.split(":")
    return DecodedPublicToken(public=public, token=token)


def retrieve_decoded_token(token: DecodedPublicToken) -> Token | None:
    """
    Does not check for expiry. Returns None if public doesn't exist
    or the private `token` is wrong
    """
    db_token = db.execute(
        select(Token).where(Token.public == token.public)
    ).scalar_one_or_none()
    if (db_token is not None) and secrets.compare_digest(db_token.token, token.token):
        return db_token
    else:
        return None


class NotAuthorizedException(Exception):
    def __init__(self, private_reason: str):
        self.private_reason = private_reason


def get_current_valid_token() -> Token:
    request = get_current_request()
    public_token = decode_public_token(request.cookies["public_token"])
    maybe_token = retrieve_decoded_token(public_token)

    if maybe_token is None:
        raise NotAuthorizedException(private_reason="Token does not exist")
    elif maybe_token.expires_at < datetime.now():
        raise NotAuthorizedException(private_reason="Token expired")
    else:
        return maybe_token


def get_current_valid_token_or_none() -> Token | None:
    request = get_current_request()
    if "public_token" not in request.cookies:
        return None
    else:
        return get_current_valid_token()


def create_token_for_user(user_id: int) -> Token:
    return db.execute(
        insert(Token)
        .values(
            [
                {
                    "user_id": user_id,
                    "public": secrets.token_urlsafe(32),
                    "token": secrets.token_urlsafe(32),
                    "expires_at": datetime.now() + timedelta(hours=1),
                }
            ]
        )
        .returning(Token)
    ).scalar_one()
