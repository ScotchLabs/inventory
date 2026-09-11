
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.db import db
from app.users.models.user import User


def get_user_by_id(user_id: int) -> User:
    return db.execute(select(User).where(User.id == user_id)).scalar_one()



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
