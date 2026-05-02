#!/bin/bash
# Startup script for GCP Compute Engine e2-micro instance to run PocketBase

set -e

echo "Starting PocketBase VM Setup..."

# Update system
apt-get update && apt-get upgrade -y

# Install Docker & Docker Compose
apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Setup PocketBase Directory
mkdir -p /opt/pocketbase
cd /opt/pocketbase

# Create Docker Compose file
cat <<EOF > docker-compose.yml
version: '3.8'
services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    container_name: pocketbase
    restart: unless-stopped
    command:
      - --encryptionEnv=PB_ENCRYPTION_KEY
    environment:
      - PB_ENCRYPTION_KEY=\${PB_ENCRYPTION_KEY:-your_secure_encryption_key_here}
    ports:
      - "80:8090"
    volumes:
      - ./pb_data:/pb_data
      - ./pb_public:/pb_public
      - ./pb_hooks:/pb_hooks
EOF

# Start PocketBase
docker compose up -d

echo "PocketBase is running on port 80!"
echo "Note: For production, please configure a reverse proxy (like Caddy/Nginx) with SSL."
