# Docker Development Environment Setup

This document provides instructions for setting up the local development environment using Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Bun installed (for local development outside containers)
- Git

## Quick Start

1. **Clone the repository and navigate to the project directory**

2. **Copy environment configuration**
   ```bash
   cp .env.example .env
   ```

3. **Start the development environment**
   ```bash
   docker-compose up
   ```

4. **Access the application**
   - Frontend: http://localhost:8080 (or your configured FRONTEND_PORT)
   - Supabase Studio: http://localhost:54323 (or your configured SUPABASE_STUDIO_PORT)
   - Supabase API: http://localhost:54321 (or your configured SUPABASE_API_PORT)

## Available Commands

- `docker-compose up` - Start all services
- `docker-compose up --build` - Rebuild and start all services
- `docker-compose down` - Stop all services
- `docker-compose down -v` - Stop services and remove volumes
- `docker-compose logs -f` - View logs from all services

## Services

### Frontend (Default Port 8080)
- React application with Vite and Bun
- Hot module replacement enabled
- Source code mounted for live reloading
- Port configurable via `FRONTEND_PORT` environment variable

### Supabase Stack
- **Database** (Default Port 54322): PostgreSQL with migrations
  - Configurable via `SUPABASE_DB_PORT`
- **API** (Default Port 54321): Supabase API Gateway with Auth
  - Configurable via `SUPABASE_API_PORT`
- **Studio** (Default Port 54323): Database management interface
  - Configurable via `SUPABASE_STUDIO_PORT`

**Note**: Realtime service is commented out in docker-compose.yml as it requires additional configuration. The core development environment works perfectly without it.

## Volumes

- `node_modules`: Named volume for better performance
- `supabase-db-data`: Database persistence
- Source code: Bind mounted for hot reloading

## Port Configuration

All service ports can be customized by setting environment variables in your `.env` file:

```bash
# Example custom port configuration
FRONTEND_PORT=3000
SUPABASE_DB_PORT=5432
SUPABASE_API_PORT=8000
SUPABASE_STUDIO_PORT=3001
SUPABASE_REALTIME_PORT=4000
```

## Customization

Create a `docker-compose.override.yml` file (use `docker-compose.override.yml.example` as template) to customize your local setup without affecting the main configuration.

## Troubleshooting

### Port Conflicts
If you encounter port conflicts, update the port environment variables in your `.env` file:
1. Edit your `.env` file
2. Change the conflicting port (e.g., `FRONTEND_PORT=3000`)
3. Restart the services: `docker-compose down && docker-compose up`

### Database Issues
- Reset database: `docker-compose down -v && docker-compose up`
- View database logs: `docker-compose logs supabase-db`

### Container Issues
- Rebuild containers: `docker-compose up --build`
- Clean everything: `docker-compose down -v && docker system prune -f`