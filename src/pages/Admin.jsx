import { useState } from 'react';
import { supabase, isConfigured } from '../supabase.js';
import { Card, Lbl, STitle, Btn, T0, T1, T2, G0, G1, GR, RD, W, SF, SF2, S0, S1, S2, S3, B0, B1, INR } from '../components/ui.jsx';
import { PROVIDERS, PACKAGES } from '../data/defaults.js';
 
const ADMIN_TABS = [
  {id:'Global',icon:'⚙️',label:'Global'},
  {id:'Modules',icon:'📦',label:'Modules'},
  {id:'Server',icon:'🖥️',label:'Server'},
  {id:'VolumeTiers',icon:'📊',label:'Volume Tiers'},
  {id:'APISlabs',icon:'🔌',label:'API Slabs'},
  {id:'RateCard',icon:'💼',label:'Rate Card'},
];
 
const ALL_SECTIONS = [
  "EMS","Master Data","Operations","Manifest & Delivery",
  "Accounts & Expense","Finance & Banking","Grievance",
  "Analytics","Dashboards","Reports","Automation","Other Features"
];
 
const DEL_BTN = {background:`${RD}10`,border:`1px solid ${RD}25`,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontSize:12,color:RD,fontFamily:"DM Sans,sans-serif"};
const ADD_BTN = {background:T2,border:`1px solid ${T0}30`,borderRadius:6,padding:"6px 14px",cursor:"pointer",fontSize:12,color:T1,fontWeight:600,fontFamily:"DM Sans,sans-serif"};
 
export default function AdminPanel({ pricing, setPricing, onBack, user }) {
  const [aTab,setATab]=useState('Global');
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [modQ,setModQ]=useState('');
  const [confirm,setConfirm]=useState(null);
 
  async function saveAll() {
    setSaving(true);
    if (isConfigured) {
      await supabase.from('pricing_config').upsert({id:1,config:pricing,updated_at:new Date().toISOString(),updated_by:user?.email||'admin'});
    } else {
      localStorage.setItem('etechcube_pricing',JSON.stringify(pricing));
    }
    setSaving(false);setSaved(true);
    setTimeout(()=>setSaved(false),3000);
  }
 
  // ── Updaters ──────────────────────────────────────────────────────
  const updateGbl   = (k,v) => setPricing(p=>({...p,gbl:{...p.gbl,[k]:v}}));
  const updateVolT  = (i,k,v) => setPricing(p=>{const t=[...p.volTiers];t[i]={...t[i],[k]:k==='label'?v:+v};return{...p,volTiers:t};});
  const updateApiSl = (i,k,v) => setPricing(p=>{const t=[...p.apiSlabs];t[i]={...t[i],[k]:k==='label'?v:+v};return{...p,apiSlabs:t};});
  const updateMod   = (i,k,v) => setPricing(p=>{const t=[...p.modList];t[i]={...t[i],[k]:k==='price'?+v:v};return{...p,modList:t};});
  const updateSrv   = (prov,pi,v) => setPricing(p=>{const sp={...p.srvPrices,[prov]:[...p.srvPrices[prov]]};sp[prov][pi]=+v;return{...p,srvPrices:sp};});
  const updateStor  = (prov,v) => setPricing(p=>({...p,storCost:{...p.storCost,[prov]:+v}}));
  const updateRole  = (cat,i,k,v) => setPricing(p=>{const arr=[...p[cat]];arr[i]={...arr[i],[k]:k==='rate'?+v:v};return{...p,[cat]:arr};});
 
  // ── Module CRUD ───────────────────────────────────────────────────
  function addModule() {
    const newId=`M${String(pricing.modList.length+1).padStart(3,'0')}`;
    setPricing(p=>({...p,modList:[...p.modList,{id:newId,sec:ALL_SECTIONS[0],name:'New Module',ess:0,pro:1,pre:1,price:5000,desc:'Enter description'}]}));
    setTimeout(()=>{const el=document.getElementById('mod-bottom');if(el)el.scrollIntoView({behavior:'smooth'});},100);
  }
  function deleteModule(id){setConfirm({type:'module',id,name:pricing.modList.find(m=>m.id===id)?.name});}
  function duplicateModule(id){
    const orig=pricing.modList.find(m=>m.id===id);if(!orig)return;
    const newId=`M${String(pricing.modList.length+1).padStart(3,'0')}`;
    setPricing(p=>({...p,modList:[...p.modList,{...orig,id:newId,name:orig.name+' (Copy)'}]}));
  }
  function confirmDelete(){
    if(confirm?.type==='module') setPricing(p=>({...p,modList:p.modList.filter(m=>m.id!==confirm.id)}));
    if(confirm?.type==='volTier') setPricing(p=>({...p,volTiers:p.volTiers.filter((_,i)=>i!==confirm.index)}));
    if(confirm?.type==='apiSlab') setPricing(p=>({...p,apiSlabs:p.apiSlabs.filter((_,i)=>i!==confirm.index)}));
    if(confirm?.type==='role') setPricing(p=>{const arr=[...p[confirm.cat]].filter((_,i)=>i!==confirm.index);return{...p,[confirm.cat]:arr};});
    if(confirm?.type==='provider'){
      setPricing(p=>{
        const sp={...p.srvPrices};delete sp[confirm.name];
        const sc={...p.storCost};delete sc[confirm.name];
        return{...p,srvPrices:sp,storCost:sc};
      });
    }
    setConfirm(null);
  }
 
  // ── Volume Tier CRUD ──────────────────────────────────────────────
  function addVolTier(){
    setPricing(p=>({...p,volTiers:[...p.volTiers,{label:'New Tier',min:0,max:9999,surcharge:0}]}));
  }
 
  // ── API Slab CRUD ─────────────────────────────────────────────────
  function addApiSlab(){
    setPricing(p=>({...p,apiSlabs:[...p.apiSlabs,{label:'New Slab',from:0,to:9999,surcharge:0}]}));
  }
 
  // ── Server Provider CRUD ──────────────────────────────────────────
  function addProvider(){
    const name=prompt('Enter provider name (e.g. Oracle):');
    if(!name||!name.trim()) return;
    const n=name.trim();
    setPricing(p=>({
      ...p,
      srvPrices:{...p.srvPrices,[n]:PACKAGES.map(()=>0)},
      storCost:{...p.storCost,[n]:0}
    }));
  }
 
  // ── Rate Card CRUD ────────────────────────────────────────────────
  function addRole(cat){
    setPricing(p=>{const arr=[...p[cat],{role:'New Role',note:'',rate:0}];return{...p,[cat]:arr};});
  }
 
  const filteredMods=modQ?pricing.modList.filter(m=>m.name.toLowerCase().includes(modQ.toLowerCase())||m.sec.toLowerCase().includes(modQ.toLowerCase())):pricing.modList;
  const fld={background:SF2,border:`1px solid ${B0}`,borderRadius:7,color:S0,padding:"6px 10px",fontSize:13,outline:"none",width:"100%"};
  const num={background:SF2,border:`1px solid ${B0}`,borderRadius:7,color:S0,padding:"6px 8px",fontSize:13,outline:"none",textAlign:"right"};
  const allProviders=Object.keys(pricing.srvPrices||{});
 
  return (
    <div style={{minHeight:"100vh",background:"#F8FAFC"}}>
 
      {/* ── Confirm Delete Modal ── */}
      {confirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}>
          <div style={{background:SF,borderRadius:14,padding:28,maxWidth:400,width:"90%",boxShadow:"0 8px 32px rgba(0,0,0,.15)"}}>
            <div style={{fontSize:32,textAlign:"center",marginBottom:12}}>🗑️</div>
            <div style={{fontSize:16,fontWeight:700,color:S0,textAlign:"center",marginBottom:8}}>Confirm Delete</div>
            <div style={{fontSize:14,color:S1,textAlign:"center",marginBottom:24}}>
              Delete <strong>"{confirm.name||confirm.label||'this item'}"</strong>? This cannot be undone.
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={()=>setConfirm(null)} variant="ghost" style={{flex:1}}>Cancel</Btn>
              <Btn onClick={confirmDelete} variant="danger" style={{flex:1}}>Yes, Delete</Btn>
            </div>
          </div>
        </div>
      )}
 
      {/* ── Top Bar ── */}
      <div style={{background:SF,borderBottom:`1px solid ${B0}`,height:58,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{background:SF2,border:`1px solid ${B0}`,borderRadius:8,color:S1,padding:"6px 14px",fontSize:13,cursor:"pointer",fontFamily:"DM Sans,sans-serif"}}>← Back</button>
          <div style={{width:1,height:24,background:B0}}/>
          <img src="/etechcube-logo.png" alt="eTechCube" style={{height:28,objectFit:"contain"}} onError={e=>{e.target.style.display='none';}}/>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:15,fontWeight:800,color:S0}}>Admin Panel</div>
          <span style={{fontSize:11,padding:"2px 10px",borderRadius:20,background:`${RD}12`,color:RD,border:`1px solid ${RD}25`,fontWeight:700}}>ADMIN ONLY</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {saved&&<span style={{fontSize:13,color:GR,fontWeight:600}}>✓ Saved!</span>}
          <Btn onClick={saveAll} disabled={saving} style={{background:T0}}>{saving?'Saving…':'💾 Save All Changes'}</Btn>
        </div>
      </div>
 
      <div style={{display:"flex",maxWidth:1320,margin:"0 auto"}}>
 
        {/* ── Sidebar ── */}
        <div className="sidebar-nav" style={{width:200,flexShrink:0,padding:"16px 12px",position:"sticky",top:58,height:"calc(100vh - 58px)",overflowY:"auto",borderRight:`1px solid ${B0}`,background:SF}}>
          {ADMIN_TABS.map(t=>(
            <div key={t.id} onClick={()=>setATab(t.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 12px",borderRadius:8,marginBottom:3,cursor:"pointer",transition:"all .13s",background:aTab===t.id?T2:"transparent",border:`1px solid ${aTab===t.id?T0+"40":"transparent"}`,fontSize:13,fontWeight:aTab===t.id?600:400,color:aTab===t.id?T1:S2}}>
              <span style={{fontSize:15}}>{t.icon}</span>{t.label}
            </div>
          ))}
          <div style={{marginTop:20,padding:12,background:SF2,borderRadius:10,border:`1px solid ${B0}`}}>
            <div style={{fontSize:10,color:S2,fontWeight:700,textTransform:"uppercase",marginBottom:6}}>Module Stats</div>
            <div style={{fontSize:13,color:S0,fontWeight:600,marginBottom:4}}>Total: {pricing.modList.length}</div>
            {ALL_SECTIONS.map(sec=>(
              <div key={sec} style={{fontSize:11,color:S2,marginBottom:2}}>{sec.split(' ')[0]}: {pricing.modList.filter(m=>m.sec===sec).length}</div>
            ))}
          </div>
        </div>
 
        {/* ── Main Content ── */}
        <div className="main-content" style={{flex:1,padding:"24px 28px",overflowY:"auto"}}>
 
          {/* ══ GLOBAL ══ */}
          {aTab==='Global'&&(
            <div className="fade-in">
              <STitle icon="⚙️" title="Global Settings" sub="These values apply across all calculations."/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                {[{label:"Annual Billing Discount",key:"annualDiscount",note:"e.g. 0.15 = 15%",mul:100,suffix:"%"},{label:"Managed Backup Add-on",key:"backupPct",note:"e.g. 0.20 = 20% of server",mul:100,suffix:"%"},{label:"Free API Hits / Month",key:"freeApiHits",note:"Per API service",mul:1,suffix:" hits"}].map(f=>(
                  <Card key={f.key}>
                    <Lbl>{f.label}</Lbl>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <input type="number" value={Math.round(pricing.gbl[f.key]*f.mul)} onChange={e=>updateGbl(f.key,+e.target.value/f.mul)} style={{...num,width:100}}/>
                      <span style={{fontSize:13,color:S2}}>{f.suffix}</span>
                    </div>
                    <div style={{fontSize:11,color:S3,marginTop:6}}>{f.note}</div>
                    <div style={{fontSize:12,color:T0,marginTop:4,fontWeight:600}}>Current: {pricing.gbl[f.key]*f.mul}{f.suffix}</div>
                  </Card>
                ))}
              </div>
            </div>
          )}
 
          {/* ══ MODULES ══ */}
          {aTab==='Modules'&&(
            <div className="fade-in">
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16,gap:16}}>
                <STitle icon="📦" title="Module Manager" sub={`${pricing.modList.length} total · Add, edit, delete or change section`}/>
                <Btn onClick={addModule} style={{background:T0,flexShrink:0,marginTop:4}}>+ Add Module</Btn>
              </div>
              <input value={modQ} onChange={e=>setModQ(e.target.value)} placeholder="🔍 Search by name or section…" style={{...fld,marginBottom:10,padding:"10px 14px",fontSize:14}}/>
              {modQ&&<div style={{fontSize:12,color:S2,marginBottom:10}}>Showing {filteredMods.length} of {pricing.modList.length} modules</div>}
              <div style={{display:"grid",gridTemplateColumns:"2fr 1.2fr 1fr auto",gap:8,padding:"6px 12px",marginBottom:4}}>
                {["Module Name","Section / Category","Price (₹/mo)","Actions"].map(h=>(
                  <span key={h} style={{fontSize:10,fontWeight:700,color:S2,textTransform:"uppercase"}}>{h}</span>
                ))}
              </div>
              {filteredMods.map(m=>{
                const i=pricing.modList.findIndex(x=>x.id===m.id);
                return(
                  <div key={m.id} style={{display:"grid",gridTemplateColumns:"2fr 1.2fr 1fr auto",gap:8,alignItems:"center",padding:"8px 12px",borderRadius:8,marginBottom:5,background:SF,border:`1px solid ${B0}`,boxShadow:"0 1px 2px rgba(0,0,0,.04)"}}>
                    <input value={m.name} onChange={e=>updateMod(i,'name',e.target.value)} style={{...fld,fontSize:13}}/>
                    <select value={m.sec} onChange={e=>updateMod(i,'sec',e.target.value)} style={{...fld,fontSize:12}}>
                      {ALL_SECTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="number" value={m.price} onChange={e=>updateMod(i,'price',e.target.value)} style={{...num,width:"100%"}}/>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={()=>duplicateModule(m.id)} title="Duplicate" style={{background:SF2,border:`1px solid ${B0}`,borderRadius:6,padding:"5px 8px",cursor:"pointer",fontSize:13,color:S2}}>⧉</button>
                      <button onClick={()=>deleteModule(m.id)} title="Delete" style={DEL_BTN}>🗑️</button>
                    </div>
                  </div>
                );
              })}
              <div id="mod-bottom"/>
              <div style={{marginTop:16,textAlign:"center"}}>
                <Btn onClick={addModule} variant="ghost">+ Add Another Module</Btn>
              </div>
            </div>
          )}
 
          {/* ══ SERVER ══ */}
          {aTab==='Server'&&(
            <div className="fade-in">
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
                <STitle icon="🖥️" title="Server & Storage Pricing" sub="Edit base price per provider/package and storage cost per 100GB."/>
                <button onClick={addProvider} style={ADD_BTN}>+ Add Provider</button>
              </div>
              <Card style={{marginBottom:16}}>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:13,fontWeight:700,color:S0,marginBottom:12}}>Package Prices (₹/mo)</div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead><tr style={{background:SF2}}>
                      <th style={{textAlign:"left",padding:"8px 10px",color:S2,fontWeight:700,borderBottom:`1px solid ${B0}`}}>Provider</th>
                      {PACKAGES.map(p=><th key={p} style={{padding:"8px 10px",color:S2,fontWeight:600,textAlign:"right",borderBottom:`1px solid ${B0}`}}>{p}</th>)}
                      <th style={{padding:"8px 10px",borderBottom:`1px solid ${B0}`}}></th>
                    </tr></thead>
                    <tbody>{allProviders.map((prov,pi)=>(
                      <tr key={prov} style={{background:pi%2===0?SF:SF2}}>
                        <td style={{padding:"7px 10px",color:T0,fontWeight:600}}>{prov}</td>
                        {(pricing.srvPrices[prov]||[]).map((price,idx)=>(
                          <td key={idx} style={{padding:"4px 6px"}}><input type="number" value={price} onChange={e=>updateSrv(prov,idx,e.target.value)} style={{...num,width:90}}/></td>
                        ))}
                        <td style={{padding:"4px 8px"}}>
                          <button onClick={()=>setConfirm({type:'provider',name:prov})} style={DEL_BTN}>🗑️</button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </Card>
              <Card>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:13,fontWeight:700,color:S0,marginBottom:12}}>Storage Cost per 100 GB/mo (₹)</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                  {allProviders.map(prov=>(
                    <div key={prov}><Lbl>{prov}</Lbl><input type="number" value={pricing.storCost[prov]||0} onChange={e=>updateStor(prov,e.target.value)} style={{...num,width:"100%"}}/></div>
                  ))}
                </div>
              </Card>
            </div>
          )}
 
          {/* ══ VOLUME TIERS ══ */}
          {aTab==='VolumeTiers'&&(
            <div className="fade-in">
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
                <STitle icon="📊" title="Volume Tier Surcharges" sub="Monthly surcharge based on order volume."/>
                <button onClick={addVolTier} style={ADD_BTN}>+ Add Tier</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr auto",gap:8,padding:"6px 12px",marginBottom:6}}>
                {['Tier Label','Min Orders','Max Orders','Surcharge (₹/mo)','Per Unit Cost',''].map(h=>(
                  <span key={h} style={{fontSize:10,fontWeight:700,color:S2,textTransform:"uppercase"}}>{h}</span>
                ))}
              </div>
              {pricing.volTiers.map((t,i)=>{
                const avgOrders=t.min===0?t.max:Math.round((t.min+t.max)/2);
                const perUnit=t.surcharge===0?0:+(t.surcharge/avgOrders).toFixed(2);
                return(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr 1fr auto",gap:8,alignItems:"center",padding:"8px 12px",borderRadius:8,marginBottom:6,background:SF,border:`1px solid ${B0}`}}>
                    <input value={t.label} onChange={e=>updateVolT(i,'label',e.target.value)} style={{...fld,fontSize:12}}/>
                    <input type="number" value={t.min} onChange={e=>updateVolT(i,'min',e.target.value)} style={num}/>
                    <input type="number" value={t.max} onChange={e=>updateVolT(i,'max',e.target.value)} style={num}/>
                    <input type="number" value={t.surcharge} onChange={e=>updateVolT(i,'surcharge',e.target.value)} style={num}/>
                    <div style={{textAlign:"center",padding:"5px 8px",background:perUnit===0?"#DCFCE7":"#FEF3C7",borderRadius:7,border:`1px solid ${perUnit===0?"#86EFAC":"#FCD34D"}`}}>
                      <div style={{fontFamily:"Syne,sans-serif",fontSize:13,fontWeight:700,color:perUnit===0?"#16A34A":"#92400E"}}>{perUnit===0?"FREE":`₹${perUnit}`}</div>
                      <div style={{fontSize:9,color:S2,marginTop:1}}>per order</div>
                    </div>
                    <button onClick={()=>setConfirm({type:'volTier',index:i,name:t.label})} style={DEL_BTN}>🗑️</button>
                  </div>
                );
              })}
            </div>
          )}
 
          {/* ══ API SLABS ══ */}
          {aTab==='APISlabs'&&(
            <div className="fade-in">
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
                <STitle icon="🔌" title="API Volume Slab Surcharges" sub="Surcharge added per API based on monthly hit volume."/>
                <button onClick={addApiSlab} style={ADD_BTN}>+ Add Slab</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr auto",gap:8,padding:"6px 12px",marginBottom:6}}>
                {['Slab Label','From (hits)','To (hits)','Surcharge (₹/mo)',''].map(h=>(
                  <span key={h} style={{fontSize:10,fontWeight:700,color:S2,textTransform:"uppercase"}}>{h}</span>
                ))}
              </div>
              {pricing.apiSlabs.map((s,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr auto",gap:8,alignItems:"center",padding:"8px 12px",borderRadius:8,marginBottom:6,background:SF,border:`1px solid ${B0}`}}>
                  <input value={s.label} onChange={e=>updateApiSl(i,'label',e.target.value)} style={{...fld,fontSize:12}}/>
                  <input type="number" value={s.from} onChange={e=>updateApiSl(i,'from',e.target.value)} style={num}/>
                  <input type="number" value={s.to} onChange={e=>updateApiSl(i,'to',e.target.value)} style={num}/>
                  <input type="number" value={s.surcharge} onChange={e=>updateApiSl(i,'surcharge',e.target.value)} style={num}/>
                  <button onClick={()=>setConfirm({type:'apiSlab',index:i,name:s.label})} style={DEL_BTN}>🗑️</button>
                </div>
              ))}
            </div>
          )}
 
          {/* ══ RATE CARD ══ */}
          {aTab==='RateCard'&&(
            <div className="fade-in">
              <STitle icon="💼" title="Professional Services Rate Card" sub="Day rates for Custom Dev, Implementation and Training."/>
              {[{title:"Custom Development",key:"cdevRoles",color:T0},{title:"Implementation",key:"implRoles",color:"#7C3AED"},{title:"Training & Enablement",key:"trainRoles",color:G0}].map(sec=>(
                <Card key={sec.key} style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                    <div style={{fontFamily:"Syne,sans-serif",fontSize:14,fontWeight:700,color:sec.color}}>{sec.title}</div>
                    <button onClick={()=>addRole(sec.key)} style={ADD_BTN}>+ Add Role</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:8,paddingBottom:8,marginBottom:8,borderBottom:`1px solid ${B0}`}}>
                    {['Role','Note','Day Rate (₹)',''].map(h=><span key={h} style={{fontSize:10,fontWeight:700,color:S2,textTransform:"uppercase"}}>{h}</span>)}
                  </div>
                  {pricing[sec.key].map((r,i)=>(
                    <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:8,alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${B0}`}}>
                      <input value={r.role} onChange={e=>updateRole(sec.key,i,'role',e.target.value)} style={{...fld,fontSize:13}}/>
                      <input value={r.note||''} onChange={e=>updateRole(sec.key,i,'note',e.target.value)} style={{...fld,fontSize:12}}/>
                      <input type="number" value={r.rate} onChange={e=>updateRole(sec.key,i,'rate',e.target.value)} style={num}/>
                      <button onClick={()=>setConfirm({type:'role',cat:sec.key,index:i,name:r.role})} style={DEL_BTN}>🗑️</button>
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
 