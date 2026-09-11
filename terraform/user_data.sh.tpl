#!/bin/bash
set -euxo pipefail

# ---- Base packages ----
dnf update -y
dnf install -y docker amazon-efs-utils git

systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# ---- Docker Compose plugin ----
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
ln -sf /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose

# ---- ECR auth (auto-refreshing, no manual `docker login` needed) ----
# amazon-ecr-credential-helper uses the instance's IAM role to fetch a
# fresh token on every pull, so it never expires like a manual login does.
dnf install -y amazon-ecr-credential-helper

mkdir -p /home/ec2-user/.docker /root/.docker
ECR_HOST="${aws_account_id}.dkr.ecr.${aws_region}.amazonaws.com"
cat > /home/ec2-user/.docker/config.json <<EOF
{
  "credHelpers": {
    "$ECR_HOST": "ecr-login"
  }
}
EOF
cp /home/ec2-user/.docker/config.json /root/.docker/config.json
chown -R ec2-user:ec2-user /home/ec2-user/.docker

# ---- Mount EFS ----
mkdir -p /mnt/efs/postgres-data /mnt/efs/letsencrypt /mnt/efs/certbot
if ! grep -q "${efs_id}" /etc/fstab; then
  echo "${efs_id}:/ /mnt/efs efs _netdev,tls,iam 0 0" >> /etc/fstab
fi
mount -a -t efs || mount -t efs -o tls,iam "${efs_id}:/" /mnt/efs
mkdir -p /mnt/efs/postgres-data /mnt/efs/letsencrypt /mnt/efs/certbot
chown -R 999:999 /mnt/efs/postgres-data  # postgres container user

# ---- App directory ----

git clone https://github.com/ScotchLabs/inventory.git /opt/inventory/
cd /opt/inventory/

chown -R ec2-user:ec2-user /opt/inventory/

# ---- Fetch secrets from Secrets Manager and create .env ----
# Install AWS CLI and jq if not present (AL2023 usually has them)
dnf install -y aws-cli jq

# Fetch the secret
SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id sns-inventory-app-secrets \
  --region ${aws_region} \
  --query SecretString \
  --output text)

# Extract values
GOOGLE_OAUTH_CLIENT_ID=$(echo "$SECRET_JSON" | jq -r '.google_oauth_client_id')
GOOGLE_OAUTH_CLIENT_SECRET=$(echo "$SECRET_JSON" | jq -r '.google_oauth_client_secret')
WEB_ROOT_URL=$(echo "$SECRET_JSON" | jq -r '.web_root_url')
API_ROOT_URL=$(echo "$SECRET_JSON" | jq -r '.api_root_url')
FASTAPI_SESSION_SECRET=$(echo "$SECRET_JSON" | jq -r '.fastapi_session_secret')
DOMAIN_NAME=$(echo "$SECRET_JSON" | jq -r '.domain_name')

# Create .env file
cat > /opt/inventory/.env <<ENVEOF
postgres_db=${postgres_db}
postgres_user=${postgres_user}
postgres_password=${postgres_password}
GOOGLE_OAUTH_CLIENT_ID=$GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET=$GOOGLE_OAUTH_CLIENT_SECRET
WEB_ROOT_URL=$WEB_ROOT_URL
API_ROOT_URL=$API_ROOT_URL
FASTAPI_SESSION_SECRET=$FASTAPI_SESSION_SECRET
DOMAIN=$DOMAIN_NAME
ENVEOF

# Fix permissions - the .env file contains secrets
chmod 600 /opt/inventory/.env
chown ec2-user:ec2-user /opt/inventory/.env

cat > /etc/systemd/system/app-compose.service <<'EOF'
[Unit]
Description=App Docker Compose Stack
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/inventory
EnvironmentFile=/opt/inventory/.env
ExecStart=/usr/local/bin/docker-compose -f production-docker-compose.yml up -d
ExecStop=/usr/local/bin/docker-compose -f production-docker-compose.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable app-compose.service
systemctl start app-compose.service
