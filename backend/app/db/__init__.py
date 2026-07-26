import os
from collections.abc import Generator
from contextlib import contextmanager
from contextvars import ContextVar

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker


load_dotenv()

engine = create_engine(os.environ.get("DATABASE_URL", ""))

_sync_connection_ctx: ContextVar[Session | None] = ContextVar("session", default=None)


def get_current_db_session() -> Session:
    """Retrieve the session for the current context/request."""
    session = _sync_connection_ctx.get()
    if session is None:
        raise RuntimeError("No database session found in the current context.")
    return session


class ConnectionProxy:
    def __getattr__(self, name: str):
        return getattr(get_current_db_session(), name)


@contextmanager
def sync_db_connection_context() -> Generator[Session]:
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


db: Session = ConnectionProxy()  # type: ignore
