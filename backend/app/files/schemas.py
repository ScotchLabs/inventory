from pydantic import BaseModel

class FileDumpSchema(BaseModel):
    id: int
    url: str
    filename: str

class FileSearchParams(BaseModel):
    pass

