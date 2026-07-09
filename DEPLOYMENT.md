# InfinityAI — Production Deployment Guide

Architecture decision: **the backend is NOT deployed to Vercel.** Ollama and
ComfyUI are long-running services that cannot run inside Vercel serverless
functions. The split is:

| Layer        | Hosting                                  | Why |
|--------------|------------------------------------------|-----|
| Frontend     | **Vercel** (static SPA only)             | Build output is pure static assets; no server logic. |
| Backend      | **VPS / Railway / Render** (standalone Express) | Needs a persistent process + access to Ollama/ComfyUI. |
| Database     | **MongoDB Atlas**                        | Managed, networked Mongo with a `mongodb+srv://` URI. |
| LLM          | **Ollama** (long-running)                | Local or LAN model server. |
| Image gen    | **ComfyUI** (long-running)               | Local or LAN workflow server. |

The Express server (`server.js`) is **kept as a standalone server** and still
integrates **Ollama** and **ComfyUI**. Neither has been removed or replaced.

---

## 1. MongoDB Atlas

1. Create a project and a **M0 (free) or higher** cluster at
   <https://cloud.mongodb.com>.
2. Under *Database → Connect → Drivers*, copy the connection string:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/infinityai
   ```
3. Create a DB user with a password (not the project API key).
4. Under *Network Access*, add `0.0.0.0/0` (or your host's IP) so the backend
   can connect.
5. Use this string as `MONGO_URI` in the backend environment.

> In production `MONGO_URI` is **required**. If it is missing, the server refuses
> to serve database-backed routes and logs a clear error.

---

## 2. Ollama (LLM server)

Ollama runs as its own process. It can live on the same host as the backend, on
a private network, or on a separate GPU box.

**Same host / VPS:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama serve            # runs on :11434
ollama pull llama3.2    # the model used by default
```

**Docker:**
```bash
docker run -d --gpus=all -p 11434:11434 --name ollama ollama/ollama
docker exec ollama ollama pull llama3.2
```

Point the backend at it with `OLLAMA_URL` (e.g. `http://127.0.0.1:11434` on the
same host, or `http://ollama.internal:11434` across a private network) and set
`OLLAMA_MODEL` (default `llama3.2`).

If Ollama is unreachable, the chat/writer/code endpoints fall back to a safe
local response — the server keeps running.

---

## 3. ComfyUI (image generation server)

ComfyUI is also a long-running server.

**From source:**
```bash
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI
pip install -r requirements.txt
python main.py --listen 0.0.0.0 --port 8188
```

**Docker:**
```bash
docker run -d -p 8188:8188 --gpus=all comfyui/comfyui:latest
```

Point the backend at it with `COMFYUI_URL` (e.g. `http://127.0.0.1:8188` or
`http://comfyui.internal:8188`). If ComfyUI is unreachable, the image endpoint
returns a fallback concept so the app stays usable.

---

## 4. Backend — VPS / Railway / Render

The backend is a standalone Express server: `node server.js` (also `npm start`).
It uses `PORT` and `NODE_ENV`. It already serves the built frontend from `dist/`
in production, so a single process can host both API and SPA if you prefer.

### Required environment variables

See `.env.example`. Production essentials:

| Variable          | Required | Notes |
|-------------------|----------|-------|
| `NODE_ENV`        | yes      | Set to `production`. |
| `PORT`            | yes      | e.g. `4000` (Railway/Render inject their own). |
| `MONGO_URI`       | yes      | MongoDB Atlas SRV string. |
| `MONGO_DB`        | no       | Default `infinityai`. |
| `CLIENT_ORIGIN`   | yes*     | Comma-separated frontend origin(s), e.g. `https://infinityai.vercel.app`. Enables CORS + cross-site cookies. |
| `JWT_SECRET`      | yes      | Strong random value. Auth breaks if changed after users sign up. |
| `JWT_EXPIRY`      | no       | Default `7d`. |
| `AUTH_SALT_ROUNDS`| no       | Default `12`. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | no | Seeds an admin user on first start. |
| `OLLAMA_URL`      | no       | Default `http://127.0.0.1:11434`. |
| `OLLAMA_MODEL`    | no       | Default `llama3.2`. |
| `COMFYUI_URL`     | no       | Default `http://127.0.0.1:8188`. |
| `COOKIE_SAMESITE` | no       | Auto `none` when `CLIENT_ORIGIN` is set; otherwise `lax`. |

\* Required when the frontend is on a different origin (the Vercel + backend
split). Without it, auth cookies will not be sent cross-site.

### Option A — VPS (any Linux box)

```bash
git clone <your-repo> && cd InfinityAI
npm install
npm run build            # produces dist/ for the SPA
cp .env.example .env     # fill in values
# run it
node server.js
```

For a durable process use a manager:
```bash
# systemd unit / InfinityAI.service
[Unit]
Description=InfinityAI backend
After=network.target

[Service]
WorkingDirectory=/opt/InfinityAI
ExecStart=/usr/bin/node server.js
Environment=NODE_ENV=production
Restart=on-failure

[Install]
WantedBy=multi-user.target
```
Then `systemctl enable --now InfinityAI`. Put Ollama and ComfyUI on the same box
(or reachable on the LAN) and point `OLLAMA_URL` / `COMFYUI_URL` at them.

### Option B — Railway

1. New Project → Deploy from GitHub repo.
2. Add a service from the repo root. Railway auto-detects the `Dockerfile`.
   (`railway.json` already pins the start command and `/api/health` healthcheck.)
3. Add the env vars from the table above. `PORT` is injected automatically.
4. Deploy. Note the generated `*.up.railway.app` URL — that is your
   `VITE_API_BASE_URL` (append `/api`) for the frontend.

### Option C — Render

1. New → Blueprint → connect repo. `render.yaml` defines the `infinityai-backend`
   web service (Docker build, health check `/api/health`).
2. Set the `sync: false` env vars in the Render dashboard (secrets are not
   committed). `MONGO_URI`, `CLIENT_ORIGIN`, `JWT_SECRET`, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD`, `OLLAMA_URL`, `COMFYUI_URL`.
3. Deploy. Use the generated `*.onrender.com` URL as the backend origin.

### Docker (works for any VPS / Render / Railway)

```bash
docker build -t infinityai-backend .
docker run -d -p 4000:4000 --env-file .env --name infinityai-backend infinityai-backend
```

---

## 5. Frontend — Vercel (static only)

The frontend is a Vite SPA. `vercel.json` has been updated so Vercel serves only
the static build and a SPA fallback to `index.html` — **no backend function**.

1. Import the repo in Vercel. Framework preset: **Vite**
   (build `npm run build`, output `dist`).
2. Add one build env var:
   ```
   VITE_API_BASE_URL=https://<your-backend-host>/api
   ```
   (Use the Railway/Render/VPS URL, e.g. `https://infinityai-backend.up.railway.app/api`.)
   The frontend code already reads this and defaults to `/api` for local dev.
3. Deploy. The app will call your standalone backend for all `/api/*` routes.

> Because the frontend (Vercel) and backend are different origins, the backend
> must set `CLIENT_ORIGIN` to the Vercel URL so CORS and the auth cookie
> (`sameSite: none; secure`) work. Without `CLIENT_ORIGIN` set, login will fail
> cross-site.

---

## 6. Local development (unchanged)

```bash
npm install
npm run dev:server     # Express on :4000
npm run dev            # Vite on :5173 (proxies /api -> :4000)
```

Locally `VITE_API_BASE_URL` is empty, so the frontend uses the relative `/api`
path through Vite's proxy.

---

## 7. Verification checklist

- [ ] `GET https://<backend>/api/health` returns `{ "ok": true }`.
- [ ] `GET /api/plans` and `/api/config` return data.
- [ ] Frontend on Vercel loads state from the backend URL.
- [ ] Signup/login works cross-site (cookie present, `CLIENT_ORIGIN` set).
- [ ] Chat works when Ollama is reachable; graceful fallback when not.
- [ ] Image generation works when ComfyUI is reachable; graceful fallback when not.
- [ ] MongoDB Atlas shows the `users` / `app_state` collections being written.
