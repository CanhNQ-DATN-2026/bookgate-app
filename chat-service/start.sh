#!/bin/bash
set -e

echo "==> Starting Chat Service..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
