# eTechCube — Logistics Cube Pricing Tool
 
> Internal sales tool for generating professional pricing quotes for the Logistics Cube platform.
> Built with React + Vite + Supabase.
 
**Live URL:** https://logistic-cube-pricing-website-git-main-vsgithubrepos-projects.vercel.app
 
---
 
## ✨ What This Tool Does
 
The eTechCube Pricing Tool allows the sales team to:
- Build custom quotes for prospective clients by selecting software modules, server packages and API integrations
- Calculate grand totals in real time including volume tier surcharges and annual discounts
- Export professional quotes as PDF or Excel files for client handover
- Save quotes to a database and retrieve them from a history dashboard
- Manage all pricing from a secure admin panel without touching any code
 
---
 
## 👥 User Roles
 
| Role | What They Can Do |
|------|-----------------|
| **admin** | Everything — edit prices, view all team quotes, access Admin Panel |
| **sales** | Create quotes, export PDF/Excel, view their own quote history |
 
Current admin users: `rajeev@etechcube.com`, `vikas@etechcube.com`
 
---
 
## 🔑 Features
 
| Feature | Details |
|---------|---------|
| 🔐 Authentication | Each sales rep has their own login. Powered by Supabase Auth |
| 🛡️ Admin Panel | Edit module prices, server costs, volume tiers, API slabs, rate card |
| 📦 Module Manager | 110+ modules across 12 sections. Add, edit, delete, duplicate, change category |
| 🖥️ Server Pricing | 6 cloud providers × 6 packages + additional storage + managed backup |
| 🔌 API Integrations | 28 APIs with volume-based surcharge slabs |
| 💻 Professional Services | Custom Dev, Implementation, Training with day rate calculator |
| 📄 PDF Export | Branded A4 quote document ready for client |
| 📊 Excel Export | 4-sheet workbook with full cost breakdown |
| 💾 Save Quotes | Quotes saved to Supabase with full customer details |
| 📚 Quote History | Browse, view, reload and delete past quotes |
| 🔄 State Persistence | Work in progress is saved — no data lost on navigation |
| 📱 Mobile Responsive | Works on phones and tablets |
 
---
 
## 🚀 Quick Start (Local Development)
 
```bash
# 1. Clone the repo
git clone https://github.com/vsgithubrepo/LogisticCubePricingWebsite.git
cd LogisticCubePricingWebsite
 
# 2. Install dependencies
npm install
 
# 3. Create .env file (see below)
cp .env.example .env
 
# 4. Start dev server
npm run dev
```
 
---
 
## 🗄️ Environment Variables
 
Create a `.env` file in the project root (never commit this file):
 
```
VITE_SUPABASE_URL=https://vlaguonommcycwjdclgq.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```
 
Get the anon key from: Supabase Dashboard → Settings → API Keys → Legacy anon key
 
---
 
## 🗃️ Database Setup (Supabase)
 
Project: `etechcube-pricing` | ID: `vlaguonommcycwjdclgq`
 
### Tables
 
| Table | Purpose |
|-------|---------|
| `profiles` | One row per user — stores name, email, role |
| `pricing_config` | Single row (id=1) — stores all admin-editable pricing as JSON |
| `quotes` | All saved quotes with customer details and quote data |
| `quote_events` | Audit log — tracks downloads, shares, views |
 
### Run this SQL to set up the database from scratch
 
```sql
-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'sales',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
 
-- Pricing config
CREATE TABLE IF NOT EXISTS pricing_config (
  id          INT PRIMARY KEY DEFAULT 1,
  config      JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  TEXT
);
 
-- Quotes
CREATE TABLE IF NOT EXISTS quotes (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by       UUID REFERENCES profiles(id),
  created_by_email TEXT,
  created_by_name  TEXT,
  customer_name    TEXT,
  customer_email   TEXT,
  customer_company TEXT,
  grand_total      NUMERIC,
  billing_cycle    TEXT,
  quote_data       JSONB,
  share_token      TEXT UNIQUE,
  is_shared        BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
 
-- Quote events
CREATE TABLE IF NOT EXISTS quote_events (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id     UUID REFERENCES quotes(id) ON DELETE CASCADE,
  event_type   TEXT,
  triggered_by TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
 
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'sales'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN RETURN NEW;
END;
$$;
 
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
 
-- Enable Row Level Security
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_events  ENABLE ROW LEVEL SECURITY;
 
-- RLS Policies
CREATE POLICY "profiles_own"         ON profiles      FOR ALL USING (auth.uid() = id);
CREATE POLICY "quotes_own"           ON quotes        FOR ALL USING (auth.uid() = created_by OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "pricing_read"         ON pricing_config FOR SELECT USING (TRUE);
CREATE POLICY "pricing_admin_write"  ON pricing_config FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "events_own"           ON quote_events  FOR ALL USING ((SELECT created_by FROM quotes WHERE id = quote_id) = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
 
-- Promote users to admin
UPDATE public.profiles SET role = 'admin'
WHERE email IN ('rajeev@etechcube.com', 'vikas@etechcube.com');
```
 
---
 
## 📦 Deploy to Vercel
 
1. Push to GitHub — Vercel auto-deploys on every push
2. Add environment variables in Vercel → Project → Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Redeploy once after adding variables
 
---
 
## 📁 Project Structure
 
```
LogisticCubePricingWebsite/
├── .env                        ← Local secrets (never commit)
├── .env.example                ← Template for new developers
├── .gitignore                  ← Protects .env and APIKey.txt
├── package.json
├── vite.config.js
├── index.html
├── public/
│   └── etechcube-logo.png      ← Company logo
└── src/
    ├── App.jsx                 ← Root: auth, routing, pricing state
    ├── supabase.js             ← Supabase client setup
    ├── index.css               ← Global styles and light theme tokens
    ├── main.jsx
    ├── hooks/
    │   └── usePersistentState.js  ← Saves state to sessionStorage
    ├── components/
    │   └── ui.jsx              ← Shared UI: Card, Toggle, Button etc.
    ├── data/
    │   └── defaults.js         ← All 110 modules, 28 APIs, default pricing
    ├── pages/
    │   ├── Login.jsx           ← Sign in / Sign up / Forgot password
    │   ├── Dashboard.jsx       ← Main pricing tool (8 tabs)
    │   ├── Admin.jsx           ← Price editor — admin only
    │   └── History.jsx         ← Quote history browser
    └── utils/
        ├── calc.js             ← All pricing calculation logic
        ├── exportPDF.js        ← jsPDF branded quote export
        └── exportExcel.js      ← SheetJS Excel workbook export
```
 
---
 
## 🛠️ Tech Stack
 
| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Vite 5 | Build tool and dev server |
| Supabase | Database, authentication, real-time |
| jsPDF + AutoTable | PDF quote generation |
| SheetJS (xlsx) | Excel quote generation |
| Vercel | Hosting and auto-deployment |
 
---
 
## 📋 Pending Features
 
- [ ] Email notifications when a quote is downloaded or shared (Resend + Supabase Edge Function)
- [ ] Public share link for quotes (shareable URL without login)
- [ ] eTechCube logo on exported PDF and Excel files
- [ ] Password change page for users
 
---
 
*Built for eTechCube LLP · www.etechcube.com · Confidential Internal Tool*