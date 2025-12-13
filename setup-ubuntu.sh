#!/bin/bash

set -e

echo "=== Ubuntu 24.04 Setup for CarHaus (2GB RAM) ==="
echo ""

echo "Updating system..."
sudo apt update
sudo apt upgrade -y

echo ""
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
rm get-docker.sh

echo ""
echo "Installing Docker Compose..."
sudo apt install -y docker-compose-plugin

echo ""
echo "Creating SWAP (2GB)..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "SWAP created successfully"
else
    echo "SWAP already exists"
fi

echo ""
echo "Configuring system limits..."
sudo tee /etc/sysctl.d/99-carhaus.conf > /dev/null <<EOF
vm.swappiness=10
vm.overcommit_memory=1
net.core.somaxconn=511
EOF
sudo sysctl -p /etc/sysctl.d/99-carhaus.conf

echo ""
echo "Creating project directory..."
mkdir -p ~/carhaus
cd ~/carhaus

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Clone your repo: git clone YOUR_GITHUB_REPO_URL ."
echo "2. Copy .env: cp .env.example .env"
echo "3. Edit .env: nano .env"
echo "4. Run: chmod +x deploy.sh && ./deploy.sh"
echo ""
echo "IMPORTANT: Logout and login again for Docker permissions!"

