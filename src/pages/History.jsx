import { useState, useEffect } from 'react';
import { supabase, isConfigured } from '../supabase.js';
import { Card, STitle, Btn, T0, T1, T2, G0, GR, RD, W, SF, SF2, SF3, S0, S1, S2, S3, B0, B1, INR } from '../components/ui.jsx';

export default function History({ user, onLoadQuote, onBack }) {
  const [quotes,setQuotes]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState('');
  const [view,setView]=useState(null);

  useEffect(()=>{ fetchQuotes(); },[]);

  async function fetchQuotes() {
    setLoading(true);
    if (isConfigured) {
      let q=supabase.from('quotes').select('*').order('created_at',{ascending:false});
      if(user.role!=='admin') q=q.eq('created_by',user.id);
      const{data}=await q;
      setQuotes(data||[]);
    } else {
      const raw=localStorage.getItem('etechcube_quotes');
      const all=raw?JSON.parse(raw):[];
      setQuotes(user.role==='admin'?all:all.filter(q=>q.created_by===user.id));
    }
    setLoading(false);
  }

  async function deleteQuote(id) {
    if(!confirm('Delete this quote?')) return;
    if(isConfigured){ await supabase.from('quotes').delete().eq('id',id); }
    else {
      const raw=localStorage.getItem('etechcube_quotes');
      const all=raw?JSON.parse(raw):[];
      localStorage.setItem('etechcube_quotes',JSON.stringify(all.filter(q=>q.id!==id)));
    }
    fetchQuotes();
  }

  const filtered=quotes.filter(q=>!search||q.customer_name?.toLowerCase().includes(search.toLowerCase())||q.customer_company?.toLowerCase().includes(search.toLowerCase())||q.created_by_name?.toLowerCase().includes(search.toLowerCase()));

  if(view) {
    const q=view; const d=q.quote_data||{};
    return(
      <div style={{minHeight:"100vh",background:"#F8FAFC"}}>
        <div style={{background:SF,borderBottom:`1px solid ${B0}`,height:58,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setView(null)} style={{background:SF2,border:`1px solid ${B0}`,borderRadius:8,color:S1,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>← Back to History</button>
            <span style={{fontFamily:"Syne,sans-serif",fontSize:15,fontWeight:800,color:S0}}>Quote: {q.customer_name}</span>
          </div>
          <Btn onClick={()=>onLoadQuote(q)} style={{background:T0}}>📂 Load & Edit This Quote</Btn>
        </div>
        <div style={{maxWidth:900,margin:"0 auto",padding:"24px 20px"}}>
          <Card style={{marginBottom:14}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
              {[['Customer',q.customer_name],['Company',q.customer_company||'—'],['Email',q.customer_email||'—'],['Created By',q.created_by_name||'—'],['Date',new Date(q.created_at).toLocaleDateString('en-IN')],['Billing',d.cfg?.billing||'—']].map(([k,v])=>(
                <div key={k}>
                  <div style={{fontSize:10,color:S2,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>{k}</div>
                  <div style={{fontSize:13,color:S0,fontWeight:500}}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
            {[{l:"Modules",v:INR(d.calc?.modC||0),c:T0,bg:T2},{l:"Server + APIs",v:INR((d.calc?.srvT||0)+(d.calc?.apiT||0)),c:"#7C3AED",bg:"#EDE9FE"},{l:"Prof. Services",v:INR(d.calc?.ps||0),c:G0,bg:"#FEF3C7"},{l:"Grand Total",v:INR(q.grand_total||0),c:"#DC2626",bg:"#FEE2E2"}].map(x=>(
              <div key={x.l} style={{background:x.bg,borderRadius:10,padding:"12px 14px",border:`1px solid ${x.c}20`}}>
                <div style={{fontSize:10,color:x.c,textTransform:"uppercase",fontWeight:700,marginBottom:3}}>{x.l}</div>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:16,fontWeight:800,color:x.c}}>{x.v}</div>
              </div>
            ))}
          </div>
          {d.selMods&&d.selMods.length>0&&(
            <Card>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:12,fontWeight:700,color:S0,marginBottom:10,textTransform:"uppercase"}}>Selected Modules ({d.selMods.length})</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {d.selMods.map(m=>(
                  <span key={m.id} style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:T2,color:T1,border:`1px solid ${T0}30`}}>{m.name} · {INR(m.price)}</span>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return(
    <div style={{minHeight:"100vh",background:"#F8FAFC"}}>
      <div style={{background:SF,borderBottom:`1px solid ${B0}`,height:58,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{background:SF2,border:`1px solid ${B0}`,borderRadius:8,color:S1,padding:"6px 12px",fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>← Back</button>
          <span style={{fontFamily:"Syne,sans-serif",fontSize:15,fontWeight:800,color:S0}}>📚 Quote History {user.role==='admin'?'(All Users)':'(My Quotes)'}</span>
        </div>
        <span style={{fontSize:12,color:S2,fontWeight:500}}>{filtered.length} quotes</span>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 20px"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search by customer name, company or sales rep…"
          style={{width:"100%",background:SF,border:`1px solid ${B0}`,borderRadius:8,color:S0,padding:"10px 14px",fontSize:14,outline:"none",marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}/>

        {loading?(
          <div style={{textAlign:"center",color:S2,padding:40,fontSize:14}}>Loading quotes…</div>
        ):filtered.length===0?(
          <Card style={{textAlign:"center",padding:40}}>
            <div style={{fontSize:40,marginBottom:12}}>📭</div>
            <div style={{color:S1,fontSize:14}}>No quotes found. Create your first quote from the Dashboard.</div>
          </Card>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr auto",gap:10,padding:"6px 16px",fontSize:10,fontWeight:700,color:S2,textTransform:"uppercase",letterSpacing:"0.05em"}}>
              <span>Customer</span><span>Company</span><span>Created By</span><span>Date</span><span>Grand Total</span><span>Actions</span>
            </div>
            {filtered.map(q=>(
              <div key={q.id} className="hover-row"
                style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr auto",gap:10,alignItems:"center",padding:"13px 16px",borderRadius:10,background:SF,border:`1px solid ${B0}`,boxShadow:"0 1px 3px rgba(0,0,0,.04)"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:S0}}>{q.customer_name}</div>
                  <div style={{fontSize:11,color:S2}}>{q.quote_data?.cfg?.billing||''} billing</div>
                </div>
                <span style={{fontSize:13,color:S1}}>{q.customer_company||'—'}</span>
                <span style={{fontSize:13,color:S2}}>{q.created_by_name||'—'}</span>
                <span style={{fontSize:13,color:S2}}>{new Date(q.created_at).toLocaleDateString('en-IN')}</span>
                <span style={{fontFamily:"Syne,sans-serif",fontSize:14,fontWeight:700,color:T0}}>{INR(q.grand_total||0)}</span>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setView(q)} style={{padding:"5px 12px",borderRadius:6,background:T2,border:`1px solid ${T0}30`,color:T1,fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:500}}>View</button>
                  <button onClick={()=>onLoadQuote(q)} style={{padding:"5px 12px",borderRadius:6,background:"#FEF3C7",border:"1px solid #FCD34D",color:"#92400E",fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:500}}>Load</button>
                  <button onClick={()=>deleteQuote(q.id)} style={{padding:"5px 10px",borderRadius:6,background:"#FEE2E2",border:"1px solid #FCA5A5",color:RD,fontSize:12,cursor:"pointer"}}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
