from fastapi import APIRouter
from pydantic import BaseModel
from app.inventory.schemas.asset import AssetCreateSchema, AssetDumpSchema
from app.inventory.models.asset import Asset
from app.inventory.models.category import Category
from app.db import db
from sqlalchemy import insert

router = APIRouter(
    prefix="/assets",
    responses={404: {"description": "Not found"}},
)

class SuccessResponse(BaseModel):
    success: bool

def asset_to_dump_schema(asset: Asset) -> AssetDumpSchema:
    return AssetDumpSchema(
        id=asset.id,
        file_id=asset.file_id,
        name=asset.name,
        name_verbose=asset.name_verbose,
        categories=[category.id for category in asset.categories],
        sub_categories=[category.id for category in asset.sub_categories],
        quantity=asset.quantity,
        current_location=asset.current_location,
        permanent_location_id=asset.permanent_location_id,
        last_updated=asset.last_updated,
        last_updated_by=asset.last_updated_by,
        notes=asset.notes,
    )

@router.post("/")
async def create_asset(body: AssetCreateSchema) -> AssetDumpSchema:
    asset = Asset(
        file_id=body.file_id,
        name=body.name,
        name_verbose=body.name_verbose,
        quantity=body.quantity,
        current_location=body.current_location,
        permanent_location_id=body.permanent_location_id,
        last_updated=body.last_updated,
        last_updated_by=body.last_updated_by,
        notes=body.notes,
    )

    asset.categories = db.query(Category).filter(Category.id.in_(body.categories)).all()
    asset.sub_categories = db.query(Category).filter(Category.id.in_(body.sub_categories)).all()

    db.add(asset)
    db.commit()
    db.refresh(asset)

    return asset_to_dump_schema(asset)

@router.delete("/{id}")
async def delete_asset(id: int) -> SuccessResponse:
    asset = db.query(Asset).filter(Asset.id == id).first()

    if asset is None:
        return SuccessResponse(success=False)
    
    db.delete(asset)
    db.commit()

    return SuccessResponse(success=True)