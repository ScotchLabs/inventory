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


sns_environment = SNSEnvironment(
    google_oauth_client_id=os.environ["GOOGLE_OAUTH_CLIENT_ID"],
    google_oauth_client_secret=os.environ["GOOGLE_OAUTH_CLIENT_SECRET"],
    web_root_url=os.environ["WEB_ROOT_URL"],
    api_root_url=os.environ["API_ROOT_URL"],
    fastapi_session_secret=os.environ["FASTAPI_SESSION_SECRET"],
    deployment_type=SNSDeploymentType(os.environ["DEPLOYMENT_TYPE"]),
)
