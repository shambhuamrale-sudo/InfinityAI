# InfinityAI

InfinityAI is a premium AI SaaS MVP built with 100% free and open-source technologies. The experience includes a polished landing page, authentication flow, dashboard, pricing, admin surfaces, and AI-focused product experiences for chat, image generation, writing, code, document, and translation workflows.

## Tech stack

- React + Vite
- Tailwind CSS
- Framer Motion
- React Router
- Express
- CORS + dotenv
- MongoDB
- JWT + bcrypt

## Features

- Premium dark-mode SaaS landing experience
- Real authentication with JWT and httpOnly cookies
- Auth screens and product dashboard
- AI tool experiences for chat and image generation
- Launch-focused UI for subscriptions, notifications, favorites, and admin state
- Backend endpoints for plans, config, and persisted app state
- Role-based admin access with protected API routes

## Getting started

1. Install dependencies
    ```bash
    npm install
    ```

2. Start the frontend dev server
    ```bash
    npm run dev
    ```

3. Start the API server in a second terminal
    ```bash
    npm run dev:server
    ```

4. Open the app at http://localhost:5173 and the API at http://localhost:4000

## Environment variables

Create a .env file with the following contents:

```bash
PORT=4000
JWT_SECRET=change-me-in-production
NODE_ENV=development
```

## Build

```bash
npm run build
```
