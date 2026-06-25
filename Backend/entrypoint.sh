#!/bin/bash
set -e

php /var/www/artisan config:clear
php /var/www/artisan cache:clear
php /var/www/artisan migrate --force
php /var/www/artisan storage:link

# Utilise le port Railway ou 80 par défaut
PORT=${PORT:-80}

# Remplace le port dans la config nginx
sed -i "s/listen 80/listen $PORT/" /etc/nginx/sites-available/default

# Démarre php-fpm en arrière-plan
php-fpm -D

sleep 2

nginx -t

# Démarre nginx au premier plan
nginx -g "daemon off;"