from fastapi import APIRouter
from pydantic import BaseModel
from app.db import engine
from sqlalchemy import Connection
from app.db import db
from sqlalchemy import insert, Row
from app.inventory.schemas.location import LocationCreateSchema, LocationDumpSchema
from app.inventory.models.location import Location
router = APIRouter(
    prefix="/locations",
    responses={404: {"description": "Not found"}},
)


def handle_create_location_from_schema(
    body: LocationCreateSchema
) -> Location:
    location = db.execute(
        insert(Location).values(
            name=body.name
        ).returning(Location)
    ).scalar_one()

    return location

@router.post("/")
async def create_location(body: LocationCreateSchema) -> LocationDumpSchema:
    location = handle_create_location_from_schema(
        body=body
    )
    db.commit()

    return LocationDumpSchema(
        id=location.id,
        name=location.name,
    )
