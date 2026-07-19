from datetime import datetime
from app.inventory.routes.asset import create_asset
from app.inventory.schemas.asset import AssetCreateSchema
from app.db import sync_db_connection_context
from app.extensions.all_models import *


if __name__ == "__main__":
    with sync_db_connection_context():
        create_asset(AssetCreateSchema(
            name="test",
            name_verbose="testing again",
            quantity=4,
            current_location="back dungeon",
            last_updated=datetime.now(),
            notes="these are the notes",
        ))