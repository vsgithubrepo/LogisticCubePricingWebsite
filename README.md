# eTechCube — Logistics Cube Pricing Tool v2

Full-featured pricing calculator with login, admin panel, PDF/Excel export, quote history and cloud DB.

---

## 🚀 Quick Start

```
npm install
npm run dev
```

---

## 🗄️ Supabase Setup (Free Cloud DB + Auth)

### Step 1 — Create free account
Go to https://supabase.com → Sign up → New Project
Choose a name, set a DB password, pick a region close to India (e.g. Singapore).

### Step 2 — Get your API keys
In your Supabase project → Settings → API
Copy:
- **Project URL** (looks like: https://xyzxyz.supabase.co)
- **anon public key** (long string starting with eyJ...)

### Step 3 — Create .env file
Copy `.env.example` to `.env` and fill in your keys:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4 — Run this SQL in Supabase SQL Editor
Go to your Supabase project → SQL Editor → New Query → paste and run:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'sales',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing config (single row, admin editable)
CREATE TABLE pricing_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- Quotes table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id),
  created_by_email TEXT,
  created_by_name TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_company TEXT,
  quote_data JSONB NOT NULL,
  grand_total NUMERIC,
  billing_cycle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_read"   ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Pricing config: everyone reads, only admin writes
CREATE POLICY "pricing_read"  ON pricing_config FOR SELECT USING (true);
CREATE POLICY "pricing_write" ON pricing_config FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Quotes: users see own, admin sees all
CREATE POLICY "quotes_insert" ON quotes FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "quotes_select" ON quotes FOR SELECT USING (
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "quotes_update" ON quotes FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "quotes_delete" ON quotes FOR DELETE USING (
  auth.uid() = created_by OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Step 5 — Create your Admin account
1. Go to your app → Sign up with your email
2. In Supabase → Table Editor → profiles → find your row → change `role` from `sales` to `admin`
3. You now have full admin access including the 🛡️ Admin price editor

---

## 👥 How Roles Work

| Role | Can do |
|---|---|
| **admin** | Edit prices, view ALL quotes, access Admin panel |
| **sales** | Create quotes, view own quote history only |

To create a sales rep account: they sign up themselves, or you sign them up. Their role defaults to `sales`.

---

## 🔑 Features

| Feature | Description |
|---|---|
| 🔐 Login | Each user has their own account |
| 🛡️ Admin Panel | Edit all prices, rates, tiers — only admin can see |
| 📦 110 Modules | Toggle on/off, prices shown to sales team (not editable) |
| 🖥️ Server | 6 providers × 6 packages + storage + backup |
| 🔌 28 APIs | Volume slabs + 7 provider options each |
| 💻 Prof. Services | Custom Dev, Implementation, Training |
| 📄 PDF Export | Branded 4-section A4 quote document |
| 📊 Excel Export | 4-sheet workbook with full breakdown |
| 💾 Save Quote | Each quote saved to Supabase with customer name |
| 📚 History | Browse, view, reload, delete past quotes |

---

## 📦 Deploy to Vercel

1. Push to GitHub
2. Go to vercel.com → Import repo
3. In Vercel project settings → Environment Variables → add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

Every `git push` auto-redeploys.

---

## 📁 File Structure

```
src/
├── App.jsx                 ← Root: auth, routing, pricing state
├── supabase.js             ← Supabase client
├── data/defaults.js        ← All 110 modules, 28 APIs, rates (default values)
├── components/ui.jsx       ← Shared UI atoms (Card, Toggle, etc.)
├── pages/
│   ├── Login.jsx           ← Sign in / Sign up
│   ├── Dashboard.jsx       ← Main pricing tool (all 8 tabs)
│   ├── Admin.jsx           ← Price editor (admin only)
│   └── History.jsx         ← Quote history
└── utils/
    ├── calc.js             ← All calculation logic
    ├── exportPDF.js        ← jsPDF branded quote
    └── exportExcel.js      ← SheetJS 4-sheet workbook
```

---

Built by Claude for eTechCube LLP | www.etechcube.com
