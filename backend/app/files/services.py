from sqlalchemy import select
from app.files.models import File
from sqlalchemy import insert
from app.files.schemas import FileSearchParams
from app.utils.strings import make_slug
from app.utils.db_helpers import exec_scalar


def file_search_query(params: FileSearchParams):
    return select(File)


def save_file(
    contents: bytes,
    filename: str,
) -> str:
    url = f"{make_slug()}-{filename}"
    with open(f"localdata/{url}", "wb") as f:
        f.write(contents)

    return url


def handle_file_upload(
    contents: bytes, filename: str | None, content_type: str | None
) -> File:
    resolved_filename = filename if filename is not None else "upload"
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
