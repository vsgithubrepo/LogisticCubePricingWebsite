import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
 
const INR = n => `Rs.${Math.round(n).toLocaleString("en-IN")}`;
 
// Colors as explicit values — no spread operators
const C = {
  tealDark:  [10, 110, 104],
  teal:      [13, 148, 136],
  tealLight: [204, 251, 241],
  white:     [255, 255, 255],
  dark:      [15, 23, 42],
  dark2:     [30, 41, 59],
  slate:     [71, 85, 105],
  muted:     [148, 163, 184],
  gold:      [217, 119, 6],
  goldLight: [254, 243, 199],
  green:     [22, 163, 74],
  bg:        [248, 250, 252],
  bg2:       [241, 245, 249],
  border:    [226, 232, 240],
};
 
function fill(doc, color) { doc.setFillColor(color[0], color[1], color[2]); }
function stroke(doc, color) { doc.setDrawColor(color[0], color[1], color[2]); }
function textColor(doc, color) { doc.setTextColor(color[0], color[1], color[2]); }
 
export function exportPDF({ cfg, calc, mods, modList, srv, apiState, apiList,
  cdevSt, implSt, trnSt, cdevRoles, implRoles, trainRoles, PACKAGES, includeDetails = true }) {
 
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210, M = 14;
  const CW = PW - 2 * M;
 
  const selMods = modList.filter(m => mods[m.id]);
  const selApis = apiState.map((a,i) => ({...a, api: apiList[i]})).filter(a => a.on);
  const psRows = [
    ...cdevRoles.map((r,i) => cdevSt[i]?.res>0 && cdevSt[i]?.days>0
      ? {role:r.role, cat:'Custom Dev', res:cdevSt[i].res, days:cdevSt[i].days, rate:r.rate, total:r.rate*cdevSt[i].res*cdevSt[i].days} : null),
    ...implRoles.map((r,i) => implSt[i]?.res>0 && implSt[i]?.days>0
      ? {role:r.role, cat:'Implementation', res:implSt[i].res, days:implSt[i].days, rate:r.rate, total:r.rate*implSt[i].res*implSt[i].days} : null),
    ...trainRoles.map((r,i) => trnSt[i]?.res>0 && trnSt[i]?.days>0
      ? {role:r.role, cat:'Training', res:trnSt[i].res, days:trnSt[i].days, rate:r.rate, total:r.rate*trnSt[i].res*trnSt[i].days} : null),
  ].filter(Boolean);
 
  // ── Section title helper ──────────────────────────────────────────
  function sectionTitle(title, y) {
    fill(doc, C.teal);
    doc.rect(M, y, 3, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    textColor(doc, C.tealDark);
    doc.text(title, M + 6, y + 5);
    return y + 10;
  }
 
  // ════════════════════════════════════════════
  // PAGE 1 — COVER
  // ════════════════════════════════════════════
  fill(doc, C.tealDark);
  doc.rect(0, 0, PW, 42, 'F');
  fill(doc, [94, 234, 212]);
  doc.rect(0, 0, 5, 42, 'F');
 
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  textColor(doc, C.white);
  doc.text('eTechCube LLP', M + 6, 16);
 
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  textColor(doc, C.tealLight);
  doc.text('Logistics Cube \u2014 Pricing Quotation', M + 6, 24);
  doc.setTextColor(153, 246, 228);
  doc.text('www.etechcube.com  |  info@etechcube.com  |  +91-7280044001', PW - M, 24, { align: 'right' });
 
  // Ref badge
  fill(doc, [20, 184, 166]);
  doc.roundedRect(PW - M - 40, 28, 40, 10, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  textColor(doc, C.white);
  doc.text('Ref: ETC-' + Date.now().toString().slice(-6), PW - M - 20, 34.5, { align: 'center' });
 
  let y = 50;
 
  // Client info card
  fill(doc, C.bg);
  stroke(doc, C.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, CW, 30, 3, 3, 'FD');
  fill(doc, C.teal);
  doc.rect(M, y, 3, 30, 'F');
 
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  textColor(doc, C.slate);
  doc.text('PREPARED FOR', M + 8, y + 7);
  doc.text('PREPARED BY', M + 70, y + 7);
  doc.text('DATE', M + 130, y + 7);
  doc.text('BILLING', M + 160, y + 7);
 
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  textColor(doc, C.dark);
  doc.text(cfg.company || '\u2014', M + 8, y + 14);
  doc.text(cfg.preparedBy || '\u2014', M + 70, y + 14);
  doc.text(new Date().toLocaleDateString('en-IN'), M + 130, y + 14);
  doc.text(cfg.billing, M + 160, y + 14);
 
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  textColor(doc, C.slate);
  doc.text(cfg.contact || '', M + 8, y + 21);
  doc.text(cfg.email || '', M + 70, y + 21);
  doc.text('Orders: ' + Number(cfg.orders).toLocaleString('en-IN') + '/mo', M + 130, y + 21);
  doc.text('Term: ' + cfg.term + ' Year(s)', M + 160, y + 21);
  y += 36;
 
  // 4 cost summary tiles
  y = sectionTitle('PRICING SUMMARY', y);
  const cards = [
    { label: 'Software Modules',     value: INR(calc.modC),            sub: selMods.length + ' modules',  color: C.teal },
    { label: 'Server & Infra',       value: INR(calc.srvT),            sub: srv.provider + ' ' + srv.pkg, color: [124, 58, 237] },
    { label: 'Vol. Tier Surcharge',  value: INR(calc.volSur),          sub: calc.tier.label,              color: [14, 165, 233] },
    { label: 'API Integrations',     value: INR(calc.apiT),            sub: selApis.length + ' APIs',     color: [234, 88, 12] },
  ];
  const cw = (CW - 9) / 4;
  cards.forEach(function(card, i) {
    const cx = M + i * (cw + 3);
    fill(doc, C.bg);
    stroke(doc, C.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, y, cw, 22, 2, 2, 'FD');
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.rect(cx, y, cw, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    textColor(doc, C.slate);
    doc.text(card.label.toUpperCase(), cx + cw/2, y + 7, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(card.color[0], card.color[1], card.color[2]);
    doc.text(card.value, cx + cw/2, y + 14, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    textColor(doc, C.muted);
    doc.text(card.sub, cx + cw/2, y + 19, { align: 'center' });
  });
  y += 28;
 
  // Recurring vs one-time side by side
  var leftW = CW * 0.57;
  var rightX = M + leftW + 4;
  var rightW = CW * 0.43;
 
  fill(doc, C.bg);
  stroke(doc, C.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, leftW, 52, 3, 3, 'FD');
  doc.roundedRect(rightX, y, rightW, 52, 3, 3, 'FD');
 
  // Left header — teal
  fill(doc, C.teal);
  doc.roundedRect(M, y, leftW, 8, 3, 3, 'F');
  doc.rect(M, y + 4, leftW, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  textColor(doc, C.white);
  doc.text('MONTHLY RECURRING', M + 5, y + 5.5);
 
  var recRows = [
    ['Software Modules', INR(calc.modC)],
    ['Volume Tier Surcharge', INR(calc.volSur)],
    ['Server & Infrastructure', INR(calc.srvT)],
    ['API Integrations', INR(calc.apiT)],
    ['Monthly Subtotal', INR(calc.sub)],
  ];
  if (calc.disc > 0) recRows.push(['Annual Discount', '\u2013 ' + INR(calc.disc)]);
  recRows.push(['Total Recurring (' + cfg.billing + ')', INR(calc.rec)]);
 
  recRows.forEach(function(r, i) {
    var ry = y + 13 + i * 5.5;
    var isBold = i === recRows.length - 1;
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 8.5 : 8);
    textColor(doc, isBold ? C.dark : C.slate);
    doc.text(r[0], M + 5, ry);
    textColor(doc, isBold ? C.tealDark : C.dark2);
    doc.text(r[1], M + leftW - 4, ry, { align: 'right' });
    if (isBold) {
      stroke(doc, C.teal);
      doc.setLineWidth(0.3);
      doc.line(M + 4, ry - 3, M + leftW - 4, ry - 3);
    }
  });
 
  // Right header — gold
  fill(doc, C.gold);
  doc.roundedRect(rightX, y, rightW, 8, 3, 3, 'F');
  doc.rect(rightX, y + 4, rightW, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  textColor(doc, C.white);
  doc.text('ONE-TIME SERVICES', rightX + 5, y + 5.5);
 
  var otRows = [
    ['Custom Development', INR(calc.cdT)],
    ['Implementation', INR(calc.imT)],
    ['Training & Enablement', INR(calc.trT)],
    ['Total Prof. Services', INR(calc.ps)],
  ];
  otRows.forEach(function(r, i) {
    var ry = y + 13 + i * 5.5;
    var isBold = i === otRows.length - 1;
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 8.5 : 8);
    textColor(doc, isBold ? C.dark : C.slate);
    doc.text(r[0], rightX + 5, ry);
    doc.setTextColor(isBold ? C.gold[0] : C.dark2[0], isBold ? C.gold[1] : C.dark2[1], isBold ? C.gold[2] : C.dark2[2]);
    doc.text(r[1], rightX + rightW - 4, ry, { align: 'right' });
    if (isBold) {
      stroke(doc, C.gold);
      doc.setLineWidth(0.3);
      doc.line(rightX + 4, ry - 3, rightX + rightW - 4, ry - 3);
    }
  });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  textColor(doc, C.muted);
  doc.text('Contract: ' + cfg.term + ' yr | Eff. Monthly: ' + INR(calc.eff), rightX + 5, y + 46);
 
  y += 58;
 
  // Grand total banner
  fill(doc, C.tealDark);
  doc.roundedRect(M, y, CW, 26, 3, 3, 'F');
  fill(doc, [20, 184, 166]);
  doc.roundedRect(M, y, 6, 26, 3, 3, 'F');
  doc.rect(M + 3, y, 3, 26, 'F');
 
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  textColor(doc, C.white);
  doc.text('GRAND TOTAL', M + 12, y + 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(153, 246, 228);
  doc.text(cfg.billing + ' Recurring + One-Time  |  ' + Number(cfg.orders).toLocaleString('en-IN') + ' orders/mo', M + 12, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  textColor(doc, C.goldLight);
  doc.text(INR(calc.grand), PW - M - 4, y + 16, { align: 'right' });
 
  y += 32;
 
  // Modules by section summary
  if (selMods.length > 0) {
    var bySec = {};
    selMods.forEach(function(m) {
      if (!bySec[m.sec]) bySec[m.sec] = { count: 0, total: 0 };
      bySec[m.sec].count++;
      bySec[m.sec].total += m.price;
    });
    var secRows = Object.entries(bySec).map(function(entry) {
      return [entry[0], entry[1].count + ' modules', INR(entry[1].total) + '/mo'];
    });
    if (y > 220) { doc.addPage(); y = 15; }
    y = sectionTitle('MODULES BY SECTION (SUMMARY)', y);
    autoTable(doc, {
      startY: y, margin: { left: M, right: M },
      head: [['Section', 'Count', 'Monthly Cost']],
      body: secRows,
      foot: [['Total', selMods.length + ' modules', INR(calc.modC)]],
      headStyles: { fillColor: C.tealDark, textColor: C.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fillColor: C.bg, textColor: C.dark, fontSize: 8 },
      alternateRowStyles: { fillColor: C.bg2 },
      footStyles: { fillColor: C.dark, textColor: C.goldLight, fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 30 }, 2: { halign: 'right' } },
    });
    y = doc.lastAutoTable.finalY + 6;
  }
 
  // Server summary
  if (y > 230) { doc.addPage(); y = 15; }
  y = sectionTitle('SERVER & INFRASTRUCTURE', y);
  autoTable(doc, {
    startY: y, margin: { left: M, right: M },
    head: [['Component', 'Details', 'Cost']],
    body: [
      ['Cloud Provider', srv.provider, '\u2014'],
      ['Server Package', srv.pkg, INR(calc.srvT)],
      ['Additional Storage', srv.storageGB + ' GB', '\u2014'],
      ['Managed Backup', srv.backup ? 'Enabled' : 'Disabled', '\u2014'],
      ['Volume Tier', calc.tier.label, INR(calc.volSur)],
    ],
    foot: [['', 'Total Server + Volume Surcharge', INR(calc.srvT + calc.volSur)]],
    headStyles: { fillColor: C.tealDark, textColor: C.white, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fillColor: C.bg, textColor: C.dark, fontSize: 8 },
    alternateRowStyles: { fillColor: C.bg2 },
    footStyles: { fillColor: C.dark, textColor: C.goldLight, fontStyle: 'bold', fontSize: 9 },
    columnStyles: { 2: { halign: 'right', cellWidth: 35 } },
  });
  y = doc.lastAutoTable.finalY + 6;
 
  // Professional services
  if (psRows.length > 0) {
    if (y > 220) { doc.addPage(); y = 15; }
    y = sectionTitle('PROFESSIONAL SERVICES (ONE-TIME)', y);
    autoTable(doc, {
      startY: y, margin: { left: M, right: M },
      head: [['Role', 'Category', 'Res.', 'Days', 'Day Rate', 'Total']],
      body: psRows.map(function(r) { return [r.role, r.cat, r.res, r.days, INR(r.rate), INR(r.total)]; }),
      foot: [['', '', '', '', 'Total Prof. Services', INR(calc.ps)]],
      headStyles: { fillColor: C.tealDark, textColor: C.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fillColor: C.bg, textColor: C.dark, fontSize: 8 },
      alternateRowStyles: { fillColor: C.bg2 },
      footStyles: { fillColor: C.dark, textColor: C.goldLight, fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 5: { halign: 'right' }, 2: { halign: 'center', cellWidth: 12 }, 3: { halign: 'center', cellWidth: 12 } },
    });
    y = doc.lastAutoTable.finalY + 6;
  }
 
  // ════════════════════════════════════════════
  // DETAIL PAGES (optional)
  // ════════════════════════════════════════════
  if (includeDetails && selMods.length > 0) {
    doc.addPage();
    // Detail page header
    fill(doc, C.tealDark);
    doc.rect(0, 0, PW, 14, 'F');
    fill(doc, [94, 234, 212]);
    doc.rect(0, 0, 5, 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    textColor(doc, C.white);
    doc.text('eTechCube LLP \u2014 Software Modules Detail', M + 6, 9.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    textColor(doc, C.tealLight);
    doc.text(cfg.company + ' | ' + new Date().toLocaleDateString('en-IN'), PW - M, 9.5, { align: 'right' });
    y = 22;
    y = sectionTitle('SOFTWARE MODULES \u2014 FULL DETAIL', y);
    autoTable(doc, {
      startY: y, margin: { left: M, right: M },
      head: [['#', 'Module Name', 'Section', 'Monthly Price']],
      body: selMods.map(function(m, i) { return [i + 1, m.name, m.sec, INR(m.price)]; }),
      foot: [['', '', 'Total Modules Cost', INR(calc.modC)]],
      headStyles: { fillColor: C.tealDark, textColor: C.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fillColor: C.bg, textColor: C.dark, fontSize: 8 },
      alternateRowStyles: { fillColor: C.bg2 },
      footStyles: { fillColor: C.dark, textColor: C.goldLight, fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 0: { cellWidth: 10 }, 3: { halign: 'right', cellWidth: 32 } },
    });
    y = doc.lastAutoTable.finalY + 6;
 
    if (selApis.length > 0) {
      if (y > 220) { doc.addPage(); y = 15; }
      y = sectionTitle('API INTEGRATIONS \u2014 DETAIL', y);
      autoTable(doc, {
        startY: y, margin: { left: M, right: M },
        head: [['API Service', 'Category', 'Provider', 'Hits/mo', 'Cost']],
        body: selApis.map(function(a) { return [a.api.name, a.api.cat, a.api.p[a.p][0], a.hits.toLocaleString('en-IN'), INR(a.api.p[a.p][1])]; }),
        foot: [['', '', '', 'Total API Cost', INR(calc.apiT)]],
        headStyles: { fillColor: C.tealDark, textColor: C.white, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fillColor: C.bg, textColor: C.dark, fontSize: 8 },
        alternateRowStyles: { fillColor: C.bg2 },
        footStyles: { fillColor: C.dark, textColor: C.goldLight, fontStyle: 'bold', fontSize: 9 },
        columnStyles: { 4: { halign: 'right', cellWidth: 30 } },
      });
    }
  }
 
  // Footer on all pages
  var pageCount = doc.internal.getNumberOfPages();
  for (var i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    fill(doc, C.bg);
    doc.rect(0, 284, PW, 13, 'F');
    stroke(doc, C.border);
    doc.setLineWidth(0.3);
    doc.line(0, 284, PW, 284);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    textColor(doc, C.slate);
    doc.text('eTechCube LLP  |  Confidential Pricing Quotation  |  www.etechcube.com', M, 290);
    doc.text('Page ' + i + ' of ' + pageCount, PW - M, 290, { align: 'right' });
  }
 
  var fname = 'eTechCube_Quote_' + (cfg.company || 'Customer').replace(/\s+/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.pdf';
  doc.save(fname);
}
 