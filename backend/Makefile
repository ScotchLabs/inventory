dc-up:
	docker compose up -d

db-migrate:
	alembic revision --autogenerate

db-upgrade:
	alembic upgrade head

start:
	uv run uvicorn main:app --reload

spec:
	mkdir -p dist/
	python3 -m app.scripts.save_openapi

generate-fixtures:
	python3 -m app.scripts.fixtures

format:
	ruff format .

check:
	ruff check

fix:
	ruff format .
	ruff check --fix
