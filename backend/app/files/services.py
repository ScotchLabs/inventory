import boto3
from botocore.exceptions import ClientError
from typing import assert_never
from sqlalchemy import insert, select

from app.files.models import File
from app.files.schemas import FileSearchParams
from app.utils.db_helpers import exec_scalar
from app.utils.environment import sns_environment, SNSDeploymentType
from app.utils.strings import make_slug


def file_search_query(params: FileSearchParams):
    return select(File)


def save_file_local(
    contents: bytes,
    filename: str,
) -> tuple[str, str]:
    system_filename = f"{make_slug()}-{filename}"
    with open(f"localdevuploads/{system_filename}", "wb") as f:
        f.write(contents)

    return (
        system_filename,
        f"{sns_environment.localdev_static_files_url}/{system_filename}",
    )


def save_file_production(
    contents: bytes,
    filename: str,
) -> tuple[str, str]:
    """Upload file to S3 and return (system_filename, public_url)"""
    if not sns_environment.aws_s3_bucket_name:
        raise ValueError("AWS_S3_BUCKET_NAME environment variable not set")

    system_filename = f"{make_slug()}-{filename}"

    try:
        s3_client = boto3.client(
            "s3",
            region_name=sns_environment.aws_s3_region,
            aws_access_key_id=sns_environment.aws_access_key_id,
            aws_secret_access_key=sns_environment.aws_secret_access_key,
        )

        # Upload to S3
        s3_client.put_object(
            Bucket=sns_environment.aws_s3_bucket_name,
            Key=f"uploads/{system_filename}",
            Body=contents,
        )

        # Generate public URL
        url = f"https://{sns_environment.aws_s3_bucket_name}.s3.{sns_environment.aws_s3_region}.amazonaws.com/uploads/{system_filename}"

        return system_filename, url

    except ClientError as e:
        raise RuntimeError(f"Failed to upload file to S3: {e}")
    except Exception as e:
        raise RuntimeError(f"Unexpected error uploading to S3: {e}")


def handle_file_upload(
    contents: bytes, filename: str | None, content_type: str | None
) -> File:
    resolved_filename = filename if filename is not None else "unnamed-upload"

    if sns_environment.deployment_type == SNSDeploymentType.LOCALDEV:
        system_filename, url = save_file_local(
            contents=contents,
            filename=resolved_filename,
        )
    elif sns_environment.deployment_type == SNSDeploymentType.PRODUCTION:
        system_filename, url = save_file_production(
            contents=contents,
            filename=resolved_filename,
        )
    else:
        assert_never(sns_environment.deployment_type)

    file = exec_scalar(
        insert(File)
        .values(
            [
                {
                    "url": url,
                    "filename": resolved_filename,
                    "content_type": content_type or "UNKNOWN",
                    "system_filename": system_filename,
                }
            ]
        )
        .returning(File)
    )

    return file
