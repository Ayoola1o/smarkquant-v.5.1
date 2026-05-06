# 🚀 Quick Deployment Guide: Vercel + AWS

Follow these steps to get your full-stack trading application live in under 15 minutes.

---

## 1. Backend Deployment (AWS EC2)

### Step 1: Launch Instance
1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2).
2. Click **Launch Instance**.
3. **Name:** `smarkquant-backend`
4. **OS:** `Ubuntu 22.04 LTS` (Free Tier).
5. **Instance Type:** `t3.micro` (Free Tier) or `t3.small`.
6. **Key Pair:** Create a new one and download it.
7. **Security Group:** Allow:
   - SSH (Port 22)
   - HTTP (Port 80)
   - Custom TCP (Port 8000)
8. Click **Launch**.

### Step 2: One-Click Setup
Connect to your server (SSH) and run this block:

```bash
# 1. Install Python & Dependencies
sudo apt update && sudo apt install -y python3-pip python3-venv git
cd /home/ubuntu
git clone https://github.com/Ayoola1o/smarkquant-v.5.1.git
cd smarkquant-v.5.1/backend

# 2. Setup Environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt gunicorn

# 3. Create .env (Update your keys here!)
nano .env
```

**Inside `.env`, paste this and fill in your keys:**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=8000
```

### Step 3: Keep it Running 24/7
Run this to keep your backend alive:

```bash
sudo tee /etc/systemd/system/smarkquant.service <<EOF
[Unit]
Description=SMarkQuant Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/smarkquant-v.5.1/backend
ExecStart=/home/ubuntu/smarkquant-v.5.1/backend/venv/bin/gunicorn --bind 0.0.0.0:8000 main:app
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now smarkquant
```

---

## 2. Frontend Deployment (Vercel)

### Step 1: Import Project
1. Go to [Vercel](https://vercel.com/new).
2. Import your GitHub repository.
3. **Root Directory:** Set to `frontend`.

### Step 2: Environment Variables
Add these in the Vercel dashboard (Settings > Environment Variables):

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://YOUR_AWS_PUBLIC_IP:8000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |

### Step 3: Deploy
Click **Deploy**. Once finished, your site is live!

---

## 3. Important Notes
- **CORS:** Ensure your backend's `main.py` allows your Vercel URL (or `*` for testing).
- **SSL:** Vercel provides HTTPS automatically. For Backend HTTPS, you'll eventually want a domain + Certbot (see `AWS_DEPLOY.md`).
- **Public IP:** Find your IP in the AWS Console under "Instances".

✅ **Done!** Your frontend is on Vercel, and your backend is running 24/7 on AWS.
