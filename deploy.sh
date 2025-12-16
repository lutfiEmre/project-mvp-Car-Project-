#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   CarHaus Deployment${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check .env
if [ ! -f .env ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo ""
    echo "Creating .env from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}IMPORTANT: Edit .env file with your configuration${NC}"
        echo "  nano .env"
        echo ""
        echo "Then run: ./deploy.sh"
        exit 1
    else
        echo -e "${RED}ERROR: .env.example not found!${NC}"
        echo "Please create .env manually"
        exit 1
    fi
fi

echo -e "${GREEN}[1/6] Stopping existing containers...${NC}"
if command -v docker-compose &> /dev/null; then
    docker-compose down
else
    docker compose down
fi

echo ""
echo -e "${GREEN}[2/6] Pulling latest code...${NC}"
git pull origin main

echo ""
echo -e "${GREEN}[3/6] Building Docker images...${NC}"
echo -e "${YELLOW}This may take 15-20 minutes...${NC}"
if command -v docker-compose &> /dev/null; then
    docker-compose build --no-cache
else
    docker compose build --no-cache
fi

echo ""
echo -e "${GREEN}[4/6] Starting services...${NC}"
if command -v docker-compose &> /dev/null; then
    docker-compose up -d
else
    docker compose up -d
fi

echo ""
echo -e "${GREEN}[5/6] Waiting for services to be healthy...${NC}"
sleep 15

echo ""
echo -e "${GREEN}[6/6] Running database migrations...${NC}"
if command -v docker-compose &> /dev/null; then
    docker-compose exec -T api pnpm prisma migrate deploy || echo -e "${YELLOW}Warning: Migration failed or no migrations to run${NC}"
else
    docker compose exec -T api pnpm prisma migrate deploy || echo -e "${YELLOW}Warning: Migration failed or no migrations to run${NC}"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   DEPLOYMENT COMPLETE! 🚀${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Get server IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")

echo -e "${BLUE}Access your application:${NC}"
echo -e "  Frontend: ${GREEN}http://${SERVER_IP}${NC}"
echo -e "  API Docs: ${GREEN}http://${SERVER_IP}/api/docs${NC}"
echo ""
echo -e "${BLUE}Check status:${NC}"
echo "  docker compose ps"
echo ""
echo -e "${BLUE}View logs:${NC}"
echo "  docker compose logs -f        # All services"
echo "  docker compose logs -f api    # API only"
echo "  docker compose logs -f web    # Web only"
echo ""

# Show container status
echo -e "${YELLOW}Container Status:${NC}"
if command -v docker-compose &> /dev/null; then
    docker-compose ps
else
    docker compose ps
fi
echo ""
