import { useState } from 'react';
import { supabase, isConfigured } from '../supabase.js';

export default function Login({ onLogin }) {
  const [mode,setMode]=useState('login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [name,setName]=useState('');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [info,setInfo]=useState('');

  const inp={width:"100%",background:"#F1F5F9",border:"1px solid #E2E8F0",borderRadius:8,color:"#0F172A",padding:"11px 14px",fontSize:14,outline:"none",marginBottom:12,fontFamily:"DM Sans,sans-serif"};

  async function handleSubmit() {
    setError('');setInfo('');
    if(!email||!password){setError('Please fill in all fields.');return;}
    if(mode==='signup'&&!name){setError('Please enter your full name.');return;}
    if(!isConfigured){onLogin({id:'demo',email,full_name:name||email,role:'sales'});return;}
    setLoading(true);
    try {
      if(mode==='login'){
        const{data,error:e}=await supabase.auth.signInWithPassword({email,password});
        if(e)throw e;
        const{data:prof}=await supabase.from('profiles').select('*').eq('id',data.user.id).single();
        onLogin(prof||{id:data.user.id,email,full_name:email,role:'sales'});
      } else {
        const{error:e}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}});
        if(e)throw e;
        setInfo('Account created! Please check your email to confirm, then log in.');
        setMode('login');
      }
    } catch(e){setError(e.message||'Something went wrong.');}
    setLoading(false);
  }

  async function handleForgotPassword() {
    if(!email){setError('Please enter your email address first.');return;}
    setLoading(true);
    const{error:e}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`});
    if(e)setError(e.message);
    else setInfo('Password reset email sent! Check your inbox.');
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:"#F8FAFC",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:440}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <img src="/etechcube-logo.jpg" alt="eTechCube" style={{height:48,objectFit:"contain",marginBottom:12}}
            onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='inline-flex';}}/>
          <div style={{display:"none",width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,#0D9488,#0A6E68)",alignItems:"center",justifyContent:"center",fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:28,color:"#fff",margin:"0 auto 12px"}}>e</div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:24,fontWeight:800,color:"#0F172A"}}>eTechCube</div>
          <div style={{fontSize:13,color:"#64748B",marginTop:4}}>Logistics Cube — Pricing Tool</div>
        </div>

        <div style={{background:"#FFFFFF",border:"1px solid #E2E8F0",borderRadius:16,padding:32,boxShadow:"0 4px 24px rgba(0,0,0,.08)"}}>
          <div style={{display:"flex",gap:6,marginBottom:24,background:"#F1F5F9",borderRadius:10,padding:4}}>
            {['login','signup'].map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",cursor:"pointer",background:mode===m?"#0D9488":"transparent",color:mode===m?"#fff":"#64748B",fontSize:13,fontWeight:600,transition:"all .15s",fontFamily:"DM Sans,sans-serif"}}>
                {m==='login'?'Sign In':'Create Account'}
              </button>
            ))}
          </div>

          {mode==='signup'&&<input placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} style={inp}/>}
          <input placeholder="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} style={inp}/>
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSubmit()} style={{...inp,marginBottom:0}}/>

          {error&&<div style={{marginTop:12,padding:"9px 12px",background:"#FEE2E2",borderRadius:8,fontSize:13,color:"#DC2626",border:"1px solid #FCA5A5"}}>{error}</div>}
          {info&&<div style={{marginTop:12,padding:"9px 12px",background:"#DCFCE7",borderRadius:8,fontSize:13,color:"#16A34A",border:"1px solid #86EFAC"}}>{info}</div>}

          <button onClick={handleSubmit} disabled={loading} style={{width:"100%",marginTop:18,padding:"12px",borderRadius:10,border:"none",background:"#0D9488",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",opacity:loading?0.6:1,transition:"opacity .2s",fontFamily:"DM Sans,sans-serif"}}>
            {loading?'Please wait…':mode==='login'?'Sign In':'Create Account'}
          </button>

          {mode==='login'&&(
            <button onClick={handleForgotPassword} style={{width:"100%",marginTop:10,background:"none",border:"none",color:"#0D9488",fontSize:13,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>
              Forgot password?
            </button>
          )}

          {!isConfigured&&(
            <div style={{marginTop:16,padding:"10px 12px",background:"#FEF3C7",borderRadius:8,border:"1px solid #FCD34D",fontSize:12,color:"#92400E"}}>
              ⚠️ Supabase not configured — running in demo mode.
            </div>
          )}
        </div>
        <p style={{textAlign:"center",marginTop:16,fontSize:12,color:"#94A3B8"}}>eTechCube LLP · Confidential Internal Tool</p>
      </div>
    </div>
  );
}