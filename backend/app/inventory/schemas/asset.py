from datetime import datetime
from pydantic import BaseModel, Field


class AssetBaseSchema(BaseModel):
    file_id: int | None = None
    name: str
    name_verbose: str
    categories: list[int] = Field(default_factory=list)
    sub_categories: list[int] = Field(default_factory=list)
    quantity: float
    current_location: str
    permanent_location_id: int | None = None
    last_updated: datetime
    last_updated_by: int | None = None
    notes: str


class AssetCreateSchema(AssetBaseSchema):
    pass


class AssetDumpSchema(AssetBaseSchema):
    id: int


class AssetListResponseSchema(BaseModel):
    assets: list[AssetDumpSchema]
