from contextlib import contextmanager
from typing import Generator
from sqlalchemy import create_engine, Connection
import os
from contextvars import ContextVar
from sqlalchemy.orm import sessionmaker, Session

engine = create_engine(os.environ.get("DATABASE_URL", ""))

# _sync_connection_ctx: ContextVar[Connection | None] = ContextVar("session", default=None)
# def get_current_session() -> Connection:
#     """Retrieve the session for the current context/request."""
#     session = _sync_connection_ctx.get()
#     if session is None:
#         raise RuntimeError("No database session found in the current context.")
#     return session

# class ConnectionProxy:
#     def __getattr__(self, name: str):
#         return getattr(get_current_session(), name)
        
# @contextmanager
# def sync_db_connection_context() -> Generator[Connection, None, None]:
#     with engine.connect() as session:
#         token = _sync_connection_ctx.set(session)
#         try:
#             yield session
#         finally:
#             session.rollback()
#             # Always clean up
#             session.close()
#             _sync_connection_ctx.reset(token)
# from sqlalchemy.orm import sessionmaker
_sync_connection_ctx: ContextVar[Session | None] = ContextVar("session", default=None)
def get_current_session() -> Session:
    """Retrieve the session for the current context/request."""
    session = _sync_connection_ctx.get()
    if session is None:
        raise RuntimeError("No database session found in the current context.")
    return session

class ConnectionProxy:
    def __getattr__(self, name: str):
        return getattr(get_current_session(), name)

@contextmanager
def sync_db_connection_context() -> Generator[Session, None, None]:
    Session = sessionmaker(bind=engine)
    session = Session()
    token = _sync_connection_ctx.set(session)
    try:
        yield session
    finally:
        session.rollback()
        # Always clean up
        session.close()
        _sync_connection_ctx.reset(token)
db: Session = ConnectionProxy() # type: ignore

