-- ============================================================
-- SHARMA FAMILY INVESTMENT TRACKER (DEMO) — SUPABASE SETUP
-- ============================================================
-- Run this entire file in your Supabase SQL Editor.
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run

-- 1. Create the investments table
CREATE TABLE IF NOT EXISTS public.investments (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name      TEXT        NOT NULL,
  type           TEXT        NOT NULL CHECK (type IN ('stock','mutual_fund','bond','insurance','fd','unlisted_stock','llp_capital','llp_loan')),
  name           TEXT        NOT NULL,
  ticker         TEXT,
  scheme_code    TEXT,
  quantity       NUMERIC     NOT NULL DEFAULT 1,
  buy_price      NUMERIC     NOT NULL,
  buy_date       DATE        NOT NULL,
  current_value  NUMERIC,
  maturity_date  DATE,
  notes          TEXT,
  advisor        TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row-Level Security
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- 3. Allow all authenticated users to read + write
DROP POLICY IF EXISTS "Authenticated full access" ON public.investments;
CREATE POLICY "Authenticated full access"
  ON public.investments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Portfolio History table (optional, for Performance Chart)
CREATE TABLE IF NOT EXISTS public.portfolio_history (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name      TEXT        NOT NULL,
  snapshot_date  DATE        NOT NULL,
  total_value    NUMERIC     NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.portfolio_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated full access on history" ON public.portfolio_history;
CREATE POLICY "Authenticated full access on history"
  ON public.portfolio_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 5. SEED DUMMY DATA
-- ============================================================
TRUNCATE TABLE public.investments;
TRUNCATE TABLE public.portfolio_history;

-- ── STOCKS ──
INSERT INTO public.investments (user_name, type, name, ticker, quantity, buy_price, buy_date, advisor) VALUES
('Rahul Sharma',  'stock', 'Reliance Industries',       'RELIANCE.NS',    150, 2340, '2023-03-15', 'MOTILAL'),
('Rahul Sharma',  'stock', 'Tata Consultancy Services', 'TCS.NS',          50, 3280, '2022-11-10', 'ICICI'),
('Priya Sharma',  'stock', 'HDFC Bank',                 'HDFCBANK.NS',    200, 1520, '2023-01-05', 'KOTAK'),
('Priya Sharma',  'stock', 'Infosys',                   'INFY.NS',        120, 1450, '2022-08-20', 'MOTILAL'),
('Amit Sharma',   'stock', 'Bharti Airtel',             'BHARTIARTL.NS',  300,  780, '2023-06-12', 'ANGEL'),
('Amit Sharma',   'stock', 'ITC Limited',               'ITC.NS',         500,  340, '2022-05-18', NULL),
('Neha Sharma',   'stock', 'Asian Paints',              'ASIANPAINT.NS',   80, 3100, '2023-09-01', 'HDFC'),
('Vikram Sharma', 'stock', 'Larsen & Toubro',           'LT.NS',           60, 2150, '2023-04-22', 'KOTAK'),
('Vikram Sharma', 'stock', 'Bajaj Finance',             'BAJFINANCE.NS',   40, 6800, '2022-12-08', 'MOTILAL'),
('Sonia Sharma',  'stock', 'Maruti Suzuki',             'MARUTI.NS',       25, 8900, '2023-07-14', 'ICICI'),
('Rahul Sharma',  'stock', 'Hindustan Unilever',        'HINDUNILVR.NS',  100, 2450, '2023-02-20', 'KOTAK'),
('Neha Sharma',   'stock', 'Titan Company',             'TITAN.NS',        45, 2750, '2023-08-05', 'ANGEL');

-- ── MUTUAL FUNDS ──
INSERT INTO public.investments (user_name, type, name, scheme_code, quantity, buy_price, buy_date, advisor) VALUES
('Rahul Sharma',  'mutual_fund', 'Axis Bluechip Fund - Direct Growth',             '120503', 1200, 42.50, '2022-06-01', 'MOTILAL'),
('Priya Sharma',  'mutual_fund', 'SBI Small Cap Fund - Direct Growth',             '125497',  800, 78.20, '2023-02-15', 'KOTAK'),
('Amit Sharma',   'mutual_fund', 'HDFC Mid-Cap Opportunities - Direct Growth',     '118989',  650, 95.00, '2022-09-20', 'HDFC'),
('Neha Sharma',   'mutual_fund', 'Parag Parikh Flexi Cap Fund - Direct Growth',    '122639', 1500, 38.50, '2023-01-10', 'ANGEL'),
('Vikram Sharma', 'mutual_fund', 'Mirae Asset Large Cap Fund - Direct Growth',     '118834',  950, 68.00, '2022-07-25', NULL),
('Sonia Sharma',  'mutual_fund', 'Kotak Emerging Equity Fund - Direct Growth',     '118777',  700, 55.30, '2023-05-08', 'KOTAK');

-- ── BONDS ──
INSERT INTO public.investments (user_name, type, name, quantity, buy_price, buy_date, current_value, maturity_date, advisor) VALUES
('Rahul Sharma',  'bond', 'GOI Sovereign Gold Bond 2028',   10,  5200, '2022-10-15', 58000,  '2028-10-15', NULL),
('Priya Sharma',  'bond', 'REC Tax-Free Bond 2029',         20,  1050, '2023-03-20', 22500,  '2029-03-20', 'ICICI'),
('Vikram Sharma', 'bond', 'NHAI 54EC Capital Gain Bond',     5, 10000, '2023-08-10', 52000,  '2028-08-10', NULL);

-- ── INSURANCE ──
INSERT INTO public.investments (user_name, type, name, quantity, buy_price, buy_date, current_value, maturity_date, advisor) VALUES
('Rahul Sharma', 'insurance', 'LIC Jeevan Anand - 815',     1, 450000, '2019-04-10', 620000, '2034-04-10', 'LIC'),
('Priya Sharma', 'insurance', 'HDFC Life Sanchay Plus',     1, 300000, '2021-01-15', 385000, '2036-01-15', 'HDFC'),
('Sonia Sharma', 'insurance', 'Max Life Smart Wealth Plan',  1, 200000, '2022-06-20', 235000, '2037-06-20', NULL);

-- ── FIXED DEPOSITS ──
INSERT INTO public.investments (user_name, type, name, quantity, buy_price, buy_date, current_value, maturity_date) VALUES
('Rahul Sharma', 'fd', 'SBI FD — 7.10% Senior Citizen',  1, 1500000, '2023-01-01', 1620000, '2026-01-01'),
('Priya Sharma', 'fd', 'HDFC FD — 7.25%',                1,  800000, '2023-06-15',  862000, '2026-06-15'),
('Neha Sharma',  'fd', 'ICICI FD — 6.90%',               1,  500000, '2023-09-01',  535000, '2026-09-01'),
('Amit Sharma',  'fd', 'Bajaj Finance FD — 8.05%',       1, 1000000, '2023-04-10', 1095000, '2026-04-10');

-- ── UNLISTED STOCKS ──
INSERT INTO public.investments (user_name, type, name, quantity, buy_price, buy_date, current_value, advisor) VALUES
('Amit Sharma',   'unlisted_stock', 'Swiggy Pre-IPO',   200, 380, '2023-02-01', 108000, 'ANGEL'),
('Vikram Sharma', 'unlisted_stock', 'Boat Lifestyle',   150, 650, '2023-05-20', 120000, NULL);

-- ── LLP CAPITAL ──
INSERT INTO public.investments (user_name, type, name, quantity, buy_price, buy_date, current_value) VALUES
('Rahul Sharma', 'llp_capital', 'Sharma Group LLP',   1, 5000000, '2020-04-01', 7200000),
('Amit Sharma',  'llp_capital', 'Sharma Infra LLP',   1, 3000000, '2021-07-15', 3850000);

-- ── LLP LOANS ──
INSERT INTO public.investments (user_name, type, name, quantity, buy_price, buy_date, current_value, notes) VALUES
('Rahul Sharma', 'llp_loan', 'Loan to Sharma Industries Pvt Ltd', 1, 2000000, '2022-01-10', 2180000, '9% interest'),
('Priya Sharma', 'llp_loan', 'Loan to Sharma Group LLP',          1, 1500000, '2023-03-01', 1590000, '8.5% interest');

-- ============================================================
-- HOW TO CREATE THE DEMO USER
-- ============================================================
-- Go to: Supabase Dashboard → Authentication → Users → Add User
--   Email    : demo@sharmafinance.in
--   Password : Demo@1234
-- ============================================================
