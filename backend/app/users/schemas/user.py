from datetime import datetime

from pydantic import BaseModel


class UserDumpSchema(BaseModel):
    id: int
    email: str


class UserDumpSchemaWithSessionInfo(UserDumpSchema):
    started_at: datetime
    expires_at: datetime


class CurrentSessionDumpSchema(BaseModel):
    user: UserDumpSchemaWithSessionInfo | None = None
