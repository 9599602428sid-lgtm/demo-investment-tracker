# Family Investment Tracker — Demo

A fully-featured portfolio tracker demo with **real-time live market data**, Supabase authentication, and sample investment data.

## Features
- 📊 **8 Investment Types**: Stocks, Mutual Funds, Bonds, Insurance, FDs, Unlisted Stocks, LLP Capital, LLP Loans
- 📈 **Live Market Data**: Real-time stock prices (Yahoo Finance) and MF NAVs (mfapi.in)
- 👨‍👩‍👧‍👦 **6 Family Members**: Filter and view investments per person
- 🧑‍💼 **Advisor Tracking**: P&L summary by advisor
- 🌙 **Light/Dark Mode**: Toggle with preference persistence
- 📥 **CSV Export**: Download filtered portfolio data
- 🔒 **Supabase Auth**: Secure login with email/password

## Quick Setup

### 1. Create a Supabase Project
- Go to [supabase.com](https://supabase.com) → New Project
- Copy your **URL** and **Anon Key** from Settings → API

### 2. Set up the Database
- Go to SQL Editor → New Query
- Paste the contents of `supabase-setup.sql` and run it
- This creates the tables and seeds 32+ dummy investments

### 3. Create a Demo User
- Go to Authentication → Users → Add User
- Email: `demo@sharmafinance.in`
- Password: `Demo@1234`

### 4. Configure Environment
```bash
cp .env.local.example .env.local
# Fill in your Supabase URL and Anon Key
```

### 5. Install & Run
```bash
npm install
npm run dev
```

### 6. Deploy to Vercel
```bash
# Push to GitHub, then import in Vercel
# Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY as env vars
```

## Tech Stack
- **Next.js 16** + TypeScript
- **Supabase** (Auth + PostgreSQL)
- **Recharts** (Charts)
- **Yahoo Finance** (Live stock prices)
- **Lucide React** (Icons)