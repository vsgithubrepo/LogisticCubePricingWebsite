import { useState, useMemo } from 'react';
import { supabase, isConfigured } from '../supabase.js';
import { Card, Lbl, STitle, PRow, Tog, TxtInput, SelInput, NumInput, Btn, Badge, T0, T1, T2, G0, G1, GR, RD, W, SF, SF2, SF3, S0, S1, S2, S3, B0, B1, INR } from '../components/ui.jsx';
import { SEC_META, PROVIDERS, PACKAGES, PKG_SPECS, STOR_OPT } from '../data/defaults.js';
import { calcTotals, getApiSlab } from '../utils/calc.js';
import { exportPDF } from '../utils/exportPDF.js';
import { exportExcel } from '../utils/exportExcel.js';
import { usePersistentState } from '../hooks/usePersistentState.js';

const SECS = Object.keys(SEC_META);

const TABS = [
  {id:"config", icon:"⚙️", label:"Configuration"},
  {id:"modules",icon:"📦", label:"Modules"},
  {id:"server", icon:"🖥️", label:"Server & Infra"},
  {id:"apis",   icon:"🔌", label:"API Integrations"},
  {id:"dev",    icon:"💻", label:"Custom Dev"},
  {id:"impl",   icon:"🚀", label:"Implementation"},
  {id:"train",  icon:"🎓", label:"Training"},
  {id:"summary",icon:"📋", label:"Quote Summary"},
];

export default function Dashboard({ user, pricing, onAdmin, onHistory, onLogout, initialQuote }) {
  const { gbl, volTiers, apiSlabs, srvPrices, storCost, modList, apiList, cdevRoles, implRoles, trainRoles } = pricing;

  const [tab,      setTab]      = usePersistentState('etec_tab', 'config');
  const [activeSec,setActiveSec]= usePersistentState('etec_sec', SECS[0]);
  const [modQ,     setModQ]     = useState('');
  const [cfg,      setCfg]      = usePersistentState('etec_cfg', { company:"", contact:"", email:"", preparedBy: user.full_name||"", billing:"Monthly", orders:1000, term:1 });
  const [mods,     setMods]     = usePersistentState('etec_mods', () => { const m={}; modList.forEach(x=>{m[x.id]=!!x.pro;}); return m; });
  const [srv,      setSrv]      = usePersistentState('etec_srv', { provider:"AWS", pkg:"Business", storageGB:0, backup:false });
  const [apiState, setApiState] = usePersistentState('etec_api', () => apiList.map(()=>({ on:false, p:0, hits:0 })));
  const [cdevSt,   setCdevSt]   = useState(() => cdevRoles.map(()=>({ res:0, days:0 })));
  const [implSt,   setImplSt]   = useState(() => [{ res:1,days:10 },{ res:2,days:20 },{ res:2,days:30 }]);
  const [trnSt,    setTrnSt]    = useState(() => [{ res:2,days:5  },{ res:1,days:10 },{ res:2,days:15 }]);
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState('');
  const [quoteId,  setQuoteId]  = useState(null);
  const [includeDetails, setIncludeDetails] = useState(true);

  const calc = useMemo(() => calcTotals({
    cfg, mods, modList, srv, srvPrices, storCost, apiState, apiList, apiSlabs, volTiers, gbl,
    cdevSt, implSt, trnSt, cdevRoles, implRoles, trainRoles, PACKAGES,
  }), [cfg, mods, srv, apiState, cdevSt, implSt, trnSt, pricing]);

  async function saveQuote() {
    if (!cfg.company) { alert("Please enter the customer company name first (Configuration tab)."); return; }
    setSaving(true);
    const selMods = modList.filter(m => mods[m.id]);
    const payload = {
      created_by: user.id, created_by_email: user.email,
      created_by_name: user.full_name || user.email,
      customer_name: cfg.contact || cfg.company,
      customer_email: cfg.email, customer_company: cfg.company,
      grand_total: calc.grand, billing_cycle: cfg.billing,
      quote_data: { cfg, mods, srv, apiState, cdevSt, implSt, trnSt, calc, selMods },
      updated_at: new Date().toISOString(),
    };
    if (isConfigured) {
      if (quoteId) {
        await supabase.from('quotes').update(payload).eq('id', quoteId);
      } else {
        const { data } = await supabase.from('quotes').insert({ ...payload, created_at: new Date().toISOString() }).select().single();
        if (data) setQuoteId(data.id);
      }
    } else {
      const raw = localStorage.getItem('etechcube_quotes');
      const all = raw ? JSON.parse(raw) : [];
      if (quoteId) { const idx=all.findIndex(q=>q.id===quoteId); if(idx>=0) all[idx]={...all[idx],...payload}; }
      else { const id=Date.now().toString(); setQuoteId(id); all.unshift({...payload,id,created_at:new Date().toISOString()}); }
      localStorage.setItem('etechcube_quotes', JSON.stringify(all));
    }
    setSaving(false); setSaveMsg('✓ Quote saved!');
    setTimeout(()=>setSaveMsg(''), 3000);
  }

  function clearDraft() {
    if (!confirm('Clear all your current progress and start fresh?')) return;
    ['etec_tab','etec_sec','etec_cfg','etec_mods','etec_srv','etec_api'].forEach(k=>sessionStorage.removeItem(k));
    window.location.reload();
  }

  const exportArgs = { cfg, calc, mods, modList, srv, apiState, apiList, cdevSt, implSt, trnSt, cdevRoles, implRoles, trainRoles, PACKAGES };
  const setAll = (sec, v) => setMods(p => { const n={...p}; modList.filter(m=>m.sec===sec).forEach(m=>{n[m.id]=v;}); return n; });
  const shownMods = modQ ? modList.filter(m=>m.name.toLowerCase().includes(modQ.toLowerCase())) : modList.filter(m=>m.sec===activeSec);
  const apiCats = [...new Set(apiList.map(a=>a.cat))];

  // ── Stat card colors ──
  const statCards = [
    {l:"Modules",      v:INR(calc.modC),          c:T0,    bg:T2},
    {l:"Server + APIs",v:INR(calc.srvT+calc.apiT),c:"#7C3AED", bg:"#EDE9FE"},
    {l:"Services",     v:INR(calc.ps),             c:G0,    bg:G1},
    {l:"Grand Total",  v:INR(calc.grand),          c:"#DC2626", bg:"#FEE2E2", onClick:()=>setTab("summary")},
  ];

  return (
    <div style={{minHeight:"100vh",background:SF2}}>

      {/* ── TOP BAR ── */}
      <div style={{background:SF,borderBottom:`1px solid ${B0}`,height:62,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 8px rgba(0,0,0,.06)"}}>
        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <img src="/etechcube-logo.png" alt="eTechCube" style={{height:34,objectFit:"contain"}}
            onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}}/>
          <div style={{display:"none",width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${T0},#0A6E68)`,alignItems:"center",justifyContent:"center",fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:17,color:W}}>e</div>
          <div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:15,fontWeight:800,color:S0,lineHeight:1.1}}>eTechCube</div>
            <div style={{fontSize:10,color:S2,letterSpacing:"0.06em",textTransform:"uppercase"}}>Logistics Cube Pricing</div>
          </div>
        </div>

        {/* Stats in header */}
        <div style={{display:"flex",alignItems:"center",gap:8}} className="hide-mobile">
          {statCards.map(x=>(
            <div key={x.l} onClick={x.onClick} style={{textAlign:"center",padding:"5px 12px",background:x.bg,borderRadius:8,border:`1px solid ${x.c}25`,cursor:x.onClick?"pointer":"default",minWidth:90}}>
              <div style={{fontSize:9,color:x.c,textTransform:"uppercase",fontWeight:700,letterSpacing:"0.06em"}}>{x.l}</div>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:13,fontWeight:800,color:x.c}}>{x.v}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={onHistory} style={{padding:"6px 12px",borderRadius:8,background:SF2,border:`1px solid ${B0}`,color:S1,fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif",fontWeight:500}}>📚 History</button>
          {user.role==='admin'&&(
            <button onClick={onAdmin} style={{padding:"6px 12px",borderRadius:8,background:`${T0}12`,border:`1px solid ${T0}30`,color:T1,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>🛡️ Admin</button>
          )}
          <div style={{width:1,height:28,background:B0}}/>
          <div style={{fontSize:13,color:S1,fontWeight:500,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.full_name||user.email}</div>
          <button onClick={onLogout} style={{padding:"6px 10px",borderRadius:8,background:"transparent",border:`1px solid ${B1}`,color:S2,fontSize:12,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>Sign Out</button>
        </div>
      </div>

      <div style={{display:"flex",maxWidth:1380,margin:"0 auto"}} className="app-layout">

        {/* ── SIDEBAR ── */}
        <div className="sidebar-nav" style={{width:210,flexShrink:0,padding:"16px 12px",position:"sticky",top:62,height:"calc(100vh - 62px)",overflowY:"auto",borderRight:`1px solid ${B0}`,background:SF}}>
          {TABS.map(t=>(
            <div key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 12px",borderRadius:8,marginBottom:3,cursor:"pointer",transition:"all .13s",background:tab===t.id?T2:"transparent",border:`1px solid ${tab===t.id?T0+"35":"transparent"}`,fontSize:13,fontWeight:tab===t.id?600:400,color:tab===t.id?T1:S2}}>
              <span style={{fontSize:15}}>{t.icon}</span>{t.label}
            </div>
          ))}

          {/* Live Breakdown */}
          <div style={{marginTop:16,padding:14,background:SF2,borderRadius:10,border:`1px solid ${B0}`}}>
            <div style={{fontSize:10,color:S2,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:10}}>Live Breakdown</div>
            {[["Modules",calc.modC,T0],["Vol. Sur.",calc.volSur,S2],["Server",calc.srvT,"#7C3AED"],["APIs",calc.apiT,T0],["Prof. Svcs",calc.ps,G0]].map(([l,v,c])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:S1,marginBottom:5}}>
                <span style={{color:S2}}>{l}</span>
                <span style={{color:c,fontWeight:600}}>{INR(v)}</span>
              </div>
            ))}
            <div style={{borderTop:`1px solid ${B0}`,paddingTop:8,marginTop:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:S1,fontWeight:600}}>Grand Total</span>
              <span style={{fontFamily:"Syne,sans-serif",fontSize:15,fontWeight:800,color:"#DC2626"}}>{INR(calc.grand)}</span>
            </div>
          </div>

          {/* Save button */}
          <button onClick={saveQuote} disabled={saving} style={{width:"100%",marginTop:12,padding:"10px",borderRadius:8,background:T0,border:"none",color:W,fontSize:13,fontWeight:700,cursor:"pointer",opacity:saving?0.6:1,fontFamily:"DM Sans,sans-serif"}}>
            {saving?"Saving…":"💾 Save Quote"}
          </button>
          {saveMsg&&<div style={{fontSize:12,color:GR,textAlign:"center",marginTop:6,fontWeight:600}}>{saveMsg}</div>}
          {quoteId&&<div style={{fontSize:10,color:S2,textAlign:"center",marginTop:3}}>Saved ✓</div>}

          <button onClick={clearDraft} style={{width:"100%",marginTop:8,padding:"7px",borderRadius:8,background:"transparent",border:`1px solid ${B1}`,color:S2,fontSize:11,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>
            🗑 Clear Draft
          </button>
        </div>

        {/* ── MAIN ── */}
        <div className="main-content" style={{flex:1,padding:"24px 28px",overflowY:"auto",minHeight:"calc(100vh - 62px)"}}>

          {/* ════ CONFIG ════ */}
          {tab==="config"&&(
            <div className="fade-in">
              <STitle icon="⚙️" title="Configuration" sub="Set client details, billing cycle and order volume. All totals update live."/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                {[["Company Name","company","Client Co. Pvt. Ltd."],["Contact Person","contact","Name"],["Contact Email","email","email@company.com"],["Prepared By","preparedBy","Sales Team"]].map(([l,k,ph])=>(
                  <Card key={k}><Lbl>{l}</Lbl><TxtInput val={cfg[k]} set={v=>setCfg(p=>({...p,[k]:v}))} ph={ph}/></Card>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
                <Card>
                  <Lbl>Billing Cycle</Lbl>
                  <SelInput val={cfg.billing} set={v=>setCfg(p=>({...p,billing:v}))} opts={["Monthly","Annual"]}/>
                  {cfg.billing==="Annual"&&<div style={{marginTop:8,padding:"6px 10px",background:T2,borderRadius:6,fontSize:12,color:T1,border:`1px solid ${T0}30`,fontWeight:500}}>✓ {gbl.annualDiscount*100}% annual discount applied</div>}
                </Card>
                <Card>
                  <Lbl>Monthly Order Volume</Lbl>
                  <TxtInput val={cfg.orders} set={v=>setCfg(p=>({...p,orders:+v}))} type="number" ph="1000"/>
                  <div style={{marginTop:7,fontSize:12,color:T0,fontWeight:500}}>Tier: <strong>{calc.tier.label}</strong>{calc.volSur>0&&<span style={{color:S2}}> · +{INR(calc.volSur)}/mo</span>}</div>
                </Card>
                <Card>
                  <Lbl>Contract Term</Lbl>
                  <SelInput val={String(cfg.term)} set={v=>setCfg(p=>({...p,term:+v}))} opts={["1","2","3"]}/>
                </Card>
              </div>

              {/* Summary stat cards */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                {[{l:"Modules",v:INR(calc.modC),c:T0,bg:T2},{l:"Server + APIs",v:INR(calc.srvT+calc.apiT),c:"#7C3AED",bg:"#EDE9FE"},{l:"Monthly Subtotal",v:INR(calc.sub),c:S0,bg:SF3},{l:"Grand Total",v:INR(calc.grand),c:"#DC2626",bg:"#FEE2E2"}].map(x=>(
                  <div key={x.l} style={{background:x.bg,borderRadius:12,padding:"14px 16px",border:`1px solid ${x.c}20`}}>
                    <div style={{fontSize:10,color:x.c,textTransform:"uppercase",fontWeight:700,marginBottom:4}}>{x.l}</div>
                    <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,color:x.c}}>{x.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ MODULES ════ */}
          {tab==="modules"&&(
            <div className="fade-in">
              <STitle icon="📦" title="Software Modules" sub={`${calc.selM} of ${modList.length} selected · ${INR(calc.modC)}/mo`}/>
              <div style={{display:"flex",gap:16}}>
                {/* Section nav */}
                <div style={{width:180,flexShrink:0}}>
                  <input value={modQ} onChange={e=>setModQ(e.target.value)} placeholder="🔍 Search modules…"
                    style={{width:"100%",background:SF2,border:`1px solid ${B0}`,borderRadius:8,color:S0,padding:"8px 10px",fontSize:12,outline:"none",marginBottom:8}}/>
                  {SECS.map(sec=>{
                    const meta=SEC_META[sec]||{accent:T0,color:SF2,icon:"•"};
                    const on=modList.filter(x=>x.sec===sec&&mods[x.id]).length;
                    const tot=modList.filter(x=>x.sec===sec).length;
                    const isActive=activeSec===sec&&!modQ;
                    return(
                      <div key={sec} onClick={()=>{setActiveSec(sec);setModQ("");}}
                        style={{padding:"8px 10px",borderRadius:8,cursor:"pointer",marginBottom:3,transition:"all .13s",
                          background:isActive?T2:SF,border:`1px solid ${isActive?T0+"40":B0}`}}>
                        <div style={{fontSize:12,fontWeight:600,color:isActive?T1:S1}}>{meta.icon} {sec}</div>
                        <div style={{fontSize:10,color:S2,marginTop:1}}>{on}/{tot} selected</div>
                      </div>
                    );
                  })}
                </div>

                {/* Module list */}
                <div style={{flex:1}}>
                  {!modQ&&(
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <span style={{fontFamily:"Syne,sans-serif",fontSize:15,fontWeight:700,color:S0}}>{activeSec}</span>
                      <div style={{display:"flex",gap:6}}>
                        {["Select All","Clear All"].map((lbl,i)=>(
                          <button key={lbl} onClick={()=>setAll(activeSec,!i)}
                            style={{fontSize:11,padding:"5px 12px",borderRadius:6,cursor:"pointer",background:i?SF2:T0,border:i?`1px solid ${B1}`:"none",color:i?S1:W,fontFamily:"DM Sans,sans-serif",fontWeight:500}}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {shownMods.map(m=>{
                      const on=mods[m.id];
                      return(
                        <div key={m.id} className="mod-row" onClick={()=>setMods(p=>({...p,[m.id]:!p[m.id]}))}
                          style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,
                            background:on?T2:SF,border:`1px solid ${on?T0+"50":B0}`,
                            boxShadow:on?"0 1px 4px rgba(13,148,136,.1)":"0 1px 2px rgba(0,0,0,.04)"}}>
                          <Tog on={on} set={()=>{}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:500,color:on?T1:S0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.name}</div>
                            <div style={{fontSize:10,color:S2,marginTop:1}}>{m.desc}</div>
                          </div>
                          <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                            {m.ess?<Badge color={T0}>Essential</Badge>:!m.pro?<Badge color={G0}>Premium</Badge>:null}
                            <span style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:12,color:on?T0:S2,minWidth:70,textAlign:"right"}}>{INR(m.price)}/mo</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ SERVER ════ */}
          {tab==="server"&&(
            <div className="fade-in">
              <STitle icon="🖥️" title="Server & Infrastructure" sub="Choose cloud provider, package and add-ons."/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <Card>
                  <Lbl>Cloud Provider</Lbl>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    {PROVIDERS.map(p=>(
                      <div key={p} className="chip" onClick={()=>setSrv(s=>({...s,provider:p}))}
                        style={{padding:"10px 6px",borderRadius:8,textAlign:"center",background:srv.provider===p?T2:SF2,border:`1px solid ${srv.provider===p?T0:B0}`,fontSize:12,fontWeight:600,color:srv.provider===p?T1:S1}}>
                        {p}
                      </div>
                    ))}
                  </div>
                </Card>
                <Card>
                  <Lbl>Server Package</Lbl>
                  {PACKAGES.map((pkg,i)=>(
                    <div key={pkg} className="chip" onClick={()=>setSrv(s=>({...s,pkg}))}
                      style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",borderRadius:8,marginBottom:5,background:srv.pkg===pkg?T2:SF2,border:`1px solid ${srv.pkg===pkg?T0:B0}`}}>
                      <div>
                        <span style={{fontSize:13,fontWeight:600,color:srv.pkg===pkg?T1:S0}}>{pkg}</span>
                        <span style={{fontSize:11,color:S2,marginLeft:8}}>{PKG_SPECS[i]}</span>
                      </div>
                      <span style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:12,color:srv.pkg===pkg?T0:S2}}>{INR((srvPrices[srv.provider]||[])[i]||0)}/mo</span>
                    </div>
                  ))}
                </Card>
                <Card>
                  <Lbl>Additional Storage</Lbl>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
                    {STOR_OPT.map(gb=>(
                      <div key={gb} className="chip" onClick={()=>setSrv(s=>({...s,storageGB:gb}))}
                        style={{padding:"8px 4px",borderRadius:8,textAlign:"center",background:srv.storageGB===gb?T2:SF2,border:`1px solid ${srv.storageGB===gb?T0:B0}`,fontSize:11,fontWeight:600,color:srv.storageGB===gb?T1:S1}}>
                        {gb===0?"None":`${gb}GB`}
                        {gb>0&&<div style={{fontSize:9,color:S2,marginTop:2}}>+{INR((storCost[srv.provider]||0)*gb/100)}</div>}
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:8,fontSize:11,color:S2}}>{srv.provider} SSD: ₹{storCost[srv.provider]||0}/100GB/mo</div>
                </Card>
                <Card>
                  <Lbl>Managed Backup</Lbl>
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0"}}>
                    <Tog on={srv.backup} set={v=>setSrv(s=>({...s,backup:v}))}/>
                    <div>
                      <div style={{fontSize:13,color:S0,fontWeight:500}}>Enable Managed Backup</div>
                      <div style={{fontSize:11,color:S2}}>+{gbl.backupPct*100}% of server base cost</div>
                    </div>
                  </div>
                  <div style={{borderTop:`1px solid ${B0}`,paddingTop:10,marginTop:4}}>
                    <PRow label="Base Package" val={INR((srvPrices[srv.provider]||[])[PACKAGES.indexOf(srv.pkg)]||0)}/>
                    <PRow label="Storage Add-on" val={INR((storCost[srv.provider]||0)*(srv.storageGB/100))}/>
                    <PRow label="Backup Add-on" val={INR(srv.backup?((srvPrices[srv.provider]||[])[PACKAGES.indexOf(srv.pkg)]||0)*gbl.backupPct:0)}/>
                    <PRow label="Total Server" val={INR(calc.srvT)} bold accent/>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ════ APIS ════ */}
          {tab==="apis"&&(
            <div className="fade-in">
              <STitle icon="🔌" title="API Integrations" sub={`First ${gbl.freeApiHits} hits/mo free per service.`}/>
              <Card style={{marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:700,color:S2,textTransform:"uppercase",marginBottom:8}}>Volume Surcharge Slabs</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {apiSlabs.map(s=>(
                    <span key={s.label} className="pill" style={{background:s.surcharge===0?`${GR}15`:`${G0}15`,color:s.surcharge===0?GR:G0,border:`1px solid ${s.surcharge===0?GR:G0}35`}}>
                      {s.label}: {s.surcharge===0?"FREE":`+${INR(s.surcharge)}/mo`}
                    </span>
                  ))}
                </div>
              </Card>
              {apiCats.map(cat=>(
                <div key={cat} style={{marginBottom:18}}>
                  <div style={{fontSize:11,fontWeight:700,color:T0,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8,paddingLeft:10,borderLeft:`3px solid ${T0}`}}>{cat}</div>
                  {apiList.map((api,i)=>{
                    if(api.cat!==cat) return null;
                    const a=apiState[i];
                    const slab=getApiSlab(a.hits,apiSlabs,gbl.freeApiHits);
                    const base=api.p[a.p][1];
                    const tot=a.on?base+slab.surcharge:0;
                    return(
                      <div key={api.name} className="hover-row"
                        style={{display:"grid",gridTemplateColumns:"auto 1fr auto auto auto auto",alignItems:"center",gap:10,padding:"9px 14px",borderRadius:8,marginBottom:5,background:a.on?T2:SF,border:`1px solid ${a.on?T0+"40":B0}`}}>
                        <Tog on={a.on} set={v=>setApiState(p=>{const n=[...p];n[i]={...n[i],on:v};return n;})}/>
                        <div style={{fontSize:13,fontWeight:500,color:a.on?T1:S0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{api.name}</div>
                        <select value={a.p} onChange={e=>setApiState(p=>{const n=[...p];n[i]={...n[i],p:+e.target.value};return n;})} disabled={!a.on}
                          style={{background:SF2,border:`1px solid ${B0}`,borderRadius:6,color:S0,padding:"5px 8px",fontSize:11,outline:"none",opacity:a.on?1:0.5,maxWidth:170}}>
                          {api.p.map(([name,price],pi)=>(
                            <option key={pi} value={pi}>P{pi+1}: {name} ({price===0?"Free":INR(price)})</option>
                          ))}
                        </select>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <NumInput val={a.hits} set={v=>setApiState(p=>{const n=[...p];n[i]={...n[i],hits:v};return n;})}/>
                          <span style={{fontSize:11,color:S2}}>hits</span>
                        </div>
                        <span className="pill" style={{background:slab.surcharge===0?`${GR}15`:`${G0}15`,color:slab.surcharge===0?GR:G0,border:`1px solid ${slab.surcharge===0?GR:G0}40`}}>{slab.label}</span>
                        <span style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:12,color:a.on&&tot>0?T0:S2,minWidth:80,textAlign:"right"}}>{a.on?INR(tot):"—"}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
              <Card><PRow label="Total API Cost" val={INR(calc.apiT)} bold accent/></Card>
            </div>
          )}

          {/* ════ PS TABS ════ */}
          {(tab==="dev"||tab==="impl"||tab==="train")&&(()=>{
            const c2={
              dev: {icon:"💻",title:"Custom Development",sub:"One-time cost. Adjust resources and days per role.",roles:cdevRoles,st:cdevSt,setSt:setCdevSt,total:calc.cdT,tip:"Typical: 1 TL + 2 Senior + 3 Mid + 1 PM + 1 QA × 90 days"},
              impl:{icon:"🚀",title:"Implementation",sub:"Expert-led kickoff, config, migration and go-live.",roles:implRoles,st:implSt,setSt:setImplSt,total:calc.imT},
              train:{icon:"🎓",title:"Training & Enablement",sub:"End-user, train-the-trainer and e-learning content.",roles:trainRoles,st:trnSt,setSt:setTrnSt,total:calc.trT},
            }[tab];
            return(
              <div className="fade-in">
                <STitle icon={c2.icon} title={c2.title} sub={c2.sub}/>
                <Card>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1.2fr",gap:8,paddingBottom:10,marginBottom:6,borderBottom:`1px solid ${B0}`}}>
                    {["Role","Resources","Days","Day Rate","Total"].map(h=>(
                      <div key={h} style={{fontSize:10,fontWeight:700,color:S2,textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</div>
                    ))}
                  </div>
                  {c2.roles.map((r,i)=>(
                    <div key={r.role} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1.2fr",gap:8,alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${B0}`}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:500,color:S0}}>{r.role}</div>
                        <div style={{fontSize:10,color:S2}}>{r.note}</div>
                      </div>
                      <NumInput val={c2.st[i]?.res||0} set={v=>c2.setSt(p=>{const n=[...p];n[i]={...n[i],res:v};return n;})}/>
                      <NumInput val={c2.st[i]?.days||0} set={v=>c2.setSt(p=>{const n=[...p];n[i]={...n[i],days:v};return n;})}/>
                      <span style={{fontFamily:"Syne,sans-serif",fontSize:12,color:S2}}>{INR(r.rate)}</span>
                      <span style={{fontFamily:"Syne,sans-serif",fontSize:14,fontWeight:700,color:T0}}>{INR(r.rate*(c2.st[i]?.res||0)*(c2.st[i]?.days||0))}</span>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:14,marginTop:6}}>
                    <span style={{fontSize:13,fontWeight:600,color:S0}}>Total (one-time)</span>
                    <span style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:800,color:T0}}>{INR(c2.total)}</span>
                  </div>
                </Card>
                {c2.tip&&<div style={{marginTop:12,padding:"10px 14px",background:G1,borderRadius:8,border:`1px solid ${G0}30`,fontSize:12,color:S1}}>💡 {c2.tip}</div>}
              </div>
            );
          })()}

          {/* ════ SUMMARY ════ */}
          {tab==="summary"&&(
            <div className="fade-in">
              <STitle icon="📋" title="Quote Summary" sub="Complete breakdown ready for client handover."/>

              {/* Client info */}
              <Card style={{marginBottom:14}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                  {[["Company",cfg.company||"—"],["Contact",cfg.contact||"—"],["Email",cfg.email||"—"],["Billing",cfg.billing],["Orders/mo",cfg.orders.toLocaleString("en-IN")],["Prepared By",cfg.preparedBy||"—"]].map(([k,v])=>(
                    <div key={k}>
                      <div style={{fontSize:10,color:S2,fontWeight:700,textTransform:"uppercase",marginBottom:3}}>{k}</div>
                      <div style={{fontSize:13,color:S0,fontWeight:500}}>{v}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                <Card>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:12,fontWeight:700,color:S0,marginBottom:12,textTransform:"uppercase"}}>Monthly Recurring</div>
                  <PRow label="📦 Software Modules" val={INR(calc.modC)} sub={`${calc.selM}/${modList.length} selected`}/>
                  <PRow label="📊 Volume Tier Surcharge" val={INR(calc.volSur)} sub={calc.tier.label}/>
                  <PRow label="🖥️ Server & Infrastructure" val={INR(calc.srvT)} sub={`${srv.provider} ${srv.pkg}`}/>
                  <PRow label="🔌 API Integrations" val={INR(calc.apiT)} sub={`${calc.selA} APIs enabled`}/>
                  <PRow label="Monthly Subtotal" val={INR(calc.sub)} bold/>
                  {calc.disc>0&&<PRow label={`🏷️ Annual Discount (${gbl.annualDiscount*100}%)`} val={`–${INR(calc.disc)}`}/>}
                  <div style={{marginTop:12,padding:"12px 14px",background:T2,borderRadius:8,border:`1px solid ${T0}30`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:T1}}>Total Recurring ({cfg.billing})</div>
                      {cfg.billing==="Annual"&&<div style={{fontSize:10,color:T0}}>×12 months with {gbl.annualDiscount*100}% discount</div>}
                    </div>
                    <span style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,color:T0}}>{INR(calc.rec)}</span>
                  </div>
                </Card>
                <Card>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:12,fontWeight:700,color:S0,marginBottom:12,textTransform:"uppercase"}}>One-Time Services</div>
                  <PRow label="💻 Custom Development" val={INR(calc.cdT)}/>
                  <PRow label="🚀 Implementation" val={INR(calc.imT)}/>
                  <PRow label="🎓 Training & Enablement" val={INR(calc.trT)}/>
                  <PRow label="Total Prof. Services" val={INR(calc.ps)} bold/>
                  <div style={{marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[["Effective Monthly",INR(calc.eff)],["Contract",`${cfg.term} Year(s)`]].map(([k,v])=>(
                      <div key={k} style={{background:SF2,borderRadius:8,padding:"10px 12px",border:`1px solid ${B0}`}}>
                        <div style={{fontSize:10,color:S2,textTransform:"uppercase",fontWeight:700,marginBottom:3}}>{k}</div>
                        <div style={{fontFamily:"Syne,sans-serif",fontSize:14,fontWeight:700,color:S0}}>{v}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Grand total banner */}
              <div style={{padding:"24px 32px",background:`linear-gradient(135deg,${T0},#0A6E68)`,borderRadius:14,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,boxShadow:"0 4px 20px rgba(13,148,136,.25)"}}>
                <div>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,color:W}}>💰 GRAND TOTAL</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,.75)",marginTop:4}}>{cfg.billing} Recurring + One-Time Services</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:40,fontWeight:800,color:W,lineHeight:1}}>{INR(calc.grand)}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.7)",marginTop:4}}>Indian Rupees (₹)</div>
                </div>
              </div>

              {/* PDF Options */}
              <div style={{background:SF2,border:`1px solid ${B0}`,borderRadius:10,padding:"14px 18px",marginBottom:14}}>
                <div style={{fontSize:13,fontWeight:600,color:S0,marginBottom:10}}>📄 PDF Export Options</div>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",background:SF,border:`1px solid ${B0}`,borderRadius:8,cursor:"pointer"}}
                    onClick={()=>setIncludeDetails(v=>!v)}>
                    <div style={{width:18,height:18,borderRadius:4,background:includeDetails?T0:SF2,border:`1.5px solid ${includeDetails?T0:B1}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {includeDetails&&<span style={{color:W,fontSize:12,lineHeight:1}}>✓</span>}
                    </div>
                    <span style={{fontSize:13,color:S0,fontWeight:500}}>Include full module & API detail pages</span>
                  </div>
                  <span style={{fontSize:12,color:S2}}>
                    {includeDetails?"PDF will include cover summary + detailed module list":"PDF will include cover summary only (shorter, cleaner)"}
                  </span>
                </div>
              </div>

              {/* Export buttons */}
              <div style={{display:"flex",gap:12}}>
                <button onClick={()=>exportPDF({...exportArgs,includeDetails})} style={{flex:1,padding:"13px",borderRadius:10,border:"none",background:"#DC2626",color:W,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"DM Sans,sans-serif"}}>
                  📄 Download PDF Quote
                </button>
                <button onClick={()=>exportExcel(exportArgs)} style={{flex:1,padding:"13px",borderRadius:10,border:"none",background:"#16A34A",color:W,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"DM Sans,sans-serif"}}>
                  📊 Download Excel Quote
                </button>
                <button onClick={saveQuote} disabled={saving} style={{flex:1,padding:"13px",borderRadius:10,border:"none",background:T0,color:W,fontSize:14,fontWeight:700,cursor:"pointer",opacity:saving?0.6:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"DM Sans,sans-serif"}}>
                  {saving?"Saving…":"💾 Save to History"}
                </button>
              </div>
              {saveMsg&&<div style={{marginTop:10,textAlign:"center",fontSize:13,color:GR,fontWeight:600}}>{saveMsg}</div>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
