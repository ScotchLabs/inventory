from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import insert, select

from app.db import db
from app.inventory.models.category import Category
from app.inventory.schemas.category import (
    CategoryCreateSchema,
    CategoryDumpSchema,
    CategoryListResponseSchema,
)

from app.inventory.enums import CategoryClassification

router = APIRouter(
    prefix="/categories",
    responses={404: {"description": "Not found"}},
)


def category_to_dump_schema(category: Category) -> CategoryDumpSchema:
    return CategoryDumpSchema(
        id=category.id, name=category.name, classification=category.classification
    )


@router.post("/create")
async def create_location(body: CategoryCreateSchema) -> CategoryDumpSchema:
    category = db.execute(
        insert(Category)
        .values(name=body.name, classification=body.classification)
        .returning(Category)
    ).scalar_one()
    db.commit()

    existing = db.execute(
        select(Category).where(Category.name.ilike(body.name))
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=400, detail=f"Category '{body.name}' already exists"
        )

    return category_to_dump_schema(category)


@router.post("/list_primary")
def list_primary_categories() -> CategoryListResponseSchema[CategoryDumpSchema]:
    query = select(Category).where(
        Category.classification == CategoryClassification.PRIMARY
    )

    categories = db.execute(query).scalars().all()
    return CategoryListResponseSchema(
        categories=[category_to_dump_schema(category) for category in categories]
    )


@router.post("/list_secondary")
def list_secondary_categories() -> CategoryListResponseSchema[CategoryDumpSchema]:
    query = select(Category).where(
        Category.classification == CategoryClassification.SECONDARY
    )

    categories = db.execute(query).scalars().all()
    return CategoryListResponseSchema(
        categories=[category_to_dump_schema(category) for category in categories]
    )
