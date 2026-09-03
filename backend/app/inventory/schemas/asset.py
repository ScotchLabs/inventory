from datetime import datetime

from pydantic import BaseModel, Field
from app.inventory.schemas.category import CategoryDumpSchema
from app.inventory.schemas.location import LocationDumpSchema


class AssetBaseSchema(BaseModel):
    file_id: int | None = None
    name: str
    name_verbose: str
    quantity: float
    current_location: str
    permanent_location_id: int | None = None
    last_updated: datetime
    last_updated_by: int | None = None
    notes: str


class AssetSearchParems(BaseModel):
    search: str | None = None
    categories: list[int] | None = None
    sub_categories: list[int] | None = None


class AssetCreateSchema(AssetBaseSchema):
    categories: list[int] = Field(default_factory=list)
    sub_categories: list[int] = Field(default_factory=list)


class AssetUpdateSchema(AssetCreateSchema):
    id: int


class AssetDumpSchema(AssetBaseSchema):
    id: int
    categories: list[CategoryDumpSchema] = Field(default_factory=list)
    sub_categories: list[CategoryDumpSchema] = Field(default_factory=list)
    permanent_location: LocationDumpSchema | None = None
    last_updated_by_email: str | None = None


class ListResponseSchema[T: BaseModel](BaseModel):
    elements: list[T]
