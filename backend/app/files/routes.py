from typing import Annotated

from fastapi import File as FastAPIFile, Query, UploadFile

from app.db import db
from app.files.schemas import FileDumpSchema, FileSearchParams
from app.files.services import file_search_query, handle_file_upload
from app.inventory.schemas.asset import ListResponseSchema
from app.utils.api_route import SatisAPIRouter, public_route
from app.utils.db_helpers import exec_scalars


router = SatisAPIRouter(
    prefix="/files",
    responses={404: {"description": "Not found"}},
)


@router.get("/list")
@public_route
async def files_list(
    params: Annotated[FileSearchParams, Query()],
) -> ListResponseSchema[FileDumpSchema]:
    files = exec_scalars(file_search_query(params))
    return ListResponseSchema(
        elements=[
            FileDumpSchema(
                id=satis_file.id,
                url=satis_file.url,
                filename=satis_file.filename,
            )
            for satis_file in files
        ]
    )


@router.post("/upload")
async def files_upload(
    files: list[UploadFile] = FastAPIFile(...),  # noqa: B008
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
                url=satis_file.url,
                filename=satis_file.filename,
            )
            for satis_file in to_return
        ]
    )
