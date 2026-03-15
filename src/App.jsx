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
  const [page,    setPage]    = useState('dashboard');
  const [pricing, setPricing] = useState(defaultPricing);
  const [loading, setLoading] = useState(true);
  const [loadQuote, setLoadQuote] = useState(null);

  useEffect(() => {
    async function init() {
      await loadPricing();
      if (isConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: prof } = await supabase
            .from('profiles').select('*').eq('id', session.user.id).single();
          setUser(prof || { id:session.user.id, email:session.user.email, full_name:session.user.email, role:'sales' });
        }
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
    const raw = localStorage.getItem('etechcube_pricing');
    if (raw) { try { setPricing(JSON.parse(raw)); } catch {} }
  }

  async function handleLogout() {
    if (isConfigured) await supabase.auth.signOut();
    setUser(null);
    setPage('dashboard');
    sessionStorage.clear();
  }

  function handleLoadQuote(q) {
    setLoadQuote(q);
    setPage('dashboard');
  }

  if (loading) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#F8FAFC"}}>
        <div style={{textAlign:"center"}}>
          <img src="/etechcube-logo.png" alt="eTechCube" style={{height:48,marginBottom:20,objectFit:"contain"}}
            onError={e=>{e.target.style.display='none';}}/>
          <Spinner/>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={u => { setUser(u); setPage('dashboard'); }}/>;
  }

  if (page === 'admin') {
    if (user.role !== 'admin') { setPage('dashboard'); return null; }
    return <Admin pricing={pricing} setPricing={setPricing} onBack={()=>setPage('dashboard')} user={user}/>;
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

  return (
    <Dashboard
      key={loadQuote?.id || 'new'}
      user={user}
      pricing={pricing}
      initialQuote={loadQuote}
      onAdmin={()=>setPage('admin')}
      onHistory={()=>setPage('history')}
      onLogout={handleLogout}
    />
  );
}