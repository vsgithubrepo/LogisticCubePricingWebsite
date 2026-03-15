import { useState, useEffect } from 'react';
import { supabase, isConfigured } from '../supabase.js';
import { Card, STitle, Btn, T0, T1, G0, W, S200, S300, S400, S500, S600, GR, RD, INR } from '../components/ui.jsx';

const N0="#060D18",N1="#0A1525",N2="#0F1F35",N3="#162840",N4="#1E3554";

export default function History({ user, onLoadQuote, onBack }) {
  const [quotes,  setQuotes]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [view,    setView]    = useState(null); // quote detail

  useEffect(() => { fetchQuotes(); }, []);

  async function fetchQuotes() {
    setLoading(true);
    if (isConfigured) {
      let q = supabase.from('quotes').select('*').order('created_at', { ascending: false });
      if (user.role !== 'admin') q = q.eq('created_by', user.id);
      const { data } = await q;
      setQuotes(data || []);
    } else {
      const raw = localStorage.getItem('etechcube_quotes');
      const all = raw ? JSON.parse(raw) : [];
      setQuotes(user.role === 'admin' ? all : all.filter(q => q.created_by === user.id));
    }
    setLoading(false);
  }

  async function deleteQuote(id) {
    if (!confirm('Delete this quote?')) return;
    if (isConfigured) {
      await supabase.from('quotes').delete().eq('id', id);
    } else {
      const raw = localStorage.getItem('etechcube_quotes');
      const all = raw ? JSON.parse(raw) : [];
      localStorage.setItem('etechcube_quotes', JSON.stringify(all.filter(q=>q.id!==id)));
    }
    fetchQuotes();
  }

  const filtered = quotes.filter(q =>
    !search ||
    q.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    q.customer_company?.toLowerCase().includes(search.toLowerCase()) ||
    q.created_by_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (view) {
    const q = view;
    const d = q.quote_data || {};
    return (
      <div style={{minHeight:"100vh",background:N0,padding:"0"}}>
        <div style={{background:N1,borderBottom:`1px solid ${N4}`,height:58,padding:"0 20px",
          display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <button onClick={()=>setView(null)} style={{background:N3,border:`1px solid ${N4}`,
              borderRadius:8,color:S300,padding:"6px 12px",fontSize:12,cursor:"pointer"}}>← Back to History</button>
            <span style={{fontFamily:"Syne,sans-serif",fontSize:15,fontWeight:800,color:W}}>
              Quote: {q.customer_name}
            </span>
          </div>
          <Btn onClick={()=>{ onLoadQuote(q); }}>📂 Load & Edit This Quote</Btn>
        </div>
        <div style={{maxWidth:900,margin:"0 auto",padding:"24px 20px"}}>
          <Card style={{marginBottom:14}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
              {[
                ['Customer',q.customer_name],['Company',q.customer_company||'—'],
                ['Email',q.customer_email||'—'],['Created By',q.created_by_name||'—'],
                ['Date',new Date(q.created_at).toLocaleDateString('en-IN')],
                ['Billing',d.cfg?.billing||'—'],
              ].map(([k,v])=>(
                <div key={k}>
                  <div style={{fontSize:10,color:S600,fontWeight:700,textTransform:"uppercase"}}>{k}</div>
                  <div style={{fontSize:13,color:S200,marginTop:2}}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
            {[
              {l:"Modules",v:INR(d.calc?.modC||0),c:T0},
              {l:"Server + APIs",v:INR((d.calc?.srvT||0)+(d.calc?.apiT||0)),c:"#A78BFA"},
              {l:"Prof. Services",v:INR(d.calc?.ps||0),c:G0},
              {l:"Grand Total",v:INR(q.grand_total||0),c:G0},
            ].map(x=>(
              <div key={x.l} style={{background:N2,borderRadius:10,padding:"12px 14px",
                borderTop:`2px solid ${x.c}`,border:`1px solid ${x.c}30`,borderTopColor:x.c}}>
                <div style={{fontSize:10,color:S500,textTransform:"uppercase",fontWeight:700}}>{x.l}</div>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:16,fontWeight:800,color:x.c,marginTop:3}}>{x.v}</div>
              </div>
            ))}
          </div>
          {d.selMods && d.selMods.length > 0 && (
            <Card style={{marginBottom:14}}>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:12,fontWeight:700,color:T1,marginBottom:10,textTransform:"uppercase"}}>
                Selected Modules ({d.selMods.length})
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {d.selMods.map(m=>(
                  <span key={m.id} style={{fontSize:11,padding:"3px 9px",borderRadius:20,
                    background:`${T0}15`,color:T1,border:`1px solid ${T0}30`}}>
                    {m.name} · {INR(m.price)}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:N0,padding:"0"}}>
      <div style={{background:N1,borderBottom:`1px solid ${N4}`,height:58,padding:"0 20px",
        display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{background:N3,border:`1px solid ${N4}`,
            borderRadius:8,color:S300,padding:"6px 12px",fontSize:12,cursor:"pointer"}}>← Back</button>
          <span style={{fontFamily:"Syne,sans-serif",fontSize:15,fontWeight:800,color:W}}>
            📚 Quote History {user.role==='admin'?'(All Users)':'(My Quotes)'}
          </span>
        </div>
        <span style={{fontSize:12,color:S400}}>{filtered.length} quotes</span>
      </div>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px 20px"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍 Search by customer name, company or sales rep…"
          style={{width:"100%",background:N3,border:`1px solid ${N4}`,borderRadius:8,
            color:W,padding:"10px 14px",fontSize:14,outline:"none",marginBottom:16}}/>

        {loading ? (
          <div style={{textAlign:"center",color:S500,padding:40}}>Loading quotes…</div>
        ) : filtered.length === 0 ? (
          <Card style={{textAlign:"center",padding:40}}>
            <div style={{fontSize:32,marginBottom:12}}>📭</div>
            <div style={{color:S400}}>No quotes found. Create your first quote from the Dashboard.</div>
          </Card>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {/* Header */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr auto",gap:10,
              padding:"6px 14px",fontSize:10,fontWeight:700,color:S500,textTransform:"uppercase",letterSpacing:"0.05em"}}>
              <span>Customer</span><span>Company</span><span>Created By</span>
              <span>Date</span><span>Grand Total</span><span>Actions</span>
            </div>
            {filtered.map(q=>(
              <div key={q.id} className="hover-row"
                style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr auto",gap:10,
                  alignItems:"center",padding:"12px 14px",borderRadius:10,
                  background:N2,border:`1px solid ${N4}`}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:W}}>{q.customer_name}</div>
                  <div style={{fontSize:11,color:S500}}>{q.quote_data?.cfg?.billing||''} billing</div>
                </div>
                <span style={{fontSize:12,color:S300}}>{q.customer_company||'—'}</span>
                <span style={{fontSize:12,color:S400}}>{q.created_by_name||'—'}</span>
                <span style={{fontSize:12,color:S500}}>{new Date(q.created_at).toLocaleDateString('en-IN')}</span>
                <span style={{fontFamily:"Syne,sans-serif",fontSize:14,fontWeight:700,color:G0}}>
                  {INR(q.grand_total||0)}
                </span>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setView(q)}
                    style={{padding:"5px 10px",borderRadius:6,background:`${T0}20`,
                      border:`1px solid ${T0}40`,color:T1,fontSize:11,cursor:"pointer"}}>View</button>
                  <button onClick={()=>{ onLoadQuote(q); }}
                    style={{padding:"5px 10px",borderRadius:6,background:`${G0}20`,
                      border:`1px solid ${G0}40`,color:G0,fontSize:11,cursor:"pointer"}}>Load</button>
                  <button onClick={()=>deleteQuote(q.id)}
                    style={{padding:"5px 10px",borderRadius:6,background:`${RD}15`,
                      border:`1px solid ${RD}30`,color:RD,fontSize:11,cursor:"pointer"}}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
