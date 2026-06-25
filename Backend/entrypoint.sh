#!/bin/bash
set -e

php /var/www/artisan config:clear
php /var/www/artisan cache:clear
php /var/www/artisan migrate --force
php /var/www/artisan storage:link

# Démarre le serveur Laravel directement
php /var/www/artisan serve --host=0.0.0.0 --port=${PORT:-8000}