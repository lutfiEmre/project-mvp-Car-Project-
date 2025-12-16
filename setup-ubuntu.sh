#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   CarHaus VPS Setup Script (Ubuntu 24.04)${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}ERROR: Please run as root${NC}"
    echo "Run: sudo bash setup-ubuntu.sh"
    exit 1
fi

# System Update
echo -e "${GREEN}[1/8] Updating system...${NC}"
apt update && apt upgrade -y

# Install Dependencies
echo ""
echo -e "${GREEN}[2/8] Installing dependencies...${NC}"
apt install -y apt-transport-https ca-certificates curl software-properties-common git ufw

# Install Docker
echo ""
echo -e "${GREEN}[3/8] Installing Docker...${NC}"
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" -y
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo -e "${BLUE}✓ Docker installed successfully${NC}"
docker --version

# Setup Swap
echo ""
echo -e "${GREEN}[4/8] Setting up swap space (2GB)...${NC}"
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo -e "${BLUE}✓ 2GB Swap created successfully${NC}"
else
    echo -e "${YELLOW}Swap already exists, skipping...${NC}"
fi

# Configure Firewall
echo ""
echo -e "${GREEN}[5/8] Configuring firewall...${NC}"
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable
echo -e "${BLUE}✓ Firewall configured (Ports: 22, 80, 443)${NC}"

# Get Server IP
SERVER_IP=$(curl -s ifconfig.me)
echo ""
echo -e "${BLUE}Your server IP: ${GREEN}${SERVER_IP}${NC}"

# Check existing directory
echo ""
echo -e "${GREEN}[6/8] Setting up project directory...${NC}"
cd /root

if [ -d "carhaus" ]; then
    echo -e "${YELLOW}WARNING: /root/carhaus already exists!${NC}"
    read -p "Delete and clone fresh? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping containers..."
        cd carhaus
        if command -v docker-compose &> /dev/null; then
            docker-compose down -v 2>/dev/null || true
        else
            docker compose down -v 2>/dev/null || true
        fi
        cd /root
        rm -rf carhaus
        echo -e "${GREEN}Old directory removed${NC}"
    else
        echo -e "${YELLOW}Using existing directory...${NC}"
        cd carhaus
        git pull origin main
    fi
fi

# Clone repository
if [ ! -d "carhaus" ]; then
    echo ""
    echo -e "${GREEN}[7/8] Cloning project from GitHub...${NC}"
    echo ""
    read -p "Enter GitHub repo URL: " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo -e "${RED}ERROR: Repository URL required${NC}"
        exit 1
    fi
    
    git clone "$REPO_URL" carhaus
    cd carhaus
else
    cd carhaus
fi

# Create .env file
echo ""
echo -e "${GREEN}[8/8] Creating environment configuration...${NC}"

if [ -f .env ]; then
    echo -e "${YELLOW}.env file already exists!${NC}"
    read -p "Overwrite? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Keeping existing .env${NC}"
        skip_env=true
    fi
fi

if [ "$skip_env" != true ]; then
    # Generate random passwords
    DB_PASS=$(openssl rand -base64 24)
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH=$(openssl rand -base64 32)
    
    cat > .env << EOF
# Database Configuration
DB_USER=carhaus
DB_PASSWORD=${DB_PASS}
DB_NAME=carhaus

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH}
JWT_EXPIRES_IN=15m

# API Configuration
NEXT_PUBLIC_API_URL=http://${SERVER_IP}/api
CORS_ORIGIN=http://${SERVER_IP}
API_PREFIX=api

# Upload Configuration
UPLOAD_DIR=./uploads

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=200

# Database Connection Pool
DATABASE_CONNECTION_LIMIT=20
DATABASE_POOL_TIMEOUT=30
EOF

    echo -e "${BLUE}✓ .env file created with secure passwords${NC}"
    
    # Show .env for confirmation
    echo ""
    echo -e "${YELLOW}Review your configuration:${NC}"
    cat .env
    echo ""
    
    read -p "Edit .env manually? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        nano .env
    fi
fi

# Make deploy script executable
chmod +x deploy.sh

# Ask to deploy now
echo ""
echo -e "${YELLOW}Ready to deploy!${NC}"
echo "This will build Docker images and start containers (15-20 min)"
echo ""
read -p "Deploy now? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}Starting deployment...${NC}"
    ./deploy.sh
else
    echo -e "${YELLOW}Skipping deployment${NC}"
    echo "To deploy later: cd /root/carhaus && ./deploy.sh"
fi

# Final summary
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   SETUP COMPLETE! 🎉${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}Access your application:${NC}"
echo -e "  Frontend: ${GREEN}http://${SERVER_IP}${NC}"
echo -e "  API Docs: ${GREEN}http://${SERVER_IP}/api/docs${NC}"
echo ""
echo -e "${BLUE}Container Management:${NC}"
echo "  View status:  docker compose ps"
echo "  View logs:    docker compose logs -f"
echo "  Restart:      docker compose restart"
echo "  Stop:         docker compose down"
echo ""
echo -e "${YELLOW}GitHub Actions Setup:${NC}"
echo "  1. Go to: https://github.com/YOUR_REPO/settings/secrets/actions"
echo "  2. Add these secrets:"
echo "     - SERVER_HOST = ${SERVER_IP}"
echo "     - SERVER_USER = root"
echo "     - SERVER_SSH_KEY = (your SSH private key)"
echo ""
echo -e "${YELLOW}SSH Key Setup (run on your LOCAL computer):${NC}"
echo "  ssh-keygen -t ed25519 -C \"github-actions\""
echo "  ssh-copy-id root@${SERVER_IP}"
echo "  cat ~/.ssh/id_ed25519  # Copy this to GitHub"
echo ""
echo -e "${BLUE}Security:${NC}"
echo "  ✓ Firewall enabled (only ports 22, 80, 443)"
echo "  ✓ PostgreSQL/Redis NOT exposed externally"
echo "  ✓ Strong passwords generated automatically"
echo ""
echo -e "${GREEN}For more info: README-DEPLOY.md${NC}"
echo ""
