from fastapi import APIRouter, Query
from typing import Annotated
from pydantic import BaseModel
from app.inventory.schemas.asset import AssetCreateSchema, AssetDumpSchema, ListResponseSchema, AssetSearchParems
from app.inventory.models.asset import Asset, AssetCategoryMap
from app.inventory.models.category import Category
from app.db import db
from sqlalchemy import insert

router = APIRouter(
    prefix="/asset",
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
        categories=[],
        sub_categories=[],
        quantity=float(asset.quantity),
        current_location=asset.current_location,
        permanent_location_id=asset.permanent_location_id,
        last_updated=asset.last_updated,
        last_updated_by=asset.last_updated_by,
        notes=asset.notes,
    )

@router.get("/")
def get_assets(parems : Annotated[AssetSearchParems, Query()]) -> ListResponseSchema[AssetDumpSchema]:
    print(parems)
    query = db.query(Asset)
    if parems.search is not None:
        query = query.where(Asset.name.ilike(f'{parems.search}%'))
    assets = query.all()
    return ListResponseSchema(elements = [asset_to_dump_schema(asset) for asset in assets])



@router.post("/")
def create_asset(body: AssetCreateSchema) -> AssetDumpSchema:
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

    db.add(asset)
    db.flush()
    db.execute(insert(AssetCategoryMap).values([{"asset_id": asset.id, "category_id": category, "type": "PRIMARY"} for category in body.categories]))
    db.execute(insert(AssetCategoryMap).values([{"asset_id": asset.id, "category_id": category, "type": "SECONDARY"} for category in body.sub_categories]))

    db.commit()
    db.refresh(asset)

    return asset_to_dump_schema(asset)

@router.delete("/{id}")
def delete_asset(id: int) -> SuccessResponse:
    asset = db.query(Asset).filter(Asset.id == id).first()

    if asset is None:
        return SuccessResponse(success=False)
    
    db.delete(asset)
    db.commit()

    return SuccessResponse(success=True)