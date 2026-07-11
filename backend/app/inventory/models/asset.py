from app.db.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, Text, ForeignKey, Numeric
from decimal import Decimal

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

    #categories: Mapped[]

    #sub_categories: 

    quantity: Mapped[Decimal] = mapped_column(
        Numeric,
    )

    current_location: Mapped[str] = mapped_column(
        Text,
    )

    permanent_location_id: Mapped[int] = mapped_column(
        ForeignKey("locations.id"),
    )

    #last_updated:

    #last_updated_by:

    #notes:



