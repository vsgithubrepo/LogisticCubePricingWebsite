import { useState, useEffect } from 'react';
import { supabase, isConfigured } from './supabase.js';
import Login     from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin     from './pages/Admin.jsx';
import History   from './pages/History.jsx';
import { Spinner } from './components/ui.jsx';
import {
  DEFAULT_GLOBAL, DEFAULT_VOL_TIERS, DEFAULT_API_SLABS,
  DEFAULT_SRV_PRICES, DEFAULT_STOR_COST, DEFAULT_MODS, DEFAULT_APIS,
  DEFAULT_CDEV, DEFAULT_IMPL, DEFAULT_TRAIN,
} from './data/defaults.js';

const defaultPricing = () => ({
  gbl:       DEFAULT_GLOBAL,
  volTiers:  DEFAULT_VOL_TIERS,
  apiSlabs:  DEFAULT_API_SLABS,
  srvPrices: DEFAULT_SRV_PRICES,
  storCost:  DEFAULT_STOR_COST,
  modList:   DEFAULT_MODS,
  apiList:   DEFAULT_APIS,
  cdevRoles: DEFAULT_CDEV,
  implRoles: DEFAULT_IMPL,
  trainRoles:DEFAULT_TRAIN,
});

export default function App() {
  const [user,    setUser]    = useState(null);
  const [page,    setPage]    = useState('dashboard'); // 'dashboard'|'admin'|'history'
  const [pricing, setPricing] = useState(defaultPricing);
  const [loading, setLoading] = useState(true);
  const [loadQuote, setLoadQuote] = useState(null); // quote to restore in Dashboard

  /* ── On mount: check session + load pricing config ────────────────── */
  useEffect(() => {
    async function init() {
      // Load pricing from DB or localStorage
      await loadPricing();
      // Check existing session
      if (isConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: prof } = await supabase
            .from('profiles').select('*').eq('id', session.user.id).single();
          setUser(prof || { id:session.user.id, email:session.user.email, full_name:session.user.email, role:'sales' });
        }
        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (!session) { setUser(null); return; }
          const { data: prof } = await supabase
            .from('profiles').select('*').eq('id', session.user.id).single();
          setUser(prof || { id:session.user.id, email:session.user.email, full_name:session.user.email, role:'sales' });
        });
      }
      setLoading(false);
    }
    init();
  }, []);

  async function loadPricing() {
    if (isConfigured) {
      const { data } = await supabase.from('pricing_config').select('config').eq('id',1).single();
      if (data?.config) { setPricing(data.config); return; }
    }
    // Fallback: localStorage
    const raw = localStorage.getItem('etechcube_pricing');
    if (raw) { try { setPricing(JSON.parse(raw)); } catch {} }
  }

  async function handleLogout() {
    if (isConfigured) await supabase.auth.signOut();
    setUser(null);
    setPage('dashboard');
  }

  function handleLoadQuote(q) {
    setLoadQuote(q);
    setPage('dashboard');
  }

  if (loading) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#060D18"}}>
        <Spinner/>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={u => { setUser(u); setPage('dashboard'); }}/>;
  }

  if (page === 'admin') {
    if (user.role !== 'admin') {
      setPage('dashboard');
      return null;
    }
    return <Admin pricing={pricing} setPricing={setPricing} onBack={()=>setPage('dashboard')}/>;
  }

  if (page === 'history') {
    return (
      <History
        user={user}
        onLoadQuote={handleLoadQuote}
        onBack={()=>setPage('dashboard')}
      />
    );
  }

  // Default: dashboard
  return (
    <Dashboard
      key={loadQuote?.id || 'new'}   // remount when loading a different quote
      user={user}
      pricing={pricing}
      initialQuote={loadQuote}
      onAdmin={()=>setPage('admin')}
      onHistory={()=>setPage('history')}
      onLogout={handleLogout}
    />
  );
}
