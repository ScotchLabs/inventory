from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, or_, update

from app.db import db
from app.inventory.models.asset import Asset, AssetCategoryMap
from app.inventory.models.location import Location
from app.inventory.models.category import Category
from app.inventory.routes.category import category_to_dump_schema
from app.inventory.routes.locations import location_to_dump_schema
from app.users.models.user import User
from app.inventory.schemas.asset import (
    AssetCreateSchema,
    AssetDumpSchema,
    AssetSearchParems,
    AssetUpdateSchema,
    ListResponseSchema,
)

from app.inventory.enums import CategoryClassification


router = APIRouter(
    prefix="/asset",
    responses={404: {"description": "Not found"}},
)


class SuccessResponse(BaseModel):
    success: bool


def asset_to_dump_schema(asset: Asset) -> AssetDumpSchema:
    primary_ids = select(AssetCategoryMap.category_id).where(
        (AssetCategoryMap.asset_id == asset.id),
        (AssetCategoryMap.type == CategoryClassification.PRIMARY),
    )

    primary = (
        db.execute(select(Category).where(Category.id.in_(primary_ids))).scalars().all()
    )

    secondary_ids = select(AssetCategoryMap.category_id).where(
        (AssetCategoryMap.asset_id == asset.id),
        (AssetCategoryMap.type == CategoryClassification.SECONDARY),
    )
    secondary = (
        db.execute(select(Category).where(Category.id.in_(secondary_ids)))
        .scalars()
        .all()
    )

    user_email = None
    if asset.last_updated_by:
        user = db.execute(
            select(User.email).where(User.id == asset.last_updated_by)
        ).scalar_one_or_none()
        user_email = user[:-15] if user else None

    permanent = db.execute(
        select(Location).where(Location.id == asset.permanent_location_id)
    ).scalar_one_or_none()

    return AssetDumpSchema(
        id=asset.id,
        file_id=asset.file_id,
        name=asset.name,
        name_verbose=asset.name_verbose,
        categories=[category_to_dump_schema(category) for category in primary],
        sub_categories=[category_to_dump_schema(category) for category in secondary],
        quantity=float(asset.quantity),
        current_location=asset.current_location,
        permanent_location=location_to_dump_schema(permanent)
        if permanent is not None
        else None,
        last_updated=asset.last_updated,
        last_updated_by_email=user_email,
        notes=asset.notes,
    )


@router.post("/list")
def list_assets(body: AssetSearchParems) -> ListResponseSchema[AssetDumpSchema]:
    query = select(Asset)

    if body.search is not None:
        query = query.where(
            or_(
                Asset.name.ilike(f"{body.search}%"),
                Asset.name_verbose.ilike(f"{body.search}%"),
                Asset.current_location.ilike(f"{body.search}%"),
                Asset.notes.ilike(f"{body.search}%"),
                select(Category.id)
                .select_from(AssetCategoryMap)
                .join(Category, Category.id == AssetCategoryMap.category_id)
                .where(
                    Category.name.ilike(f"{body.search}%"),
                    AssetCategoryMap.asset_id == Asset.id,
                )
                .correlate(Asset)
                .exists(),
                select(Location.id)
                .select_from(Location)
                .where(
                    Location.name.ilike(f"{body.search}%"),
                    Asset.permanent_location_id == Location.id,
                )
                .correlate(Asset)
                .exists(),
                select(User.id)
                .select_from(User)
                .where(
                    User.email.ilike(f"{body.search}%"),
                    Asset.last_updated_by == User.id,
                )
                .correlate(Asset)
                .exists(),
            )
        )

    assets = db.execute(query).scalars().all()
    return ListResponseSchema(
        elements=[asset_to_dump_schema(asset) for asset in assets]
    )


@router.post("/create")
def create_asset(body: AssetCreateSchema) -> AssetDumpSchema:

    existing = db.execute(
        select(Asset).where(Asset.name.ilike(body.name))
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=400, detail=f"Asset '{body.name}' already exists"
        )

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

    for category in body.categories:
        db.add(
            AssetCategoryMap(
                asset_id=asset.id,
                category_id=category,
                type=CategoryClassification.PRIMARY,
            )
        )

    for category in body.sub_categories:
        db.add(
            AssetCategoryMap(
                asset_id=asset.id,
                category_id=category,
                type=CategoryClassification.SECONDARY,
            )
        )

    db.commit()
    db.refresh(asset)

    return asset_to_dump_schema(asset)


@router.get("/get/{id}")
def get_asset(id: int) -> AssetDumpSchema:
    asset = db.execute(select(Asset).where(Asset.id == id)).scalars().first()

    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")

    return asset_to_dump_schema(asset)


@router.post("/edit")
def edit_asset(body: AssetUpdateSchema) -> SuccessResponse:

    db.execute(
        update(Asset)
        .where(Asset.id == body.id)
        .values(
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
    )

    db.execute(select(AssetCategoryMap).where(AssetCategoryMap.asset_id == body.id))
    db.query(AssetCategoryMap).filter(AssetCategoryMap.asset_id == body.id).delete()

    for category in body.categories:
        db.add(
            AssetCategoryMap(
                asset_id=body.id,
                category_id=category,
                type=CategoryClassification.PRIMARY,
            )
        )

    for category in body.sub_categories:
        db.add(
            AssetCategoryMap(
                asset_id=body.id,
                category_id=category,
                type=CategoryClassification.SECONDARY,
            )
        )

    db.commit()

    return SuccessResponse(success=True)


@router.delete("/delete/{id}")
def delete_asset(id: int) -> SuccessResponse:
    asset = db.query(Asset).filter(Asset.id == id).first()

    if asset is None:
        return SuccessResponse(success=False)

    db.query(AssetCategoryMap).filter(AssetCategoryMap.asset_id == id).delete()

    db.delete(asset)
    db.commit()

    return SuccessResponse(success=True)
