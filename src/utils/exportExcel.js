import * as XLSX from 'xlsx';

const INR = n => `Rs.${Math.round(n).toLocaleString("en-IN")}`;

export function exportExcel({ cfg, calc, mods, modList, srv, apiState, apiList, cdevSt, implSt, trnSt, cdevRoles, implRoles, trainRoles, PACKAGES }) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Summary ──────────────────────────────────────────────
  const summaryData = [
    ['eTechCube LLP – Logistics Cube Pricing Quotation'],
    [],
    ['Prepared For', cfg.company || '—', 'Date', new Date().toLocaleDateString('en-IN')],
    ['Contact', cfg.contact || '—', 'Prepared By', cfg.preparedBy || '—'],
    ['Billing Cycle', cfg.billing, 'Contract Term', `${cfg.term} Year(s)`],
    ['Monthly Orders', cfg.orders, 'Volume Tier', calc.tier.label],
    [],
    ['PRICING SUMMARY', '', '', ''],
    ['Component', '', '', 'Amount'],
    ['Software Modules', '', '', INR(calc.modC)],
    ['Volume Tier Surcharge', '', '', INR(calc.volSur)],
    ['Server & Infrastructure', '', '', INR(calc.srvT)],
    ['API Integrations', '', '', INR(calc.apiT)],
    ['Monthly Subtotal', '', '', INR(calc.sub)],
  ];
  if (calc.disc > 0) summaryData.push([`Annual Discount (15%)`, '', '', `– ${INR(calc.disc)}`]);
  summaryData.push(
    [`Total Recurring (${cfg.billing})`, '', '', INR(calc.rec)],
    ['Professional Services (One-time)', '', '', INR(calc.ps)],
    [],
    ['GRAND TOTAL', '', '', INR(calc.grand)],
  );
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1['!cols'] = [{wch:40},{wch:25},{wch:20},{wch:20}];
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

  // ── Sheet 2: Modules ──────────────────────────────────────────────
  const modHeaders = ['#','Module ID','Module Name','Section','Plan Type','Monthly Price (Rs.)'];
  const modRows = modList.filter(m=>mods[m.id]).map((m,i)=>[
    i+1, m.id, m.name, m.sec,
    m.ess?'Essential':m.pro?'Professional':'Premium Only',
    m.price,
  ]);
  modRows.push(['','','','','Total', calc.modC]);
  const ws2 = XLSX.utils.aoa_to_sheet([modHeaders, ...modRows]);
  ws2['!cols'] = [{wch:5},{wch:8},{wch:50},{wch:22},{wch:16},{wch:20}];
  XLSX.utils.book_append_sheet(wb, ws2, 'Modules');

  // ── Sheet 3: Server & APIs ─────────────────────────────────────────
  const srvSheet = [
    ['SERVER & INFRASTRUCTURE'],
    ['Provider', srv.provider],
    ['Package', srv.pkg],
    ['Storage', `${srv.storageGB} GB`],
    ['Managed Backup', srv.backup ? 'Yes' : 'No'],
    ['Server Total', INR(calc.srvT)],
    [],
    ['Volume Tier', calc.tier.label, 'Surcharge', INR(calc.volSur)],
    [],
    ['API INTEGRATIONS'],
    ['API Name','Category','Provider Selected','Hits/mo','Base Cost','Volume Slab','Total Cost'],
    ...apiState.map((a,i)=>{
      if(!a.on) return null;
      const api = apiList[i];
      return [api.name, api.cat, api.p[a.p][0], a.hits, api.p[a.p][1], '', api.p[a.p][1]];
    }).filter(Boolean),
    ['','','','','','Total API Cost', calc.apiT],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(srvSheet);
  ws3['!cols'] = [{wch:30},{wch:20},{wch:22},{wch:12},{wch:15},{wch:18},{wch:15}];
  XLSX.utils.book_append_sheet(wb, ws3, 'Server & APIs');

  // ── Sheet 4: Professional Services ────────────────────────────────
  const psHeaders = ['Role','Category','Resources','Days','Day Rate (Rs.)','Total (Rs.)'];
  const psRows = [];
  cdevRoles.forEach((r,i)=>{
    if((cdevSt[i]?.res||0)>0) psRows.push([r.role,'Custom Development',cdevSt[i].res,cdevSt[i].days,r.rate,r.rate*cdevSt[i].res*cdevSt[i].days]);
  });
  implRoles.forEach((r,i)=>{
    if((implSt[i]?.res||0)>0) psRows.push([r.role,'Implementation',implSt[i].res,implSt[i].days,r.rate,r.rate*implSt[i].res*implSt[i].days]);
  });
  trainRoles.forEach((r,i)=>{
    if((trnSt[i]?.res||0)>0) psRows.push([r.role,'Training',trnSt[i].res,trnSt[i].days,r.rate,r.rate*trnSt[i].res*trnSt[i].days]);
  });
  psRows.push(['','','','','Total Professional Services', calc.ps]);
  const ws4 = XLSX.utils.aoa_to_sheet([psHeaders,...psRows]);
  ws4['!cols'] = [{wch:35},{wch:22},{wch:12},{wch:10},{wch:18},{wch:18}];
  XLSX.utils.book_append_sheet(wb, ws4, 'Professional Services');

  const fname = `eTechCube_Quote_${(cfg.company||'Customer').replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, fname);
}
