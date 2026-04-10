# Deployment Guide

This document describes how to deploy the frontend to Vercel and the backend to an AWS EC2 instance.

## 1. Architecture Overview

- Frontend: `frontend/` Next.js app deployed on Vercel.
- Backend: `backend/` FastAPI app deployed on AWS EC2.
- Communication: Frontend proxies `/api/*` requests to the backend using `BACKEND_URL` in `frontend/next.config.ts`.

## 2. Frontend Deployment on Vercel

### 2.1 Project Setup

1. Sign in to Vercel and create a new project.
2. Select this repository.
3. Set the root directory to `frontend`.

### 2.2 Build settings

Vercel should detect the app as a Next.js project automatically.

- Framework preset: `Next.js`
- Build command: `npm run build`
- Output directory: (leave empty)

### 2.3 Environment variables

Add the following environment variable in Vercel for production:

- `BACKEND_URL` = `https://your-backend-domain.com`

This value must point to the public URL of your AWS backend.

### 2.4 CORS / allowed origin

The file `frontend/vercel.json` currently contains a header rule that allows only `https://smarkquantlive.vercel.app`.

Update it to match your actual Vercel deployment domain, for example:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://your-vercel-app.vercel.app" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" }
      ]
    }
  ]
}
```

If you want to allow multiple origins, you can manage CORS from the backend instead.

### 2.5 Confirm proxy behavior

The frontend uses `frontend/next.config.ts`:

```ts
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
```

This means all frontend fetch calls to `/api/*` will be forwarded to the backend URL set in production.

## 3. Backend Deployment on AWS EC2

### 3.1 Recommended EC2 setup

- Instance type: `t3.medium` or larger
- AMI: Ubuntu 24.04 LTS
- Security group:
  - Allow inbound `22` from your IP only
  - Allow inbound `80` and `443` from anywhere if using a domain and HTTPS
  - Allow inbound `8000` only if you plan to expose the backend directly without a reverse proxy

### 3.2 Install runtime dependencies

SSH into the instance and run:

```bash
sudo apt update && sudo apt install -y python3 python3-venv python3-pip git nginx
```

If you prefer Docker, install Docker and Docker Compose instead.

### 3.3 Deploy repo and install backend dependencies

```bash
cd /opt
sudo git clone https://github.com/<owner>/<repo>.git smarkquant
cd smarkquant/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### 3.4 Configure environment variables

Create `backend/.env` from `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with:

- `ALPACA_API_KEY`
- `ALPACA_SECRET_KEY`
- `DB_PATH` (optional; default uses local backend/market_data.db)
- `ALLOWED_ORIGINS` = `https://your-vercel-app.vercel.app`

Example:

```env
ALPACA_API_KEY=xxxx
ALPACA_SECRET_KEY=yyyy
DB_PATH=/opt/smarkquant/backend/market_data.db
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

### 3.5 Database and cache considerations

The repo provides a `docker-compose.yml` that uses Postgres and Redis for the Jesse engine.

For a minimal AWS EC2 deployment you can:

- run the backend using local SQLite for the app's own storage
- use PostgreSQL + Redis only if you need Jesse persistence/caching

If you want full parity with Docker Compose:

```bash
sudo apt install -y docker.io docker-compose
cd /opt/smarkquant
sudo docker compose up -d
```

If you do not want Docker, install PostgreSQL and Redis on the instance or use AWS RDS / ElastiCache.

### 3.6 Start the backend service

For production, a systemd service or process manager is recommended.

Example using `uvicorn` directly:

```bash
cd /opt/smarkquant/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

Better: use `tmux`, `screen`, or a process manager such as `systemd`.

### 3.7 Optional: configure Nginx reverse proxy

Use Nginx to expose the backend at `https://api.your-domain.com`.

Example Nginx config:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then reload Nginx and obtain a TLS certificate with Certbot.

## 4. Confirm end-to-end deployment

1. Deploy frontend on Vercel with `BACKEND_URL` set to your backend domain.
2. Deploy backend on AWS EC2 and confirm `http://<backend-host>:8000/` returns `{ "status": "ok" }`.
3. Confirm `https://your-vercel-app.vercel.app/api/backtest/results` is proxied correctly and returns backend data.

## 5. Useful checks

- `frontend/vercel.json` should match your Vercel domain if using CORS in Vercel headers.
- `frontend/next.config.ts` should use `BACKEND_URL` for rewrites.
- `backend/.env` should include Alpaca keys and allowed frontend origins.
- Ensure the AWS instance firewall/security group allows traffic only as required.

## 6. Recommended production improvements

- Use HTTPS on the backend with Nginx and Certbot.
- Use a process manager (`systemd`, `supervisord`, or Docker) for the backend.
- Keep secrets out of source control and manage them in Vercel / EC2 environment files.
- If you have high availability needs, consider AWS RDS for Postgres and ElastiCache for Redis.
