from sqlalchemy import CheckConstraint, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


ADMIN_EMAILS = ["madisone@andrew.cmu.edu", "hschremm@andrew.cmu.edu"]


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            f"email in ({', '.join(ADMIN_EMAILS)})", name="ck_only_admin_users"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    username: Mapped[str] = mapped_column(
        Text,
    )

    email: Mapped[str] = mapped_column(
        Text,
        unique=True,
    )
