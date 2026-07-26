
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Token(Base):
    __tablename__ = "tokens"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        nullable=False,
    )

    public: Mapped[str] = mapped_column(
       Text,
       index=True,
       nullable=False,
    )

    token: Mapped[str] = mapped_column(
       Text,
       index=True,
       nullable=False,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,

    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(),
        server_default="NOW()",
        nullable=False,
    )