from fastapi import FastAPI
from pydantic import BaseModel
from app.users.models.user import User
from sqlalchemy import insert
from app.app import app