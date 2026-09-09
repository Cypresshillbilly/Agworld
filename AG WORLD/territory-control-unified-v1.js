// AG World Unified Territory Control v1
// Territory control is based on the Company's client ownership of BOTH Farms and Contractors.
(() => {
  'use strict';
  const type = v => String(v || '').toLowerCase().replace(/[\s_-]+/g,'');
  const list = kind => {
    const w = window.AG_WORLD_WORLD || {};
    if (kind === 'farm') return Array.isArray(window.__AG_WORLD_FARMS) ? window.__AG_WORLD_FARMS : (w.getFarms?.() || []);
    return w.getContractors?.() || window.__AG_WORLD_CONTRACTORS || [];
  };
  const control = entity => {
    const status = String(entity?.status || entity?.details?.status || '').toLowerCase();
    const owner = String(entity?.owner || entity?.details?.owner || '').toLowerCase();
    const customer = /customer|client|active customer|owned/.test(status) || /the company|company/.test(owner);
    const assets = [...(entity?.assets || []), ...(entity?.objects || [])].map(a => String(a?.type || a?.name || a?.label || '').toLowerCase());
    if (customer || assets.some(x => /our drone|company drone/.test(x))) return 'company';
    if (/competitor/.test(status) || /competitor/.test(owner) || assets.some(x => /competitor/.test(x))) return 'competitor';
    return 'neutral';
  };
  const territoryOf = e => e?.municipalityId || e?.details?.municipalityId || e?.territoryId || e?.details?.territoryId || e?.geographicRelationships?.context?.municipalityId || e?.details?.geographicRelationships?.context?.municipalityId || 'Unassigned';
  const aggregate = entities => {
    const total = entities.length;
    const company = entities.filter(e => control(e) === 'company').length;
    const competitor = entities.filter(e => control(e) === 'competitor').length;
    const neutral = total - company - competitor;
    return { total, company, competitor, neutral, companyPct: total ? Math.round(company / total * 1000) / 10 : 0, competitorPct: total ? Math.round(competitor / total * 1000) / 10 : 0, neutralPct: total ? Math.round(neutral / total * 1000) / 10 : 0 };
  };
  const summary = () => {
    const farms = list('farm').map(e => ({...e,type:'farm'}));
    const contractors = list('contractor').map(e => ({...e,type:'contractor'}));
    const all = [...farms, ...contractors];
    const farm = aggregate(farms), contractor = aggregate(contractors), combined = aggregate(all);
    return { farms:farm, contractors:contractor, combined, all };
  };
  const byTerritory = id => {
    const all = summary().all.filter(e => String(territoryOf(e)) === String(id));
    const farms = all.filter(e => type(e.type)==='farm');
    const contractors = all.filter(e => type(e.type)==='contractor');
    return { id, farms:aggregate(farms), contractors:aggregate(contractors), combined:aggregate(all), entities:all };
  };
  const publish = () => {
    const s=summary();
    window.AGWorldTerritoryControl = { ...(window.AGWorldTerritoryControl||{}), summary, byTerritory, control, territoryOf };
    window.dispatchEvent(new CustomEvent('agworld:territory-control-updated',{detail:s}));
    return s;
  };
  let publishQueued = false;
  const schedulePublish = () => {
    if (publishQueued) return;
    publishQueued = true;
    setTimeout(() => { publishQueued = false; publish(); }, 120);
  };
  ['agworld:entity-updated','agworld:dynamic-spatial-edit-request','agworld:relationship-created','agworld:relationship-updated','agworld:relationship-removed','agworld:contractor-created','agworld:contractor-updated','agworld:contractor-deleted'].forEach(name=>window.addEventListener(name,schedulePublish));
  publish();
})();