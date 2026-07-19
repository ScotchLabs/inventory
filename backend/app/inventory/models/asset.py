from typing import TYPE_CHECKING
from app.db.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, Text, ForeignKey, Numeric, DateTime, Table, Column
from decimal import Decimal
from datetime import datetime

if TYPE_CHECKING:
    from app.inventory.models.category import Category

class AssetCategoryMap(Base):
    __tablename__ = "asset_categories"
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )
    asset_id: Mapped[int] = mapped_column(
        ForeignKey("assets.id")
    ) 
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id")
    ) 
    type: Mapped[str] = mapped_column(
        Text
    )


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    file_id: Mapped[int | None] = mapped_column(
        ForeignKey("files.id"),
        nullable=True,
    )

    name: Mapped[str] = mapped_column(
        Text,
    )

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
        DateTime,
    )

    last_updated_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    notes: Mapped[str] = mapped_column(
        Text,
    )