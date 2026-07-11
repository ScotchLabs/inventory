from fastapi import APIRouter
from app.inventory.routes.locations import router as locations_router
router = APIRouter(
    prefix="/inventory",
    responses={404: {"description": "Not found"}},
)
router.include_router(locations_router)