import * as XLSX from 'xlsx';

const INR = n => `Rs.${Math.round(n).toLocaleString("en-IN")}`;
const NUM = n => Math.round(n);

function styleSheet(ws, merges, colWidths) {
  if (merges) ws['!merges'] = merges;
  if (colWidths) ws['!cols'] = colWidths.map(w => ({ wch: w }));
  return ws;
}

export function exportExcel({ cfg, calc, mods, modList, srv, apiState, apiList,
  cdevSt, implSt, trnSt, cdevRoles, implRoles, trainRoles, PACKAGES }) {

  const wb = XLSX.utils.book_new();
  const selMods = modList.filter(m => mods[m.id]);
  const selApis = apiState.map((a,i)=>({...a,api:apiList[i]})).filter(a=>a.on);
  const date = new Date().toLocaleDateString('en-IN');

  // ════════════════════════════════════════
  // SHEET 1 — SUMMARY DASHBOARD
  // ════════════════════════════════════════
  const S = [];
  const push = (...args) => S.push(args);

  push(['eTechCube LLP', '', '', '', '', '']);
  push(['Logistics Cube — Pricing Quotation', '', '', '', '', '']);
  push([]);
  push(['CLIENT INFORMATION', '', '', '', '', '']);
  push(['Prepared For', cfg.company || '—', '', 'Date', date, '']);
  push(['Contact Person', cfg.contact || '—', '', 'Prepared By', cfg.preparedBy || '—', '']);
  push(['Email', cfg.email || '—', '', 'Contract Term', `${cfg.term} Year(s)`, '']);
  push(['Billing Cycle', cfg.billing, '', 'Monthly Orders', Number(cfg.orders).toLocaleString('en-IN'), '']);
  push(['Volume Tier', calc.tier.label, '', 'Tier Surcharge', INR(calc.volSur), '']);
  push([]);
  push(['PRICING BREAKDOWN', '', '', '', '', '']);
  push(['#', 'Component', 'Details', '', 'Amount (₹)', 'Notes']);
  push(['1', 'Software Modules', `${selMods.length} of ${modList.length} modules selected`, '', NUM(calc.modC), 'Monthly recurring']);
  push(['2', 'Volume Tier Surcharge', calc.tier.label, '', NUM(calc.volSur), 'Monthly recurring']);
  push(['3', 'Server & Infrastructure', `${srv.provider} — ${srv.pkg}`, '', NUM(calc.srvT), 'Monthly recurring']);
  push(['4', 'API Integrations', `${selApis.length} APIs enabled`, '', NUM(calc.apiT), 'Monthly recurring']);
  push(['', 'MONTHLY SUBTOTAL', '', '', NUM(calc.sub), '']);
  if (calc.disc > 0) push(['', `Annual Discount (${Math.round(calc.disc/calc.sub*100)}%)`, 'Applied for annual billing', '', -NUM(calc.disc), 'Discount']);
  push(['', `TOTAL RECURRING (${cfg.billing.toUpperCase()})`, '', '', NUM(calc.rec), cfg.billing === 'Annual' ? '÷12 for monthly equiv.' : '']);
  push([]);
  push(['5', 'Custom Development', `${cdevRoles.filter((_,i)=>cdevSt[i]?.res>0).length} roles`, '', NUM(calc.cdT), 'One-time']);
  push(['6', 'Implementation', `${implRoles.filter((_,i)=>implSt[i]?.res>0).length} roles`, '', NUM(calc.imT), 'One-time']);
  push(['7', 'Training & Enablement', `${trainRoles.filter((_,i)=>trnSt[i]?.res>0).length} roles`, '', NUM(calc.trT), 'One-time']);
  push(['', 'PROFESSIONAL SERVICES (ONE-TIME)', '', '', NUM(calc.ps), '']);
  push([]);
  push(['', 'GRAND TOTAL', 'Recurring + One-Time', '', NUM(calc.grand), '']);
  push([]);
  push(['', 'Effective Monthly Cost', `Over ${cfg.term} year(s)`, '', NUM(calc.eff), 'Amortised']);
  push([]);
  push(['MODULES BY SECTION', '', '', '', '', '']);
  push(['Section', 'Modules Selected', 'Monthly Cost', '', '', '']);
  const bySec = {};
  selMods.forEach(m => { if (!bySec[m.sec]) bySec[m.sec] = { count: 0, total: 0 }; bySec[m.sec].count++; bySec[m.sec].total += m.price; });
  Object.entries(bySec).forEach(([sec, d]) => push([sec, d.count, NUM(d.total), '', '', '']));
  push(['TOTAL', selMods.length, NUM(calc.modC), '', '', '']);

  const ws1 = XLSX.utils.aoa_to_sheet(S);
  styleSheet(ws1, [
    { s:{r:0,c:0}, e:{r:0,c:5} },
    { s:{r:1,c:0}, e:{r:1,c:5} },
    { s:{r:3,c:0}, e:{r:3,c:5} },
    { s:{r:10,c:0}, e:{r:10,c:5} },
  ], [6, 36, 30, 4, 18, 22]);
  XLSX.utils.book_append_sheet(wb, ws1, '📊 Summary');

  // ════════════════════════════════════════
  // SHEET 2 — MODULES
  // ════════════════════════════════════════
  const M2 = [];
  M2.push(['eTechCube LLP — Software Modules', '', '', '', '', '']);
  M2.push([`Quote for: ${cfg.company} | Date: ${date}`, '', '', '', '', '']);
  M2.push([]);
  M2.push(['#', 'Module ID', 'Module Name', 'Section', 'Type', 'Monthly Price (₹)']);
  selMods.forEach((m, i) => M2.push([
    i + 1, m.id, m.name, m.sec,
    m.ess ? 'Essential' : m.pro ? 'Professional' : 'Premium',
    NUM(m.price)
  ]));
  M2.push([]);
  M2.push(['', '', '', '', 'TOTAL MODULES COST', NUM(calc.modC)]);

  // Section subtotals
  M2.push([]);
  M2.push(['SECTION SUMMARY', '', '', '', '', '']);
  M2.push(['Section', 'Count', 'Cost (₹)', '% of Total', '', '']);
  Object.entries(bySec).forEach(([sec, d]) => M2.push([
    sec, d.count, NUM(d.total),
    `${Math.round(d.total / calc.modC * 100)}%`, '', ''
  ]));

  const ws2 = XLSX.utils.aoa_to_sheet(M2);
  styleSheet(ws2, [
    { s:{r:0,c:0}, e:{r:0,c:5} },
    { s:{r:1,c:0}, e:{r:1,c:5} },
  ], [5, 10, 52, 24, 16, 18]);
  XLSX.utils.book_append_sheet(wb, ws2, '📦 Modules');

  // ════════════════════════════════════════
  // SHEET 3 — SERVER & APIs
  // ════════════════════════════════════════
  const SA = [];
  SA.push(['eTechCube LLP — Server & API Details', '', '', '', '', '']);
  SA.push([`Quote for: ${cfg.company} | Date: ${date}`, '', '', '', '', '']);
  SA.push([]);
  SA.push(['SERVER CONFIGURATION', '', '', '', '', '']);
  SA.push(['Field', 'Value', '', 'Cost Component', 'Amount (₹)', '']);
  SA.push(['Cloud Provider', srv.provider, '', 'Base Package', NUM((Object.values(({
    AWS:[2900,5800,11600,23200,46400,87500],Azure:[3100,6200,12400,24800,49600,93600],
    GCP:[2800,5500,11000,22000,44000,83000],DigitalOcean:[2200,4400,8700,17400,34800,65700],
    Hetzner:[1400,2800,5600,11200,22400,42300],Hostinger:[1200,2500,5000,10000,20000,37800]
  })[srv.provider]||[])[PACKAGES.indexOf(srv.pkg)]||0), '']);
  SA.push(['Server Package', srv.pkg, '', 'Storage Add-on', srv.storageGB > 0 ? NUM(srv.storageGB * 8.3) : 0, '']);
  SA.push(['Storage', `${srv.storageGB} GB`, '', 'Backup Add-on', srv.backup ? NUM(calc.srvT * 0.2) : 0, '']);
  SA.push(['Managed Backup', srv.backup ? 'Yes' : 'No', '', 'TOTAL SERVER', NUM(calc.srvT), '']);
  SA.push([]);
  SA.push(['VOLUME TIER', '', '', '', '', '']);
  SA.push(['Tier Name', calc.tier.label, '', 'Monthly Surcharge', NUM(calc.volSur), '']);
  SA.push(['Order Volume', Number(cfg.orders).toLocaleString('en-IN') + ' orders/mo', '', '', '', '']);
  SA.push([]);
  if (selApis.length > 0) {
    SA.push(['API INTEGRATIONS', '', '', '', '', '']);
    SA.push(['#', 'API Service', 'Category', 'Provider Selected', 'Hits/mo', 'Monthly Cost (₹)']);
    selApis.forEach((a, i) => SA.push([
      i + 1, a.api.name, a.api.cat, a.api.p[a.p][0],
      a.hits, NUM(a.api.p[a.p][1])
    ]));
    SA.push(['', '', '', '', 'TOTAL API COST', NUM(calc.apiT)]);
  } else {
    SA.push(['API INTEGRATIONS', 'No APIs selected', '', '', '', '']);
  }

  const ws3 = XLSX.utils.aoa_to_sheet(SA);
  styleSheet(ws3, [
    { s:{r:0,c:0}, e:{r:0,c:5} },
    { s:{r:1,c:0}, e:{r:1,c:5} },
    { s:{r:3,c:0}, e:{r:3,c:5} },
  ], [22, 24, 22, 24, 14, 18]);
  XLSX.utils.book_append_sheet(wb, ws3, '🖥️ Server & APIs');

  // ════════════════════════════════════════
  // SHEET 4 — PROFESSIONAL SERVICES
  // ════════════════════════════════════════
  const PS = [];
  PS.push(['eTechCube LLP — Professional Services', '', '', '', '', '']);
  PS.push([`Quote for: ${cfg.company} | Date: ${date}`, '', '', '', '', '']);
  PS.push([]);

  const addPSSection = (title, roles, states) => {
    const rows = roles.map((r, i) => ({
      role: r.role, note: r.note || '', res: states[i]?.res || 0,
      days: states[i]?.days || 0, rate: r.rate,
      total: r.rate * (states[i]?.res || 0) * (states[i]?.days || 0)
    }));
    const total = rows.reduce((s, r) => s + r.total, 0);
    PS.push([title, '', '', '', '', '']);
    PS.push(['Role', 'Description', 'Resources', 'Days', 'Day Rate (₹)', 'Total (₹)']);
    rows.forEach(r => PS.push([r.role, r.note, r.res, r.days, NUM(r.rate), NUM(r.total)]));
    PS.push(['', '', '', '', `${title} Total`, NUM(total)]);
    PS.push([]);
  };

  addPSSection('CUSTOM DEVELOPMENT', cdevRoles, cdevSt);
  addPSSection('IMPLEMENTATION', implRoles, implSt);
  addPSSection('TRAINING & ENABLEMENT', trainRoles, trnSt);

  PS.push(['GRAND TOTAL — PROFESSIONAL SERVICES', '', '', '', '', NUM(calc.ps)]);
  PS.push(['', '', '', '', 'Custom Dev', NUM(calc.cdT)]);
  PS.push(['', '', '', '', 'Implementation', NUM(calc.imT)]);
  PS.push(['', '', '', '', 'Training', NUM(calc.trT)]);

  const ws4 = XLSX.utils.aoa_to_sheet(PS);
  styleSheet(ws4, [
    { s:{r:0,c:0}, e:{r:0,c:5} },
    { s:{r:1,c:0}, e:{r:1,c:5} },
  ], [36, 28, 12, 10, 18, 18]);
  XLSX.utils.book_append_sheet(wb, ws4, '💼 Prof Services');

  const fname = `eTechCube_Quote_${(cfg.company || 'Customer').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fname);
}
