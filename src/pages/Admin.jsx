import { useState } from 'react';
import { supabase, isConfigured } from '../supabase.js';
import { Card, Lbl, STitle, TxtInput, NumInput, Btn, T0, T1, G0, W, S200, S300, S400, S500, S600, GR, RD, INR } from '../components/ui.jsx';
import { PROVIDERS, PACKAGES } from '../data/defaults.js';

const N0="#060D18",N1="#0A1525",N2="#0F1F35",N3="#162840",N4="#1E3554";

const ADMIN_TABS = ['Global','Modules','Server','Volume Tiers','API Slabs','Rate Card'];

export default function AdminPanel({ pricing, setPricing, onBack }) {
  const [aTab,   setATab]   = useState('Global');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [modQ,   setModQ]   = useState('');

  async function saveAll() {
    setSaving(true);
    if (isConfigured) {
      await supabase.from('pricing_config').upsert({ id:1, config: pricing, updated_at: new Date().toISOString() });
    } else {
      localStorage.setItem('etechcube_pricing', JSON.stringify(pricing));
    }
    setSaving(false); setSaved(true);
    setTimeout(()=>setSaved(false), 3000);
  }

  const updateGbl  = (k,v) => setPricing(p=>({...p, gbl:{...p.gbl,[k]:v}}));
  const updateVolT = (i,k,v) => setPricing(p=>{ const t=[...p.volTiers]; t[i]={...t[i],[k]:+v}; return {...p,volTiers:t}; });
  const updateApiSl= (i,k,v) => setPricing(p=>{ const t=[...p.apiSlabs]; t[i]={...t[i],[k]:+v}; return {...p,apiSlabs:t}; });
  const updateMod  = (i,k,v) => setPricing(p=>{ const t=[...p.modList]; t[i]={...t[i],[k]:k==='price'?+v:v}; return {...p,modList:t}; });
  const updateSrv  = (prov,pi,v) => setPricing(p=>{ const sp={...p.srvPrices,[prov]:[...p.srvPrices[prov]]};sp[prov][pi]=+v;return{...p,srvPrices:sp};});
  const updateStor = (prov,v) => setPricing(p=>({...p,storCost:{...p.storCost,[prov]:+v}}));
  const updateRole = (cat,i,k,v) => setPricing(p=>{ const arr=[...p[cat]]; arr[i]={...arr[i],[k]:k==='rate'?+v:v}; return {...p,[cat]:arr}; });

  const fldStyle = {background:N3,border:`1px solid ${N4}`,borderRadius:7,color:W,
    padding:"6px 10px",fontSize:13,outline:"none",width:"100%"};
  const numFld = {background:N3,border:`1px solid ${N4}`,borderRadius:7,color:W,
    padding:"6px 8px",fontSize:13,outline:"none",textAlign:"right"};

  const filteredMods = pricing.modList.filter(m =>
    !modQ || m.name.toLowerCase().includes(modQ.toLowerCase()) || m.sec.toLowerCase().includes(modQ.toLowerCase())
  );

  return (
    <div style={{minHeight:"100vh",background:N0,padding:"0"}}>
      {/* Admin topbar */}
      <div style={{background:N1,borderBottom:`1px solid ${N4}`,height:58,padding:"0 20px",
        display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{background:N3,border:`1px solid ${N4}`,borderRadius:8,
            color:S300,padding:"6px 12px",fontSize:12,cursor:"pointer"}}>← Back</button>
          <div style={{fontFamily:"Syne, sans-serif",fontSize:15,fontWeight:800,color:W}}>
            🛡️ Admin – Price Editor
          </div>
          <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:`${G0}20`,
            color:G0,border:`1px solid ${G0}40`,fontWeight:600}}>ADMIN ONLY</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {saved && <span style={{fontSize:12,color:GR}}>✓ Saved successfully</span>}
          <Btn onClick={saveAll} style={{background:G0,opacity:saving?0.6:1}}>
            {saving ? 'Saving…' : '💾 Save All Changes'}
          </Btn>
        </div>
      </div>

      <div style={{display:"flex",maxWidth:1280,margin:"0 auto"}}>
        {/* Admin sidebar */}
        <div style={{width:180,flexShrink:0,padding:"16px 10px",position:"sticky",
          top:58,height:"calc(100vh - 58px)",overflowY:"auto",borderRight:`1px solid ${N4}30`}}>
          {ADMIN_TABS.map(t=>(
            <div key={t} onClick={()=>setATab(t)}
              style={{padding:"9px 12px",borderRadius:8,marginBottom:3,cursor:"pointer",
                background:aTab===t?`${T0}22`:"transparent",
                border:`1px solid ${aTab===t?T0+"55":"transparent"}`,
                fontSize:13,fontWeight:aTab===t?600:400,color:aTab===t?T1:S400}}>
              {t}
            </div>
          ))}
        </div>

        <div style={{flex:1,padding:"24px 28px",overflowY:"auto"}}>

          {/* ── GLOBAL SETTINGS ── */}
          {aTab==='Global' && (
            <div>
              <STitle icon="⚙️" title="Global Settings" sub="These values apply across all calculations."/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                {[
                  {label:"Annual Billing Discount",key:"annualDiscount",note:"e.g. 0.15 = 15%",mul:100,suffix:"%"},
                  {label:"Managed Backup Add-on",key:"backupPct",note:"e.g. 0.20 = 20% of server cost",mul:100,suffix:"%"},
                  {label:"Free API Hits / Month",key:"freeApiHits",note:"Per API service",mul:1,suffix:" hits"},
                ].map(f=>(
                  <Card key={f.key}>
                    <Lbl>{f.label}</Lbl>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <input type="number" value={Math.round(pricing.gbl[f.key]*f.mul)}
                        onChange={e=>updateGbl(f.key,+e.target.value/f.mul)}
                        style={{...numFld,width:100}}/>
                      <span style={{fontSize:13,color:S400}}>{f.suffix}</span>
                    </div>
                    <div style={{fontSize:11,color:S500,marginTop:6}}>{f.note}</div>
                    <div style={{fontSize:12,color:T1,marginTop:4}}>
                      Current: <strong>{pricing.gbl[f.key]*f.mul}{f.suffix}</strong>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ── MODULE PRICES ── */}
          {aTab==='Modules' && (
            <div>
              <STitle icon="📦" title="Module Price Editor" sub="Edit name and monthly price for each of the 110 modules."/>
              <input value={modQ} onChange={e=>setModQ(e.target.value)} placeholder="🔍 Search modules…"
                style={{...fldStyle,marginBottom:16,padding:"9px 12px"}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,
                marginBottom:8,padding:"6px 10px"}}>
                <span style={{fontSize:10,fontWeight:700,color:S500,textTransform:"uppercase"}}>Module Name</span>
                <span style={{fontSize:10,fontWeight:700,color:S500,textTransform:"uppercase"}}>Section</span>
                <span style={{fontSize:10,fontWeight:700,color:S500,textTransform:"uppercase",textAlign:"right"}}>Price (₹/mo)</span>
              </div>
              {filteredMods.map((m,_i)=>{
                const i = pricing.modList.findIndex(x=>x.id===m.id);
                return (
                  <div key={m.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,
                    alignItems:"center",padding:"7px 10px",borderRadius:8,marginBottom:4,
                    background:N2,border:`1px solid ${N4}`}}>
                    <input value={m.name} onChange={e=>updateMod(i,'name',e.target.value)}
                      style={{...fldStyle,fontSize:12}}/>
                    <span style={{fontSize:11,color:S400}}>{m.sec}</span>
                    <input type="number" value={m.price} onChange={e=>updateMod(i,'price',e.target.value)}
                      style={{...numFld}}/>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SERVER PRICES ── */}
          {aTab==='Server' && (
            <div>
              <STitle icon="🖥️" title="Server & Storage Pricing" sub="Edit base price per provider/package, and storage cost per 100GB."/>
              <Card style={{marginBottom:16}}>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:13,fontWeight:700,color:T1,marginBottom:12}}>
                  Package Prices (₹/mo)
                </div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr>
                        <th style={{textAlign:"left",padding:"6px 8px",color:S500,fontWeight:700}}>Provider</th>
                        {PACKAGES.map(p=>(
                          <th key={p} style={{padding:"6px 8px",color:S400,fontWeight:600,textAlign:"right"}}>{p}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PROVIDERS.map(prov=>(
                        <tr key={prov}>
                          <td style={{padding:"6px 8px",color:T1,fontWeight:600}}>{prov}</td>
                          {(pricing.srvPrices[prov]||[]).map((price,pi)=>(
                            <td key={pi} style={{padding:"4px 6px"}}>
                              <input type="number" value={price}
                                onChange={e=>updateSrv(prov,pi,e.target.value)}
                                style={{...numFld,width:90}}/>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              <Card>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:13,fontWeight:700,color:T1,marginBottom:12}}>
                  Storage Cost per 100 GB/mo (₹)
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {PROVIDERS.map(prov=>(
                    <div key={prov}>
                      <Lbl>{prov}</Lbl>
                      <input type="number" value={pricing.storCost[prov]||0}
                        onChange={e=>updateStor(prov,e.target.value)}
                        style={{...numFld,width:"100%"}}/>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ── VOLUME TIERS ── */}
          {aTab==='Volume Tiers' && (
            <div>
              <STitle icon="📊" title="Volume Tier Surcharges" sub="Monthly surcharge based on order volume. Applied on top of recurring cost."/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:7,
                padding:"6px 10px",marginBottom:6}}>
                {['Tier Label','Min Orders','Max Orders','Surcharge (₹/mo)'].map(h=>(
                  <span key={h} style={{fontSize:10,fontWeight:700,color:S500,textTransform:"uppercase"}}>{h}</span>
                ))}
              </div>
              {pricing.volTiers.map((t,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:7,
                  alignItems:"center",padding:"8px 10px",borderRadius:8,marginBottom:5,
                  background:N2,border:`1px solid ${N4}`}}>
                  <input value={t.label} onChange={e=>updateVolT(i,'label',e.target.value)} style={{...fldStyle,fontSize:12}}/>
                  <input type="number" value={t.min} onChange={e=>updateVolT(i,'min',e.target.value)} style={numFld}/>
                  <input type="number" value={t.max} onChange={e=>updateVolT(i,'max',e.target.value)} style={numFld}/>
                  <input type="number" value={t.surcharge} onChange={e=>updateVolT(i,'surcharge',e.target.value)} style={numFld}/>
                </div>
              ))}
            </div>
          )}

          {/* ── API SLABS ── */}
          {aTab==='API Slabs' && (
            <div>
              <STitle icon="🔌" title="API Volume Slab Surcharges" sub="Surcharge added per API based on monthly hit volume."/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:7,
                padding:"6px 10px",marginBottom:6}}>
                {['Slab Label','From (hits)','To (hits)','Surcharge (₹/mo)'].map(h=>(
                  <span key={h} style={{fontSize:10,fontWeight:700,color:S500,textTransform:"uppercase"}}>{h}</span>
                ))}
              </div>
              {pricing.apiSlabs.map((s,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:7,
                  alignItems:"center",padding:"8px 10px",borderRadius:8,marginBottom:5,
                  background:N2,border:`1px solid ${N4}`}}>
                  <input value={s.label} onChange={e=>updateApiSl(i,'label',e.target.value)} style={{...fldStyle,fontSize:12}}/>
                  <input type="number" value={s.from} onChange={e=>updateApiSl(i,'from',e.target.value)} style={numFld}/>
                  <input type="number" value={s.to} onChange={e=>updateApiSl(i,'to',e.target.value)} style={numFld}/>
                  <input type="number" value={s.surcharge} onChange={e=>updateApiSl(i,'surcharge',e.target.value)} style={numFld}/>
                </div>
              ))}
            </div>
          )}

          {/* ── RATE CARD ── */}
          {aTab==='Rate Card' && (
            <div>
              <STitle icon="💼" title="Professional Services Rate Card" sub="Day rates for Custom Dev, Implementation and Training roles."/>
              {[
                {title:"Custom Development",key:"cdevRoles",color:T0},
                {title:"Implementation",key:"implRoles",color:"#A78BFA"},
                {title:"Training",key:"trainRoles",color:G0},
              ].map(sec=>(
                <Card key={sec.key} style={{marginBottom:16}}>
                  <div style={{fontFamily:"Syne,sans-serif",fontSize:13,fontWeight:700,color:sec.color,marginBottom:12}}>
                    {sec.title}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:7,
                    padding:"0 0 8px",marginBottom:6,borderBottom:`1px solid ${N4}`}}>
                    {['Role','Note','Day Rate (₹)'].map(h=>(
                      <span key={h} style={{fontSize:10,fontWeight:700,color:S500,textTransform:"uppercase"}}>{h}</span>
                    ))}
                  </div>
                  {pricing[sec.key].map((r,i)=>(
                    <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:7,
                      alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${N4}20`}}>
                      <span style={{fontSize:12,color:S200,fontWeight:500}}>{r.role}</span>
                      <input value={r.note||''} onChange={e=>updateRole(sec.key,i,'note',e.target.value)}
                        style={{...fldStyle,fontSize:11}}/>
                      <input type="number" value={r.rate} onChange={e=>updateRole(sec.key,i,'rate',e.target.value)}
                        style={numFld}/>
                    </div>
                  ))}
                </Card>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
