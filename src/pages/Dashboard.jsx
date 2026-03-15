import { useState, useMemo } from 'react';
import { supabase, isConfigured } from '../supabase.js';
import { Card, Lbl, STitle, PRow, Tog, TxtInput, SelInput, NumInput, Btn, Badge, T0, T1, G0, G1, W, S200, S300, S400, S500, S600, GR, RD, INR } from '../components/ui.jsx';
import { SEC_META, PROVIDERS, PACKAGES, PKG_SPECS, STOR_OPT } from '../data/defaults.js';
import { calcTotals, getApiSlab } from '../utils/calc.js';
import { exportPDF } from '../utils/exportPDF.js';
import { exportExcel } from '../utils/exportExcel.js';

const N0="#060D18",N1="#0A1525",N2="#0F1F35",N3="#162840",N4="#1E3554";
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

export default function Dashboard({ user, pricing, onAdmin, onHistory, onLogout }) {
  const { gbl, volTiers, apiSlabs, srvPrices, storCost, modList, apiList, cdevRoles, implRoles, trainRoles } = pricing;

  // ── All state at TOP LEVEL — critical for section tab bug fix ─────
  const [tab,       setTab]       = useState("config");
  const [activeSec, setActiveSec] = useState(SECS[0]);  // ← lifted here, never inside a child
  const [modQ,      setModQ]      = useState('');
  const [cfg,       setCfg]       = useState({ company:"", contact:"", email:"", preparedBy: user.full_name||"", billing:"Monthly", orders:1000, term:1 });
  const [mods,      setMods]      = useState(() => { const m={}; modList.forEach(x=>{m[x.id]=!!x.pro;}); return m; });
  const [srv,       setSrv]       = useState({ provider:"AWS", pkg:"Business", storageGB:0, backup:false });
  const [apiState,  setApiState]  = useState(() => apiList.map(()=>({ on:false, p:0, hits:0 })));
  const [cdevSt,    setCdevSt]    = useState(() => cdevRoles.map(()=>({ res:0, days:0 })));
  const [implSt,    setImplSt]    = useState(() => [{ res:1,days:10 },{ res:2,days:20 },{ res:2,days:30 }]);
  const [trnSt,     setTrnSt]     = useState(() => [{ res:2,days:5  },{ res:1,days:10 },{ res:2,days:15 }]);
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState('');
  const [quoteId,   setQuoteId]   = useState(null);

  // ── Live calc ─────────────────────────────────────────────────────
  const calc = useMemo(() => calcTotals({
    cfg, mods, modList, srv, srvPrices, storCost, apiState, apiList, apiSlabs, volTiers, gbl,
    cdevSt, implSt, trnSt, cdevRoles, implRoles, trainRoles, PACKAGES,
  }), [cfg, mods, srv, apiState, cdevSt, implSt, trnSt, pricing]);

  // ── Save quote ────────────────────────────────────────────────────
  async function saveQuote() {
    if (!cfg.company) { alert("Please enter the customer company name first (Configuration tab)."); return; }
    setSaving(true);
    const selMods = modList.filter(m => mods[m.id]);
    const payload = {
      created_by: user.id,
      created_by_email: user.email,
      created_by_name: user.full_name || user.email,
      customer_name: cfg.contact || cfg.company,
      customer_email: cfg.email,
      customer_company: cfg.company,
      grand_total: calc.grand,
      billing_cycle: cfg.billing,
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
      if (quoteId) {
        const idx = all.findIndex(q=>q.id===quoteId);
        if (idx>=0) all[idx]={...all[idx],...payload};
      } else {
        const id = Date.now().toString();
        setQuoteId(id);
        all.unshift({ ...payload, id, created_at: new Date().toISOString() });
      }
      localStorage.setItem('etechcube_quotes', JSON.stringify(all));
    }
    setSaving(false);
    setSaveMsg('✓ Quote saved');
    setTimeout(()=>setSaveMsg(''), 3000);
  }

  // ── Load a quote from history ─────────────────────────────────────
  // (called from parent via prop — handled in App.jsx)

  const exportArgs = { cfg, calc, mods, modList, srv, apiState, apiList, cdevSt, implSt, trnSt, cdevRoles, implRoles, trainRoles, PACKAGES };

  // ── Modules helpers ───────────────────────────────────────────────
  const setAll = (sec, v) => setMods(p => { const n={...p}; modList.filter(m=>m.sec===sec).forEach(m=>{n[m.id]=v;}); return n; });
  const shownMods = modQ ? modList.filter(m=>m.name.toLowerCase().includes(modQ.toLowerCase())) : modList.filter(m=>m.sec===activeSec);

  // ── API cats ──────────────────────────────────────────────────────
  const apiCats = [...new Set(apiList.map(a=>a.cat))];

  return (
    <div style={{minHeight:"100vh",background:N0}}>
      {/* TOP BAR */}
      <div style={{background:N1,borderBottom:`1px solid ${N4}`,height:58,padding:"0 16px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${T0},#0A6E68)`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:17,color:W}}>e</div>
          <div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:15,fontWeight:800,color:W,lineHeight:1.1}}>eTechCube</div>
            <div style={{fontSize:9,color:T1,letterSpacing:"0.08em",textTransform:"uppercase"}}>Logistics Cube Pricing</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {[{l:"Modules",v:INR(calc.modC)},{l:"Server+APIs",v:INR(calc.srvT+calc.apiT)},{l:"Services",v:INR(calc.ps)}].map(x=>(
            <div key={x.l} style={{textAlign:"center",padding:"4px 10px",background:N2,borderRadius:7,border:`1px solid ${N4}`}}>
              <div style={{fontSize:9,color:S500,textTransform:"uppercase",fontWeight:700}}>{x.l}</div>
              <div style={{fontFamily:"Syne,sans-serif",fontSize:12,fontWeight:700,color:S200}}>{x.v}</div>
            </div>
          ))}
          <div onClick={()=>setTab("summary")} style={{padding:"5px 12px",background:`${G0}15`,borderRadius:8,
            border:`1px solid ${G0}40`,textAlign:"right",cursor:"pointer"}}>
            <div style={{fontSize:9,color:G1,textTransform:"uppercase",fontWeight:700}}>Grand Total</div>
            <div style={{fontFamily:"Syne,sans-serif",fontSize:17,fontWeight:800,color:G0}}>{INR(calc.grand)}</div>
          </div>
          <div style={{width:1,height:32,background:N4,margin:"0 4px"}}/>
          <button onClick={onHistory} style={{padding:"6px 12px",borderRadius:8,background:N3,
            border:`1px solid ${N4}`,color:S300,fontSize:12,cursor:"pointer"}}>📚 History</button>
          {user.role==='admin' && (
            <button onClick={onAdmin} style={{padding:"6px 12px",borderRadius:8,background:`${G0}20`,
              border:`1px solid ${G0}40`,color:G0,fontSize:12,fontWeight:600,cursor:"pointer"}}>🛡️ Admin</button>
          )}
          <div style={{fontSize:12,color:S400,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {user.full_name||user.email}
          </div>
          <button onClick={onLogout} style={{padding:"6px 10px",borderRadius:8,background:"transparent",
            border:`1px solid ${N4}`,color:S500,fontSize:11,cursor:"pointer"}}>Sign Out</button>
        </div>
      </div>

      <div style={{display:"flex",maxWidth:1320,margin:"0 auto"}}>
        {/* SIDEBAR */}
        <div style={{width:188,flexShrink:0,padding:"14px 10px",position:"sticky",
          top:58,height:"calc(100vh - 58px)",overflowY:"auto",borderRight:`1px solid ${N4}30`}}>
          {TABS.map(t=>(
            <div key={t.id} onClick={()=>setTab(t.id)}
              style={{display:"flex",alignItems:"center",gap:8,padding:"9px 11px",
                borderRadius:8,marginBottom:3,cursor:"pointer",
                background:tab===t.id?`${T0}22`:"transparent",
                border:`1px solid ${tab===t.id?T0+"55":"transparent"}`,transition:"all .13s"}}>
              <span style={{fontSize:14}}>{t.icon}</span>
              <span style={{fontSize:12,fontWeight:tab===t.id?600:400,color:tab===t.id?T1:S400}}>{t.label}</span>
            </div>
          ))}
          {/* Mini breakdown */}
          <div style={{marginTop:18,padding:12,background:N2,borderRadius:10,border:`1px solid ${N4}`}}>
            <div style={{fontSize:9,color:S600,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>
              Live Breakdown
            </div>
            {[["Modules",calc.modC],["Vol. Sur.",calc.volSur],["Server",calc.srvT],
              ["APIs",calc.apiT],["Prof. Svcs",calc.ps]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:11,color:S500,marginBottom:3}}>
                <span>{l}</span><span style={{color:S300,fontWeight:600}}>{INR(v)}</span>
              </div>
            ))}
            <div style={{borderTop:`1px solid ${N4}`,paddingTop:7,marginTop:5,
              display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:11,color:S300,fontWeight:600}}>Total</span>
              <span style={{fontFamily:"Syne,sans-serif",fontSize:13,fontWeight:800,color:G0}}>{INR(calc.grand)}</span>
            </div>
          </div>
          {/* Save button in sidebar */}
          <button onClick={saveQuote} disabled={saving}
            style={{width:"100%",marginTop:12,padding:"9px",borderRadius:8,background:T0,border:"none",
              color:W,fontSize:12,fontWeight:700,cursor:"pointer",opacity:saving?0.6:1}}>
            {saving?"Saving…":"💾 Save Quote"}
          </button>
          {saveMsg && <div style={{fontSize:11,color:GR,textAlign:"center",marginTop:6}}>{saveMsg}</div>}
          {quoteId && <div style={{fontSize:10,color:S600,textAlign:"center",marginTop:3}}>Quote ID saved ✓</div>}
        </div>

        {/* MAIN CONTENT */}
        <div style={{flex:1,padding:"22px 26px",overflowY:"auto",minHeight:"calc(100vh - 58px)"}}>

          {/* ════ CONFIG ════ */}
          {tab==="config" && (
            <div className="fade-in">
              <STitle icon="⚙️" title="Configuration" sub="Set client details, billing cycle and order volume. All totals update live."/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                {[["Company Name","company","Client Co. Pvt. Ltd."],["Contact Person","contact","Name"],
                  ["Contact Email","email","email@company.com"],["Prepared By","preparedBy","Sales Team"]].map(([l,k,ph])=>(
                  <Card key={k}><Lbl>{l}</Lbl>
                    <TxtInput val={cfg[k]} set={v=>setCfg(p=>({...p,[k]:v}))} ph={ph}/>
                  </Card>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                <Card><Lbl>Billing Cycle</Lbl>
                  <SelInput val={cfg.billing} set={v=>setCfg(p=>({...p,billing:v}))} opts={["Monthly","Annual"]}/>
                  {cfg.billing==="Annual"&&<div style={{marginTop:8,padding:"6px 10px",background:`${GR}20`,
                    borderRadius:6,fontSize:12,color:GR,border:`1px solid ${GR}40`}}>✓ {gbl.annualDiscount*100}% annual discount applied</div>}
                </Card>
                <Card><Lbl>Monthly Order Volume</Lbl>
                  <TxtInput val={cfg.orders} set={v=>setCfg(p=>({...p,orders:+v}))} type="number" ph="1000"/>
                  <div style={{marginTop:7,fontSize:12,color:T1}}>Tier: <strong>{calc.tier.label}</strong>
                    {calc.volSur>0&&<span style={{color:S400}}> · +{INR(calc.volSur)}/mo</span>}</div>
                </Card>
                <Card><Lbl>Contract Term</Lbl>
                  <SelInput val={String(cfg.term)} set={v=>setCfg(p=>({...p,term:+v}))} opts={["1","2","3"]}/>
                </Card>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:18}}>
                {[{l:"Modules",v:INR(calc.modC),c:T0},{l:"Server+APIs",v:INR(calc.srvT+calc.apiT),c:"#A78BFA"},
                  {l:"Monthly Subtotal",v:INR(calc.sub),c:T1},{l:"Grand Total",v:INR(calc.grand),c:G0}].map(x=>(
                  <div key={x.l} style={{background:N1,borderRadius:10,padding:"13px 15px",
                    borderTop:`2px solid ${x.c}`,border:`1px solid ${x.c}25`,borderTopColor:x.c}}>
                    <div style={{fontSize:10,color:S500,textTransform:"uppercase",fontWeight:700}}>{x.l}</div>
                    <div style={{fontFamily:"Syne,sans-serif",fontSize:17,fontWeight:800,color:x.c,marginTop:3}}>{x.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ MODULES — activeSec is from parent state, NOT local ════ */}
          {tab==="modules" && (
            <div className="fade-in">
              <STitle icon="📦" title="Software Modules"
                sub={`${calc.selM} of ${modList.length} selected · ${INR(calc.modC)}/mo`}/>
              <div style={{display:"flex",gap:14}}>
                {/* Section nav */}
                <div style={{width:172,flexShrink:0}}>
                  <input value={modQ} onChange={e=>setModQ(e.target.value)} placeholder="🔍 Search…"
                    style={{width:"100%",background:N3,border:`1px solid ${N4}`,borderRadius:7,
                      color:W,padding:"7px 10px",fontSize:12,outline:"none",marginBottom:8}}/>
                  {SECS.map(sec=>{
                    const meta=SEC_META[sec]||{accent:T0,color:N2,icon:"•"};
                    const on=modList.filter(x=>x.sec===sec&&mods[x.id]).length;
                    const tot=modList.filter(x=>x.sec===sec).length;
                    return (
                      <div key={sec} onClick={()=>{setActiveSec(sec);setModQ("");}}
                        style={{padding:"8px 10px",borderRadius:8,cursor:"pointer",marginBottom:3,
                          background:activeSec===sec&&!modQ?meta.color:N1,
                          border:`1px solid ${activeSec===sec&&!modQ?meta.accent+"60":"transparent"}`,
                          transition:"all .13s"}}>
                        <div style={{fontSize:11,fontWeight:600,color:activeSec===sec&&!modQ?meta.accent:S400}}>
                          {meta.icon} {sec}
                        </div>
                        <div style={{fontSize:10,color:S600,marginTop:1}}>{on}/{tot} active</div>
                      </div>
                    );
                  })}
                </div>
                {/* Module list */}
                <div style={{flex:1}}>
                  {!modQ&&(
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <span style={{fontFamily:"Syne,sans-serif",fontSize:14,fontWeight:700,
                        color:(SEC_META[activeSec]||{}).accent||T1}}>{activeSec}</span>
                      <div style={{display:"flex",gap:6}}>
                        {["Select All","Clear All"].map((lbl,i)=>(
                          <button key={lbl} onClick={()=>setAll(activeSec,!i)}
                            style={{fontSize:11,padding:"4px 11px",borderRadius:6,cursor:"pointer",
                              background:i?N3:T0,border:i?`1px solid ${N4}`:"none",color:W}}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {shownMods.map(m=>{
                      const meta=SEC_META[m.sec]||{accent:T0,color:N2};
                      const on=mods[m.id];
                      return (
                        <div key={m.id} className="mod-row"
                          onClick={()=>setMods(p=>({...p,[m.id]:!p[m.id]}))}
                          style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,
                            background:on?meta.color:N1,border:`1px solid ${on?meta.accent+"50":N4}`}}>
                          <Tog on={on} set={()=>{}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:500,color:on?W:S300,
                              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.name}</div>
                            <div style={{fontSize:10,color:S600}}>{m.desc}</div>
                          </div>
                          <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                            {m.ess?<Badge color={T0}>Essential</Badge>:!m.pro?<Badge color={G0}>Premium</Badge>:null}
                            <span style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:12,
                              color:on?G0:S500,minWidth:70,textAlign:"right"}}>{INR(m.price)}/mo</span>
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
          {tab==="server" && (
            <div className="fade-in">
              <STitle icon="🖥️" title="Server & Infrastructure" sub="Choose provider, package and add-ons."/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                <Card>
                  <Lbl>Cloud Provider</Lbl>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
                    {PROVIDERS.map(p=>(
                      <div key={p} className="chip" onClick={()=>setSrv(s=>({...s,provider:p}))}
                        style={{padding:"9px 6px",borderRadius:8,textAlign:"center",
                          background:srv.provider===p?`${T0}25`:N3,border:`1px solid ${srv.provider===p?T0:N4}`,
                          fontSize:12,fontWeight:600,color:srv.provider===p?T1:S400}}>
                        {p}
                      </div>
                    ))}
                  </div>
                </Card>
                <Card>
                  <Lbl>Server Package</Lbl>
                  {PACKAGES.map((pkg,i)=>(
                    <div key={pkg} className="chip" onClick={()=>setSrv(s=>({...s,pkg}))}
                      style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                        padding:"8px 10px",borderRadius:7,marginBottom:4,
                        background:srv.pkg===pkg?`${T0}20`:"transparent",border:`1px solid ${srv.pkg===pkg?T0:N4}`}}>
                      <div>
                        <span style={{fontSize:12,fontWeight:600,color:srv.pkg===pkg?T1:S300}}>{pkg}</span>
                        <span style={{fontSize:10,color:S600,marginLeft:7}}>{PKG_SPECS[i]}</span>
                      </div>
                      <span style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:12,color:srv.pkg===pkg?G0:S500}}>
                        {INR((srvPrices[srv.provider]||[])[i]||0)}/mo
                      </span>
                    </div>
                  ))}
                </Card>
                <Card>
                  <Lbl>Additional Storage</Lbl>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
                    {STOR_OPT.map(gb=>(
                      <div key={gb} className="chip" onClick={()=>setSrv(s=>({...s,storageGB:gb}))}
                        style={{padding:"8px 4px",borderRadius:7,textAlign:"center",
                          background:srv.storageGB===gb?`${T0}25`:N3,border:`1px solid ${srv.storageGB===gb?T0:N4}`,
                          fontSize:11,fontWeight:600,color:srv.storageGB===gb?T1:S400}}>
                        {gb===0?"None":`${gb}GB`}
                        {gb>0&&<div style={{fontSize:9,color:S600}}>+{INR((storCost[srv.provider]||0)*gb/100)}</div>}
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:8,fontSize:11,color:S500}}>{srv.provider} SSD: ₹{storCost[srv.provider]||0}/100GB/mo</div>
                </Card>
                <Card>
                  <Lbl>Managed Backup</Lbl>
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0"}}>
                    <Tog on={srv.backup} set={v=>setSrv(s=>({...s,backup:v}))}/>
                    <div>
                      <div style={{fontSize:13,color:S200}}>Enable Managed Backup</div>
                      <div style={{fontSize:11,color:S500}}>+{gbl.backupPct*100}% of server base cost</div>
                    </div>
                  </div>
                  <div style={{borderTop:`1px solid ${N4}`,paddingTop:10,marginTop:4}}>
                    <PRow label="Base Package" val={INR((srvPrices[srv.provider]||[])[PACKAGES.indexOf(srv.pkg)]||0)}/>
                    <PRow label="Storage Add-on" val={INR((storCost[srv.provider]||0)*(srv.storageGB/100))}/>
                    <PRow label="Backup Add-on"  val={INR(srv.backup?((srvPrices[srv.provider]||[])[PACKAGES.indexOf(srv.pkg)]||0)*gbl.backupPct:0)}/>
                    <PRow label="Total Server"   val={INR(calc.srvT)} bold accent/>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ════ APIS ════ */}
          {tab==="apis" && (
            <div className="fade-in">
              <STitle icon="🔌" title="API Integrations"
                sub={`First ${gbl.freeApiHits} hits/mo always free per service.`}/>
              <Card style={{marginBottom:14,background:N1}}>
                <div style={{fontSize:10,fontWeight:700,color:S500,textTransform:"uppercase",marginBottom:8}}>
                  Volume Surcharge Slabs
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {apiSlabs.map(s=>(
                    <span key={s.label} className="pill" style={{background:s.surcharge===0?`${GR}15`:`${G0}12`,
                      color:s.surcharge===0?GR:G0,border:`1px solid ${s.surcharge===0?GR:G0}35`}}>
                      {s.label}: {s.surcharge===0?"FREE":`+${INR(s.surcharge)}/mo`}
                    </span>
                  ))}
                </div>
              </Card>
              {apiCats.map(cat=>(
                <div key={cat} style={{marginBottom:18}}>
                  <div style={{fontSize:10,fontWeight:700,color:T1,textTransform:"uppercase",letterSpacing:"0.1em",
                    marginBottom:7,paddingLeft:10,borderLeft:`2px solid ${T0}`}}>{cat}</div>
                  {apiList.map((api,i)=>{
                    if(api.cat!==cat) return null;
                    const a=apiState[i];
                    const slab=getApiSlab(a.hits,apiSlabs,gbl.freeApiHits);
                    const base=api.p[a.p][1];
                    const tot=a.on?base+slab.surcharge:0;
                    return (
                      <div key={api.name} className="hover-row"
                        style={{display:"grid",gridTemplateColumns:"auto 1fr auto auto auto auto",
                          alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,marginBottom:5,
                          background:a.on?N3:N1,border:`1px solid ${a.on?T0+"50":N4}`}}>
                        <Tog on={a.on} set={v=>setApiState(p=>{const n=[...p];n[i]={...n[i],on:v};return n;})}/>
                        <div style={{fontSize:12,fontWeight:500,color:a.on?W:S400,
                          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{api.name}</div>
                        <select value={a.p}
                          onChange={e=>setApiState(p=>{const n=[...p];n[i]={...n[i],p:+e.target.value};return n;})}
                          disabled={!a.on}
                          style={{background:N2,border:`1px solid ${N4}`,borderRadius:6,color:W,
                            padding:"5px 7px",fontSize:11,outline:"none",opacity:a.on?1:0.4,maxWidth:170}}>
                          {api.p.map(([name,price],pi)=>(
                            <option key={pi} value={pi}>P{pi+1}: {name} ({price===0?"Free":INR(price)})</option>
                          ))}
                        </select>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <NumInput val={a.hits} set={v=>setApiState(p=>{const n=[...p];n[i]={...n[i],hits:v};return n;})}/>
                          <span style={{fontSize:10,color:S600}}>hits</span>
                        </div>
                        <span className="pill" style={{background:slab.surcharge===0?`${GR}15`:`${G0}15`,
                          color:slab.surcharge===0?GR:G0,border:`1px solid ${slab.surcharge===0?GR:G0}40`}}>
                          {slab.label}
                        </span>
                        <span style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:12,
                          color:a.on&&tot>0?G0:S600,minWidth:80,textAlign:"right"}}>
                          {a.on?INR(tot):"—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
              <Card><PRow label="Total API Cost" val={INR(calc.apiT)} bold accent/></Card>
            </div>
          )}

          {/* ════ PS TABS (Dev / Impl / Train) ════ */}
          {(tab==="dev"||tab==="impl"||tab==="train") && (() => {
            const cfg2 = {
              dev:  {icon:"💻",title:"Custom Development",  sub:"One-time cost. Adjust resources and days per role.",roles:cdevRoles,st:cdevSt,setSt:setCdevSt,total:calc.cdT,tip:"Typical: 1 TL + 2 Senior + 3 Mid + 1 PM + 1 QA × 90 days"},
              impl: {icon:"🚀",title:"Implementation",      sub:"Expert-led kickoff, config, migration and go-live.",roles:implRoles,st:implSt,setSt:setImplSt,total:calc.imT},
              train:{icon:"🎓",title:"Training & Enablement",sub:"End-user, train-the-trainer and e-learning content.",roles:trainRoles,st:trnSt,setSt:setTrnSt,total:calc.trT},
            }[tab];
            return (
              <div className="fade-in">
                <STitle icon={cfg2.icon} title={cfg2.title} sub={cfg2.sub}/>
                <Card>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1.2fr",gap:8,
                    paddingBottom:10,marginBottom:6,borderBottom:`1px solid ${N4}`}}>
                    {["Role","Resources","Days","Day Rate","Total"].map(h=>(
                      <div key={h} style={{fontSize:10,fontWeight:700,color:S500,textTransform:"uppercase",letterSpacing:"0.06em"}}>{h}</div>
                    ))}
                  </div>
                  {cfg2.roles.map((r,i)=>(
                    <div key={r.role} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1.2fr",
                      gap:8,alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${N4}20`}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:500,color:S200}}>{r.role}</div>
                        <div style={{fontSize:10,color:S600}}>{r.note}</div>
                      </div>
                      <NumInput val={cfg2.st[i]?.res||0} set={v=>cfg2.setSt(p=>{const n=[...p];n[i]={...n[i],res:v};return n;})}/>
                      <NumInput val={cfg2.st[i]?.days||0} set={v=>cfg2.setSt(p=>{const n=[...p];n[i]={...n[i],days:v};return n;})}/>
                      <span style={{fontFamily:"Syne,sans-serif",fontSize:12,color:S400}}>{INR(r.rate)}</span>
                      <span style={{fontFamily:"Syne,sans-serif",fontSize:14,fontWeight:700,color:G0}}>
                        {INR(r.rate*(cfg2.st[i]?.res||0)*(cfg2.st[i]?.days||0))}
                      </span>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:13,marginTop:5}}>
                    <span style={{fontSize:13,fontWeight:600,color:S200}}>Total (one-time)</span>
                    <span style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,color:G0}}>{INR(cfg2.total)}</span>
                  </div>
                </Card>
                {cfg2.tip&&<div style={{marginTop:12,padding:"9px 13px",background:`${G0}12`,borderRadius:8,
                  border:`1px solid ${G0}30`,fontSize:11,color:S400}}>💡 {cfg2.tip}</div>}
              </div>
            );
          })()}

          {/* ════ SUMMARY ════ */}
          {tab==="summary" && (
            <div className="fade-in">
              <STitle icon="📋" title="Quote Summary" sub="Complete breakdown. Download as PDF or Excel for client handover."/>
              <Card style={{marginBottom:14,background:N1}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                  {[["Company",cfg.company||"—"],["Contact",cfg.contact||"—"],["Email",cfg.email||"—"],
                    ["Billing",cfg.billing],["Orders/mo",cfg.orders.toLocaleString("en-IN")],
                    ["Prepared By",cfg.preparedBy||"—"]].map(([k,v])=>(
                    <div key={k}>
                      <div style={{fontSize:10,color:S600,fontWeight:700,textTransform:"uppercase"}}>{k}</div>
                      <div style={{fontSize:13,color:S200,marginTop:2,fontWeight:500}}>{v}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                <Card>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:12,fontWeight:700,color:T1,marginBottom:10,textTransform:"uppercase"}}>
                    Monthly Recurring
                  </div>
                  <PRow label="📦 Software Modules"        val={INR(calc.modC)} sub={`${calc.selM}/${modList.length} selected`}/>
                  <PRow label="📊 Volume Tier Surcharge"   val={INR(calc.volSur)} sub={calc.tier.label}/>
                  <PRow label="🖥️ Server & Infrastructure" val={INR(calc.srvT)} sub={`${srv.provider} ${srv.pkg}`}/>
                  <PRow label="🔌 API Integrations"        val={INR(calc.apiT)} sub={`${calc.selA} APIs enabled`}/>
                  <PRow label="Monthly Subtotal"            val={INR(calc.sub)} bold/>
                  {calc.disc>0&&<PRow label={`🏷️ Annual Discount (${gbl.annualDiscount*100}%)`} val={`–${INR(calc.disc)}`}/>}
                  <div style={{marginTop:12,padding:"11px 14px",background:`${T0}18`,borderRadius:8,
                    border:`1px solid ${T0}45`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:W}}>Total Recurring ({cfg.billing})</div>
                      {cfg.billing==="Annual"&&<div style={{fontSize:10,color:T1}}>×12 months with {gbl.annualDiscount*100}% discount</div>}
                    </div>
                    <span style={{fontFamily:"Syne,sans-serif",fontSize:19,fontWeight:800,color:T1}}>{INR(calc.rec)}</span>
                  </div>
                </Card>
                <Card>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:12,fontWeight:700,color:T1,marginBottom:10,textTransform:"uppercase"}}>
                    One-Time Services
                  </div>
                  <PRow label="💻 Custom Development"   val={INR(calc.cdT)}/>
                  <PRow label="🚀 Implementation"        val={INR(calc.imT)}/>
                  <PRow label="🎓 Training & Enablement" val={INR(calc.trT)}/>
                  <PRow label="Total Prof. Services"    val={INR(calc.ps)} bold/>
                  <div style={{marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[["Effective Monthly",INR(calc.eff)],["Contract",`${cfg.term} Year(s)`]].map(([k,v])=>(
                      <div key={k} style={{background:N1,borderRadius:8,padding:"9px 11px",border:`1px solid ${N4}`}}>
                        <div style={{fontSize:10,color:S600,textTransform:"uppercase",fontWeight:700}}>{k}</div>
                        <div style={{fontFamily:"Syne,sans-serif",fontSize:14,fontWeight:700,color:S200,marginTop:2}}>{v}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Grand total */}
              <div style={{padding:"22px 28px",background:`linear-gradient(135deg,${N1},${N2})`,
                borderRadius:14,border:`1.5px solid ${G0}45`,display:"flex",justifyContent:"space-between",
                alignItems:"center",boxShadow:`0 0 40px ${G0}10`,marginBottom:16}}>
                <div>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,color:W}}>💰 GRAND TOTAL</div>
                  <div style={{fontSize:12,color:S500,marginTop:3}}>{cfg.billing} Recurring + One-Time Services</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:38,fontWeight:800,color:G0,lineHeight:1}}>
                    {INR(calc.grand)}
                  </div>
                  <div style={{fontSize:11,color:S600,marginTop:3}}>Indian Rupees (₹)</div>
                </div>
              </div>

              {/* Export buttons */}
              <div style={{display:"flex",gap:12}}>
                <button onClick={()=>exportPDF(exportArgs)}
                  style={{flex:1,padding:"13px",borderRadius:10,border:"none",
                    background:`linear-gradient(135deg,#DC2626,#991B1B)`,color:W,
                    fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",
                    justifyContent:"center",gap:8}}>
                  📄 Download PDF Quote
                </button>
                <button onClick={()=>exportExcel(exportArgs)}
                  style={{flex:1,padding:"13px",borderRadius:10,border:"none",
                    background:`linear-gradient(135deg,#16A34A,#166534)`,color:W,
                    fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",
                    justifyContent:"center",gap:8}}>
                  📊 Download Excel Quote
                </button>
                <button onClick={saveQuote} disabled={saving}
                  style={{flex:1,padding:"13px",borderRadius:10,border:"none",
                    background:`linear-gradient(135deg,${T0},#0A6E68)`,color:W,
                    fontSize:14,fontWeight:700,cursor:"pointer",opacity:saving?0.6:1,
                    display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {saving?"Saving…":"💾 Save to History"}
                </button>
              </div>
              {saveMsg&&<div style={{marginTop:10,textAlign:"center",fontSize:13,color:GR}}>{saveMsg}</div>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
