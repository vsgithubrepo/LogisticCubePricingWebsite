// All UI primitives defined at module level — never inside a render function
// This prevents React from treating them as new component types on each render

const N0="#060D18",N1="#0A1525",N2="#0F1F35",N3="#162840",N4="#1E3554";
export const T0="#0D9488",T1="#14B8A6";
export const G0="#F59E0B",G1="#FCD34D";
export const W="#FFFFFF",S200="#E2E8F0",S300="#CBD5E1",S400="#94A3B8",S500="#64748B",S600="#475569";
export const GR="#10B981",RD="#EF4444";

export const INR = n => `₹${Math.round(n).toLocaleString("en-IN")}`;

export const Card = ({ children, style={} }) => (
  <div style={{background:N2,border:`1px solid ${N4}`,borderRadius:12,padding:18,...style}}>
    {children}
  </div>
);

export const Lbl = ({ children }) => (
  <div style={{fontSize:11,fontWeight:700,color:S500,textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:6}}>
    {children}
  </div>
);

export const STitle = ({ icon, title, sub }) => (
  <div style={{marginBottom:22}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:20}}>{icon}</span>
      <h2 style={{fontFamily:"Syne, sans-serif",fontSize:21,fontWeight:800,color:W}}>{title}</h2>
    </div>
    {sub && <p style={{fontSize:12,color:S500,marginTop:4,marginLeft:30}}>{sub}</p>}
  </div>
);

export const PRow = ({ label, val, sub, bold, accent }) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
    padding:"8px 0",borderBottom:`1px solid ${N4}30`}}>
    <div>
      <span style={{fontSize:13,color:bold?W:S300,fontWeight:bold?600:400}}>{label}</span>
      {sub && <div style={{fontSize:11,color:S500,marginTop:1}}>{sub}</div>}
    </div>
    <span style={{fontFamily:"Syne, sans-serif",fontWeight:700,fontSize:bold?15:13,
      color:accent?G0:bold?W:S400}}>{val}</span>
  </div>
);

export const Tog = ({ on, set }) => (
  <div onClick={()=>set(!on)} style={{width:38,height:22,borderRadius:11,flexShrink:0,
    background:on?T0:N4,position:"relative",cursor:"pointer",transition:"background .2s"}}>
    <div style={{position:"absolute",top:3,left:on?19:3,width:16,height:16,
      borderRadius:"50%",background:W,transition:"left .2s"}}/>
  </div>
);

export const TxtInput = ({ val, set, type="text", ph="", style={} }) => (
  <input type={type} value={val} placeholder={ph}
    onChange={e=>set(type==="number"?+e.target.value:e.target.value)}
    style={{width:"100%",background:N3,border:`1px solid ${N4}`,borderRadius:8,
      color:W,padding:"9px 12px",fontSize:14,outline:"none",...style}}/>
);

export const SelInput = ({ val, set, opts }) => (
  <select value={val} onChange={e=>set(e.target.value)}
    style={{width:"100%",background:N3,border:`1px solid ${N4}`,borderRadius:8,
      color:W,padding:"9px 12px",fontSize:13,outline:"none",cursor:"pointer"}}>
    {opts.map(o=><option key={o}>{o}</option>)}
  </select>
);

export const NumInput = ({ val, set, min=0, style={} }) => (
  <input type="number" min={min} value={val} onChange={e=>set(+e.target.value)}
    style={{width:64,background:N3,border:`1px solid ${N4}`,borderRadius:7,color:W,
      padding:"6px 8px",fontSize:13,outline:"none",textAlign:"center",...style}}/>
);

export const Btn = ({ children, onClick, variant="primary", style={} }) => {
  const bg = variant==="primary" ? T0 : variant==="danger" ? RD : variant==="ghost" ? "transparent" : N3;
  const border = variant==="ghost" ? `1px solid ${N4}` : "none";
  return (
    <button onClick={onClick}
      style={{padding:"8px 18px",borderRadius:8,border,background:bg,color:W,
        fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"DM Sans, sans-serif",...style}}>
      {children}
    </button>
  );
};

export const Badge = ({ children, color=T0 }) => (
  <span className="pill" style={{background:`${color}20`,color,border:`1px solid ${color}40`}}>
    {children}
  </span>
);

export const Spinner = () => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
    <div style={{width:32,height:32,borderRadius:"50%",border:`3px solid ${N4}`,
      borderTopColor:T0,animation:"spin 0.8s linear infinite"}}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);
