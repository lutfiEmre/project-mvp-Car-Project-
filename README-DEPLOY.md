## Ubuntu 24.04 Deployment (2GB RAM)

### Quick Start

```bash
wget https://raw.githubusercontent.com/YOUR_USERNAME/carhaus/main/setup-ubuntu.sh
chmod +x setup-ubuntu.sh
./setup-ubuntu.sh
```

### Manual Setup

```bash
git clone YOUR_REPO_URL
cd carhaus
cp .env.example .env
nano .env
chmod +x deploy.sh
./deploy.sh
```

### Environment Variables

Edit `.env`:
- `DB_PASSWORD`: Strong database password
- `JWT_SECRET`: Min 32 characters
- `NEXT_PUBLIC_API_URL`: http://YOUR_SERVER_IP/api
- `CORS_ORIGIN`: http://YOUR_SERVER_IP

### Commands

```bash
docker-compose up -d
docker-compose down
docker-compose logs -f
docker-compose ps
docker-compose restart
```

### Memory Usage

- PostgreSQL: 256MB
- Redis: 128MB
- API: 384MB
- Web: 384MB
- Nginx: 50MB
- Total: ~1.2GB + OS (~500MB) = ~1.7GB

### Troubleshooting

```bash
docker-compose logs api
docker-compose logs web
docker stats
free -h
swapon --show
```

### Access

- Frontend: http://YOUR_SERVER_IP:3000
- API: http://YOUR_SERVER_IP:3001
- API Docs: http://YOUR_SERVER_IP:3001/docs
- With Nginx: http://YOUR_SERVER_IP

