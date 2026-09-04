from typing import Annotated
from app.db import db
from app.inventory.schemas.asset import ListResponseSchema
from fastapi import APIRouter, UploadFile, File as FastAPIFile, Query
from app.files.schemas import FileDumpSchema, FileSearchParams
from app.utils.db_helpers import exec_scalars
from app.files.services import file_search_query, handle_file_upload

router = APIRouter(
    prefix="/files",
    responses={404: {"description": "Not found"}},
)


@router.get("/list")
async def files_list(
    params: Annotated[FileSearchParams, Query()],
) -> ListResponseSchema[FileDumpSchema]:
    files = exec_scalars(file_search_query(params))
    return ListResponseSchema(
        elements=[
            FileDumpSchema(
                id=satis_file.id,
                url=f"http://localhost:8000/files/static/{satis_file.url}",
                filename=satis_file.filename,
            )
            for satis_file in files
        ]
    )


@router.post("/upload")
async def files_upload(
    files: list[UploadFile] = FastAPIFile(...),
) -> ListResponseSchema[FileDumpSchema]:
    to_return = []
    for file in files:
        to_return.append(
            handle_file_upload(
                contents=await file.read(),
                filename=file.filename,
                content_type=file.content_type,
            )
        )
    db.commit()
    return ListResponseSchema(
        elements=[
            FileDumpSchema(
                id=satis_file.id,
                url=f"http://localhost:8000/{satis_file.url}",
                filename=satis_file.filename,
            )
            for satis_file in to_return
        ]
    )
