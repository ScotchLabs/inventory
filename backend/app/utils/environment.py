import os
from dataclasses import dataclass
from enum import StrEnum


class SNSDeploymentType(StrEnum):
    LOCALDEV = "LOCALDEV"
    PRODUCTION = "production"


@dataclass
class SNSEnvironment:
    google_oauth_client_id: str
    google_oauth_client_secret: str
    web_root_url: str
    api_root_url: str
    fastapi_session_secret: str
    deployment_type: SNSDeploymentType
    localdev_static_files_url: str | None = None
    aws_s3_bucket_name: str | None = None
    aws_s3_region: str | None = None
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None


sns_environment = SNSEnvironment(
    google_oauth_client_id=os.environ["GOOGLE_OAUTH_CLIENT_ID"],
    google_oauth_client_secret=os.environ["GOOGLE_OAUTH_CLIENT_SECRET"],
    web_root_url=os.environ["WEB_ROOT_URL"],
    api_root_url=os.environ["API_ROOT_URL"],
    fastapi_session_secret=os.environ["FASTAPI_SESSION_SECRET"],
    deployment_type=SNSDeploymentType(os.environ["DEPLOYMENT_TYPE"]),
    localdev_static_files_url=os.environ.get("LOCALDEV_STATIC_FILES_URL"),
    aws_s3_bucket_name=os.environ.get("AWS_S3_BUCKET_NAME"),
    aws_s3_region=os.environ.get("AWS_S3_REGION", "us-east-1"),
    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
)
