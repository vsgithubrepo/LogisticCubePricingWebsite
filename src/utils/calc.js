export function getVolTier(orders, volTiers) {
  return volTiers.find(t => orders >= t.min && orders <= t.max) || volTiers[0];
}

export function getApiSlab(hits, apiSlabs, freeHits) {
  if (hits <= freeHits) return apiSlabs[0];
  return [...apiSlabs].reverse().find(s => hits >= s.from) || apiSlabs[0];
}

export function calcTotals({ cfg, mods, modList, srv, srvPrices, storCost, apiState, apiList, apiSlabs, volTiers, gbl, cdevSt, implSt, trnSt, cdevRoles, implRoles, trainRoles, PACKAGES }) {
  const tier   = getVolTier(cfg.orders, volTiers);
  const modC   = modList.reduce((s,m) => s + (mods[m.id] ? m.price : 0), 0);
  const baseSrv= (srvPrices[srv.provider] || [])[PACKAGES.indexOf(srv.pkg)] || 0;
  const storC  = (storCost[srv.provider] || 0) * (srv.storageGB / 100);
  const bkpC   = srv.backup ? baseSrv * gbl.backupPct : 0;
  const srvT   = baseSrv + storC + bkpC;
  const apiT   = apiState.reduce((s,a,i) => {
    if (!a.on) return s;
    const slab = getApiSlab(a.hits, apiSlabs, gbl.freeApiHits);
    return s + (apiList[i]?.p[a.p]?.[1] || 0) + slab.surcharge;
  }, 0);
  const sub    = modC + tier.surcharge + srvT + apiT;
  const disc   = cfg.billing === "Annual" ? sub * gbl.annualDiscount : 0;
  const rec    = cfg.billing === "Annual" ? (sub - disc) * 12 : sub;
  const cdT    = cdevRoles.reduce((s,r,i) => s + r.rate*(cdevSt[i]?.res||0)*(cdevSt[i]?.days||0), 0);
  const imT    = implRoles.reduce((s,r,i) => s + r.rate*(implSt[i]?.res||0)*(implSt[i]?.days||0), 0);
  const trT    = trainRoles.reduce((s,r,i)=> s + r.rate*(trnSt[i]?.res||0)*(trnSt[i]?.days||0), 0);
  const ps     = cdT + imT + trT;
  return {
    modC, srvT, apiT, volSur: tier.surcharge, sub, disc, rec,
    cdT, imT, trT, ps, grand: rec + ps, tier,
    eff: cfg.billing === "Annual" ? rec / 12 : rec,
    selM: Object.values(mods).filter(Boolean).length,
    selA: apiState.filter(a => a.on).length,
  };
}
