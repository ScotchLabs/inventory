from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


if TYPE_CHECKING:
    pass


class AssetCategoryMap(Base):
    __tablename__ = "asset_categories"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id"))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    type: Mapped[str] = mapped_column(Text)


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    file_id: Mapped[int | None] = mapped_column(
        ForeignKey("files.id"),
        nullable=True,
    )

    name: Mapped[str] = mapped_column(Text, unique=True, index=True)

    name_verbose: Mapped[str] = mapped_column(
        Text,
    )

    quantity: Mapped[Decimal] = mapped_column(
        Numeric,
    )

    current_location: Mapped[str] = mapped_column(
        Text,
    )

    permanent_location_id: Mapped[int | None] = mapped_column(
        ForeignKey("locations.id"),
        nullable=True,
    )

    last_updated: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
    )

    last_updated_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    notes: Mapped[str] = mapped_column(
        Text,
    )
