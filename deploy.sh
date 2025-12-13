#!/bin/bash

set -e

echo "=== CarHaus Deployment Script ==="
echo ""

if [ ! -f .env ]; then
    echo "ERROR: .env file not found!"
    echo "Please copy .env.example to .env and configure it."
    exit 1
fi

echo "Stopping existing containers..."
docker-compose down

echo ""
echo "Pulling latest code..."
git pull origin main

echo ""
echo "Building images..."
docker-compose build --no-cache

echo ""
echo "Starting services..."
docker-compose up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 10

echo ""
echo "Running database migrations..."
docker-compose exec -T api pnpm prisma migrate deploy

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Services:"
echo "  - Frontend: http://localhost:${WEB_PORT:-3000}"
echo "  - API: http://localhost:${API_PORT:-3001}"
echo "  - API Docs: http://localhost:${API_PORT:-3001}/docs"
echo ""
echo "Check status: docker-compose ps"
echo "View logs: docker-compose logs -f"

