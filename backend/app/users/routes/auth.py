from dataclasses import dataclass
from datetime import datetime, timedelta
import logging
import secrets
from typing import Protocol
from urllib.parse import urlencode
from fastapi import APIRouter, HTTPException, Request
from authlib.integrations.starlette_client import OAuth
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.db import db
from app.users.services.auth import DecodedPublicToken, create_token_for_user, encode_public_token
from app.users.services.user import get_or_create_user_for_email
from app.utils.environment import SNSDeploymentType, sns_environment

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    responses={404: {"description": "Not found"}},
)

oauth = OAuth()



oauth.register(
    name="google",
    client_id=sns_environment.google_oauth_client_id,
    client_secret=sns_environment.google_oauth_client_secret,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "email openid"},
)


@router.get("/google/callback")
async def callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get("userinfo")
        email = user_info["email"]

        user = get_or_create_user_for_email(email)
        sns_token =create_token_for_user(user.id)

        response = RedirectResponse(url=sns_environment.web_root_url)
    
        response.set_cookie(
            key="public_token",
            value=encode_public_token(DecodedPublicToken(public=sns_token.public, token=sns_token.token)),
            httponly=True, 
            secure=sns_environment.deployment_type != SNSDeploymentType.LOCALDEV,
            samesite="lax", 
            max_age=3600
        )
        
        db.commit()
        return response
    except Exception as e:
        e.with_traceback(None)
        logger.exception(e)
        raise HTTPException(status_code=400)

@router.get("/google/login")
async def login(request: Request):
    try:
        return await oauth.google.authorize_redirect(request, f"{sns_environment.api_root_url}/users/auth/google/callback")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authlib error: {str(e)}")

