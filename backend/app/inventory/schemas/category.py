from pydantic import BaseModel


class CategoryBaseSchema(BaseModel):
    name: str
    classification: str


class CategoryCreateSchema(CategoryBaseSchema):
    pass


class CategoryDumpSchema(CategoryBaseSchema):
    id: int


class CategoryListResponseSchema[T: BaseModel](BaseModel):
    categories: list[T]
