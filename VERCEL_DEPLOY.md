# Vercel Deployment Guide - Frontend + AWS EC2 Backend Integration

## Table of Contents
1. [Overview](#overview)
2. [Vercel Setup](#vercel-setup)
3. [Environment Configuration](#environment-configuration)
4. [Connecting to AWS EC2 Backend](#connecting-to-aws-ec2-backend)
5. [API Route Proxying](#api-route-proxying)
6. [Custom Domain & SSL](#custom-domain--ssl)
7. [CI/CD Integration](#cicd-integration)
8. [Monitoring & Analytics](#monitoring--analytics)
9. [Performance Optimization](#performance-optimization)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Why Vercel for Frontend?
| Feature | Vercel | Traditional Hosting |
|---------|--------|-------------------|
| **Deployment** | Automatic from Git | Manual |
| **Cost** | Free tier available | $10-50/month |
| **SSL** | Free auto-renewal | Paid |
| **Global CDN** | Built-in | Extra cost |
| **Edge Functions** | Built-in | Not available |
| **Serverless API** | Built-in | Extra setup |
| **Auto-scaling** | Yes | Manual |

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                         Client Browser                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │    Vercel CDN (Frontend)       │
        │  - Next.js Pages              │
        │  - Static Assets              │
        │  - Edge Middleware            │
        └────────────┬───────────────────┘
                     │
         API_ROUTES  │  (Next.js API Routes or Edge Functions)
                     │
         ┌───────────┴──────────────────────────┐
         │                                       │
         ▼                                       ▼
    ┌─────────────────┐          ┌──────────────────────┐
    │ Vercel Function │          │  AWS EC2 Backend     │
    │ (Optional)      │          │  - Flask/Gunicorn    │
    │ - Auth Logic    │◄────────►│  - Python Backend    │
    └─────────────────┘          │  - Port 8000/443     │
                                 └──────────────────────┘
```

---

## Vercel Setup

### Step 1: Prerequisites
- GitHub/GitLab/Bitbucket account
- Vercel account (free)
- Next.js project (already have it)
- Git repository

### Step 2: Sign Up for Vercel

1. Go to [https://vercel.com/signup](https://vercel.com/signup)
2. Sign in with GitHub
3. Authorize Vercel to access your repositories

### Step 3: Import Project

**Via CLI:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy frontend
cd frontend
vercel
```

**Via Web:**
1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Select "Import Git Repository"
3. Search for `smarkquant-v.5.1`
4. Select `/frontend` as root directory
5. Click "Import"

### Step 4: Configure Build Settings

In Vercel Dashboard:
1. Go to Settings → Build & Development Settings
2. Set:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Step 5: Deploy

```bash
# Automatic deployment (git push triggers it)
git push origin main

# Manual deployment
vercel --prod

# Check logs
vercel logs
```

---

## Environment Configuration

### Step 1: Create Environment Variables

Create `.env.local` in frontend directory:

```bash
# .env.local (Local development)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
API_SECRET_KEY=your-secret-key
```

### Step 2: Set Vercel Environment Variables

**Via CLI:**
```bash
vercel env add NEXT_PUBLIC_API_BASE_URL
# Enter: https://your-ec2-server.com or IP

vercel env add NEXT_PUBLIC_SUPABASE_URL
# Enter: your-supabase-url

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Enter: your-supabase-key

vercel env add API_SECRET_KEY
# Enter: your-secret-key
```

**Via Dashboard:**
1. Go to Project Settings → Environment Variables
2. Add each variable:

| Variable | Value | Visible to Browser |
|----------|-------|------------------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://your-ec2-ip.com` | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Key | ✅ Yes |
| `API_SECRET_KEY` | Secret token | ❌ No |

### Step 3: Update Frontend Code

Update `frontend/lib/supabase.ts`:

```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})
```

Create `frontend/lib/api-client.ts`:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export const apiClient = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getToken()}`
      }
    })
    if (!response.ok) throw new Error(`API Error: ${response.status}`)
    return response.json()
  },

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getToken()}`
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error(`API Error: ${response.status}`)
    return response.json()
  },

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getToken()}`
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error(`API Error: ${response.status}`)
    return response.json()
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await getToken()}`
      }
    })
    if (!response.ok) throw new Error(`API Error: ${response.status}`)
    return response.json()
  }
}

async function getToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || ''
}
```

Update usage in components:

```typescript
// Before
const response = await fetch('http://localhost:8000/strategies')

// After
import { apiClient } from '@/lib/api-client'
const data = await apiClient.get('/strategies')
```

---

## Connecting to AWS EC2 Backend

### Step 1: Get EC2 Instance Details

```bash
# Get instance IP and security info
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=smarkquant-server" \
  --query 'Reservations[0].Instances[0].[PublicIpAddress,State.Name,SecurityGroups[0].GroupId]' \
  --output text
```

### Step 2: Configure EC2 Security Group

Allow traffic from Vercel:

```bash
# Get security group ID
SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=smarkquant-sg" \
  --query 'SecurityGroups[0].GroupId' \
  --output text)

# Allow HTTPS from anywhere (Vercel uses HTTPS)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0 \
  --description "Vercel HTTPS"

# Allow HTTP for redirect
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --description "Vercel HTTP"
```

### Step 3: Set Up Custom Domain on EC2

**Option A: Using Elastic IP (Recommended)**

```bash
# Allocate Elastic IP
aws ec2 allocate-address --domain vpc

# Get the Allocation ID
ALLOC_ID=$(aws ec2 describe-addresses \
  --filters "Name=instance-id,Values=your-instance-id" \
  --query 'Addresses[0].AllocationId' \
  --output text)

# Associate with instance
aws ec2 associate-address \
  --instance-id your-instance-id \
  --allocation-id $ALLOC_ID
```

**Option B: Using Route 53**

```bash
# Create Route 53 hosted zone
aws route53 create-hosted-zone \
  --name api.your-domain.com \
  --caller-reference $(date +%s)

# Get hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --dns-name api.your-domain.com \
  --query 'HostedZones[0].Id' \
  --output text)

# Create A record pointing to EC2 IP
aws route53 change-resource-record-sets \
  --hosted-zone-id $ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.your-domain.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "YOUR_EC2_PUBLIC_IP"}]
      }
    }]
  }'
```

### Step 4: Update Vercel Environment Variable

```bash
# Update to use domain instead of IP
vercel env add NEXT_PUBLIC_API_BASE_URL
# Enter: https://api.your-domain.com

# Redeploy
vercel --prod
```

### Step 5: Enable CORS on EC2 Backend

Update `backend/main.py`:

```python
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Enable CORS for Vercel frontend
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://your-frontend.vercel.app",
            "https://your-custom-domain.com",
            "http://localhost:3000"  # Development
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

@app.route('/health', methods=['GET'])
def health():
    return {'status': 'healthy'}, 200

@app.route('/strategies', methods=['GET'])
def get_strategies():
    # Your logic here
    return {'strategies': []}, 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
```

Alternatively, use a middleware:

```python
from flask import make_response

@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = 'https://your-frontend.vercel.app'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response
```

### Step 6: Update Nginx Config on EC2

```bash
sudo tee /etc/nginx/sites-available/smarkquant > /dev/null <<'EOF'
upstream backend {
    server localhost:8000;
}

server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Access-Control-Allow-Origin "https://your-frontend.vercel.app" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Handle CORS preflight requests
    location / {
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://your-frontend.vercel.app' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
            return 204;
        }
    }
}
EOF

sudo systemctl restart nginx
```

---

## API Route Proxying

### Option 1: Vercel API Routes (Serverless)

Create `frontend/pages/api/proxy/[...path].ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { path } = req.query
  const pathStr = Array.isArray(path) ? path.join('/') : path

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  const fullUrl = `${apiUrl}/${pathStr}`

  try {
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    })

    const data = await response.json()

    res.status(response.status).json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
```

Usage in components:

```typescript
// Instead of calling EC2 directly
const response = await fetch('/api/proxy/strategies')
```

### Option 2: Vercel Edge Functions (Faster)

Create `frontend/pages/api/edge-proxy.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const endpoint = searchParams.get('endpoint')

  if (!endpoint) {
    return NextResponse.json(
      { error: 'Missing endpoint parameter' },
      { status: 400 }
    )
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  const response = await fetch(`${apiUrl}${endpoint}`, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': req.headers.get('authorization') || '',
    },
    body: req.method !== 'GET' ? await req.text() : undefined,
  })

  const data = await response.text()
  const newResponse = new NextResponse(data, { status: response.status })

  // Add CORS headers
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')

  return newResponse
}
```

### Option 3: Built-in Rewrites (No Serverless)

Update `frontend/next.config.ts`:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/:path*`,
        }
      ]
    }
  }
}

export default nextConfig
```

---

## Custom Domain & SSL

### Step 1: Connect Domain on Vercel

1. Go to Vercel Dashboard → Project Settings → Domains
2. Enter your domain: `frontend.your-domain.com`
3. Choose nameserver update method:
   - **Vercel Nameservers** (Recommended)
   - **CNAME** (if domain hosted elsewhere)

### Step 2: Update Domain Registrar

**If using Vercel nameservers:**
1. Go to your domain registrar
2. Update nameservers to Vercel's:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

Wait 24-48 hours for DNS propagation.

### Step 3: SSL Certificate

Vercel automatically issues free SSL via Let's Encrypt. Certificate auto-renews.

Verify SSL:
```bash
# Check certificate
curl -I https://frontend.your-domain.com

# Verify API backend
curl -I https://api.your-domain.com
```

---

## CI/CD Integration

### Step 1: Automatic Deployments

Vercel automatically deploys on:
- Push to main branch → Production
- Push to other branch → Preview

### Step 2: Preview Environment Variables

Secrets for preview deployments:

```bash
vercel env add NEXT_PUBLIC_API_BASE_URL --environments preview
# Enter: https://staging-api.your-domain.com

vercel env add NEXT_PUBLIC_API_BASE_URL --environments production
# Enter: https://api.your-domain.com
```

### Step 3: GitHub Integration

Add deployment check in GitHub Actions:

Create `.github/workflows/deploy-check.yml`:

```yaml
name: Deploy Check

on:
  push:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        working-directory: ./frontend
        run: npm install
      
      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          NEXT_PUBLIC_API_BASE_URL: ${{ secrets.API_BASE_URL }}
      
      - name: Run tests
        working-directory: ./frontend
        run: npm run test
      
      - name: Test API connectivity
        run: |
          curl -f https://api.your-domain.com/health || exit 1
```

### Step 4: Conditionally Deploy Based on API Health

```bash
# Update deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash

# Check backend health
if ! curl -f https://api.your-domain.com/health; then
  echo "Backend is down! Aborting deployment."
  exit 1
fi

# Deploy to Vercel
vercel --prod --token $VERCEL_TOKEN

echo "Deployment successful"
EOF

chmod +x deploy.sh
```

---

## Monitoring & Analytics

### Step 1: Enable Vercel Analytics

In `frontend/next.config.ts`:

```typescript
import { withVercelAnalytics } from '@vercel/analytics'

export default withVercelAnalytics({
  // your config
})
```

Or in `frontend/pages/_app.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react'

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  )
}

export default MyApp
```

### Step 2: Monitor Backend Connectivity

Create monitoring endpoint:

```typescript
// frontend/pages/api/health.ts
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const backendHealth = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/health`,
      { timeout: 5000 }
    )

    if (!backendHealth.ok) {
      return res.status(500).json({
        status: 'unhealthy',
        backend: 'down'
      })
    }

    const data = await backendHealth.json()
    res.status(200).json({
      status: 'healthy',
      backend: data
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: String(error)
    })
  }
}
```

### Step 3: Set Up Notifications

Use Vercel Integrations menu to connect:
- Slack (deployment notifications)
- Discord (alerts)
- PagerDuty (on-call alerts)

---

## Performance Optimization

### Step 1: Image Optimization

Update `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  images: {
    optimization: {
      enabled: true,
      minimumCacheTTL: 60000, // 1 minute
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      formats: ['image/webp', 'image/avif'],
    },
    domains: ['api.your-domain.com'],
  },
}
```

### Step 2: Enable Caching

```typescript
// In API routes
res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
```

### Step 3: Optimize Bundle

Install bundle analyzer:

```bash
npm install --save-dev @next/bundle-analyzer

# Use in next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // your config
})
```

Run analysis:

```bash
ANALYZE=true npm run build
```

---

## Troubleshooting

### Issue: 500 Error on Frontend

**Investigation:**
```bash
# Check Vercel logs
vercel logs --follow

# Check network tab in browser DevTools
# Should see CORS headers in API response
```

**Solutions:**
1. Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly
2. Ensure EC2 backend responds with correct CORS headers
3. Check EC2 security group allows traffic from Vercel IPs

### Issue: Backend Unreachable

**Check EC2 connectivity:**
```bash
# SSH to EC2 instance
ssh -i key.pem ubuntu@ec2-ip

# Check if backend is running
docker ps
systemctl status smarkquant-backend.service

# Check logs
docker logs -f backend

# Test locally
curl http://localhost:8000/health
```

**Verify CORS:**
```bash
# Test CORS from Vercel
curl -H "Origin: https://your-frontend.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS https://api.your-domain.com/strategies -v
```

### Issue: Deployment Fails

**Check build logs:**
```bash
# View deployment logs
vercel logs [deployment-id]

# Rebuild locally
npm run build
```

**Common causes:**
- Missing environment variables
- Build errors in code
- Incompatible dependencies

### Issue: API Timeout

**Update timeout settings:**

In `frontend/lib/api-client.ts`:

```typescript
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 30000) // 30s

try {
  const response = await fetch(url, { signal: controller.signal })
} finally {
  clearTimeout(timeout)
}
```

### Issue: CORS Errors

**Check error message:**
- `No 'Access-Control-Allow-Origin'` → Add CORS headers
- `Preflight request failed` → Allow OPTIONS method

**Quick fix:**
```bash
# Test without CORS (development only)
curl -H "Access-Control-Allow-Origin: *" https://api.your-domain.com
```

---

## Deployment Checklist

- [ ] Vercel account created and project imported
- [ ] Environment variables set in Vercel dashboard
- [ ] EC2 instance running with backend API
- [ ] Domain registered and DNS updated
- [ ] SSL certificate installed on EC2
- [ ] CORS enabled on backend
- [ ] API health endpoint created
- [ ] Frontend builds successfully locally
- [ ] API calls work in browser network tab
- [ ] Custom domain points to Vercel
- [ ] Backend domain points to EC2
- [ ] Monitoring enabled
- [ ] Automated deployments working
- [ ] Backup strategy in place

---

## Quick Commands Reference

### Local Development
```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (in another terminal)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Deployment
```bash
# Deploy frontend to Vercel
vercel --prod

# Check deployment status
vercel logs --follow

# Redeploy
vercel --prod --force
```

### Debugging
```bash
# View Vercel deployment logs
vercel logs

# Check EC2 backend status
aws ec2 describe-instances --filters "Name=tag:Name,Values=smarkquant-server"

# SSH to EC2
ssh -i key.pem ubuntu@<public-ip>

# Check backend health
curl https://api.your-domain.com/health
```

### Environment Management
```bash
# List all env vars
vercel env ls

# Add new env var
vercel env add VARIABLE_NAME

# Remove env var
vercel env rm VARIABLE_NAME

# Pull env vars locally
vercel env pull .env.local
```

---

## Cost Analysis

| Service | Cost | Notes |
|---------|------|-------|
| Vercel Frontend | Free-$20/mo | Hobby plan free |
| EC2 Backend | $20-30/mo | t3.medium instance |
| Domain | $10-15/year | Registrar dependent |
| SSL | Free | Included in both |
| Bandwidth | Free | First 100GB/month |
| **Total** | **~$30-50/mo** | Scalable |

---

## Architecture Diagram

```
                          ┌─────────────────────┐
                          │   Browser Client    │
                          └──────────┬──────────┘
                                     │
                    Vercel Global CDN │
                          ┌──────────▼──────────┐
                          │ Vercel Deployment  │
                          ├────────────────────┤
                          │ Next.js Frontend   │
                          │ Pages & Components │
                          │ Assets (images)    │
                          └───────────┬────────┘
                                      │
                          ┌───────────▼──────────┐
                          │  API Routes/Proxy   │
                          │  Edge Functions     │
                          │  CORS Headers       │
                          └───────────┬────────┘
                                      │
                                      │ HTTPS
                      ┌───────────────▼────────────────┐
                      │    AWS EC2 (api.domain.com)   │
                      ├──────────────────────────────┤
                      │      Nginx (Reverse Proxy)   │
                      │  - Port 443 (HTTPS)          │
                      │  - SSL Certificate           │
                      │  - CORS Headers              │
                      └───────────┬───────────────────┘
                                  │
                      ┌───────────▼───────────┐
                      │  Gunicorn/Flask App  │
                      ├──────────────────────┤
                      │ Trading Bot Backend  │
                      │ API Endpoints        │
                      │ Business Logic       │
                      └──────────┬───────────┘
                                 │
                      ┌─────────────▼────────────┐
                      │   Supabase Database     │
                      │   Trading Data Store    │
                      └─────────────────────────┘
```

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js API Routes**: https://nextjs.org/docs/api-routes/introduction
- **CORS Guide**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- **EC2 Best Practices**: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-best-practices.html
- **SSL/TLS Setup**: https://letsencrypt.org/getting-started/
