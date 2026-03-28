#!/bin/bash
set -e

echo "==> Waiting for Postgres..."
until python -c "
import psycopg2, os
psycopg2.connect(os.environ['DATABASE_URL'])
" 2>/dev/null; do
  sleep 1
done
echo "==> Postgres ready."

echo "==> Running Alembic migrations..."
alembic upgrade head

echo "==> Seeding database..."
python -m scripts.seed

echo "==> Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
