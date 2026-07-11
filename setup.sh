#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

export PATH="$HOME/.local/bin:$PATH"

echo "[1/4] Checking prerequisites..."
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required but was not found." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm was not found. Trying to install Node.js with Homebrew..."
  if command -v brew >/dev/null 2>&1; then
    brew install node
  else
    echo "Please install Node.js/npm manually." >&2
    exit 1
  fi
fi

if ! command -v uv >/dev/null 2>&1; then
  echo "uv was not found. Installing it..."
  if command -v brew >/dev/null 2>&1; then
    brew install uv
  else
    curl -LsSf https://astral.sh/uv/install.sh | sh
  fi
fi

echo "[2/4] Installing backend dependencies..."
cd "$BACKEND_DIR"
uv sync

echo "[3/4] Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install

echo "[4/4] Starting PostgreSQL via Docker if Docker is available..."
if command -v docker >/dev/null 2>&1; then
  docker compose -f "$BACKEND_DIR/docker-compose.yml" up -d database
  export DATABASE_URL="${DATABASE_URL:-postgresql+psycopg2://user:password@localhost:5432/db}"
  cd "$BACKEND_DIR"
  uv run alembic upgrade head
else
  echo "Docker was not found, so the database container was not started."
  echo "If you want the backend to connect, start PostgreSQL manually and export DATABASE_URL."
fi

echo ""
echo "Setup complete."
echo "Run the apps with:"
echo "  Backend:  cd $BACKEND_DIR && uv run uvicorn app.app:app --reload --host 0.0.0.0 --port 8000"
echo "  Frontend: cd $FRONTEND_DIR && npm run dev -- --host 0.0.0.0"
