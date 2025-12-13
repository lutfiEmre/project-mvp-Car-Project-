# CarHaus - Vehicle Listing Platform

A modern, full-stack vehicle listing platform for the Canadian market built with Next.js 15, NestJS, and PostgreSQL.

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS
- **Shadcn/ui** - UI components
- **Framer Motion** - Animations
- **React Query** - Data fetching
- **Zustand** - State management

### Backend
- **NestJS** - Node.js framework
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Swagger** - API documentation

## Prerequisites

### Development
- Node.js 18+
- pnpm 8+
- PostgreSQL 14+

### Production (Docker)
- Docker 20.10+
- Docker Compose 2.0+

## Getting Started

### 1. Clone and Install

```bash
cd carhaus
pnpm install
```

### 2. Setup Environment Variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edit the `.env` files with your configuration.

### 3. Setup Database

```bash
# Create database
createdb carhaus

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# (Optional) Open Prisma Studio
pnpm db:studio
```

### 4. Run Development Servers

```bash
# Run all apps
pnpm dev

# Or run individually
pnpm dev:api  # Backend on http://localhost:3001
pnpm dev:web  # Frontend on http://localhost:3000
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/docs

## 🐳 Docker Deployment (Production)

### Quick Start

```bash
# 1. Create .env file
cp .env.example .env
# Edit .env with your values

# 2. Start all services
docker-compose up -d

# 3. Run database migrations
docker-compose exec api pnpm prisma migrate deploy

# 4. Access the application
# Frontend: http://localhost
# API: http://localhost/api
```

### Docker Services

- **PostgreSQL**: Database (Port 5432)
- **Redis**: Cache (Port 6379)
- **API**: NestJS Backend (Port 3001)
- **Web**: Next.js Frontend (Port 3000)
- **Nginx**: Reverse Proxy + Static Files (Port 80)

For detailed Docker setup, see [DOCKER_SETUP.md](./DOCKER_SETUP.md)

## Project Structure

```
carhaus/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   ├── prisma/          # Database schema
│   │   └── src/
│   │       ├── modules/     # Feature modules
│   │       │   ├── auth/
│   │       │   ├── users/
│   │       │   ├── dealers/
│   │       │   ├── listings/
│   │       │   ├── media/
│   │       │   ├── subscriptions/
│   │       │   └── admin/
│   │       └── prisma/      # Prisma service
│   │
│   └── web/                 # Next.js Frontend
│       └── src/
│           ├── app/         # App router pages
│           │   ├── (main)/  # Public pages
│           │   ├── (auth)/  # Auth pages
│           │   └── (dashboard)/ # User dashboard
│           ├── components/  # React components
│           │   ├── ui/      # Base UI components
│           │   ├── layout/  # Layout components
│           │   ├── home/    # Homepage sections
│           │   └── vehicles/ # Vehicle components
│           └── lib/         # Utilities
│
└── packages/
    ├── types/               # Shared TypeScript types
    └── api-client/          # API client library
```

## Features

### Public
- Vehicle search with filters
- Vehicle detail pages
- Dealer profiles
- User registration/login

### User Dashboard
- Manage listings
- Saved vehicles
- Account settings

### Dealer Dashboard
- Inventory management
- Bulk import (XML/JSON)
- Analytics
- Subscription management

### Admin Panel
- User management
- Dealer verification
- Listing approval
- System settings

## Scripts

```bash
pnpm dev          # Start all apps in development
pnpm build        # Build all apps
pnpm lint         # Lint all apps
pnpm format       # Format code with Prettier

# Database
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Prisma Studio
```

## API Documentation

When running in development, Swagger documentation is available at:
http://localhost:3001/docs

## License

Private - All rights reserved

