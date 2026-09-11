#!/bin/bash
# Script to renew Let's Encrypt certificates
# Can be run via: docker exec frontend /renew-certs.sh
# Or added to host cron: 0 3 * * * docker exec sns-inventory-aws-frontend /renew-certs.sh

set -e

DOMAIN=${DOMAIN:-localhost}

if [ "$DOMAIN" = "localhost" ]; then
    echo "No domain configured, skipping certificate renewal"
    exit 0
fi

echo "Attempting to renew certificate for $DOMAIN..."
certbot renew --quiet --no-eff-email --webroot -w /var/www/certbot

echo "Certificate renewal complete"

# Reload nginx to pick up any renewed certificates
nginx -s reload
