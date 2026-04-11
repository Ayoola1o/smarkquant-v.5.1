# Deployment Guide

This document describes how to deploy the frontend to Vercel and the backend to an AWS EC2 instance.

## Quick Reference: Getting Your Backend URL

**After launching EC2 instance:**

1. **AWS Console** → EC2 → Instances → Select your instance
2. **Copy Public IPv4 address** (e.g., `54.123.45.67`)
3. **Backend URL**: `http://54.123.45.67:8000`
4. **Vercel Environment Variable**: `BACKEND_URL=http://54.123.45.67:8000`

**Test it works:**
```bash
curl http://54.123.45.67:8000/
# Should return: {"status": "ok", "message": "Quant Platform API is running"}
```

---

### Frontend
- [x] Build passes: `npm run build` succeeds
- [x] Critical linting errors fixed:
  - [x] Variable access before declaration (import/optimize pages)
  - [x] Math.random() during render (history page)
  - [x] Variable reassignment after render (portfolio page)
  - [x] Unescaped entities in JSX (login page)
  - [x] Improper comments in JSX (settings page)
  - [x] setState in useEffect (import page)
- [x] Environment variables configured in `frontend/next.config.ts`
- [x] CORS headers configured in `frontend/vercel.json`

### Backend
- [x] Dependencies installed: `pip install -r requirements.txt`
- [x] Environment variables configured (Alpaca API keys in root `.env`)
- [x] Database configured (SQLite for local, PostgreSQL/Redis optional)
- [x] Application can import without errors
- [x] **Dependency conflicts resolved**: Redis version compatible with Jesse framework

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

### 3.8 Get your backend URL for Vercel

After starting the backend service, you need the public URL to configure in Vercel:

#### Option 1: Using EC2 Public IP (Quick)
1. Go to AWS EC2 Console → Instances
2. Find your instance → Copy the **Public IPv4 address**
3. Your backend URL: `http://<public-ip>:8000`
4. **For Vercel**: Set `BACKEND_URL=http://<public-ip>:8000`

#### Option 2: Using Elastic IP (Stable)
1. Allocate an Elastic IP in EC2 Console
2. Associate it with your instance
3. Use the Elastic IP: `http://<elastic-ip>:8000`

#### Option 3: Using Custom Domain (Production)
1. Point your domain to the EC2 instance
2. Configure Nginx reverse proxy (see section 3.9)
3. Use domain: `https://api.yourdomain.com`

#### Testing your backend URL:
```bash
curl http://<your-ip>:8000/
# Should return: {"status": "ok", "message": "Quant Platform API is running"}
```

**Troubleshooting connection issues:**
- **Security Group**: Ensure inbound rule allows port 8000 from 0.0.0.0/0
- **Backend Running**: SSH to instance and check `ps aux | grep uvicorn`
- **IP Address**: Confirm current public IP in EC2 console
- **Firewall**: Check `sudo ufw status` on the instance

## 4. Confirm end-to-end deployment

1. Deploy frontend on Vercel with `BACKEND_URL` set to your backend domain.
2. Deploy backend on AWS EC2 and confirm `http://<backend-host>:8000/` returns `{ "status": "ok" }`.
3. Confirm `https://your-vercel-app.vercel.app/api/backtest/results` is proxied correctly and returns backend data.

## 5. Useful checks

- `frontend/vercel.json` should match your Vercel domain if using CORS in Vercel headers.
- `frontend/next.config.ts` should use `BACKEND_URL` for rewrites.
- `backend/.env` should include Alpaca keys and allowed frontend origins.
- Ensure the AWS instance firewall/security group allows traffic only as required.

## 8. Troubleshooting

### Common Issues

**Redis/Jesse Dependency Conflict**: If you encounter "No solution found when resolving dependencies" related to redis and jesse versions:
- The Jesse framework requires redis>=4.1.4,<4.2.dev0
- Updated requirements.txt to use `redis>=4.1.4` which allows compatible versions
- If issues persist, try `redis>=4.1.4,<5.0.0` for more restrictive pinning

**Backend Import Errors**: Ensure all dependencies are installed:
```bash
cd backend
pip install -r requirements.txt
```

**Frontend Build Failures**: Check for TypeScript/linting errors:
```bash
cd frontend
npm run lint
npm run build
```
