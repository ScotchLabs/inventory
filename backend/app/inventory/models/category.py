from typing import TYPE_CHECKING
from app.db.base import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, Text, Numeric

if TYPE_CHECKING:
    from app.inventory.models.asset import Asset

class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        Text,
    )

    classification: Mapped[str] = mapped_column(
        Text,
    )

    assets: Mapped[list["Asset"]] = relationship(
        secondary="asset_categories",
        back_populates="categories",
        lazy="selectin",
    )

    sub_assets: Mapped[list["Asset"]] = relationship(
        secondary="asset_sub_categories",
        back_populates="sub_categories",
        lazy="selectin",
    )