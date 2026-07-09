# Deployment guide

## Local development

1. Install dependencies
    ```bash
    npm install
    ```
2. Start the backend
    ```bash
    npm run dev:server
    ```
3. Start the frontend
    ```bash
    npm run dev
    ```

## Production build

```bash
npm run build
```

## Environment variables

Set the following values in your hosting environment:

- PORT
- MONGO_URI (optional; falls back to in-memory MongoDB)
- MONGO_DB
- OLLAMA_URL
- OLLAMA_MODEL
- COMFYUI_URL
- JWT_SECRET (required for production auth)
- JWT_EXPIRY
- AUTH_SALT_ROUNDS

## Docker

```bash
docker build -t infinityai .
docker run -p 4000:4000 --env-file .env infinityai
```

## Recommended deployment targets

- Vercel or Netlify for the frontend
- Render, Railway, or Fly.io for the Express API
- MongoDB Atlas for persistent storage
