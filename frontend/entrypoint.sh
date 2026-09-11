#!/bin/bash
set -e

# Create directories
mkdir -p /var/www/certbot
mkdir -p /etc/letsencrypt/live/default

# Check if we have a domain name from environment
DOMAIN=${DOMAIN:-localhost}

# If certificates don't exist, generate a self-signed cert temporarily
if [ ! -f /etc/letsencrypt/live/default/fullchain.pem ]; then
    echo "Generating temporary self-signed certificate..."
    mkdir -p /etc/letsencrypt/live/default
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/letsencrypt/live/default/privkey.pem \
        -out /etc/letsencrypt/live/default/fullchain.pem \
        -subj "/CN=localhost"
fi

echo "Certificate setup complete"

# If a real domain is provided and we have valid certs, attempt renewal
if [ "$DOMAIN" != "localhost" ] && [ -f /etc/letsencrypt/live/default/fullchain.pem ]; then
    echo "Attempting to renew certificate for $DOMAIN..."
    certbot renew --quiet --no-eff-email --webroot -w /var/www/certbot || true
fi

# If we don't have real certificates yet but have a domain, try to get them
if [ "$DOMAIN" != "localhost" ] && [ ! -f /etc/letsencrypt/live/default/fullchain.pem ]; then
    echo "Attempting to obtain certificate for $DOMAIN..."
    certbot certonly --quiet --no-eff-email --agree-tos \
        --email admin@example.com \
        --webroot -w /var/www/certbot \
        -d $DOMAIN || echo "Certificate generation failed, continuing with self-signed"
fi

echo "Setup complete, starting nginx..."

# Start nginx and keep it running
exec nginx -g "daemon off;"
