# Apex Overflow - Task Management Application

## Project info

**Application**: Apex Overflow Task Management System

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

You can work locally using your own IDE by cloning this repo and pushing changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
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
