from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware

from app.db import sync_db_connection_context
from app.extensions.all_models import *  # noqa
from app.inventory.routes import router as inventory_router
from app.users.routes import router as users_router
from app.users.services.auth import NotAuthorizedException
from app.utils.current_request import current_request_context
from app.utils.environment import SNSDeploymentType, sns_environment


app = FastAPI()

origins = [sns_environment.web_root_url]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SessionMiddleware, secret_key=sns_environment.fastapi_session_secret)


@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    with sync_db_connection_context():
        response = await call_next(request)
        return response


@app.middleware("http")
async def current_request_middleware(request: Request, call_next):
    with current_request_context(request):
        response = await call_next(request)
        return response


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

    if sns_environment.deployment_type != SNSDeploymentType.LOCALDEV:
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )

    return response


@app.exception_handler(NotAuthorizedException)
async def authorization_exception_handler(
    request: Request, exc: NotAuthorizedException
):
    response = JSONResponse(
        status_code=401,
        content={"detail": "Session expired or invalid"},
    )
    response.delete_cookie(key="public_token")
    return response


app.include_router(inventory_router)
app.include_router(users_router)
