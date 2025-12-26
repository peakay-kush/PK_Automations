#!/usr/bin/env bash
set -e

# Run migrations and collect static (if any), then start the app
python manage.py makemigrations --noinput || true
python manage.py migrate --noinput
# import products if not present
python manage.py import_products || true

exec "$@"
