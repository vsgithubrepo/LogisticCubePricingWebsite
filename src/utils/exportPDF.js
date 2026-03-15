import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const INR = n => `Rs.${Math.round(n).toLocaleString("en-IN")}`;
const TEAL = [13, 148, 136];
const TEAL_DARK = [10, 110, 104];
const TEAL_LIGHT = [204, 251, 241];
const DARK = [15, 23, 42];
const DARK2 = [30, 41, 59];
const SLATE = [71, 85, 105];
const MUTED = [148, 163, 184];
const WHITE = [255, 255, 255];
const GOLD = [217, 119, 6];
const GOLD_LIGHT = [254, 243, 199];
const GREEN = [22, 163, 74];

export function exportPDF({ cfg, calc, mods, modList, srv, apiState, apiList,
  cdevSt, implSt, trnSt, cdevRoles, implRoles, trainRoles, PACKAGES, includeDetails = true }) {

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW = 210, M = 14;
  const CW = PW - 2 * M;
  const selMods = modList.filter(m => mods[m.id]);
  const selApis = apiState.map((a,i)=>({...a,api:apiList[i]})).filter(a=>a.on);
  const psRows = [
    ...cdevRoles.map((r,i)=>cdevSt[i]?.res>0&&cdevSt[i]?.days>0?{role:r.role,cat:'Custom Dev',res:cdevSt[i].res,days:cdevSt[i].days,rate:r.rate,total:r.rate*cdevSt[i].res*cdevSt[i].days}:null),
    ...implRoles.map((r,i)=>implSt[i]?.res>0&&implSt[i]?.days>0?{role:r.role,cat:'Implementation',res:implSt[i].res,days:implSt[i].days,rate:r.rate,total:r.rate*implSt[i].res*implSt[i].days}:null),
    ...trainRoles.map((r,i)=>trnSt[i]?.res>0&&trnSt[i]?.days>0?{role:r.role,cat:'Training',res:trnSt[i].res,days:trnSt[i].days,rate:r.rate,total:r.rate*trnSt[i].res*trnSt[i].days}:null),
  ].filter(Boolean);

  // ════════════════════════════════════════════
  // PAGE 1 — COVER / SUMMARY
  // ════════════════════════════════════════════

  // Full-width teal header band
  doc.setFillColor(...TEAL_DARK);
  doc.rect(0, 0, PW, 42, 'F');
  // Left accent stripe
  doc.setFillColor(94, 234, 212);
  doc.rect(0, 0, 5, 42, 'F');

  // Company name & tagline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text('eTechCube LLP', M + 6, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(204, 251, 241);
  doc.text('Logistics Cube — Pricing Quotation', M + 6, 24);
  doc.setTextColor(153, 246, 228);
  doc.text('www.etechcube.com  |  info@etechcube.com  |  +91-7280044001', PW - M, 24, { align: 'right' });

  // Quote ref badge
  doc.setFillColor(20, 184, 166);
  doc.roundedRect(PW - M - 40, 28, 40, 10, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text(`Ref: ETC-${Date.now().toString().slice(-6)}`, PW - M - 20, 34.5, { align: 'center' });

  let y = 50;

  // ── Client info card ──
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, CW, 30, 3, 3, 'FD');
  // Teal left border
  doc.setFillColor(...TEAL);
  doc.rect(M, y, 3, 30, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...SLATE);
  doc.text('PREPARED FOR', M + 8, y + 7);
  doc.text('PREPARED BY', M + 70, y + 7);
  doc.text('DATE', M + 130, y + 7);
  doc.text('BILLING', M + 160, y + 7);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(cfg.company || '—', M + 8, y + 14);
  doc.text(cfg.preparedBy || '—', M + 70, y + 14);
  doc.text(new Date().toLocaleDateString('en-IN'), M + 130, y + 14);
  doc.text(cfg.billing, M + 160, y + 14);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...SLATE);
  doc.text(cfg.contact || '', M + 8, y + 21);
  doc.text(cfg.email || '', M + 70, y + 21);
  doc.text(`Orders: ${Number(cfg.orders).toLocaleString('en-IN')}/mo`, M + 130, y + 21);
  doc.text(`Term: ${cfg.term} Year(s)`, M + 160, y + 21);

  y += 36;

  // ── Section title helper ──
  function sectionTitle(title, yPos) {
    doc.setFillColor(...TEAL);
    doc.rect(M, yPos, 3, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...TEAL_DARK);
    doc.text(title, M + 6, yPos + 5);
    return yPos + 10;
  }

  // ── Cost summary cards row ──
  y = sectionTitle('PRICING SUMMARY', y);

  const cards = [
    { label: 'Software Modules', value: INR(calc.modC), sub: `${selMods.length} modules selected`, color: TEAL },
    { label: 'Server & Infrastructure', value: INR(calc.srvT), sub: `${srv.provider} ${srv.pkg}`, color: [124, 58, 237] },
    { label: 'Vol. Tier Surcharge', value: INR(calc.volSur), sub: calc.tier.label, color: [14, 165, 233] },
    { label: 'API Integrations', value: INR(calc.apiT), sub: `${selApis.length} APIs enabled`, color: [234, 88, 12] },
  ];
  const cw = (CW - 9) / 4;
  cards.forEach((c, i) => {
    const cx = M + i * (cw + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(cx, y, cw, 22, 2, 2, 'FD');
    doc.setFillColor(...c.color);
    doc.rect(cx, y, cw, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...SLATE);
    doc.text(c.label.toUpperCase(), cx + cw/2, y + 7, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...c.color);
    doc.text(c.value, cx + cw/2, y + 14, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(c.sub, cx + cw/2, y + 19, { align: 'center' });
  });
  y += 28;

  // ── Recurring vs one-time breakdown ──
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, CW * 0.57, 52, 3, 3, 'FD');
  doc.roundedRect(M + CW * 0.57 + 4, y, CW * 0.43, 52, 3, 3, 'FD');

  // Left: recurring
  doc.setFillColor(...TEAL);
  doc.roundedRect(M, y, CW * 0.57, 8, 3, 3, 'F');
  doc.rect(M, y + 4, CW * 0.57, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('MONTHLY RECURRING', M + 5, y + 5.5);

  const recRows = [
    ['Software Modules', INR(calc.modC)],
    ['Volume Tier Surcharge', INR(calc.volSur)],
    ['Server & Infrastructure', INR(calc.srvT)],
    ['API Integrations', INR(calc.apiT)],
    ['Monthly Subtotal', INR(calc.sub)],
  ];
  if (calc.disc > 0) recRows.push([`Annual Discount`, `– ${INR(calc.disc)}`]);
  recRows.push([`Total Recurring (${cfg.billing})`, INR(calc.rec)]);

  recRows.forEach((r, i) => {
    const ry = y + 13 + i * 5.5;
    const isBold = i === recRows.length - 1;
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 8.5 : 8);
    doc.setTextColor(isBold ? ...DARK : ...SLATE);
    doc.text(r[0], M + 5, ry);
    doc.setTextColor(isBold ? ...TEAL_DARK : ...DARK2);
    doc.text(r[1], M + CW * 0.57 - 4, ry, { align: 'right' });
    if (isBold) {
      doc.setDrawColor(...TEAL);
      doc.setLineWidth(0.3);
      doc.line(M + 4, ry - 3, M + CW * 0.57 - 4, ry - 3);
    }
  });

  // Right: one-time + grand total
  const rx2 = M + CW * 0.57 + 4;
  const rw2 = CW * 0.43;
  doc.setFillColor(217, 119, 6);
  doc.roundedRect(rx2, y, rw2, 8, 3, 3, 'F');
  doc.rect(rx2, y + 4, rw2, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('ONE-TIME SERVICES', rx2 + 5, y + 5.5);

  const otRows = [
    ['Custom Development', INR(calc.cdT)],
    ['Implementation', INR(calc.imT)],
    ['Training & Enablement', INR(calc.trT)],
    ['Total Prof. Services', INR(calc.ps)],
  ];
  otRows.forEach((r, i) => {
    const ry = y + 13 + i * 5.5;
    const isBold = i === otRows.length - 1;
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 8.5 : 8);
    doc.setTextColor(isBold ? ...DARK : ...SLATE);
    doc.text(r[0], rx2 + 5, ry);
    doc.setTextColor(isBold ? GOLD[0] : ...DARK2);
    doc.text(r[1], rx2 + rw2 - 4, ry, { align: 'right' });
    if (isBold) {
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.3);
      doc.line(rx2 + 4, ry - 3, rx2 + rw2 - 4, ry - 3);
    }
  });

  // Contract term info
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(`Contract: ${cfg.term} Year(s) | Effective Monthly: ${INR(calc.eff)}`, rx2 + 5, y + 46);

  y += 58;

  // ── GRAND TOTAL BANNER ──
  doc.setFillColor(...TEAL_DARK);
  doc.roundedRect(M, y, CW, 26, 3, 3, 'F');
  doc.setFillColor(20, 184, 166);
  doc.roundedRect(M, y, 6, 26, 3, 3, 'F');
  doc.rect(M + 3, y, 3, 26, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...WHITE);
  doc.text('GRAND TOTAL', M + 12, y + 10);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(153, 246, 228);
  doc.text(`${cfg.billing} Recurring + One-Time Services | ${cfg.orders.toLocaleString('en-IN')} orders/mo`, M + 12, y + 18);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(254, 243, 199);
  doc.text(INR(calc.grand), PW - M - 4, y + 16, { align: 'right' });

  y += 32;

  // ── Selected modules section summary (always shown) ──
  if (selMods.length > 0) {
    // Group by section
    const bySec = {};
    selMods.forEach(m => { if (!bySec[m.sec]) bySec[m.sec] = { count: 0, total: 0 }; bySec[m.sec].count++; bySec[m.sec].total += m.price; });
    const secRows = Object.entries(bySec).map(([sec, d]) => [sec, d.count + ' modules', INR(d.total) + '/mo']);
    if (y > 220) { doc.addPage(); y = 15; }
    y = sectionTitle('MODULES BY SECTION (SUMMARY)', y);
    autoTable(doc, {
      startY: y, margin: { left: M, right: M },
      head: [['Section', 'Count', 'Monthly Cost']],
      body: secRows,
      foot: [['Total', `${selMods.length} modules`, INR(calc.modC)]],
      headStyles: { fillColor: TEAL_DARK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fillColor: [248, 250, 252], textColor: DARK, fontSize: 8 },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      footStyles: { fillColor: DARK, textColor: GOLD_LIGHT, fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 30 }, 2: { halign: 'right' } },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // ── Server summary (always shown) ──
  if (y > 230) { doc.addPage(); y = 15; }
  y = sectionTitle('SERVER & INFRASTRUCTURE', y);
  autoTable(doc, {
    startY: y, margin: { left: M, right: M },
    head: [['Component', 'Details', 'Cost']],
    body: [
      ['Cloud Provider', srv.provider, '—'],
      ['Server Package', `${srv.pkg}`, INR((Object.values(({AWS:[2900,5800,11600,23200,46400,87500],Azure:[3100,6200,12400,24800,49600,93600],GCP:[2800,5500,11000,22000,44000,83000],DigitalOcean:[2200,4400,8700,17400,34800,65700],Hetzner:[1400,2800,5600,11200,22400,42300],Hostinger:[1200,2500,5000,10000,20000,37800]})[srv.provider]||[])[PACKAGES.indexOf(srv.pkg)]||0)],
      ['Additional Storage', `${srv.storageGB} GB`, srv.storageGB > 0 ? INR(srv.storageGB * 8.3) : '—'],
      ['Managed Backup', srv.backup ? 'Enabled' : 'Disabled', srv.backup ? 'Included' : '—'],
      ['Volume Tier', calc.tier.label, INR(calc.volSur)],
    ],
    foot: [['', 'Total Server + Volume Surcharge', INR(calc.srvT + calc.volSur)]],
    headStyles: { fillColor: TEAL_DARK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fillColor: [248, 250, 252], textColor: DARK, fontSize: 8 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    footStyles: { fillColor: DARK, textColor: GOLD_LIGHT, fontStyle: 'bold', fontSize: 9 },
    columnStyles: { 2: { halign: 'right', cellWidth: 35 } },
  });
  y = doc.lastAutoTable.finalY + 6;

  // ── Professional services summary ──
  if (psRows.length > 0) {
    if (y > 220) { doc.addPage(); y = 15; }
    y = sectionTitle('PROFESSIONAL SERVICES (ONE-TIME)', y);
    autoTable(doc, {
      startY: y, margin: { left: M, right: M },
      head: [['Role', 'Category', 'Res.', 'Days', 'Day Rate', 'Total']],
      body: psRows.map(r => [r.role, r.cat, r.res, r.days, INR(r.rate), INR(r.total)]),
      foot: [['', '', '', '', 'Total Prof. Services', INR(calc.ps)]],
      headStyles: { fillColor: TEAL_DARK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fillColor: [248, 250, 252], textColor: DARK, fontSize: 8 },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      footStyles: { fillColor: DARK, textColor: GOLD_LIGHT, fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 5: { halign: 'right' }, 2: { halign: 'center', cellWidth: 12 }, 3: { halign: 'center', cellWidth: 12 } },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // ════════════════════════════════════════════
  // DETAIL PAGES (optional)
  // ════════════════════════════════════════════
  if (includeDetails && selMods.length > 0) {
    doc.addPage(); y = 15;

    // Detail page header
    doc.setFillColor(...TEAL_DARK);
    doc.rect(0, 0, PW, 14, 'F');
    doc.setFillColor(94, 234, 212);
    doc.rect(0, 0, 5, 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...WHITE);
    doc.text('eTechCube LLP — Software Modules Detail', M + 6, 9.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(204, 251, 241);
    doc.text(`${cfg.company} | ${new Date().toLocaleDateString('en-IN')}`, PW - M, 9.5, { align: 'right' });
    y = 22;

    y = sectionTitle('SOFTWARE MODULES — FULL DETAIL', y);
    autoTable(doc, {
      startY: y, margin: { left: M, right: M },
      head: [['#', 'Module Name', 'Section', 'Monthly Price']],
      body: selMods.map((m, i) => [i + 1, m.name, m.sec, INR(m.price)]),
      foot: [['', '', 'Total Modules Cost', INR(calc.modC)]],
      headStyles: { fillColor: TEAL_DARK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fillColor: [248, 250, 252], textColor: DARK, fontSize: 8 },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      footStyles: { fillColor: DARK, textColor: GOLD_LIGHT, fontStyle: 'bold', fontSize: 9 },
      columnStyles: { 0: { cellWidth: 10 }, 3: { halign: 'right', cellWidth: 32 } },
    });
    y = doc.lastAutoTable.finalY + 6;

    // APIs detail
    if (selApis.length > 0) {
      if (y > 220) { doc.addPage(); y = 15; }
      y = sectionTitle('API INTEGRATIONS — DETAIL', y);
      autoTable(doc, {
        startY: y, margin: { left: M, right: M },
        head: [['API Service', 'Category', 'Provider', 'Hits/mo', 'Cost']],
        body: selApis.map(a => [a.api.name, a.api.cat, a.api.p[a.p][0], a.hits.toLocaleString('en-IN'), INR(a.api.p[a.p][1])]),
        foot: [['', '', '', 'Total API Cost', INR(calc.apiT)]],
        headStyles: { fillColor: TEAL_DARK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fillColor: [248, 250, 252], textColor: DARK, fontSize: 8 },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        footStyles: { fillColor: DARK, textColor: GOLD_LIGHT, fontStyle: 'bold', fontSize: 9 },
        columnStyles: { 4: { halign: 'right', cellWidth: 30 } },
      });
    }
  }

  // ── Footer on all pages ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 284, PW, 13, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(0, 284, PW, 284);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE);
    doc.text('eTechCube LLP  |  Confidential Pricing Quotation  |  www.etechcube.com', M, 290);
    doc.text(`Page ${i} of ${pageCount}`, PW - M, 290, { align: 'right' });
  }

  const fname = `eTechCube_Quote_${(cfg.company || 'Customer').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fname);
}
