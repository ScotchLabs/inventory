from app.db.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, Text, ForeignKey, Numeric, DateTime
from decimal import Decimal
from datetime import datetime

class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    file_id: Mapped[int] = mapped_column(
        ForeignKey("files.id")
    )

    name: Mapped[str] = mapped_column(
        Text,
    )

    name_verbose: Mapped[str] = mapped_column(
        Text,
    )

    categories: Mapped[int] = mapped_column(
        ForeignKey("category.id")
    )

    sub_categories: Mapped[int] = mapped_column(
        ForeignKey("category.id")
    )

    quantity: Mapped[Decimal] = mapped_column(
        Numeric,
    )

    current_location: Mapped[str] = mapped_column(
        Text,
    )

    permanent_location_id: Mapped[int] = mapped_column(
        ForeignKey("locations.id"),
    )

    last_updated: Mapped[datetime] = mapped_column(
        DateTime,
    )

    last_updated_by: Mapped[int] = mapped_column(
        ForeignKey("users.id")
    )

    notes: Mapped[str] = mapped_column(
        Text,
    )