from fastapi import APIRouter
from app.inventory.routes.locations import router as locations_router
from app.inventory.routes.assets import router as assets_router

router = APIRouter(
    prefix="/inventory",
    responses={404: {"description": "Not found"}},
)
router.include_router(locations_router)
router.include_router(assets_router)