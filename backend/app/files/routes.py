from app.files.models import File
from app.db import db
from sqlalchemy import insert
from uuid import uuid4
from fastapi import APIRouter, UploadFile, File as FastAPIFile
from app.files.schemas import FileDumpSchema
from app.utils.strings import make_slug
from app.utils.db_helpers import exec_scalar

router = APIRouter(
    prefix="/file",
    responses={404: {"description": "Not found"}},
)


@router.post("/upload/")
async def upload_single_file(file: UploadFile = FastAPIFile(...)) -> FileDumpSchema:
    satis_file = handle_file_upload(
        contents=await file.read(),
        filename=file.filename,
        content_type=file.content_type,
    )
    return FileDumpSchema(
        id=satis_file.id,
        url=satis_file.url,
        filename=satis_file.filename,
    )


def save_file(
    contents: bytes,
    filename: str,
) -> str:
    url = f"localdata/{make_slug()}-{filename}"
    with open(url, "wb") as f:
        f.write(contents)

    return url


def handle_file_upload(
    contents: bytes, filename: str | None, content_type: str | None
) -> File:
    resolved_filename = filename if filename is not None else f"{make_slug()}-upload"
    file_url = save_file(
        contents=contents,
        filename=resolved_filename,
    )

    file = exec_scalar(
        insert(File)
        .values(
            [
                {
                    "url": file_url,
                    "filename": resolved_filename,
                    "content_type": content_type or "UNKNOWN",
                }
            ]
        )
        .returning(File)
    )

    return file
