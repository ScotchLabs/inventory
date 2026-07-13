from datetime import datetime
from pydantic import BaseModel, Field


class AssetBaseSchema(BaseModel):
    file_id: int
    name: str
    name_verbose: str
    categories: list[int] = Field(default_factory=list)
    sub_categories: list[int] = Field(default_factory=list)
    quantity: int
    current_location: str
    permanent_location_id: int
    last_updated: datetime
    last_updated_by: int
    notes: str


class AssetCreateSchema(AssetBaseSchema):
    pass


class AssetDumpSchema(AssetBaseSchema):
    id: int


class AssetListResponseSchema(BaseModel):
    assets: list[AssetDumpSchema]
