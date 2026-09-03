# HTTPS Setup with Let's Encrypt

This guide explains how to set up HTTPS with self-serving Let's Encrypt certificates for your EC2 instance behind Cloudflare.

## What Changed

1. **nginx.conf** - Updated to:
   - Listen on both HTTP (80) and HTTPS (443)
   - Serve ACME challenges at `/.well-known/acme-challenge/`
   - Redirect HTTP traffic to HTTPS
   - Configure SSL/TLS with strong cipher suites

2. **Dockerfile** - Added:
   - `certbot` and `openssl` packages
   - Entrypoint script for certificate initialization
   - Port 443 exposure

3. **entrypoint.sh** - New startup script that:
   - Creates necessary directories
   - Generates self-signed certificates if none exist
   - Attempts to obtain/renew Let's Encrypt certificates
   - Keeps nginx running

4. **production-docker-compose.yml** - Updated to:
   - Mount certificate directories on EFS for persistence
   - Accept `DOMAIN` environment variable

## Usage

### 1. Deploy and Build

```bash
# Build the updated frontend image
docker build -t sns-inventory-frontend:latest ./frontend

# Start the container
docker-compose -f production-docker-compose.yml up -d
```

### 2. Set Your Domain

When deploying, set the `DOMAIN` environment variable to your actual domain:

```bash
# Create .env file or add to deployment
DOMAIN=yourdomain.example.com

# Then run docker-compose
docker-compose -f production-docker-compose.yml up -d
```

### 3. Cloudflare Configuration

In your Cloudflare dashboard:

1. **SSL/TLS** → **Overview** → Set to "Full (strict)"
2. **DNS** → Point your domain to your EC2 instance's public IP
3. **Crypto** → Ensure "Full (strict)" is selected for end-to-end encryption

### 4. Certificate Generation

**First time setup:**
- The container will start with a self-signed certificate
- Once DNS is pointing to your EC2 instance and the domain is accessible, certificates will be automatically generated
- This typically happens within a few minutes

**Automatic renewal:**
- Certificates are valid for 90 days
- Renewal is attempted every time the container starts
- You can manually trigger renewal with:
  ```bash
  docker exec sns-inventory-aws-frontend /renew-certs.sh
  ```

### 5. Certificate Persistence

Certificates are stored in EFS at:
- `/mnt/efs/letsencrypt/` - Let's Encrypt configuration
- `/mnt/efs/certbot/` - ACME validation files

These persist across container restarts and updates.

## Troubleshooting

### Certificate not generating
- Check that your domain DNS is pointing to the EC2 instance
- Verify the container can reach `acme-v02.api.letsencrypt.org`
- Check logs: `docker logs sns-inventory-aws-frontend`

### ACME challenge failing
- Ensure port 80 is accessible from the internet
- Verify the domain is resolving correctly: `nslookup yourdomain.example.com`
- Check nginx logs: `docker exec sns-inventory-aws-frontend nginx -T`

### Manual renewal
```bash
# Re-run the renewal script
docker exec sns-inventory-aws-frontend /renew-certs.sh

# Or restart the container (which attempts renewal on startup)
docker-compose -f production-docker-compose.yml restart frontend
```

### Using self-signed certificates temporarily
If you have issues with Let's Encrypt, the system falls back to self-signed certificates. These work but will show security warnings in browsers. To force self-signed:

```bash
rm -rf /mnt/efs/letsencrypt/live/default
docker-compose -f production-docker-compose.yml restart frontend
```

## Security Notes

- Change the email in `entrypoint.sh` from `admin@example.com` to your actual email (for certificate expiration notices)
- Consider enabling HSTS in nginx for production:
  ```nginx
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  ```
- Keep Cloudflare's "Full (strict)" mode enabled for end-to-end encryption

## Environment Variables

- `DOMAIN` - Your domain name for certificate generation (defaults to `localhost`)

## Certificate Renewal Schedule

Add this to your EC2 cron to renew certificates daily:

```bash
0 3 * * * docker exec sns-inventory-aws-frontend /renew-certs.sh >> /var/log/cert-renewal.log 2>&1
```

This runs the renewal script at 3 AM daily.
