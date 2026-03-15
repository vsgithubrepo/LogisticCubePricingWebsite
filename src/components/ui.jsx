// Light theme UI primitives — style objects at MODULE level to prevent flickering
export const T0="#0D9488",T1="#0F766E",T2="#CCFBF1";
export const G0="#D97706",G1="#FEF3C7";
export const GR="#16A34A",RD="#DC2626";
export const W="#FFFFFF",BG="#F8FAFC";
export const S0="#0F172A",S1="#334155",S2="#64748B",S3="#94A3B8";
export const B0="#E2E8F0",B1="#CBD5E1";
export const SF="#FFFFFF",SF2="#F1F5F9",SF3="#E8EEF4";
// Legacy aliases
export const S200=S0,S300=S1,S400=S2,S500=S2,S600=S3;
export const INR=n=>`₹${Math.round(n).toLocaleString("en-IN")}`;

const CARD_BASE={background:SF,border:`1px solid ${B0}`,borderRadius:12,padding:18,boxShadow:"0 1px 3px rgba(0,0,0,.06)"};
const LBL_BASE={fontSize:11,fontWeight:700,color:S2,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6};
const TOG_BASE={width:38,height:22,borderRadius:11,flexShrink:0,position:"relative",cursor:"pointer",transition:"background .2s"};
const TOG_KNOB={position:"absolute",top:3,width:16,height:16,borderRadius:"50%",background:W,transition:"left .2s"};
const TXT_BASE={width:"100%",background:SF2,border:`1px solid ${B0}`,borderRadius:8,color:S0,padding:"9px 12px",fontSize:14,outline:"none"};
const SEL_BASE={width:"100%",background:SF2,border:`1px solid ${B0}`,borderRadius:8,color:S0,padding:"9px 12px",fontSize:13,outline:"none",cursor:"pointer"};
const NUM_BASE={width:64,background:SF2,border:`1px solid ${B0}`,borderRadius:7,color:S0,padding:"6px 8px",fontSize:13,outline:"none",textAlign:"center"};

export const Card=({children,style={}})=>(<div style={{...CARD_BASE,...style}}>{children}</div>);
export const Lbl=({children})=>(<div style={LBL_BASE}>{children}</div>);
export const STitle=({icon,title,sub})=>(<div style={{marginBottom:22}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{icon}</span><h2 style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,color:S0}}>{title}</h2></div>{sub&&<p style={{fontSize:12,color:S2,marginTop:4,marginLeft:30}}>{sub}</p>}</div>);
export const PRow=({label,val,sub,bold,accent})=>(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${B0}`}}><div><span style={{fontSize:13,color:bold?S0:S1,fontWeight:bold?600:400}}>{label}</span>{sub&&<div style={{fontSize:11,color:S2,marginTop:1}}>{sub}</div>}</div><span style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:bold?15:13,color:accent?G0:bold?S0:S2}}>{val}</span></div>);
export const Tog=({on,set})=>(<div onClick={()=>set(!on)} style={{...TOG_BASE,background:on?T0:B1}}><div style={{...TOG_KNOB,left:on?19:3}}/></div>);
export const TxtInput=({val,set,type="text",ph="",style={}})=>(<input type={type} value={val} placeholder={ph} onChange={e=>set(type==="number"?+e.target.value:e.target.value)} style={{...TXT_BASE,...style}}/>);
export const SelInput=({val,set,opts})=>(<select value={val} onChange={e=>set(e.target.value)} style={SEL_BASE}>{opts.map(o=><option key={o}>{o}</option>)}</select>);
export const NumInput=({val,set,min=0,style={}})=>(<input type="number" min={min} value={val} onChange={e=>set(+e.target.value)} style={{...NUM_BASE,...style}}/>);
export const Btn=({children,onClick,variant="primary",style={},disabled=false})=>{
  const bg=variant==="primary"?T0:variant==="danger"?RD:variant==="success"?GR:variant==="ghost"?"transparent":SF2;
  const color=variant==="ghost"?S1:W;
  const border=variant==="ghost"?`1px solid ${B1}`:"none";
  return(<button onClick={onClick} disabled={disabled} style={{padding:"8px 18px",borderRadius:8,border,background:bg,color,fontSize:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontFamily:"DM Sans,sans-serif",opacity:disabled?0.6:1,transition:"opacity .15s",...style}}>{children}</button>);
};
export const Badge=({children,color=T0})=>(<span className="pill" style={{background:`${color}18`,color,border:`1px solid ${color}35`}}>{children}</span>);
export const Spinner=()=>(<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:40}}><div style={{width:32,height:32,borderRadius:"50%",border:`3px solid ${B0}`,borderTopColor:T0,animation:"spin 0.8s linear infinite"}}/></div>);