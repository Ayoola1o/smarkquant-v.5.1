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
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SUPABASE_URL=https://fwgwlkrupkxgmdgkqqxh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_zGjuCw6-dJ3IcWEXWRJapg_wcdxDjbz
```

### For Backend (.env)

1. In the same API settings page, copy:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
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