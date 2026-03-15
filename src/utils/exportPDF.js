import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const INR = n => `Rs.${Math.round(n).toLocaleString("en-IN")}`;

export function exportPDF({ cfg, calc, mods, modList, srv, apiState, apiList, cdevSt, implSt, trnSt, cdevRoles, implRoles, trainRoles, PACKAGES }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 15;
  let y = 15;

  // Header bar
  doc.setFillColor(6, 13, 24);
  doc.rect(0, 0, W, 30, 'F');
  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, 4, 30, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('eTechCube LLP', M + 4, 13);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(94, 234, 212);
  doc.text('Logistics Cube – Pricing Quotation', M + 4, 21);
  doc.setTextColor(148, 163, 184);
  doc.text(`www.etechcube.com  |  info@etechcube.com  |  +91-7280044001`, W - M, 21, { align: 'right' });

  y = 38;

  // Client info box
  doc.setFillColor(15, 31, 53);
  doc.roundedRect(M, y, W - 2*M, 28, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('PREPARED FOR', M + 6, y + 7);
  doc.text('PREPARED BY', 100, y + 7);
  doc.text('DATE', W - M - 6, y + 7, { align: 'right' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(cfg.company || '—', M + 6, y + 14);
  doc.text(cfg.preparedBy || '—', 100, y + 14);
  doc.text(new Date().toLocaleDateString('en-IN'), W - M - 6, y + 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(cfg.contact || '', M + 6, y + 21);
  doc.text(`Billing: ${cfg.billing} | Orders: ${cfg.orders.toLocaleString('en-IN')}/mo | Term: ${cfg.term}yr`, 100, y + 21);

  y += 34;

  // Section: Selected Modules
  const selMods = modList.filter(m => mods[m.id]);
  if (selMods.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 184, 166);
    doc.text('SOFTWARE MODULES', M, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      margin: { left: M, right: M },
      head: [['#','Module Name','Section','Monthly Price']],
      body: selMods.map((m,i) => [i+1, m.name, m.sec, INR(m.price)]),
      headStyles: { fillColor:[10,21,37], textColor:[94,234,212], fontSize:8, fontStyle:'bold' },
      bodyStyles: { fillColor:[15,31,53], textColor:[203,213,225], fontSize:8 },
      alternateRowStyles: { fillColor:[22,40,64] },
      columnStyles: { 0:{cellWidth:10}, 3:{halign:'right',cellWidth:30} },
      foot: [['' ,'','Total Modules Cost', INR(calc.modC)]],
      footStyles: { fillColor:[6,13,24], textColor:[245,158,11], fontStyle:'bold', fontSize:9 },
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // Section: Server
  if (y > 240) { doc.addPage(); y = 15; }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 184, 166);
  doc.text('SERVER & INFRASTRUCTURE', M, y);
  y += 4;
  autoTable(doc, {
    startY: y, margin: { left: M, right: M },
    head: [['Component','Details','Monthly Cost']],
    body: [
      ['Cloud Provider', srv.provider, ''],
      ['Server Package', `${srv.pkg} (${PACKAGES.indexOf(srv.pkg) >= 0 ? ['2vCPU/4GB','4vCPU/8GB','8vCPU/16GB','16vCPU/32GB','32vCPU/64GB','64vCPU/128GB'][PACKAGES.indexOf(srv.pkg)] : ''})`, INR((([2900,5800,11600,23200,46400,87500])[PACKAGES.indexOf(srv.pkg)] || 0))],
      ['Storage Add-on', `${srv.storageGB} GB`, ''],
      ['Backup', srv.backup ? 'Enabled' : 'Disabled', ''],
      ['Volume Tier', calc.tier.label, INR(calc.volSur)],
    ],
    foot: [['','Total Server + Volume Surcharge', INR(calc.srvT + calc.volSur)]],
    headStyles:{fillColor:[10,21,37],textColor:[94,234,212],fontSize:8,fontStyle:'bold'},
    bodyStyles:{fillColor:[15,31,53],textColor:[203,213,225],fontSize:8},
    footStyles:{fillColor:[6,13,24],textColor:[245,158,11],fontStyle:'bold',fontSize:9},
    columnStyles:{2:{halign:'right'}},
  });
  y = doc.lastAutoTable.finalY + 6;

  // Section: APIs
  const selApis = apiState.map((a,i)=>({...a,api:apiList[i]})).filter(a=>a.on);
  if (selApis.length > 0) {
    if (y > 220) { doc.addPage(); y = 15; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 184, 166);
    doc.text('API INTEGRATIONS', M, y);
    y += 4;
    autoTable(doc, {
      startY: y, margin: { left: M, right: M },
      head: [['API Service','Provider','Hits/mo','Monthly Cost']],
      body: selApis.map(a => [a.api.name, a.api.p[a.p][0], a.hits, INR(a.api.p[a.p][1])]),
      foot: [['','','Total API Cost', INR(calc.apiT)]],
      headStyles:{fillColor:[10,21,37],textColor:[94,234,212],fontSize:8,fontStyle:'bold'},
      bodyStyles:{fillColor:[15,31,53],textColor:[203,213,225],fontSize:8},
      footStyles:{fillColor:[6,13,24],textColor:[245,158,11],fontStyle:'bold',fontSize:9},
      columnStyles:{3:{halign:'right'}},
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // Professional Services
  if (y > 200) { doc.addPage(); y = 15; }
  const psRows = [
    ...cdevRoles.map((r,i)=>cdevSt[i]?.res>0&&cdevSt[i]?.days>0?[r.role,'Custom Dev',cdevSt[i].res,cdevSt[i].days,INR(r.rate),INR(r.rate*cdevSt[i].res*cdevSt[i].days)]:null),
    ...implRoles.map((r,i)=>implSt[i]?.res>0&&implSt[i]?.days>0?[r.role,'Implementation',implSt[i].res,implSt[i].days,INR(r.rate),INR(r.rate*implSt[i].res*implSt[i].days)]:null),
    ...trainRoles.map((r,i)=>trnSt[i]?.res>0&&trnSt[i]?.days>0?[r.role,'Training',trnSt[i].res,trnSt[i].days,INR(r.rate),INR(r.rate*trnSt[i].res*trnSt[i].days)]:null),
  ].filter(Boolean);
  if (psRows.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 184, 166);
    doc.text('PROFESSIONAL SERVICES (ONE-TIME)', M, y);
    y += 4;
    autoTable(doc, {
      startY: y, margin: { left: M, right: M },
      head: [['Role','Category','Resources','Days','Day Rate','Total']],
      body: psRows,
      foot: [['','','','','Total Prof. Services', INR(calc.ps)]],
      headStyles:{fillColor:[10,21,37],textColor:[94,234,212],fontSize:8,fontStyle:'bold'},
      bodyStyles:{fillColor:[15,31,53],textColor:[203,213,225],fontSize:8},
      footStyles:{fillColor:[6,13,24],textColor:[245,158,11],fontStyle:'bold',fontSize:9},
      columnStyles:{5:{halign:'right'}},
    });
    y = doc.lastAutoTable.finalY + 6;
  }

  // Grand Total box
  if (y > 240) { doc.addPage(); y = 15; }
  y += 4;
  doc.setFillColor(6, 13, 24);
  doc.roundedRect(M, y, W-2*M, 36, 3, 3, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.roundedRect(M, y, W-2*M, 36, 3, 3, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  const rows = [
    ['Monthly Subtotal (Recurring)', INR(calc.sub)],
    cfg.disc > 0 ? [`Annual Discount (${15}%)`, `– ${INR(calc.disc)}`] : null,
    [`Total Recurring (${cfg.billing})`, INR(calc.rec)],
    ['Professional Services (One-time)', INR(calc.ps)],
  ].filter(Boolean);
  rows.forEach((r, i) => {
    doc.text(r[0], M + 6, y + 8 + i * 6);
    doc.text(r[1], W - M - 6, y + 8 + i * 6, { align: 'right' });
  });
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.3);
  doc.line(M + 6, y + 26, W - M - 6, y + 26);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(245, 158, 11);
  doc.text('GRAND TOTAL', M + 6, y + 33);
  doc.setFontSize(14);
  doc.text(INR(calc.grand), W - M - 6, y + 33, { align: 'right' });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`eTechCube LLP | Confidential Pricing Quotation | Page ${i} of ${pageCount}`, W/2, 290, { align: 'center' });
  }

  const fname = `eTechCube_Quote_${(cfg.company||'Customer').replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(fname);
}
