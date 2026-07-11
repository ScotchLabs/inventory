from pydantic import BaseModel

class LocationBaseSchema(BaseModel):
    name: str

class LocationCreateSchema(LocationBaseSchema):
    pass

class LocationDumpSchema(LocationBaseSchema):
    id: int

class LocationListResponseSchema(BaseModel):
    locations: list[LocationDumpSchema]