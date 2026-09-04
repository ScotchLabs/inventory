from fastapi import APIRouter, HTTPException
from sqlalchemy import insert, select

from app.db import db
from app.inventory.models.location import Location
from app.inventory.schemas.location import (
    LocationCreateSchema,
    LocationDumpSchema,
    LocationListResponseSchema,
)


router = APIRouter(
    prefix="/locations",
    responses={404: {"description": "Not found"}},
)


def location_to_dump_schema(location: Location) -> LocationDumpSchema:
    return LocationDumpSchema(id=location.id, name=location.name)


@router.post("/create")
async def create_location(body: LocationCreateSchema) -> LocationDumpSchema:
    existing = db.execute(
        select(Location).where(Location.name.ilike(body.name))
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=400, detail=f"Location '{body.name}' already exists"
        )

    location = db.execute(
        insert(Location).values(name=body.name).returning(Location)
    ).scalar_one()
    db.commit()

    return location_to_dump_schema(location)


@router.post("/list")
def list_locations() -> LocationListResponseSchema[LocationDumpSchema]:
    query = select(Location)

    locations = db.execute(query).scalars().all()
    return LocationListResponseSchema(
        locations=[location_to_dump_schema(location) for location in locations]
    )
