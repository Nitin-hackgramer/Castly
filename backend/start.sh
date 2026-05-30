#!/usr/bin/env bash
set -euo pipefail

# Start script for Render: waits for DB, runs migrations, collects static files,
# then starts Gunicorn with Uvicorn workers.

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

MAX_RETRIES=${MAX_RETRIES:-10}
SLEEP=${SLEEP:-3}
attempt=1

echo "Running startup script: will attempt migrations up to $MAX_RETRIES times"

while true; do
  if python manage.py migrate --noinput; then
    echo "Migrations applied"
    break
  fi
  if [ "$attempt" -ge "$MAX_RETRIES" ]; then
    echo "Migrations failed after $attempt attempts" >&2
    exit 1
  fi
  echo "Migration attempt $attempt failed; retrying in $SLEEP seconds..."
  attempt=$((attempt + 1))
  sleep $SLEEP
done

echo "Collecting static files"
python manage.py collectstatic --noinput

echo "Starting Gunicorn"
exec gunicorn backend.voidx.asgi:application -k uvicorn.workers.UvicornWorker --workers ${WEB_CONCURRENCY:-1} --bind 0.0.0.0:${PORT:-8000}
