#!/bin/bash
set -e

# Lance les migrations
php /var/www/artisan migrate --force

# Démarre php-fpm en arrière-plan
php-fpm -D

# Démarre nginx au premier plan
nginx -g "daemon off;"