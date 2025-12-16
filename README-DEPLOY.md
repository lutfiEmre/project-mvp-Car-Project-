# 🚀 Docker + GitHub Actions Deployment Guide

## ⚠️ Security Notice

Redis and PostgreSQL ports are **NOT exposed** externally. Only accessible within Docker network.

## 📦 Quick Deployment

### New Server Setup

```bash
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/setup-ubuntu.sh
chmod +x setup-ubuntu.sh
./setup-ubuntu.sh
```

### Existing Server Update

```bash
cd /root/carhaus
./deploy.sh
```

## 🔧 GitHub Actions Setup

### Required Secrets

Repository → Settings → Secrets and variables → Actions

| Secret Name | Value | Description |
|------------|-------|-------------|
| `SERVER_HOST` | `68.183.192.25` | Server IP |
| `SERVER_USER` | `root` | SSH user |
| `SERVER_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | SSH private key |

### Generate SSH Key

```bash
ssh-keygen -t ed25519 -C "github-actions"
ssh-copy-id root@68.183.192.25
cat ~/.ssh/id_ed25519
```

## 🎯 Auto Deployment

Push to `main` branch triggers automatic deployment:

```bash
git add .
git commit -m "Update application"
git push origin main
```

GitHub Actions will automatically:
- Pull latest code
- Build changed services
- Restart containers
- Clean old images

## 📋 Environment Variables

Edit `.env`:

```bash
DB_PASSWORD=STRONG_PASSWORD_HERE
JWT_SECRET=STRONG_SECRET_MIN_32_CHARS
JWT_REFRESH_SECRET=ANOTHER_STRONG_SECRET
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP/api
CORS_ORIGIN=http://YOUR_SERVER_IP
```

## 🔍 Commands

```bash
docker compose ps
docker compose logs -f
docker compose logs -f api
docker compose logs -f web
docker compose restart api
docker compose down
docker compose up -d
```

## 💾 Memory Usage

- PostgreSQL: 256MB
- Redis: 128MB  
- API: 384MB
- Web: 384MB
- Nginx: 50MB
- **Total: ~1.2GB**

## 🔐 Security Checklist

- [ ] PostgreSQL port NOT exposed
- [ ] Redis port NOT exposed
- [ ] Strong passwords in `.env`
- [ ] GitHub secrets configured
- [ ] Only nginx ports 80/443 open

### Verify Security

```bash
nmap YOUR_SERVER_IP
```

Should only show ports 80 and 443.

## 🆘 Troubleshooting

### View Logs

```bash
docker compose logs -f
docker compose logs -f api
docker compose logs -f web
```

### Check Resources

```bash
docker stats
free -h
df -h
```

### Rebuild Services

```bash
docker compose build --no-cache api
docker compose build --no-cache web
docker compose up -d
```

### Database Issues

```bash
docker compose exec api pnpm prisma migrate deploy
docker compose exec api pnpm prisma generate
docker compose restart api
```

## 🌐 Access URLs

- Frontend: `http://YOUR_SERVER_IP`
- API: `http://YOUR_SERVER_IP/api`
- API Docs: `http://YOUR_SERVER_IP/api/docs`

## 📁 Project Structure

```
/root/carhaus/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── api-client/
│   └── types/
├── docker-compose.yml
├── Dockerfile.api
├── Dockerfile.web
├── deploy.sh
├── setup-ubuntu.sh
└── .env
```

## 🔄 Workflow

1. Developer pushes code to GitHub
2. GitHub Actions triggers
3. SSH into server
4. Pull latest code
5. Build changed services
6. Restart containers
7. Clean old images

## ✅ Deployment Complete

Every push to `main` deploys automatically!

Monitor: GitHub → Actions tab
