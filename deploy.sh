#!/bin/bash

set -e

if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "IMPORTANT: Edit .env file:"
    echo "  - Add strong passwords"
    echo "  - Update server IP"
    echo "After editing, run: ./deploy.sh"
    exit 1
fi

docker compose down

git pull origin main

docker compose build --no-cache

docker compose up -d

sleep 10

docker compose exec -T api pnpm prisma migrate deploy

echo "Services:"
echo "  - Frontend: http://localhost:${WEB_PORT:-3000}"
echo "  - API: http://localhost:${API_PORT:-3001}"
echo "  - API Docs: http://localhost:${API_PORT:-3001}/docs"
echo ""
echo "Check status: docker compose ps"
echo "View logs: docker compose logs -f"

