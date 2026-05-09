# SmarkQuant

SmarkQuant is a sophisticated quantitative trading platform designed for strategy development, backtesting, and automated analysis. It features a modern web-based frontend and a high-performance Python backend.

## 🚀 Features

- **Backtesting**: Evaluate trading strategies against historical data.
- **Strategy Optimization**: Use Optuna for automated hyperparameter tuning.
- **Visual Analytics**: Interactive charts powered by Recharts.
- **Modern UI**: Dark-mode optimized dashboard built with Next.js and Tailwind CSS.
- **Quant Framework**: Integrated with the [Jesse](https://jesse.ai/) trading framework.

## 🏗️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (React), Tailwind CSS, Lucide React, Recharts, Framer Motion.
- **Backend**: [FastAPI](https://fastapi.tiangolo.com/), Python, Jesse, Pandas, Optuna.
- **Infrastructure**: Docker, PostgreSQL, Redis.

---

## 🛠️ Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose (recommended)
- **OR** Node.js 18+ and Python 3.10+

### Option 1: Quick Start with Docker (Recommended)

1. **Clone the repository** (if you haven't already).
2. **Start the services**:
   ```bash
   docker-compose up --build
   ```
3. **Access the platform**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)
   - API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)

### Option 2: Manual Setup (Development)

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   .\venv\Scripts\activate
   # Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   
   pip install --upgrade pip setuptools wheel
   pip install "uvicorn[standard]>=0.29.0" 
   pip install "pydantic>=2.0.0" 
   pip install "python-multipart>=0.0.9" 
   pip install "pandas>=2.0.0" 
   pip install "numpy>=1.26.0" 
   pip install "yfinance>=0.2.40" 
   pip install "alpaca-py>=0.20.0" 
   pip install "optuna>=3.6.0" 
   pip install "jesse>=0.47.0" 
   pip install "psycopg2-binary>=2.9.9" 
   pip install "redis>=5.0.0"
   ###
  

   ```
4. Start the backend:
   ```bash
   uvicorn main:app --reload
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

# Supabase Setup Guide for SmarkQuant

This guide will help you set up Supabase for authentication and database functionality in your SmarkQuant application.

## Prerequisites

1. A Google account or any account for Supabase
2. Node.js and npm installed
3. Python and pip installed

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com/)
2. Click "Start your project" or "New project"
3. Sign in with your preferred method
4. Choose your organization
5. Enter your project details:
   - Name: "smarkquant-v3" (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Select the closest region to your users
6. Click "Create new project"

## Step 2: Wait for Project Setup

- Supabase will take a few minutes to set up your project
- You'll see a progress indicator
- Once ready, you'll be taken to your project dashboard

## Step 3: Get Supabase Configuration

### For Frontend (.env.local)

1. In your Supabase project dashboard, go to Settings → API
2. Copy the following values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Z3dsa3J1cGt4Z21kZ2txcXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MjMxODgsImV4cCI6MjA5MTQ5OTE4OH0.d7LIZ2s9UCmban4oZ-Ky31omSfiAsd4wI6LaJPqebdo
NEXT_PUBLIC_SUPABASE_URL=https://fwgwlkrupkxgmdgkqqxh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_zGjuCw6-dJ3IcWEXWRJapg_wcdxDjbz
```

### For Backend (.env)

1. In the same API settings page, copy:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Z3dsa3J1cGt4Z21kZ2txcXhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkyMzE4OCwiZXhwIjoyMDkxNDk5MTg4fQ.s3fg4N1BoAUOSvnvfl5ruhOuEBf6ulkl1EtKVlgN0Q4

```

## Step 4: Set up Database Tables

1. In your Supabase dashboard, go to the SQL Editor
2. Run the following SQL to create the necessary tables:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  alpaca_api_key TEXT,
  alpaca_secret_key TEXT,
  preferences JSONB DEFAULT '{"theme": "dark", "notifications": true}'
);

-- Create trading_sessions table
CREATE TABLE trading_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_name TEXT NOT NULL,
  strategy_name TEXT,
  symbol TEXT,
  status TEXT DEFAULT 'created',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  config JSONB,
  results JSONB
);

-- Create backtests table
CREATE TABLE backtests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES trading_sessions(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL,
  symbol TEXT,
  timeframe TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  results JSONB,
  metrics JSONB
);

-- Create portfolios table
CREATE TABLE portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  holdings JSONB DEFAULT '[]',
  performance JSONB
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtests ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for trading_sessions
CREATE POLICY "Users can view their own sessions" ON trading_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON trading_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON trading_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON trading_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for backtests
CREATE POLICY "Users can view their own backtests" ON backtests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backtests" ON backtests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backtests" ON backtests
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for portfolios
CREATE POLICY "Users can view their own portfolios" ON portfolios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolios" ON portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios" ON portfolios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios" ON portfolios
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_trading_sessions_user_id ON trading_sessions(user_id);
CREATE INDEX idx_backtests_user_id ON backtests(user_id);
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
```

## Step 5: Configure Authentication

1. In your Supabase dashboard, go to Authentication → Settings
2. Configure the following:
   - Site URL: `http://localhost:3000` (for development)
   - Redirect URLs: Add your production URLs later
3. Go to Authentication → Providers
4. Enable Email provider (it's enabled by default)

## Step 6: Install Dependencies

### Frontend
```bash
cd frontend
npm install
```

### Backend
```bash
cd backend
pip install -r requirements.txt
```

## Step 7: Test the Integration

1. Start the backend:
```bash
cd backend
python main.py
```

2. Start the frontend:
```bash
cd frontend
npm run dev
```

3. Try registering a new account and logging in

## Database Schema Overview

- **user_profiles**: Extended user information and preferences
- **trading_sessions**: Live trading sessions data
- **backtests**: Backtesting results and configurations
- **portfolios**: User portfolio tracking

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## Security Features

- JWT-based authentication
- Row Level Security (RLS) on all tables
- Secure API key storage (encrypted)
- User-specific data isolation

## Production Deployment

When deploying to production:

1. Update the Site URL in Supabase Auth settings
2. Add your production domain to Redirect URLs
3. Consider setting up Supabase Edge Functions for serverless API endpoints
4. Monitor usage and upgrade your plan as needed

## Troubleshooting

### Common Issues:

1. **"Invalid API key"**
   - Check your environment variables
   - Verify the keys are from the correct Supabase project

2. **"Permission denied"**
   - Check RLS policies in Supabase dashboard
   - Ensure user is authenticated

3. **"Table doesn't exist"**
   - Run the SQL setup script in Supabase SQL Editor

4. **CORS errors**
   - Supabase handles CORS automatically for authenticated requests

## Next Steps

After Supabase is set up, you can:
- Add real-time subscriptions for live data
- Implement user profile management
- Store trading strategies and results
- Add analytics and reporting
- Set up automated backups

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


### Optional Jesse extension endpoints
- `GET /api/jesse/version` : get installed Jesse version (or error if missing)
- `POST /api/jesse/update` : upgrade Jesse (`{ "version": "0.47.0" }` optional)
- `POST /api/jesse/backtest` : run native Jesse backtest CLI in project (if installed)

---

## 📁 Project Structure

```text
SmarkQuant/
├── backend/            # FastAPI & Quant logic
│   ├── strategies/     # Trading strategy implementations
│   ├── main.py        # API Entry point
│   └── requirements.txt
├── frontend/           # Next.js Application
│   ├── src/app        # App router and pages
│   └── package.json
├── docker-compose.yml  # Infrastructure orchestration
└── .env                # Environment variables
```

## 📝 License

[MIT](LICENSE)
