#!/bin/sh
set -e

sed \
  -e "s|NGINX_LISTEN_PORT|${VITE_PORT:-8080}|g" \
  -e "s|NGINX_BACKEND_URL|${VITE_BACKEND_URL}|g" \
  /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
