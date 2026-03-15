eTechCube — Logistics Cube Pricing Tool

An internal sales tool for the eTechCube team to generate, customise, save and share
professional pricing quotes for the Logistics Cube platform.


🌐 Live Links
ResourceURLLive Apphttps://logistic-cube-pricing-website-git-main-vsgithubrepos-projects.vercel.appGitHub Repohttps://github.com/vsgithubrepo/LogisticCubePricingWebsiteSupabase Projecthttps://supabase.com/dashboard/project/vlaguonommcycwjdclgq

🧭 What This Tool Does
The eTechCube Pricing Tool allows the sales team to build accurate, fully itemised quotes
for prospective Logistics Cube customers. A sales rep can:

Enter customer details (company, contact, email)
Select the exact software modules the customer needs (110+ modules across 12 sections)
Choose a cloud server provider and package
Enable API integrations with volume-based pricing
Add Custom Development, Implementation and Training services
See a live Grand Total that updates with every change
Export a branded PDF or Excel quote for the customer
Save the quote to the database and access it later from the History page
Load any past quote back into the tool to edit and re-export

Admins can manage all pricing from a secure Admin Panel without touching any code.

🏗️ Architecture & Infrastructure
Frontend — React + Vite

Built with React 18 and Vite 5
Single-page application (SPA) with no page reloads
All state managed with React useState plus a custom usePersistentState hook
that saves work-in-progress to sessionStorage so users never lose their draft

Database & Authentication — Supabase

Supabase (free tier) provides a hosted PostgreSQL database plus authentication
Email/password authentication — each sales rep has their own login
Row Level Security (RLS) ensures users can only see their own quotes;
admins can see all quotes from all users
Pricing configuration is stored as a single JSONB row in pricing_config,
editable by admins from the app without any SQL
Quotes are stored in the quotes table with full customer details and the
minimal input data needed to reconstruct the quote

Deployment — Vercel

Hosted on Vercel (free hobby tier)
Connected to the GitHub repository — every git push to main triggers
an automatic redeploy in approximately 30-60 seconds
Environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
are stored securely in Vercel project settings, never in code


👥 User Roles
RoleWhat They Can DoadminCreate quotes, Edit all pricing, View ALL team quotes, Access Admin PanelsalesCreate quotes, View and reload their own quotes only
Current admin users: rajeev@etechcube.com and vikas@etechcube.com
To add a new sales rep: go to Supabase → Authentication → Add user and create
their account with a temporary password. Their role defaults to sales.
To promote someone to admin, run this SQL in Supabase SQL Editor:
sqlUPDATE public.profiles SET role = 'admin' WHERE email = 'person@etechcube.com';

Features
Pricing Calculator (Dashboard)

8-tab interface: Configuration, Modules, Server & Infra, API Integrations,
Custom Dev, Implementation, Training, Quote Summary
Live Grand Total — updates instantly as selections change
Billing cycle — Monthly or Annual (annual applies a configurable discount)
Volume tier surcharge — automatically applied based on monthly order volume
State persistence — work in progress is saved to sessionStorage; navigating
to History and back does not lose the current draft
Clear Draft button to reset and start a fresh quote

Module Selection

110+ software modules organised across 12 sections
Toggle modules on/off individually or use Select All / Clear All per section
Section navigation sidebar with active count per section
Search across all modules by name

Server & Infrastructure

6 cloud providers: AWS, Azure, GCP, DigitalOcean, Hetzner, Hostinger
6 packages per provider (Starter to Enterprise Plus)
Additional storage add-on (configurable GB)
Managed backup add-on (percentage of server base cost)

API Integrations

28 APIs across multiple categories
Per-API provider selection and monthly hit volume input
Volume slab surcharges automatically applied

Professional Services

Custom Development — role-based with resources x days x day rate
Implementation — expert-led deployment and go-live
Training & Enablement — end-user and train-the-trainer

Export

PDF Quote — A4 document with eTechCube branding, cover page with client
info, cost summary tiles, recurring vs one-time breakdown, grand total banner,
and optional full module detail pages
Excel Quote — 4-sheet workbook: Summary, Modules, Server & APIs,
Professional Services
PDF detail toggle — checkbox to include or exclude the full module list pages

Quote History

List of all saved quotes with customer name, company, date and grand total
Search by customer name, company or sales rep
View — read-only summary of any past quote
Load — load any past quote back into the Dashboard for editing
Delete — remove a quote with confirmation
Refresh button to reload from the database
Proper error handling with Try Again if the fetch fails
10-second timeout so the page never hangs

Admin Panel (admin users only)

Global Settings — annual discount, backup add-on percentage, free API hits
Module Manager — add, edit, delete, duplicate modules; change section/category
Server Pricing — edit package prices per provider; add/remove providers
Volume Tiers — add, edit, delete tiers; per-unit cost column auto-calculated
API Slabs — add, edit, delete volume surcharge slabs
Rate Card — add, edit, delete roles for Custom Dev, Implementation and Training
All changes saved to Supabase pricing_config with a single Save All Changes button


🗄️ Database Schema (Supabase)
Project ID: vlaguonommcycwjdclgq | Region: Asia (Mumbai)
Tables
TablePurposeprofilesOne row per user — stores name, email and role (sales or admin)pricing_configSingle row (id=1) — stores all pricing as JSONB, editable from Admin PanelquotesAll saved quotes — customer details, grand total and quote inputs as JSONBquote_eventsAudit log — records downloads, shares and views (reserved for future use)
Complete Setup SQL
Run this in Supabase → SQL Editor → New Query:
sqlCREATE TABLE IF NOT EXISTS profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      TEXT NOT NULL,
  full_name  TEXT,
  role       TEXT NOT NULL DEFAULT 'sales',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pricing_config (
  id         INT PRIMARY KEY DEFAULT 1,
  config     JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

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

CREATE TABLE IF NOT EXISTS quote_events (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id     UUID REFERENCES quotes(id) ON DELETE CASCADE,
  event_type   TEXT,
  triggered_by TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
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

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_events   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_own"        ON profiles       FOR ALL    USING (auth.uid() = id);
CREATE POLICY "quotes_own"          ON quotes         FOR ALL    USING (auth.uid() = created_by OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "pricing_read"        ON pricing_config FOR SELECT USING (TRUE);
CREATE POLICY "pricing_admin_write" ON pricing_config FOR ALL    USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "events_own"          ON quote_events   FOR ALL    USING ((SELECT created_by FROM quotes WHERE id = quote_id) = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

UPDATE public.profiles SET role = 'admin'
WHERE email IN ('rajeev@etechcube.com', 'vikas@etechcube.com');

🚀 Local Development
bash# 1. Clone
git clone https://github.com/vsgithubrepo/LogisticCubePricingWebsite.git
cd LogisticCubePricingWebsite

# 2. Install dependencies
npm install

# 3. Create .env file (never commit this)
cp .env.example .env
# Edit .env and fill in your Supabase URL and anon key

# 4. Start dev server
npm run dev
# Opens at http://localhost:5173
Environment Variables
VITE_SUPABASE_URL=https://vlaguonommcycwjdclgq.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_from_supabase_settings
Get the anon key from: Supabase → Settings → API Keys → Legacy anon tab → anon key
The .env file is gitignored and will never be pushed to GitHub.

📦 Deploying to Vercel
The app is already live. For any new deployment or if setting up fresh:

Go to vercel.com → New Project → Import from GitHub
Select vsgithubrepo/LogisticCubePricingWebsite
Go to Settings → Environment Variables and add:

VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY


Click Deploy

Updating the live site
Every push to main automatically triggers a redeploy:
bashgit add .
git commit -m "Your change description"
git push
Vercel deploys in approximately 30-60 seconds.
Check status at vercel.com → your project → Deployments.

📁 Project Structure
LogisticCubePricingWebsite/
├── .env                          <- Local secrets (never commit)
├── .env.example                  <- Template for new developers
├── .gitignore                    <- Protects .env and APIKey.txt
├── package.json                  <- Dependencies and build scripts
├── vite.config.js                <- Vite build configuration
├── index.html                    <- App entry point
│
├── public/
│   └── etechcube-logo.jpg        <- Official eTechCube logo
│
└── src/
    ├── App.jsx                   <- Root: auth state, routing, pricing loader
    ├── supabase.js               <- Supabase client initialisation
    ├── index.css                 <- Global styles, light theme CSS variables,
    │                                responsive rules
    ├── main.jsx                  <- React DOM entry point
    │
    ├── hooks/
    │   └── usePersistentState.js <- sessionStorage-backed useState hook;
    │                                exports seedPersistentState() for loading
    │                                saved quotes into the dashboard
    │
    ├── components/
    │   └── ui.jsx                <- Shared UI primitives: Card, Toggle, Button,
    │                                Badge, Spinner, colour tokens
    │
    ├── data/
    │   └── defaults.js           <- Default pricing: 110+ modules, 28 APIs,
    │                                server packages, volume tiers, rate cards
    │
    ├── pages/
    │   ├── Login.jsx             <- Sign in, Sign up, Forgot password
    │   ├── Dashboard.jsx         <- Main pricing tool (8 tabs), quote save/load,
    │   │                            state persistence, PDF/Excel export
    │   ├── Admin.jsx             <- Full pricing editor (admin only)
    │   └── History.jsx           <- Quote history list, search, view, load,
    │                                delete; error handling and timeout
    │
    └── utils/
        ├── calc.js               <- All pricing calculation logic
        ├── exportPDF.js          <- jsPDF A4 branded quote with logo
        └── exportExcel.js        <- SheetJS 4-sheet workbook

🛠️ Tech Stack
TechnologyPurposeReact 18UI frameworkVite 5Build tool and dev serverSupabase JS SDK 2.xDatabase, authenticationjsPDF + AutoTablePDF quote generationSheetJS (xlsx)Excel workbook generationVercelHosting and automatic deployment

📋 Pending Features
ItemNotesEmail notificationsNeeds Resend API + Supabase Edge FunctionPublic shareable quote linkshare_token column exists in DB, UI not built yetMobile responsivenessCSS classes added, needs testing on phonesPassword change pageNot yet built

🔒 Security Notes

The anon key is safe to expose in the frontend — it is the public key
and is protected by Row Level Security policies on all tables
Never expose the service_role key in frontend code — it bypasses RLS
The .env file is gitignored — credentials are only in Vercel's encrypted store
Admin routes are protected at both UI level (role check) and DB level (RLS)


eTechCube LLP · www.etechcube.com · Confidential Internal Tool
Built with React + Vite + Supabase + Vercel