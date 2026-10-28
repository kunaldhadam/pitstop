#!/bin/sh
set -eu

: "${PORT:=10000}"
: "${DJANGO_SETTINGS_MODULE:?Set DJANGO_SETTINGS_MODULE to your Django settings module}"
: "${DJANGO_WSGI_MODULE:?Set DJANGO_WSGI_MODULE, e.g. project_name.wsgi:application}"
: "${GUNICORN_WORKERS:=2}"
export PORT DJANGO_SETTINGS_MODULE DJANGO_WSGI_MODULE GUNICORN_WORKERS

# Render the Nginx config with the platform-provided port.
envsubst '${PORT}' < /etc/nginx/templates/render.conf.template > /etc/nginx/conf.d/default.conf

cd /app/backend
python manage.py collectstatic --noinput

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
