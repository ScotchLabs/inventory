FROM python:3.11-slim

WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install uv && uv sync --frozen

COPY . .

EXPOSE 5000

# Run migrations, then start the server
CMD ["sh", "-c", "uv run alembic upgrade head && uv run python -m uvicorn app.app:app --host 0.0.0.0 --port 5000"]