from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/assets",
    responses={404: {"description": "Not found"}},
)

class SuccessResponse(BaseModel):
    success: bool



@router.post("/")
async def create_asset() -> SuccessResponse:
    return SuccessResponse(success=True)

@router.delete("/{id}")
async def delete_asset(id: int) -> SuccessResponse:
    return SuccessResponse(success=True)