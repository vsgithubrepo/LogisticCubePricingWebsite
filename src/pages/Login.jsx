import { useState } from 'react';
import { supabase, isConfigured } from '../supabase.js';

const N0="#060D18",N1="#0A1525",N2="#0F1F35",N3="#162840",N4="#1E3554";
const T0="#0D9488",T1="#14B8A6",G0="#F59E0B",W="#FFFFFF",S400="#94A3B8",S500="#64748B",RD="#EF4444",GR="#10B981";

export default function Login({ onLogin }) {
  const [mode,    setMode]    = useState('login'); // 'login' | 'signup'
  const [email,   setEmail]   = useState('');
  const [password,setPassword]= useState('');
  const [name,    setName]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [info,    setInfo]    = useState('');

  const inp = {width:"100%",background:N3,border:`1px solid ${N4}`,borderRadius:8,
    color:W,padding:"11px 14px",fontSize:14,outline:"none",marginBottom:12};

  async function handleSubmit() {
    setError(''); setInfo('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup' && !name) { setError('Please enter your full name.'); return; }

    if (!isConfigured) {
      // Demo mode — no Supabase
      onLogin({ id:'demo', email, full_name: name || email, role:'sales' });
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
        // fetch profile
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        onLogin(prof || { id: data.user.id, email, full_name: email, role: 'sales' });
      } else {
        const { data, error: e } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } }
        });
        if (e) throw e;
        setInfo('Account created! Please check your email to confirm, then log in.');
        setMode('login');
      }
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    }
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:N0,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:420}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:56,height:56,borderRadius:16,background:`linear-gradient(135deg,${T0},#0A6E68)`,
            display:"inline-flex",alignItems:"center",justifyContent:"center",
            fontFamily:"Syne, sans-serif",fontWeight:800,fontSize:28,color:W,marginBottom:12}}>e</div>
          <div style={{fontFamily:"Syne, sans-serif",fontSize:22,fontWeight:800,color:W}}>eTechCube</div>
          <div style={{fontSize:12,color:T1,letterSpacing:"0.08em",textTransform:"uppercase",marginTop:2}}>
            Logistics Cube Pricing Tool
          </div>
        </div>

        {/* Card */}
        <div style={{background:N2,border:`1px solid ${N4}`,borderRadius:16,padding:32}}>
          <div style={{display:"flex",gap:8,marginBottom:24,background:N3,borderRadius:10,padding:4}}>
            {['login','signup'].map(m=>(
              <button key={m} onClick={()=>setMode(m)}
                style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",
                  background:mode===m?T0:"transparent",color:mode===m?W:S400,
                  fontSize:13,fontWeight:600,transition:"all .15s"}}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {mode === 'signup' && (
            <input placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} style={inp}/>
          )}
          <input placeholder="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} style={inp}/>
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleSubmit()} style={{...inp,marginBottom:0}}/>

          {error && <div style={{marginTop:12,padding:"9px 12px",background:`${RD}20`,borderRadius:8,
            fontSize:12,color:RD,border:`1px solid ${RD}40`}}>{error}</div>}
          {info  && <div style={{marginTop:12,padding:"9px 12px",background:`${GR}20`,borderRadius:8,
            fontSize:12,color:GR,border:`1px solid ${GR}40`}}>{info}</div>}

          <button onClick={handleSubmit} disabled={loading}
            style={{width:"100%",marginTop:18,padding:"12px",borderRadius:10,border:"none",
              background:T0,color:W,fontSize:14,fontWeight:700,cursor:"pointer",
              opacity:loading?0.6:1,transition:"opacity .2s"}}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {!isConfigured && (
            <div style={{marginTop:16,padding:"10px 12px",background:`${G0}15`,borderRadius:8,
              border:`1px solid ${G0}30`,fontSize:11,color:S400}}>
              ⚠️ Supabase not configured — running in demo mode. Data saves to browser only.
              See README for setup instructions.
            </div>
          )}
        </div>

        <p style={{textAlign:"center",marginTop:16,fontSize:12,color:S500}}>
          eTechCube LLP · Confidential Internal Tool
        </p>
      </div>
    </div>
  );
}
