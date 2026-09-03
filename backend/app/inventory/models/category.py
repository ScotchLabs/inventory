from typing import TYPE_CHECKING

from sqlalchemy import Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


if TYPE_CHECKING:
    pass


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    name: Mapped[str] = mapped_column(Text, unique=True, index=True)

    classification: Mapped[str] = mapped_column(
        Text,
    )
