# Apex Overflow - Task Management Application

## Project info

**Application**: Apex Overflow Task Management System

## Development Setup

### Prerequisites

- **Bun** (recommended) or Node.js 18+ - [Install Bun](https://bun.sh/docs/installation)
- **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- **Git** - [Install Git](https://git-scm.com/downloads)

### Quick Start

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>
cd apex-overflow

# Step 2: Copy environment configuration
cp .env.example .env

# Step 3: Install dependencies
bun install

# Step 4: Start the development environment (includes Supabase backend)
docker-compose up

# Alternative: Start only the frontend (requires separate Supabase setup)
bun run dev
```

### Build Commands

```sh
# Development build
bun run build:dev

# Production build
bun run build

# Preview production build locally
bun run preview

# Lint code
bun run lint

# Fix linting issues
bun run lint:fix
```

### Development Workflow

1. **Full Stack Development** (Recommended):
   ```sh
   docker-compose up
   ```
   This starts:
   - Frontend at http://localhost:3000
   - Supabase Studio at http://localhost:54323
   - Local database and API services

2. **Frontend Only Development**:
   ```sh
   bun run dev
   ```
   Requires separate Supabase configuration

3. **Database Management**:
   ```sh
   # Reset local database
   supabase db reset
   
   # Generate TypeScript types
   supabase gen types typescript --local > src/integrations/supabase/types.ts
   ```

## Docker Development Environment

For a complete development environment with Supabase backend services, use Docker:

```sh
# Copy environment configuration
cp .env.example .env

# Start the full development environment
docker-compose up
```

See the [Docker Setup Guide](./docs/DOCKER_SETUP.md) for detailed instructions.

## Documentation

All project documentation is located in the [`docs/`](./docs/) folder:

- [Docker Development Environment](./docs/DOCKER_SETUP.md) - Complete setup guide
- [Documentation Index](./docs/README.md) - Full documentation overview

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

This project can be deployed using various hosting platforms that support React applications, such as Vercel, Netlify, or traditional web servers.

## Custom Domain Configuration

You can configure a custom domain through your chosen hosting platform's domain management interface.
