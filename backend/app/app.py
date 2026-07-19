from fastapi import FastAPI, Request
from pydantic import BaseModel
from app.users.models.user import User
from sqlalchemy import insert
from app.db import engine, sync_db_connection_context, db
from fastapi.middleware.cors import CORSMiddleware
from app.inventory.routes import router as inventory_router
from app.files.routes import router as files_router
from app.extensions.all_models import *

app = FastAPI()

origins = [
    "http://localhost:5173",    # Common Vite / Vue port,
    "http://127.0.0.1:5173",
]

# 2. Add the CORS middleware to your application
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allows all HTTP headers
)

@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    with sync_db_connection_context():
        # The session is active for the duration of this request
        response = await call_next(request)
        return response

app.include_router(inventory_router)
app.include_router(files_router)


class UserCreateSchema(BaseModel):
    username: str

class UserDumpSchema(BaseModel):
    id: int
    username: str

@app.post("/")
async def create_user(body: UserCreateSchema) -> UserDumpSchema:
    user = db.execute(
        insert(User).values(
            username=body.username
        ).returning(User)
    ).scalar_one()
    db.commit()

    return UserDumpSchema(
        id=user.id,
        username=user.username,
    )
