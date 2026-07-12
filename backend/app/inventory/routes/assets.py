from fastapi import APIRouter
from pydantic import BaseModel
from app.inventory.schemas.asset import AssetCreateSchema, AssetDumpSchema
from app.inventory.models.asset import Asset
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
        categories=asset.categories,
        sub_categories=asset.sub_categories,
        quantity=asset.quantity,
        current_location=asset.current_location,
        permanent_location_id=asset.permanent_location_id,
        last_updated=asset.last_updated,
        last_updated_by=asset.last_updated_by,
        notes=asset.notes,
    )

@router.post("/")
async def create_asset(body: AssetCreateSchema) -> AssetDumpSchema:
    asset = db.execute(
        insert(Asset).values(
            file_id=body.file_id,
            name=body.name,
            name_verbose=body.name_verbose,
            categories=body.categories,
            sub_categories=body.sub_categories,
            quantity=body.quantity,
            current_location=body.current_location,
            permanent_location_id=body.permanent_location_id,
            last_updated=body.last_updated,
            last_updated_by=body.last_updated_by,
            notes=body.notes
        ).returning(Asset)
    ).scalar_one()

    db.commit()

    return asset_to_dump_schema(asset)

@router.delete("/{id}")
async def delete_asset(id: int) -> SuccessResponse:
    return SuccessResponse(success=True)