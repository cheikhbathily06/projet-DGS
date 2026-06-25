#!/bin/bash
set -e

php /var/www/artisan config:clear
php /var/www/artisan cache:clear
php /var/www/artisan migrate --force
php /var/www/artisan storage:link

# Démarre php-fpm en arrière-plan
php-fpm -D

# Attendre que php-fpm soit prêt
sleep 2

# Test config nginx
nginx -t

# Démarre nginx au premier plan
nginx -g "daemon off;"