import * as XLSX from 'xlsx';
 
function inr(n) { return 'Rs.' + Math.round(n).toLocaleString('en-IN'); }
function num(n) { return Math.round(n); }
 
function makeSheet(data, merges, widths) {
  var ws = XLSX.utils.aoa_to_sheet(data);
  if (merges) ws['!merges'] = merges;
  if (widths) ws['!cols'] = widths.map(function(w) { return { wch: w }; });
  return ws;
}
 
export function exportExcel({ cfg, calc, mods, modList, srv, apiState, apiList,
  cdevSt, implSt, trnSt, cdevRoles, implRoles, trainRoles, PACKAGES }) {
 
  var wb = XLSX.utils.book_new();
  var selMods = modList.filter(function(m) { return mods[m.id]; });
  var selApis = apiState.map(function(a, i) { return Object.assign({}, a, { api: apiList[i] }); }).filter(function(a) { return a.on; });
  var date = new Date().toLocaleDateString('en-IN');
 
  // ── Group modules by section ──────────────────────────────────────
  var bySec = {};
  selMods.forEach(function(m) {
    if (!bySec[m.sec]) bySec[m.sec] = { count: 0, total: 0 };
    bySec[m.sec].count++;
    bySec[m.sec].total += m.price;
  });
 
  // ══════════════════════════════════════════
  // SHEET 1 — SUMMARY
  // ══════════════════════════════════════════
  var S = [];
  S.push(['eTechCube LLP', '', '', '', '', '']);
  S.push(['Logistics Cube - Pricing Quotation', '', '', '', '', '']);
  S.push(['', '', '', '', '', '']);
  S.push(['CLIENT INFORMATION', '', '', '', '', '']);
  S.push(['Prepared For', cfg.company || '-', '', 'Date', date, '']);
  S.push(['Contact Person', cfg.contact || '-', '', 'Prepared By', cfg.preparedBy || '-', '']);
  S.push(['Email', cfg.email || '-', '', 'Contract Term', cfg.term + ' Year(s)', '']);
  S.push(['Billing Cycle', cfg.billing, '', 'Monthly Orders', Number(cfg.orders).toLocaleString('en-IN'), '']);
  S.push(['Volume Tier', calc.tier.label, '', 'Tier Surcharge', inr(calc.volSur), '']);
  S.push(['', '', '', '', '', '']);
  S.push(['PRICING BREAKDOWN', '', '', '', '', '']);
  S.push(['#', 'Component', 'Details', '', 'Amount (Rs.)', 'Notes']);
  S.push(['1', 'Software Modules', selMods.length + ' of ' + modList.length + ' modules selected', '', num(calc.modC), 'Monthly recurring']);
  S.push(['2', 'Volume Tier Surcharge', calc.tier.label, '', num(calc.volSur), 'Monthly recurring']);
  S.push(['3', 'Server & Infrastructure', srv.provider + ' - ' + srv.pkg, '', num(calc.srvT), 'Monthly recurring']);
  S.push(['4', 'API Integrations', selApis.length + ' APIs enabled', '', num(calc.apiT), 'Monthly recurring']);
  S.push(['', 'MONTHLY SUBTOTAL', '', '', num(calc.sub), '']);
  if (calc.disc > 0) {
    var discPct = Math.round(calc.disc / calc.sub * 100);
    S.push(['', 'Annual Discount (' + discPct + '%)', 'Applied for annual billing', '', -num(calc.disc), 'Discount']);
  }
  S.push(['', 'TOTAL RECURRING (' + cfg.billing.toUpperCase() + ')', '', '', num(calc.rec), cfg.billing === 'Annual' ? 'div by 12 for monthly' : '']);
  S.push(['', '', '', '', '', '']);
 
  var cdevCount = cdevRoles.filter(function(_, i) { return cdevSt[i] && cdevSt[i].res > 0; }).length;
  var implCount = implRoles.filter(function(_, i) { return implSt[i] && implSt[i].res > 0; }).length;
  var trainCount = trainRoles.filter(function(_, i) { return trnSt[i] && trnSt[i].res > 0; }).length;
 
  S.push(['5', 'Custom Development', cdevCount + ' roles', '', num(calc.cdT), 'One-time']);
  S.push(['6', 'Implementation', implCount + ' roles', '', num(calc.imT), 'One-time']);
  S.push(['7', 'Training & Enablement', trainCount + ' roles', '', num(calc.trT), 'One-time']);
  S.push(['', 'PROFESSIONAL SERVICES (ONE-TIME)', '', '', num(calc.ps), '']);
  S.push(['', '', '', '', '', '']);
  S.push(['', 'GRAND TOTAL', 'Recurring + One-Time', '', num(calc.grand), '']);
  S.push(['', '', '', '', '', '']);
  S.push(['', 'Effective Monthly Cost', 'Over ' + cfg.term + ' year(s)', '', num(calc.eff), 'Amortised']);
  S.push(['', '', '', '', '', '']);
  S.push(['MODULES BY SECTION', '', '', '', '', '']);
  S.push(['Section', 'Modules Selected', 'Monthly Cost (Rs.)', '', '', '']);
  Object.keys(bySec).forEach(function(sec) {
    S.push([sec, bySec[sec].count, num(bySec[sec].total), '', '', '']);
  });
  S.push(['TOTAL', selMods.length, num(calc.modC), '', '', '']);
 
  var ws1 = makeSheet(S, [
    { s:{r:0,c:0}, e:{r:0,c:5} },
    { s:{r:1,c:0}, e:{r:1,c:5} },
    { s:{r:3,c:0}, e:{r:3,c:5} },
    { s:{r:10,c:0}, e:{r:10,c:5} },
  ], [6, 36, 30, 4, 18, 22]);
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');
 
  // ══════════════════════════════════════════
  // SHEET 2 — MODULES
  // ══════════════════════════════════════════
  var M2 = [];
  M2.push(['eTechCube LLP - Software Modules', '', '', '', '', '']);
  M2.push(['Quote for: ' + cfg.company + ' | Date: ' + date, '', '', '', '', '']);
  M2.push(['', '', '', '', '', '']);
  M2.push(['#', 'Module ID', 'Module Name', 'Section', 'Type', 'Monthly Price (Rs.)']);
  selMods.forEach(function(m, i) {
    var type = m.ess ? 'Essential' : m.pro ? 'Professional' : 'Premium';
    M2.push([i + 1, m.id, m.name, m.sec, type, num(m.price)]);
  });
  M2.push(['', '', '', '', '', '']);
  M2.push(['', '', '', '', 'TOTAL MODULES COST', num(calc.modC)]);
  M2.push(['', '', '', '', '', '']);
  M2.push(['SECTION SUMMARY', '', '', '', '', '']);
  M2.push(['Section', 'Count', 'Cost (Rs.)', '% of Total', '', '']);
  Object.keys(bySec).forEach(function(sec) {
    var pct = Math.round(bySec[sec].total / calc.modC * 100) + '%';
    M2.push([sec, bySec[sec].count, num(bySec[sec].total), pct, '', '']);
  });
 
  var ws2 = makeSheet(M2, [
    { s:{r:0,c:0}, e:{r:0,c:5} },
    { s:{r:1,c:0}, e:{r:1,c:5} },
  ], [5, 10, 52, 24, 16, 18]);
  XLSX.utils.book_append_sheet(wb, ws2, 'Modules');
 
  // ══════════════════════════════════════════
  // SHEET 3 — SERVER & APIs
  // ══════════════════════════════════════════
  var SA = [];
  SA.push(['eTechCube LLP - Server & API Details', '', '', '', '', '']);
  SA.push(['Quote for: ' + cfg.company + ' | Date: ' + date, '', '', '', '', '']);
  SA.push(['', '', '', '', '', '']);
  SA.push(['SERVER CONFIGURATION', '', '', '', '', '']);
  SA.push(['Field', 'Value', '', 'Cost Component', 'Amount (Rs.)', '']);
  SA.push(['Cloud Provider', srv.provider, '', 'Server Total', num(calc.srvT), '']);
  SA.push(['Server Package', srv.pkg, '', 'Storage Add-on', srv.storageGB > 0 ? num(srv.storageGB * 8.3) : 0, '']);
  SA.push(['Storage', srv.storageGB + ' GB', '', 'Backup Add-on', srv.backup ? num(calc.srvT * 0.2) : 0, '']);
  SA.push(['Managed Backup', srv.backup ? 'Yes' : 'No', '', '', '', '']);
  SA.push(['', '', '', '', '', '']);
  SA.push(['VOLUME TIER', '', '', '', '', '']);
  SA.push(['Tier Name', calc.tier.label, '', 'Monthly Surcharge', num(calc.volSur), '']);
  SA.push(['Order Volume', Number(cfg.orders).toLocaleString('en-IN') + ' orders/mo', '', '', '', '']);
  SA.push(['', '', '', '', '', '']);
 
  if (selApis.length > 0) {
    SA.push(['API INTEGRATIONS', '', '', '', '', '']);
    SA.push(['#', 'API Service', 'Category', 'Provider Selected', 'Hits/mo', 'Monthly Cost (Rs.)']);
    selApis.forEach(function(a, i) {
      SA.push([i + 1, a.api.name, a.api.cat, a.api.p[a.p][0], a.hits, num(a.api.p[a.p][1])]);
    });
    SA.push(['', '', '', '', 'TOTAL API COST', num(calc.apiT)]);
  } else {
    SA.push(['API INTEGRATIONS', 'No APIs selected', '', '', '', '']);
  }
 
  var ws3 = makeSheet(SA, [
    { s:{r:0,c:0}, e:{r:0,c:5} },
    { s:{r:1,c:0}, e:{r:1,c:5} },
    { s:{r:3,c:0}, e:{r:3,c:5} },
  ], [22, 24, 22, 24, 14, 18]);
  XLSX.utils.book_append_sheet(wb, ws3, 'Server & APIs');
 
  // ══════════════════════════════════════════
  // SHEET 4 — PROFESSIONAL SERVICES
  // ══════════════════════════════════════════
  var PS = [];
  PS.push(['eTechCube LLP - Professional Services', '', '', '', '', '']);
  PS.push(['Quote for: ' + cfg.company + ' | Date: ' + date, '', '', '', '', '']);
  PS.push(['', '', '', '', '', '']);
 
  function addSection(title, roles, states) {
    var total = 0;
    PS.push([title, '', '', '', '', '']);
    PS.push(['Role', 'Description', 'Resources', 'Days', 'Day Rate (Rs.)', 'Total (Rs.)']);
    roles.forEach(function(r, i) {
      var res = (states[i] && states[i].res) || 0;
      var days = (states[i] && states[i].days) || 0;
      var rowTotal = r.rate * res * days;
      total += rowTotal;
      PS.push([r.role, r.note || '', res, days, num(r.rate), num(rowTotal)]);
    });
    PS.push(['', '', '', '', title + ' Total', num(total)]);
    PS.push(['', '', '', '', '', '']);
  }
 
  addSection('CUSTOM DEVELOPMENT', cdevRoles, cdevSt);
  addSection('IMPLEMENTATION', implRoles, implSt);
  addSection('TRAINING & ENABLEMENT', trainRoles, trnSt);
 
  PS.push(['GRAND TOTAL - PROFESSIONAL SERVICES', '', '', '', '', num(calc.ps)]);
  PS.push(['', '', '', '', 'Custom Dev', num(calc.cdT)]);
  PS.push(['', '', '', '', 'Implementation', num(calc.imT)]);
  PS.push(['', '', '', '', 'Training', num(calc.trT)]);
 
  var ws4 = makeSheet(PS, [
    { s:{r:0,c:0}, e:{r:0,c:5} },
    { s:{r:1,c:0}, e:{r:1,c:5} },
  ], [36, 28, 12, 10, 18, 18]);
  XLSX.utils.book_append_sheet(wb, ws4, 'Prof Services');
 
  var fname = 'eTechCube_Quote_' + (cfg.company || 'Customer').replace(/\s+/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.xlsx';
  XLSX.writeFile(wb, fname);
}
 