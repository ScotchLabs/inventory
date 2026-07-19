from sqlalchemy.sql.dml import ReturningInsert
from sqlalchemy import Select
from app.db import db


def exec_scalars[T](statement: Select[tuple[T]] | ReturningInsert[tuple[T]]) -> list[T]:
    return list(db.execute(statement).scalars().all())


def exec_scalar[T](statement: Select[tuple[T]] | ReturningInsert[tuple[T]]) -> T:
    return db.execute(statement).scalars().one()
