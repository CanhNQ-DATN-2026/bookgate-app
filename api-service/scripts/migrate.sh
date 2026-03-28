#!/bin/bash
# migrate.sh — run by the Helm pre-install/pre-upgrade Job.
# Runs Alembic migrations and bootstraps the initial admin account.
# Must complete successfully before the main application Pods start.
set -e

echo "==> Waiting for Postgres..."
until python -c "import psycopg2, os; psycopg2.connect(os.environ['DATABASE_URL'])" 2>/dev/null; do
  sleep 2
done
echo "==> Postgres ready."

echo "==> Running Alembic migrations..."
alembic upgrade head

echo "==> Bootstrapping admin account..."
python -m scripts.seed

echo "==> Migration complete."
