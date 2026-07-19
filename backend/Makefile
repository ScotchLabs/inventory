dc-up:
	docker compose up -d

db-migrate:
	alembic revision --autogenerate

db-upgrade:
	alembic upgrade head

spec:
	mkdir -p dist/
	python3 -m app.scripts.save_openapi

generate-fixtures:
	python3 -m app.scripts.fixtures