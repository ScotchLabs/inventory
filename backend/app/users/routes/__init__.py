from fastapi import APIRouter

from app.users.routes.auth import router as auth_router
from app.users.routes.user import router as user_router


router = APIRouter(
    prefix="/users",
    responses={404: {"description": "Not found"}},
)
router.include_router(auth_router)
router.include_router(user_router)
