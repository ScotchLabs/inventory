from typing import TYPE_CHECKING
from app.db.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, Text, ForeignKey, Numeric, DateTime, Table, Column
from decimal import Decimal
from datetime import datetime

if TYPE_CHECKING:
    from app.inventory.models.category import Category

asset_categories = Table(
    "asset_categories",
    Base.metadata,
    Column("asset_id", Integer, ForeignKey("assets.id"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True),
)

asset_sub_categories = Table(
    "asset_sub_categories",
    Base.metadata,
    Column("asset_id", Integer, ForeignKey("assets.id"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True),
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

    categories: Mapped[list["Category"]] = relationship(
        secondary=asset_categories,
        back_populates="assets",
        lazy="selectin",
    )

    sub_categories: Mapped[list["Category"]] = relationship(
        secondary=asset_sub_categories,
        back_populates="sub_assets",
        lazy="selectin",
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