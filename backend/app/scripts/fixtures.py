from datetime import datetime
from sqlalchemy import select

from app.db import sync_db_connection_context, db
from app.extensions.all_models import *  # noqa
from app.inventory.routes.asset import create_asset
from app.inventory.schemas.asset import AssetCreateSchema
from app.inventory.models.location import Location
from app.inventory.models.category import Category
from app.inventory.enums import CategoryClassification


if __name__ == "__main__":
    with sync_db_connection_context():
        # Create locations if they don't exist
        locations = ["Warehouse A", "Warehouse B", "Storage Room", "Back Dungeon"]
        location_map = {}
        for loc_name in locations:
            existing = db.execute(
                select(Location).where(Location.name == loc_name)
            ).scalar_one_or_none()
            if existing:
                location_map[loc_name] = existing.id
            else:
                new_loc = Location(name=loc_name)
                db.add(new_loc)
                db.flush()
                location_map[loc_name] = new_loc.id
        db.commit()

        # Create categories if they don't exist
        categories_data = [
            ("Furniture", CategoryClassification.PRIMARY),
            ("Electronics", CategoryClassification.PRIMARY),
            ("Wood", CategoryClassification.SECONDARY),
            ("Metal", CategoryClassification.SECONDARY),
        ]
        category_map = {}
        for cat_name, classification in categories_data:
            existing = db.execute(
                select(Category).where(Category.name == cat_name)
            ).scalar_one_or_none()
            if existing:
                category_map[cat_name] = existing.id
            else:
                new_cat = Category(name=cat_name, classification=classification)
                db.add(new_cat)
                db.flush()
                category_map[cat_name] = new_cat.id
        db.commit()

        # Create test assets
        create_asset(
            AssetCreateSchema(
                name="test",
                name_verbose="testing again",
                quantity=4,
                current_location="Warehouse A, Shelf 3",
                permanent_location_id=location_map["Warehouse A"],
                categories=[category_map["Electronics"]],
                sub_categories=[category_map["Metal"]],
                last_updated=datetime.now(),
                notes="these are the notes",
            )
        )

        create_asset(
            AssetCreateSchema(
                name="chair",
                name_verbose="wooden office chair",
                quantity=6,
                current_location="Warehouse B, Section 2",
                permanent_location_id=location_map["Warehouse B"],
                categories=[category_map["Furniture"]],
                sub_categories=[category_map["Wood"]],
                last_updated=datetime.now(),
                notes="dark walnut finish",
            )
        )

        create_asset(
            AssetCreateSchema(
                name="router",
                name_verbose="Cisco WS-C2960X Network Router",
                quantity=2,
                current_location="Storage Room, Rack 1",
                permanent_location_id=location_map["Storage Room"],
                categories=[category_map["Electronics"]],
                sub_categories=[category_map["Metal"]],
                last_updated=datetime.now(),
                notes="needs configuration before use",
            )
        )
