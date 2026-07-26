from fastapi import APIRouter
from sqlalchemy import insert

from app.db import db
from app.inventory.models.location import Location
from app.inventory.schemas.location import LocationCreateSchema, LocationDumpSchema


router = APIRouter(
    prefix="/locations",
    responses={404: {"description": "Not found"}},
)


@router.post("/")
async def create_location(body: LocationCreateSchema) -> LocationDumpSchema:
    location = db.execute(
        insert(Location).values(name=body.name).returning(Location)
    ).scalar_one()
    db.commit()

    return LocationDumpSchema(
        id=location.id,
        name=location.name,
    )
