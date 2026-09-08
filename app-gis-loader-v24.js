const CONFIG = window.AG_WORLD_CONFIG || {};
// World data mode is selected before this loader starts. Demo mode shows the
// controlled testing population; user mode excludes records marked as demo.
window.AG_WORLD_DEMO_MODE = window.AGWorldWorldDataMode
  ? window.AGWorldWorldDataMode.isDemoMode()
  : true;

function shouldIncludeWorldRecord(type, record) {
  return window.AGWorldWorldDataMode?.shouldInclude
    ? window.AGWorldWorldDataMode.shouldInclude(type, record)
    : true;
}

let farms = [];
let territories = [];
let countries = [];
let municipalities = [];
let towns = [];
let territoryMarkers = [];
let map = null;
let selected = null;
let editingFarmId = null;
let newBoundary = [];
let boundaryPolygon = null;
let creatingFarm = false;
let placingObjectType = null;
let draftObjects = [];
let drawListener = null;
let objectMarkers = [];
let scene = null, renderer = null, camera = null, animationId = null, sceneFarm = null, sceneObjects = [];

const $ = id => document.getElementById(id);
const OBJECT_TYPES = {
  'crop-field': { label: 'Crop field', icon: '🌾', fields: ['Crop type', 'Area (ha)', 'Season'] },
  dam: { label: 'Dam / water', icon: '◉', fields: ['Water type', 'Capacity / size'] },
  building: { label: 'Building', icon: '⌂', fields: ['Building type', 'Purpose'] },
  tractor: { label: 'Tractor', icon: '▣', fields: ['Make / model', 'Hours', 'Status'] },
  drone: { label: 'Company drone', icon: '✦', fields: ['Model', 'Serial number', 'Status'] },
  'competitor-drone': { label: 'Competitor drone', icon: '◇', fields: ['Brand / model', 'Owner / operator', 'Status'] },
  'livestock-area': { label: 'Livestock area', icon: '♢', fields: ['Livestock type', 'Estimated head'] },
  irrigation: { label: 'Irrigation', icon: '≈', fields: ['System type', 'Area served (ha)', 'Status'] }
};

const toast = message => {
  const t = $('toast');
  if (!t) return;
  t.textContent = message;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
};

function cleanFarm(farm) {
  // Google Maps overlay objects contain circular references. Remove runtime-only
  // map objects BEFORE serialising the farm, not afterwards.
  const seen = new WeakSet();
  const sanitize = value => {
    if (value === null || value === undefined) return value ?? null;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
    if (typeof value === 'function') return undefined;
    if (value instanceof Date) return value.toISOString();
    if (typeof value !== 'object') return undefined;
    if (seen.has(value)) return undefined;
    seen.add(value);

    if (Array.isArray(value)) {
      return value.map(sanitize).filter(v => v !== undefined);
    }

    const output = {};
    Object.entries(value).forEach(([key, child]) => {
      // Runtime map overlays/listeners and other private implementation fields
      // must never enter localStorage or the Supabase JSON payload.
      if (key === '_polygon' || key === '_marker' || key === '_gm' ||
          key === '__gm' || key === 'map' || key === 'listener') return;
      const cleaned = sanitize(child);
      if (cleaned !== undefined) output[key] = cleaned;
    });
    return output;
  };
  return sanitize(farm) || {};
}

function saveLocal() {
  localStorage.setItem('agworld-farms-v2', JSON.stringify(farms.map(cleanFarm)));
  refreshTerritoryControl();
}

// The Supabase farms table is the source of truth for farm information.
// Generated demo data is only the initial fallback used when no database row exists.
const FARM_DB_URL = 'https://vcnkspaljmsjvonftfcw.supabase.co';
const FARM_DB_KEY = 'sb_publishable_azAO3PoKko79ccwSJFjkhQ_L67ZM85o';
let farmDbClient;
const getFarmDb = () => farmDbClient || (farmDbClient = window.supabase?.createClient?.(FARM_DB_URL, FARM_DB_KEY));

async function loadFarmDatabaseOverrides() {
  const db = getFarmDb();
  // Shared farms are world data. Reading them must not depend on a particular
  // player's profile initialising first.
  if (!db) return false;

  const { data, error } = await db.from('farms')
    .select('id,name,owner,region,status,annual_harvest,last_service,opportunity_score,source,notes,details,updated_at')
    .order('updated_at', { ascending: true });
  if (error) { console.warn('Farm database load failed', error); return false; }

  const rows = (Array.isArray(data) ? data : []).filter(row => shouldIncludeWorldRecord('farm', row));
  const byId = new Map(rows.map(row => [String(row.id), row]));
  const existingIds = new Set(farms.map(farm => String(farm.id)));
  let changed = false;

  const hydrateRow = (row, base = {}) => {
    const details = row.details && typeof row.details === 'object' ? row.details : {};
    return {
      ...base,
      ...details,
      id: String(row.id),
      name: row.name || details.name || base.name || 'Unnamed Farm',
      owner: row.owner ?? details.owner ?? base.owner ?? '',
      region: row.region ?? details.region ?? base.region ?? '',
      status: row.status ?? details.status ?? base.status ?? 'Prospect',
      annualHarvest: row.annual_harvest ?? details.annualHarvest ?? base.annualHarvest,
      lastService: row.last_service ?? details.lastService ?? base.lastService,
      opportunityScore: Number(row.opportunity_score ?? details.opportunityScore ?? base.opportunityScore ?? 0),
      source: row.source || details.source || base.source || 'manual',
      notes: row.notes ?? details.notes ?? base.notes,
      updatedAt: row.updated_at || details.updatedAt || base.updatedAt
    };
  };

  farms.forEach((farm, index) => {
    const row = byId.get(String(farm.id));
    if (!row) return;
    farms[index] = hydrateRow(row, farm);
    changed = true;
  });

  // A newly created farm is not part of the generated demo set. It must be
  // reconstructed from the canonical Farms database after every refresh,
  // otherwise demo seeding would make it disappear.
  rows.forEach(row => {
    if (existingIds.has(String(row.id))) return;
    const farm = hydrateRow(row);
    if (!Array.isArray(farm.boundary) || farm.boundary.length < 3) return;
    if (!farm.center) farm.center = centroid(farm.boundary);
    farms.push(farm);
    existingIds.add(String(row.id));
    changed = true;
    if (map) {
      try { addFarm(farm); } catch (error) { console.warn('Database farm map add failed', error); }
    }
  });

  if (changed) {
    window.__AG_WORLD_FARMS = farms;
    saveLocal();
    window.dispatchEvent(new CustomEvent('agworld:farm-database-loaded', { detail: { farms } }));
  }

  // Always re-render the map layer from the canonical database-hydrated farm
  // collection. This prevents an older demo reseed from visually overwriting
  // a database update after the page refresh.
  if (map && farms.length) {
    try {
      farms.forEach(farm => addFarm(farm));
      refreshMapVisibility();
    } catch (error) {
      console.warn('Farm database render refresh failed', error);
    }
  }
  return changed;
}

async function saveFarmToDatabase(farm, beforeState) {
  const db = getFarmDb();
  const user = window.AGWorldBackend?.getUser?.();
  if (!db || !user) throw new Error('You must be signed in to save a farm record.');

  const details = cleanFarm(farm);
  const id = String(farm.id);
  const now = new Date().toISOString();

  // Only send columns that actually belong to the existing farms table.
  // The full editable record lives in details, making details the authoritative
  // field-by-field source for the Farm Information panel.
  const row = {
    id,
    name: farm.name,
    owner: farm.owner || null,
    region: farm.region || null,
    status: farm.status || 'Prospect',
    annual_harvest: farm.annualHarvest || null,
    last_service: /^\d{4}-\d{2}-\d{2}$/.test(String(farm.lastService || '')) ? farm.lastService : null,
    opportunity_score: Number(farm.opportunityScore || 0),
    source: farm.source || 'manual',
    notes: farm.notes || null,
    details,
    updated_at: now,
    updated_by: user.id
  };

  // Upsert can fail when the database uses a generated primary key rather than
  // a unique id constraint. Select first, then update or insert deterministically.
  const { data: existingRows, error: lookupError } = await db
    .from('farms').select('id').eq('id', id).limit(1);
  if (lookupError) throw lookupError;

  let saveError;
  if (existingRows && existingRows.length) {
    ({ error: saveError } = await db.from('farms').update(row).eq('id', id));
  } else {
    ({ error: saveError } = await db.from('farms').insert(row));
  }
  if (saveError) throw saveError;

  // Keep an immutable, attributed history of every successful farm change.
  const changedFields = {};
  const before = beforeState || {};
  Object.keys(details).forEach(key => {
    const a = JSON.stringify(before[key] ?? null);
    const b = JSON.stringify(details[key] ?? null);
    if (a !== b) changedFields[key] = { before: before[key] ?? null, after: details[key] ?? null };
  });

  const auditRecord = {
    farm_id: id,
    action: beforeState ? 'updated' : 'created',
    actor_id: user.id,
    source: 'farm_editor',
    before_state: beforeState || null,
    after_state: { ...details, changed_fields: changedFields, changed_at: now }
  };

  const { error: auditError } = await db.from('farm_audit').insert(auditRecord);
  if (auditError) {
    console.warn('Farm audit logging failed', auditError);
    // Do not claim the history was recorded when it was rejected by RLS.
    // The shared farm save is still valid, but the audit must be repaired
    // server-side before the action can be considered fully attributed.
    throw new Error('Farm saved, but the shared farm history could not be recorded: ' + (auditError.message || auditError.code || 'audit write rejected'));
  }

  return row;
}
function geometryToBoundary(geometry) {
  if (!geometry?.coordinates) return [];

  // Pick the largest outer ring so multipolygon municipalities/towns do not
  // disappear simply because their first geometry part is a tiny island.
  const rings = geometry.type === 'Polygon'
    ? [geometry.coordinates?.[0]]
    : geometry.type === 'MultiPolygon'
      ? geometry.coordinates.map(part => part?.[0])
      : [];

  const valid = rings.filter(ring => Array.isArray(ring) && ring.length >= 3);
  if (!valid.length) return [];

  const ringArea = ring => {
    let area = 0;
    for (let i = 0; i < ring.length; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[(i + 1) % ring.length];
      area += x1 * y2 - x2 * y1;
    }
    return Math.abs(area);
  };

  const ring = valid.reduce((largest, candidate) =>
    ringArea(candidate) > ringArea(largest) ? candidate : largest
  );

  return ring.map(([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) }))
    .filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

const MASTER_PLAYER = {
  id: 'the-company',
  name: 'The Company'
};

function farmAssetControl(farm) {
  const assets = Array.isArray(farm?.assets) ? farm.assets : (farm?.objects || []);
  const types = assets.map(asset => String(
    asset?.type || asset?.assetType || asset?.name || asset?.label || ''
  ).toLowerCase());
  const hasOurDrone = types.some(type =>
    type === 'drone' || type === 'our drone' || type === 'our-drone' || type.includes('our drone') || type.includes('company drone')
  );
  const hasCompetitorDrone = types.some(type =>
    type === 'competitor-drone' || type === 'competitor drone' || type.includes('competitor')
  );
  if (hasOurDrone) return 'company';
  if (hasCompetitorDrone) return 'competitor';
  return 'neutral';
}

function territoryFarmSet(territory) {
  const level = territory.level || 'province';
  if (level === 'farm') return farms.filter(f => f.id === territory.id);
  if (level === 'town') return farms.filter(f => f.townId === territory.id);
  if (level === 'municipality') return farms.filter(f => f.municipalityId === territory.id);
  if (level === 'province') return farms.filter(f => f.territoryId === territory.id);
  if (level === 'country') return farms.slice();
  return [];
}

let contractorSpatialIndex = null;
let contractorSpatialSignature = '';

function contractorPoint(contractor) {
  const coords = contractor?.geometry?.coordinates;
  if (Array.isArray(coords) && coords.length >= 2) {
    return { lat: Number(coords[1]), lng: Number(coords[0]) };
  }
  const p = contractor?.position || contractor?.center || contractor;
  return { lat: Number(p?.lat), lng: Number(p?.lng) };
}

function getContractorSpatialIndex() {
  const world = window.AG_WORLD_WORLD || {};
  const contractorList = Array.isArray(window.__AG_WORLD_CONTRACTORS)
    ? window.__AG_WORLD_CONTRACTORS
    : (world.getContractors?.() || []);

  // Geometry is resolved once per contractor instead of being recalculated for
  // every country/province/municipality/town during territory control styling.
  const signature = contractorList.map(c => {
    const p = contractorPoint(c);
    return String(c?.id || '') + ':' + p.lat + ':' + p.lng + ':' +
      String(c?.municipalityId || c?.details?.municipalityId || '') + ':' +
      String(c?.townId || c?.details?.townId || '') + ':' +
      String(c?.territoryId || c?.details?.territoryId || '');
  }).join('|');

  if (contractorSpatialIndex && signature === contractorSpatialSignature) return contractorSpatialIndex;

  const index = {
    all: contractorList.slice(),
    country: contractorList.slice(),
    province: new Map(),
    municipality: new Map(),
    town: new Map()
  };

  contractorList.forEach(contractor => {
    const p = contractorPoint(contractor);
    const details = contractor?.details || {};
    const municipalityId = contractor?.municipalityId || details.municipalityId ||
      (Number.isFinite(p.lat) && Number.isFinite(p.lng)
        ? municipalities.find(m => pointInPolygon(p, m.boundary))?.id
        : null);
    const townId = contractor?.townId || details.townId ||
      (Number.isFinite(p.lat) && Number.isFinite(p.lng)
        ? towns.find(t => pointInPolygon(p, t.boundary))?.id
        : null);
    let territoryId = contractor?.territoryId || details.territoryId;
    if (!territoryId && Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
      territoryId = territories.find(t => pointInPolygon(p, t.boundary))?.id || null;
    }
    if (!territoryId && municipalityId) {
      territoryId = municipalities.find(m => m.id === municipalityId)?.parentId || null;
    }

    if (territoryId) {
      if (!index.province.has(String(territoryId))) index.province.set(String(territoryId), []);
      index.province.get(String(territoryId)).push(contractor);
    }
    if (municipalityId) {
      if (!index.municipality.has(String(municipalityId))) index.municipality.set(String(municipalityId), []);
      index.municipality.get(String(municipalityId)).push(contractor);
    }
    if (townId) {
      if (!index.town.has(String(townId))) index.town.set(String(townId), []);
      index.town.get(String(townId)).push(contractor);
    }
  });

  contractorSpatialSignature = signature;
  contractorSpatialIndex = index;
  return index;
}

function invalidateContractorSpatialIndex() {
  contractorSpatialIndex = null;
  contractorSpatialSignature = '';
}

function territoryContractorSet(territory) {
  const index = getContractorSpatialIndex();
  const level = territory.level || 'province';
  if (level === 'country') return index.country.slice();
  if (level === 'town') return (index.town.get(String(territory.id)) || []).slice();
  if (level === 'municipality') return (index.municipality.get(String(territory.id)) || []).slice();
  if (level === 'province') return (index.province.get(String(territory.id)) || []).slice();
  return [];
}

function contractorAssetControl(contractor) {
  return farmAssetControl(contractor);
}



// SALES HISTORY & FLEET MANAGEMENT VIEW
let activeFleetManagement=null;
function escapeFleetText(value){return String(value??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
async function loadFleetTransactionHistory(type,id){
  const db=getFarmDb?.(); if(!db) return [];
  try {
    const result=await db.from('fleet_transactions').select('*').eq('entity_type',type).eq('entity_id',String(id)).order('created_at',{ascending:false}).limit(100);
    return result.error?[]:(result.data||[]);
  } catch(_){ return []; }
}
async function openFleetManagement(type,id){
  const entity=resolveFleetEntity(type,id);
  if(!entity) return toast('Fleet action could not resolve the selected '+String(type)+'.');
  activeFleetManagement={type,id:String(id)};
  const portfolio=salesPortfolio(entity);
  const drone=dronePortfolioInfluence(type,entity);
  $('fleetManagementTitle').textContent=(entity.name||'Entity')+' · Fleet Management';
  $('fleetManagementSummary').innerHTML='<span>'+type.toUpperCase()+' · LIVE MARKET POSITION</span><h3>🟢 '+drone.companyDrones+' Company Drones · 🔴 '+drone.competitorDrones+' Competitor Drones</h3><p>Total fleet: '+drone.totalDrones+' drones. Company influence: '+(drone.totalDrones?Math.round(drone.companyDrones/drone.totalDrones*1000)/10:0)+'%.</p>';
  $('fleetPortfolioRows').innerHTML=portfolio.length?portfolio.map((p,index)=>'<div class="farm-check-option"><span class="check-icon">'+(marketEntityType(p.supplierType)==='companyFacility'?'✦':'◇')+'</span><span><b>'+escapeFleetText(p.supplierName)+'</b><small>'+(marketEntityType(p.supplierType)==='companyFacility'?'Company Facility':'Competitor')+' · '+Number(p.quantity||0)+' drones</small></span><button type="button" data-fleet-adjust="'+index+'">MANAGE</button></div>').join(''):'<div class="farm-assets-status">No drone portfolio recorded yet.</div>';
  $('fleetPortfolioRows').querySelectorAll('[data-fleet-adjust]').forEach(button=>button.onclick=()=>editFleetPortfolioLine(type,id,Number(button.dataset.fleetAdjust)));
  $('fleetHistoryRows').innerHTML='<div class="farm-assets-status">Loading transaction history…</div>';
  $('fleetManagementModal').hidden=false;
  const history=await loadFleetTransactionHistory(type,id);
  $('fleetHistoryRows').innerHTML=history.length?history.map(row=>'<div class="farm-check-option"><span class="check-icon">'+(row.transaction_type==='companySale'?'✦':'◇')+'</span><span><b>'+escapeFleetText(row.metadata?.supplierName||row.supplier_type||'Supplier')+' · '+Number(row.drone_quantity||0)+' drones</b><small>'+escapeFleetText(row.notes||'Fleet transaction')+' · '+escapeFleetText(row.created_at?new Date(row.created_at).toLocaleString():'Recorded')+'</small></span></div>').join(''):'<div class="farm-assets-status">No transaction ledger entries yet. Current portfolio is shown above.</div>';
}
async function editFleetPortfolioLine(type,id,index){
  const entity=salesEntityList(type).find(e=>String(e.id)===String(id));
  const portfolio=salesPortfolio(entity); const item=portfolio[index]; if(!item) return;
  const value=window.prompt('Set the current number of drones for '+item.supplierName+'. Enter 0 to remove this supplier.',String(item.quantity||0));
  if(value===null) return;
  const quantity=Math.max(0,Number(value)); if(!Number.isFinite(quantity)) return toast('Enter a valid drone quantity.');
  if(quantity===0) portfolio.splice(index,1); else portfolio[index]={...item,quantity};
  const db=getFarmDb?.(); const table=type==='farm'?'farms':'contractors';
  const details={...(entity.details||{}),dronePortfolio:portfolio};
  const result=await db.from(table).update({details,updated_at:new Date().toISOString()}).eq('id',id);
  if(result.error) return toast('Fleet update failed: '+result.error.message);
  entity.details=details; entity.dronePortfolio=portfolio;
  marketInfluenceState.components.clear(); await loadMarketInfluenceRelationships({force:true}); refreshTerritoryControl();
  toast('Fleet portfolio updated. Territory influence recalculated.');
  openFleetManagement(type,id);
}
function installFleetManagementView(){
  if(!$('fleetManagementModal')) return;
  $('closeFleetManagement').onclick=()=>{$('fleetManagementModal').hidden=true;activeFleetManagement=null;};
}

// ---------------------------------------------------------------------------
// SALES & FLEET TRANSACTION ENGINE
// Transactions are additive, preserve supplier-level provenance, update the
// entity portfolio and strategic relationship metadata, then refresh territory
// influence immediately.
// ---------------------------------------------------------------------------
let activeFleetTransaction = null;
function salesEntityList(type) {
  return type==='farm' ? (window.AG_WORLD_WORLD?.farms || []) :
    type==='contractor' ? (window.AG_WORLD_WORLD?.getContractors?.() || []) : [];
}
function resolveFleetEntity(type,id) {
  const canonical = marketEntityType ? marketEntityType(type) : String(type || '').toLowerCase();
  const list = salesEntityList(canonical);
  const found = list.find(e => String(e?.id) === String(id));
  if (found) return found;

  // The visible card is the authoritative fallback during a selection lifecycle.
  // This prevents a newly-selected entity from becoming unclickable simply
  // because a cached world array has not yet refreshed.
  const selected = window.__AGWORLD_FLEET_SELECTED_ENTITY__;
  if (selected && String(selected.id) === String(id) && marketEntityType(selected.type) === canonical && selected.entity) {
    return selected.entity;
  }

  const dynamic = window.__AGWORLD_RUNTIME_DYNAMIC_ENTITY_SELECTION_V2__;
  if (dynamic && String(dynamic.entityId) === String(id) && marketEntityType(dynamic.entityType) === canonical) {
    return (window.AG_WORLD_WORLD?.getContractors?.() || []).find(e => String(e?.id) === String(id)) || null;
  }
  return null;
}
function salesSupplierList(kind) {
  return kind==='companySale' ? (window.AG_WORLD_WORLD?.getCompanyFacilities?.() || []) : (window.AG_WORLD_WORLD?.getCompetitors?.() || []);
}
function salesPortfolio(entity) {
  const details=entity?.details || {};
  return Array.isArray(details.dronePortfolio) ? [...details.dronePortfolio] : Array.isArray(entity?.dronePortfolio) ? [...entity.dronePortfolio] : [];
}
function renderFleetSupplierOptions() {
  const kind=$('fleetTransactionType').value;
  const suppliers=salesSupplierList(kind);
  $('fleetSupplierLabel').firstChild.textContent=kind==='companySale'?'Supplying Company Facility':'Linked Competitor';
  $('fleetSupplier').innerHTML=suppliers.length ? suppliers.map(s=>'<option value="'+String(s.id).replace(/"/g,'&quot;')+'">'+s.name+'</option>').join('') : '<option value="">No supplier entities available</option>';
}
function openFleetTransaction(type,id) {
  const entity=resolveFleetEntity(type,id);
  if(!entity) return toast('Fleet action could not resolve the selected '+String(type)+'.');
  activeFleetTransaction={type,id:String(id)};
  $('fleetTransactionEntityType').textContent=type.toUpperCase()+' · LIVE MARKET ENTITY';
  $('fleetTransactionEntityName').textContent=entity.name || entity.id;
  $('fleetDroneQuantity').value=1; $('fleetTransactionNotes').value='';
  $('fleetTransactionType').value='companySale';
  renderFleetSupplierOptions();
  const drone=dronePortfolioInfluence(type,entity);
  $('fleetTransactionCurrent').textContent='Current fleet: '+drone.companyDrones+' Company drones · '+drone.competitorDrones+' Competitor drones.';
  $('fleetTransactionModal').hidden=false;
}
async function completeFleetTransaction() {
  if(!activeFleetTransaction) throw new Error('No active fleet transaction.');
  const {type,id}=activeFleetTransaction;
  const entity=salesEntityList(type).find(e=>String(e.id)===String(id));
  if(!entity) throw new Error('Entity could not be found.');
  const kind=$('fleetTransactionType').value;
  const supplierId=$('fleetSupplier').value;
  const supplier=salesSupplierList(kind).find(s=>String(s.id)===String(supplierId));
  const quantity=Math.max(0,Number($('fleetDroneQuantity').value||0));
  if(!supplierId || !supplier) throw new Error('Select a valid supplier.');
  if(!Number.isFinite(quantity) || quantity<1) throw new Error('Enter at least one drone.');

  const supplierType=kind==='companySale'?'companyFacility':'competitor';
  const portfolio=salesPortfolio(entity);
  const existing=portfolio.find(item=>marketEntityType(item.supplierType)===supplierType && String(item.supplierId)===String(supplierId));
  if(existing) existing.quantity=Number(existing.quantity||0)+quantity;
  else portfolio.push({supplierType,supplierId:String(supplierId),supplierName:supplier.name,quantity});

  const details={...(entity.details||{}),dronePortfolio:portfolio};
  const db=getFarmDb?.();
  if(!db) throw new Error('Database connection is unavailable.');
  const table=type==='farm'?'farms':type==='contractor'?'contractors':null;
  if(!table) throw new Error('Only Farms and Contractors can receive fleet transactions.');

  const update=await db.from(table).update({details,updated_at:new Date().toISOString()}).eq('id',id);
  if(update.error) throw update.error;
  entity.details=details; entity.dronePortfolio=portfolio;

  await syncDronePurchaseRelationships(type,id,[{supplierType,supplierId:String(supplierId),supplierName:supplier.name,quantity}]);

  // Optional transaction ledger: keep gameplay audit history when the table
  // exists, but never fail the sale if an installation has not added it yet.
  try {
    await db.from('fleet_transactions').insert({
      entity_id:id,entity_type:type,supplier_id:String(supplierId),supplier_type:supplierType,
      transaction_type:kind,drone_quantity:quantity,notes:$('fleetTransactionNotes').value.trim(),
      metadata:{supplierName:supplier.name}
    });
  } catch (_) {}

  marketInfluenceState.components.clear();
  await loadMarketInfluenceRelationships({force:true});
  refreshTerritoryControl();
  window.dispatchEvent(new CustomEvent('agworld:fleet-transaction',{detail:{type,id,kind,supplierId,quantity}}));
  return {entity,supplier,quantity,kind};
}
function installFleetTransactionEngine() {
  const modal=$('fleetTransactionModal');
  if(!modal) return;
  $('closeFleetTransaction').onclick=()=>{modal.hidden=true;activeFleetTransaction=null;};
  $('fleetTransactionType').onchange=renderFleetSupplierOptions;
  $('saveFleetTransaction').onclick=async()=>{
    const button=$('saveFleetTransaction');button.disabled=true;
    try {
      const result=await completeFleetTransaction();
      modal.hidden=true; activeFleetTransaction=null;
      toast((result.kind==='companySale'?'Sale completed: ':'Competitor fleet recorded: ')+result.quantity+' drone(s) for '+result.entity.name+'. Territory influence updated.');
    } catch(error) { toast('Transaction failed: '+(error?.message||error)); }
    finally { button.disabled=false; }
  };
}
function injectFleetTransactionActions() {
  const root=document.body;
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-fleet-transaction]');
    if(!button) return;
    openFleetTransaction(button.dataset.entityType,button.dataset.entityId);
  });
}

// Canonical visible quick-action bridge. Capture phase makes these buttons
// independent of the Farm/Entity panel renderers that may stop bubbling clicks.
function installFleetQuickActionBridge() {
  if (window.__AGWORLD_FLEET_QUICK_ACTION_BRIDGE__) return;
  window.__AGWORLD_FLEET_QUICK_ACTION_BRIDGE__ = true;
  document.addEventListener('click', event => {
    const button = event.target?.closest?.('[data-fleet-action]');
    if (!button) return;

    // The visible quick-action buttons have their own direct handlers bound by
    // updateFleetTransactionAction(). Do not intercept them in the document
    // capture phase: doing so created a second action path that could throw
    // before the proven direct handler was allowed to run.
    if (button.dataset.fleetDirect === '1') return;

    const type = button.dataset.entityType;
    const id = button.dataset.entityId;
    if (!type || !id) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const action = button.dataset.fleetAction;
    window.__AGWORLD_FLEET_UI_STATE__ = {
      ...(window.__AGWORLD_FLEET_UI_STATE__ || {}),
      lastAction: action,
      lastActionAt: Date.now(),
      lastActionEntityId: String(id),
      lastActionEntityType: type
    };
    try {
      const result = action === 'history' ? openFleetManagement(type,id) : openFleetTransaction(type,id);
      if (result?.catch) result.catch(error => {
        const message = String(error?.message || error);
        toast('Fleet action failed: '+message);
        window.__AGWORLD_FLEET_UI_STATE__ = {
          ...(window.__AGWORLD_FLEET_UI_STATE__ || {}),
          lastActionError: message,
          lastActionErrorAt: Date.now()
        };
      });
    } catch (error) {
      const message = String(error?.message || error);
      toast('Fleet action failed: '+message);
      window.__AGWORLD_FLEET_UI_STATE__ = {
        ...(window.__AGWORLD_FLEET_UI_STATE__ || {}),
        lastActionError: message,
        lastActionErrorAt: Date.now()
      };
    }
  }, true);

  // Install the modal handlers after all HTML has been parsed. The loader runs
  // before the modal markup in index.html, so eager installation can silently
  // miss the controls.
  const install = () => {
    try { installFleetTransactionEngine(); } catch (_) {}
    try { installFleetManagementView(); } catch (_) {}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
}
installFleetQuickActionBridge();

window.AGWorldFleetTransactions={
  open:openFleetTransaction,
  complete:completeFleetTransaction,
  getPortfolio:(type,id)=>salesPortfolio(salesEntityList(type).find(e=>String(e.id)===String(id))),
  getInfluence:(type,id)=>{const e=salesEntityList(type).find(e=>String(e.id)===String(id));return e?dronePortfolioInfluence(type,e):null;},
  openManagement:openFleetManagement
};

// ---------------------------------------------------------------------------
// TERRITORY CONTROL & MARKET INFLUENCE ENGINE
// Farms and Contractors are the market units. Company Facilities and
// Competitors are strategic influence nodes. Active relationships propagate
// influence through the connected commercial network.
// ---------------------------------------------------------------------------
const marketInfluenceState = {
  relationships: [],
  graph: new Map(),
  components: new Map(),
  signature: '',
  loading: false,
  lastLoadedAt: 0
};

function marketEntityType(type) {
  const value = String(type || '').toLowerCase().replace(/[ _-]+/g, '');
  if (value === 'farm' || value === 'farms') return 'farm';
  if (value === 'contractor' || value === 'contractors') return 'contractor';
  if (value === 'competitor' || value === 'competitors') return 'competitor';
  if (value === 'companyfacility' || value === 'companyfacilities' || value === 'facility' || value === 'facilities') return 'companyFacility';
  return value;
}
function marketNodeKey(type, id) {
  return marketEntityType(type) + ':' + String(id);
}
function marketRelationshipActive(row) {
  return !['inactive','disabled','archived','deleted'].includes(String(row?.status || 'active').toLowerCase());
}
function marketAllowedEdge(a, b) {
  const key=[marketEntityType(a),marketEntityType(b)].sort().join('|');
  return [
    'companyFacility|contractor',
    'companyFacility|farm',
    'competitor|competitor',
    'competitor|contractor',
    'competitor|farm',
    'contractor|farm'
  ].includes(key);
}
function rebuildMarketInfluenceGraph(rows) {
  const graph = new Map();
  const add = (key, value) => {
    if (!graph.has(key)) graph.set(key, new Set());
    graph.get(key).add(value);
  };
  (rows || []).filter(marketRelationshipActive).forEach(row => {
    const aType=marketEntityType(row.source_entity_type || row.sourceType);
    const bType=marketEntityType(row.target_entity_type || row.targetType);
    const aId=row.source_entity_id ?? row.sourceId;
    const bId=row.target_entity_id ?? row.targetId;
    if (!aId || !bId || !marketAllowedEdge(aType,bType)) return;
    const a=marketNodeKey(aType,aId), b=marketNodeKey(bType,bId);
    add(a,b); add(b,a);
  });
  marketInfluenceState.relationships=(rows || []).filter(marketRelationshipActive);
  marketInfluenceState.graph=graph;
  marketInfluenceState.components=new Map();
}
function marketInfluenceSeed(type, entity) {
  const canonical=marketEntityType(type);
  if (canonical==='companyFacility') return 'company';
  if (canonical==='competitor') return 'competitor';
  if (canonical==='farm') return farmAssetControl(entity);
  if (canonical==='contractor') return contractorAssetControl(entity);
  return 'neutral';
}
function getMarketEntity(type,id) {
  const world=window.AG_WORLD_WORLD || {};
  const list = type==='farm' ? (world.farms || []) :
    type==='contractor' ? (world.getContractors?.() || []) :
    type==='competitor' ? (world.getCompetitors?.() || []) :
    type==='companyFacility' ? (world.getCompanyFacilities?.() || []) : [];
  return list.find(item => String(item?.id)===String(id)) || null;
}
function marketComponentFor(type,id) {
  const key=marketNodeKey(type,id);
  if (marketInfluenceState.components.has(key)) return marketInfluenceState.components.get(key);
  const graph=marketInfluenceState.graph;
  const queue=[key], visited=new Set(), companySeeds=[], competitorSeeds=[];
  while(queue.length) {
    const node=queue.shift();
    if(visited.has(node)) continue;
    visited.add(node);
    const [nodeType,...rest]=node.split(':');
    const nodeId=rest.join(':');
    const entity=getMarketEntity(nodeType,nodeId);
    const seed=marketInfluenceSeed(nodeType,entity);
    if(seed==='company') companySeeds.push(node);
    if(seed==='competitor') competitorSeeds.push(node);
    (graph.get(node) || []).forEach(next => { if(!visited.has(next)) queue.push(next); });
  }
  const result={
    nodes:[...visited],
    company:companySeeds.length>0,
    competitor:competitorSeeds.length>0,
    companySeeds,
    competitorSeeds
  };
  visited.forEach(node => marketInfluenceState.components.set(node,result));
  return result;
}
function dronePortfolioInfluence(type, entity) {
  const portfolio = Array.isArray(entity?.details?.dronePortfolio) ? entity.details.dronePortfolio :
    Array.isArray(entity?.dronePortfolio) ? entity.dronePortfolio : [];
  let companyDrones=0, competitorDrones=0;
  portfolio.forEach(item => {
    const quantity=Math.max(0,Number(item?.quantity || item?.droneQuantity || 0));
    const supplier=marketEntityType(item?.supplierType || item?.entityType);
    if(supplier==='companyFacility') companyDrones+=quantity;
    if(supplier==='competitor') competitorDrones+=quantity;
  });
  // Relationship metadata is the authoritative fallback for records created
  // before the Step 4 portfolio field existed.
  const key=marketNodeKey(type,entity?.id);
  (marketInfluenceState.relationships || []).forEach(row => {
    const a=marketNodeKey(row.source_entity_type,row.source_entity_id);
    const b=marketNodeKey(row.target_entity_type,row.target_entity_id);
    const quantity=Math.max(0,Number(row?.metadata?.droneQuantity || row?.metadata?.quantity || 0));
    if(!quantity || (a!==key && b!==key)) return;
    const other=a===key ? marketEntityType(row.target_entity_type) : marketEntityType(row.source_entity_type);
    if(other==='companyFacility') companyDrones+=quantity;
    if(other==='competitor') competitorDrones+=quantity;
  });
  // De-duplicate when both portfolio and relationship metadata represent the
  // same purchase by preferring the larger recorded quantity per supplier.
  // New records normally have both, so supplier-level aggregation prevents
  // relationship syncing from double-counting market influence.
  const portfolioBySupplier=new Map();
  portfolio.forEach(item=>{
    const id=String(item?.supplierId||''), typeKey=marketEntityType(item?.supplierType);
    const q=Math.max(0,Number(item?.quantity||0));
    if(id) portfolioBySupplier.set(typeKey+':'+id,q);
  });
  let relCompany=0, relCompetitor=0;
  const relBySupplier=new Map();
  (marketInfluenceState.relationships || []).forEach(row=>{
    const a=marketNodeKey(row.source_entity_type,row.source_entity_id), b=marketNodeKey(row.target_entity_type,row.target_entity_id);
    if(a!==key && b!==key) return;
    const otherType=a===key?marketEntityType(row.target_entity_type):marketEntityType(row.source_entity_type);
    const otherId=String(a===key?row.target_entity_id:row.source_entity_id);
    const q=Math.max(0,Number(row?.metadata?.droneQuantity||row?.metadata?.quantity||0));
    if(q) relBySupplier.set(otherType+':'+otherId,Math.max(relBySupplier.get(otherType+':'+otherId)||0,q));
  });
  // Portfolio totals are already in companyDrones/competitorDrones above;
  // rebuild from max values for exact accounting.
  companyDrones=0; competitorDrones=0;
  const keys=new Set([...portfolioBySupplier.keys(),...relBySupplier.keys()]);
  keys.forEach(k=>{const q=Math.max(portfolioBySupplier.get(k)||0,relBySupplier.get(k)||0);if(k.startsWith('companyFacility:')) companyDrones+=q;if(k.startsWith('competitor:')) competitorDrones+=q;});
  return {companyDrones,competitorDrones,totalDrones:companyDrones+competitorDrones};
}
function entityMarketInfluence(type, entity) {
  const drone=dronePortfolioInfluence(type,entity);
  if(drone.totalDrones>0) {
    if(drone.companyDrones>drone.competitorDrones) return 'company';
    if(drone.competitorDrones>drone.companyDrones) return 'competitor';
    return 'contested';
  }
  const direct=marketInfluenceSeed(type,entity);
  const component=marketComponentFor(type,entity?.id);
  const company=direct==='company' || component.company;
  const competitor=direct==='competitor' || component.competitor;
  if(company && competitor) return 'contested';
  if(company) return 'company';
  if(competitor) return 'competitor';
  return 'neutral';
}
function entityMarketWeights(type, entity) {
  const drone=dronePortfolioInfluence(type,entity);
  if(drone.totalDrones>0) return {
    company: drone.companyDrones,
    competitor: drone.competitorDrones,
    total: drone.totalDrones,
    mode:'drone-weighted'
  };
  const influence=entityMarketInfluence(type,entity);
  return {
    company: influence==='company'?1:influence==='contested'?.5:0,
    competitor: influence==='competitor'?1:influence==='contested'?.5:0,
    total: influence==='neutral'?0:1,
    mode:'relationship-fallback'
  };
}

async function loadMarketInfluenceRelationships(options={}) {
  const db=getFarmDb?.();
  if(!db || marketInfluenceState.loading) return false;
  const now=Date.now();
  if(!options.force && now-marketInfluenceState.lastLoadedAt<8000) return false;
  marketInfluenceState.loading=true;
  try {
    const result=await db.from('entity_relationships').select('id,source_entity_id,source_entity_type,target_entity_id,target_entity_type,relationship_type,status,metadata,updated_at,created_at');
    if(result.error) throw result.error;
    const rows=result.data || [];
    const signature=rows.map(r=>String(r.id)+':'+String(r.status)+':'+String(r.updated_at||r.created_at||'')).sort().join('|');
    const changed=signature!==marketInfluenceState.signature;
    marketInfluenceState.signature=signature;
    marketInfluenceState.lastLoadedAt=now;
    if(changed || options.force) {
      rebuildMarketInfluenceGraph(rows);
      window.__AGWORLD_ACTIVE_RELATIONSHIPS__=marketInfluenceState.relationships;
      window.dispatchEvent(new CustomEvent('agworld:market-influence-updated',{detail:{relationships:marketInfluenceState.relationships.length}}));
      if(typeof refreshTerritoryControl==='function') refreshTerritoryControl();
    }
    return changed;
  } catch(error) {
    console.warn('[AG World] Market influence relationship load failed',error);
    return false;
  } finally {
    marketInfluenceState.loading=false;
  }
}

function calculateTerritoryControl(territory) {
  const territoryFarms=territoryFarmSet(territory), territoryContractors=territoryContractorSet(territory);
  const farmCounts={company:0,competitor:0,neutral:0,contested:0}, contractorCounts={company:0,competitor:0,neutral:0,contested:0};
  let companyDroneWeight=0, competitorDroneWeight=0, marketWeight=0, companyDrones=0, competitorDrones=0;

  const score=(type,entity,counts)=>{
    const influence=entityMarketInfluence(type,entity);
    counts[influence]=(counts[influence]||0)+1;
    const weights=entityMarketWeights(type,entity);
    companyDroneWeight+=weights.company; competitorDroneWeight+=weights.competitor; marketWeight+=weights.total;
    const drone=dronePortfolioInfluence(type,entity);
    companyDrones+=drone.companyDrones; competitorDrones+=drone.competitorDrones;
  };
  territoryFarms.forEach(f=>score('farm',f,farmCounts));
  territoryContractors.forEach(c=>score('contractor',c,contractorCounts));

  const total=territoryFarms.length+territoryContractors.length;
  const company=farmCounts.company+contractorCounts.company, competitor=farmCounts.competitor+contractorCounts.competitor;
  const contested=farmCounts.contested+contractorCounts.contested, neutral=farmCounts.neutral+contractorCounts.neutral;
  const pct=v=>marketWeight?Math.round(v/marketWeight*1000)/10:0;
  const control=pct(companyDroneWeight), enemyControl=pct(competitorDroneWeight);
  const contestedControl=total?Math.round(contested/total*1000)/10:0, neutralControl=total?Math.round(neutral/total*1000)/10:0;

  return {
    total,company,competitor,contested,neutral,control,enemyControl,contestedControl,neutralControl,
    companyDroneWeight,competitorDroneWeight,marketWeight,companyDrones,competitorDrones,totalDrones:companyDrones+competitorDrones,
    farms:{total:territoryFarms.length,...farmCounts,control:territoryFarms.length?Math.round(farmCounts.company/territoryFarms.length*1000)/10:0},
    contractors:{total:territoryContractors.length,...contractorCounts,control:territoryContractors.length?Math.round(contractorCounts.company/territoryContractors.length*1000)/10:0},
    influenceModel:'drone-weighted-market-influence-v1'
  };
}

// Public strategic API used by the World Event, relationship and mission
// systems. The API deliberately exposes summaries rather than map internals.
window.AGWorldTerritoryControl = {
  refresh: () => {
    refreshTerritoryControl();
    return true;
  },
  refreshRelationships: () => loadMarketInfluenceRelationships({ force: true }),
  getInfluence: (type, entity) => entityMarketInfluence(marketEntityType(type), entity),
  getWeights: (type, entity) => entityMarketWeights(marketEntityType(type), entity),
  getSummary: (territory) => territory ? calculateTerritoryControl(territory) : null,
  getModel: () => ({
    version: 'drone-weighted-market-influence-v1',
    marketUnits: ['farm', 'contractor'],
    strategicInfluencers: ['companyFacility', 'competitor'],
    rules: {
      company: 'Company drone quantities contribute directly to weighted Company market influence.',
      competitor: 'Competitor drone quantities contribute directly to weighted Competitor market influence.',
      contested: 'Equal Company and Competitor drone quantities create a contested entity.',
      neutral: 'A market entity with no active Company or Competitor influence remains open market.'
    }
  })
};

window.addEventListener('agworld:relationship-created', () => loadMarketInfluenceRelationships({ force: true }));
window.addEventListener('agworld:relationship-updated', () => loadMarketInfluenceRelationships({ force: true }));
window.addEventListener('agworld:entity-updated', () => {
  marketInfluenceState.components.clear();
  refreshTerritoryControl();
});

// Relationship loading is asynchronous and deliberately separate from map
// startup. This keeps Google Maps responsive while the strategic graph hydrates.
setTimeout(() => loadMarketInfluenceRelationships({ force: true }), 2500);
setInterval(() => loadMarketInfluenceRelationships(), 12000);

function territoryControlStyle(territory) {
  const game = territory.game || calculateTerritoryControl(territory);
  const control = Number(game.control || 0);
  const enemy = Number(game.enemyControl || 0);
  const contested = Number(game.contestedControl || 0);

  // Company influence is green. Enemy-dominated areas are red. Neutral
  // territories remain muted until farms are placed there.
  if (control >= 100) return { fillColor: '#00c853', strokeColor: '#00e676', fillOpacity: 0.34 };
  if (control >= 76) return { fillColor: '#19d46b', strokeColor: '#46f08b', fillOpacity: 0.28 };
  if (control >= 51) return { fillColor: '#4caf50', strokeColor: '#76d275', fillOpacity: 0.23 };
  if (control >= 26) return { fillColor: '#8bc34a', strokeColor: '#b4df78', fillOpacity: 0.19 };
  if (contested > 0) return { fillColor: '#ff9800', strokeColor: '#ffcc80', fillOpacity: 0.22 };
  if (control > 0) return { fillColor: '#cddc39', strokeColor: '#e5ef70', fillOpacity: 0.15 };
  if (enemy > 0) return { fillColor: '#ef5350', strokeColor: '#ff8a80', fillOpacity: 0.20 };
  return { fillColor: '#607d8b', strokeColor: '#90a4ae', fillOpacity: 0.055 };
}

function applyTerritoryControlStyle(territory) {
  if (!territory || !territory._polygon) return;
  const base = territory._baseStyle || {};
  const controlStyle = territoryControlStyle(territory);
  territory._polygon.setOptions({
    strokeColor: controlStyle.strokeColor,
    fillColor: controlStyle.fillColor,
    fillOpacity: controlStyle.fillOpacity,
    strokeOpacity: base.strokeOpacity ?? .92,
    strokeWeight: base.strokeWeight,
    zIndex: base.zIndex
  });
}

function initialiseGameTerritories() {
  [...countries, ...territories, ...municipalities, ...towns].forEach(territory => {
    territory.game = calculateTerritoryControl(territory);
    territory.control = territory.game.control;
    const game = territory.game;
    territory.owner = game.contested > 0
      ? 'Contested market'
      : game.control > game.enemyControl && game.control > 0
        ? MASTER_PLAYER.name
        : game.enemyControl > game.control
          ? 'Competitor'
          : 'Uncontrolled';
    territory.status = game.contested > 0
      ? 'Contested market'
      : game.control >= 100
        ? 'Controlled'
        : game.control > game.enemyControl && game.control > 0
          ? 'Company influence'
          : game.enemyControl > 0
            ? 'Competitor controlled'
            : 'Uncontrolled';
    applyTerritoryControlStyle(territory);
  });
}

function territoryDescendants(territory) {
  const level = territory.level || 'province';
  if (level === 'country') return [...territories, ...municipalities, ...towns];
  if (level === 'province') {
    const municipalityIds = municipalities.filter(m => m.parentId === territory.id).map(m => m.id);
    return [...municipalities.filter(m => m.parentId === territory.id), ...towns.filter(t => municipalityIds.includes(t.parentId))];
  }
  if (level === 'municipality') return towns.filter(t => t.parentId === territory.id);
  return [];
}

function territoryGameSummary(territory) {
  const game = calculateTerritoryControl(territory);
  return {
    farms: territoryFarmSet(territory),
    contractors: territoryContractorSet(territory),
    ...game
  };
}

function refreshTerritoryControl() {
  // Entity influence can change after dynamic layers hydrate even when the
  // relationship rows themselves have not changed.
  marketInfluenceState.components.clear();
  // Contractor geography is indexed once before all territory overlays are
  // recalculated. This prevents an O(territories × contractors × polygons)
  // workload from blocking the interactive Google Map.
  invalidateContractorSpatialIndex();
  getContractorSpatialIndex();
  // Ensure farm → municipality → province relationships are current before
  // recalculating every territory.
  linkHierarchySpatialParents();
  farms.forEach(farm => {
    if (farm.municipalityId) {
      const municipality = municipalities.find(m => m.id === farm.municipalityId);
      if (municipality?.parentId) farm.territoryId = municipality.parentId;
    }
  });
  initialiseGameTerritories();
  if (selected && selected.level) selectTerritory(selected, false);
}

function normaliseSpatialFeatures(geojson, level) {
  const features = geojson?.features || [];
  return features.map((feature, index) => {
    const p = feature.properties || {};
    const name = p.MAP_TITLE || p.PROVINCE || p.MUNICNAME || p.NameCode || p.S12_NAME || p.SGADMIN || p.SGTOWN || p.TOWN || p.SHRT_ENGL || p.NAME || p.name || `${level} ${index + 1}`;
    const sourceId = p.ISO3_CODE || p.MUNICCODE || p.MUNICCD || p.CODE || p.AG_SGAD_ID || p.OBJECTID || index + 1;
    const boundary = geometryToBoundary(feature.geometry);
    const center = boundary.length
      ? ((level === 'province' || level === 'municipality') ? territoryVisualCenter(boundary) : centroid(boundary))
      : null;
    return {
      id: `ag-${level}-${String(sourceId).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      code: String(sourceId),
      name,
      regionLabel: name,
      level,
      parentId: null,
      status: 'Active',
      control: 0,
      owner: 'Unassigned',
      source: level === 'country' ? 'DLRRD GIS country boundary' : level === 'province' ? 'Municipal Demarcation Board / DLRRD' : level === 'municipality' ? 'Municipal Demarcation Board / DLRRD' : 'Surveyor-General / DLRRD',
      boundary,
      center,
      properties: p
    };
  }).filter(x => x.boundary.length >= 3);
}

function pointInPolygon(point, polygon) {
  if (!point || !polygon?.length) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersect = ((yi > point.lat) !== (yj > point.lat)) &&
      (point.lng < ((xj - xi) * (point.lat - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function linkHierarchySpatialParents() {
  municipalities.forEach(m => {
    const province = territories.find(p => pointInPolygon(m.center, p.boundary));
    if (province) m.parentId = province.id;
  });
  towns.forEach(t => {
    const municipality = municipalities.find(m => pointInPolygon(t.center, m.boundary));
    if (municipality) t.parentId = municipality.id;
  });
  farms.forEach(f => {
    if (!f.boundary?.length) return;
    const center = centroid(f.boundary);
    const municipality = municipalities.find(m => pointInPolygon(center, m.boundary));
    const town = towns.find(t => pointInPolygon(center, t.boundary));
    if (municipality) f.municipalityId = municipality.id;
    if (town) f.townId = town.id;
  });
}

function demoPointInMunicipality(municipality, seed) {
  const boundary = municipality.boundary || [];
  if (!boundary.length) return municipality.center;
  const lats = boundary.map(p => p.lat), lngs = boundary.map(p => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  let state = (seed + 1) * 9301 + 49297;
  const rnd = () => ((state = (state * 233280 + 12345) % 2147483647) / 2147483647);
  for (let i = 0; i < 80; i++) {
    const point = { lat: minLat + rnd() * (maxLat - minLat), lng: minLng + rnd() * (maxLng - minLng) };
    if (pointInPolygon(point, boundary)) return point;
  }
  return municipality.center || centroid(boundary);
}

function createDemoFarm(index, municipality) {
  const controlType = index % 10 < 5 ? 'company' : index % 10 < 8 ? 'competitor' : 'neutral';
  const center = demoPointInMunicipality(municipality, index + 77);
  const size = 0.008;
  const boundary = [
    { lat: center.lat - size, lng: center.lng - size },
    { lat: center.lat - size, lng: center.lng + size },
    { lat: center.lat + size, lng: center.lng + size },
    { lat: center.lat + size, lng: center.lng - size }
  ];
  const objects = controlType === 'company'
    ? [{ id: `demo-asset-${index}-our`, type: 'our drone', name: 'Our Drone', position: center }]
    : controlType === 'competitor'
      ? [{ id: `demo-asset-${index}-enemy`, type: 'competitor drone', name: 'Competitor Drone', position: center }]
      : [];
  return {
    id: `demo-farm-${String(index + 1).padStart(3, '0')}`,
    name: `Demo Farm ${String(index + 1).padStart(3, '0')}`,
    owner: controlType === 'company' ? MASTER_PLAYER.name : controlType === 'competitor' ? 'Competitor' : 'Independent',
    status: controlType === 'company' ? 'Customer' : controlType === 'competitor' ? 'Competitor' : 'Prospect',
    region: municipality.name,
    municipalityId: municipality.id,
    territoryId: municipality.parentId || null,
    townId: null,
    center,
    boundary,
    objects,
    assets: objects,
    drones: controlType === 'company' ? 1 : 0,
    tractors: 0,
    crops: [],
    livestock: 0,
    opportunityScore: controlType === 'company' ? 100 : controlType === 'competitor' ? 0 : 50,
    demo: true
  };
}

function seedDemoFarms() {
  if (!municipalities.length) return [];

  // Remove ALL existing farm and asset overlays before creating the demo set.
  // This also clears markers created by earlier versions of the page during
  // the same browser session, including the old red test-farm pins.
  farms.forEach(f => {
    if (f._marker) f._marker.setMap(null);
    if (f._polygon) f._polygon.setMap(null);
    (f.objects || []).forEach(object => {
      if (object._marker) object._marker.setMap(null);
    });
  });
  objectMarkers.forEach(marker => marker.setMap(null));
  objectMarkers.length = 0;

  // Generate the demo farms, but never discard manually created farms.
  // The Farms database is canonical, so user-created records must survive the
  // demo reseed that happens when GIS layers finish loading.
  const demos = [];
  for (let i = 0; i < 100; i++) {
    const municipality = municipalities[(i * 37 + 11) % municipalities.length];
    demos.push(createDemoFarm(i, municipality));
  }

  let localById = new Map(), sharedById = new Map();
  try {
    const saved = JSON.parse(localStorage.getItem('agworld-farms-v2') || '[]');
    localById = new Map((Array.isArray(saved) ? saved : []).filter(Boolean).map(f => [String(f?.id), f]));
  } catch (_) {}
  try {
    const shared = JSON.parse(localStorage.getItem('agworld-shared-farm-patches-v1') || '{}');
    sharedById = new Map(Object.entries(shared || {}));
  } catch (_) {}

  const demoIds = new Set(demos.map(farm => String(farm.id)));
  const customById = new Map();

  // Preserve custom farms already loaded from the canonical database.
  farms.forEach(farm => {
    if (farm && !demoIds.has(String(farm.id))) customById.set(String(farm.id), farm);
  });

  // Preserve custom farms saved locally as an offline/cache fallback.
  localById.forEach((farm, id) => {
    if (farm && !demoIds.has(String(id))) customById.set(String(id), farm);
  });

  const mergedDemos = demos.map(baseFarm => {
    const id = String(baseFarm.id);
    const local = localById.get(id);
    const shared = sharedById.get(id);
    return { ...baseFarm, ...(local || {}), ...(shared || {}) };
  });

  const databaseById = new Map();
  // Preserve any canonical database-loaded farm currently in memory, including
  // updates to demo farms. Database data must win over generated demo defaults.
  farms.forEach(farm => {
    if (farm && demoIds.has(String(farm.id)) && farm.source && farm.updatedAt) {
      databaseById.set(String(farm.id), farm);
    }
  });

  farms = [
    ...mergedDemos.map(farm => databaseById.get(String(farm.id)) || farm),
    ...customById.values()
  ].filter(farm => farm && Array.isArray(farm.boundary) && farm.boundary.length >= 3);
  // Publish the authoritative demo dataset for other map modules.
  window.__AG_WORLD_FARMS = farms;
  localStorage.setItem('agworld-demo-farms-v1', JSON.stringify(farms.map(cleanFarm)));
  window.dispatchEvent(new CustomEvent('agworld:farms-reset'));
  initialiseGameTerritories();
  return farms;
}

async function loadFarms() {
  // The base map must never wait for farm or territory JSON.
  // On slow GitHub Pages responses the old Promise.all kept the UI permanently
  // on the initial "Loading Agricultural maps" message before initMap() ran.
  initMap();

  try {
    const [farmResult, territoryResult] = await Promise.allSettled([
      fetchWithTimeout('data/farms.json', 10000),
      fetchWithTimeout('data/territories.json', 10000)
    ]);

    if (farmResult.status !== 'fulfilled' || !farmResult.value.ok) {
      throw new Error('farm data');
    }

    const farmData = await farmResult.value.json();
    const base = farmData.farms || [];
    let territoryData = { territories: [] };
    if (territoryResult.status === 'fulfilled' && territoryResult.value.ok) {
      territoryData = await territoryResult.value.json();
    }

    let stored = [];
    try { stored = JSON.parse(localStorage.getItem('agworld-farms-v2') || '[]'); } catch (_) {}
    // DEMO TERRITORY TEST MODE:
    // Legacy farms are deliberately excluded from the runtime. This prevents
    // their old red farm pins and asset pins from ever being created.
    const byId = new Map();
    farms = [];
    countries = territoryData.countries || [];
    territories = territoryData.territories || [];
    municipalities = territoryData.municipalities || [];
    towns = territoryData.towns || [];

    // Backfill territory links for existing farm records before the map starts.
    farms.forEach(farm => {
      if (!farm.territoryId) {
        const match = territories.find(t => (t.regions || []).includes(farm.region));
        if (match) farm.territoryId = match.id;
      }
    });
    linkHierarchySpatialParents();
    initialiseGameTerritories();

    if (map) {
      farms.forEach(farm => { if (!farm._marker) addFarm(farm); });
      // Country geometry is GIS-only. Do not render the local fallback outline.
      // Province records are retained as metadata only. Their old rectangular
      // placeholder boundaries must never be rendered; visible territory
      // boundaries come from GIS/base-map boundary data.
      municipalities.forEach(item => { try { addTerritory(item); } catch (error) { console.warn('Municipality overlay skipped', error); } });
      towns.forEach(item => { try { addTerritory(item); } catch (error) { console.warn('Town overlay skipped', error); } });
      updateZoomStage();
      $('mapStatus').textContent = `Satellite map active · ${farms.length} farm records loaded · loading municipal and town GIS…`;
    }

    // Remote GIS layers load independently of both the map and local datasets.
    loadSpatialLayersInBackground();
  } catch (error) {
    console.error('AG World farm/territory data load failed:', error);
    const detail = error?.name === 'AbortError'
      ? 'request timed out'
      : (error?.message || 'unknown error');
    $('mapStatus').textContent = `Satellite map active · farm records failed to load (${detail})`;
  }
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSpatialLayer(url, label, timeoutMs = 20000) {
  const controller = new AbortController();
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`${label}: timed out after ${Math.round(timeoutMs / 1000)} seconds`));
    }, timeoutMs);
  });
  try {
    const response = await Promise.race([
      fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/geo+json, application/json' } }),
      timeout
    ]);
    if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
    const data = await Promise.race([
      response.json(),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${label}: response parsing timed out`)), 20000))
    ]);
    if (data?.error) throw new Error(`${label}: ${data.error.message || 'GIS service error'}`);
    if (!Array.isArray(data?.features)) throw new Error(`${label}: no GeoJSON features returned`);
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchSpatialLayerWithRetry(url, label, timeoutMs = 60000, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fetchSpatialLayer(url, label + ' attempt ' + attempt, timeoutMs);
    } catch (error) {
      lastError = error;
      console.warn('AG World GIS retry', { label, attempt, attempts, error });
      if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, attempt * 1200));
    }
  }
  throw lastError;
}

async function loadSpatialLayersInBackground() {
  console.info('AG World GIS loader v24 started');
  // Use verified layer-specific field names directly. This avoids a stale
  // external configuration overriding the query with fields that do not exist.
  const spatialSources = {
    // Official GIS geometry only: country, provinces, municipalities and towns.
    country: 'data/gis/south-africa-country.geojson',
    provinces: 'https://law.drdlr.gov.za/server/rest/services/LAW_Spatial_Admin_Boundaries/MapServer/109/query?where=1%3D1&outFields=OBJECTID%2CPROVINCE&returnGeometry=true&outSR=4326&geometryPrecision=5&f=geojson',
    municipalities: 'https://law.drdlr.gov.za/server/rest/services/LAW_Spatial_Admin_Boundaries/MapServer/115/query?where=1%3D1&outFields=OBJECTID%2CMAP_TITLE&returnGeometry=true&outSR=4326&maxAllowableOffset=0.001&geometryPrecision=5&f=geojson',
    towns: 'https://law.drdlr.gov.za/server/rest/services/LAW_Spatial_Admin_Boundaries/MapServer/130/query?where=1%3D1&outFields=OBJECTID%2CSGTOWN%2CTOWN_EXT%2CSGTOWNCODE&returnGeometry=true&outSR=4326&f=geojson'
  };
  $('mapStatus').textContent = 'GIS loading · Country, provinces, municipalities and towns: connecting…';

  const countryPromise = fetchSpatialLayer(spatialSources.country, 'country boundary', 30000);
  const provincePromise = fetchSpatialLayer(spatialSources.provinces, 'provincial boundaries', 30000);
  const municipalPromise = fetchSpatialLayerWithRetry(spatialSources.municipalities, 'municipal boundaries', 90000, 3);
  const townPromise = fetchSpatialLayerWithRetry(spatialSources.towns, 'town boundaries', 90000, 3);

  municipalPromise.then(() => {
    $('mapStatus').textContent = 'GIS loading · Municipalities: downloaded · Towns: still loading…';
  }).catch(error => {
    console.error('Municipal GIS load failed:', error);
    $('mapStatus').textContent = 'GIS loading · Municipalities: failed · Towns: still loading…';
  });

  townPromise.then(() => {
    $('mapStatus').textContent = 'GIS loading · Towns: downloaded · Municipalities: still loading…';
  }).catch(error => {
    console.error('Town GIS load failed:', error);
    $('mapStatus').textContent = 'GIS loading · Towns: failed · Municipalities: still loading…';
  });

  const [countryLayer, provinceLayer, municipalLayer, townLayer] = await Promise.allSettled([
    countryPromise, provincePromise, municipalPromise, townPromise
  ]);
  const errors = [];
  const errorDetails = [];

  if (countryLayer.status === 'fulfilled') {
    const gisCountries = normaliseSpatialFeatures(countryLayer.value, 'country');
    const gisCountry = gisCountries[0];
    if (gisCountry && countries[0]) {
      if (countries[0]._polygon) countries[0]._polygon.setMap(null);
      if (countries[0]._marker) countries[0]._marker.setMap(null);
      countries[0].boundary = gisCountry.boundary;
      countries[0].center = gisCountry.center;
      countries[0].source = gisCountry.source;
      countries[0].properties = gisCountry.properties;
    }
  } else { errors.push('country boundary'); errorDetails.push(countryLayer.reason?.message || 'unknown country error'); }

  if (provinceLayer.status === 'fulfilled') {
    const gisProvinces = normaliseSpatialFeatures(provinceLayer.value, 'province');
    const normaliseName = value => String(value || '').toLowerCase()
      .replace(/agricultural territory/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    gisProvinces.forEach(gisProvince => {
      const target = territories.find(t => normaliseName(t.regions?.[0]) === normaliseName(gisProvince.name));
      if (!target) return;
      if (target._polygon) target._polygon.setMap(null);
      if (target._marker) target._marker.setMap(null);
      target.boundary = gisProvince.boundary;
      target.center = gisProvince.center;
      target.source = gisProvince.source;
      target.properties = gisProvince.properties;
      target.level = 'province';
    });
  } else { errors.push('provincial boundaries'); errorDetails.push(provinceLayer.reason?.message || 'unknown province error'); }

  if (municipalLayer.status === 'fulfilled') {
    municipalities.forEach(item => { if (item._polygon) item._polygon.setMap(null); if (item._marker) item._marker.setMap(null); });
    municipalities = normaliseSpatialFeatures(municipalLayer.value, 'municipality');
  } else { errors.push('municipal boundaries'); errorDetails.push(municipalLayer.reason?.message || 'unknown municipal error'); }

  if (townLayer.status === 'fulfilled') {
    towns.forEach(item => { if (item._polygon) item._polygon.setMap(null); if (item._marker) item._marker.setMap(null); });
    towns = normaliseSpatialFeatures(townLayer.value, 'town');
  } else { errors.push('town boundaries'); errorDetails.push(townLayer.reason?.message || 'unknown town error'); }

  linkHierarchySpatialParents();
  if (window.AG_WORLD_DEMO_MODE) seedDemoFarms();
  refreshTerritoryControl();

  if (map) {
    farms.forEach(farm => { if (!farm._marker) addFarm(farm); });
    countries.forEach(addTerritory);
    territories.forEach(addTerritory);
    municipalities.forEach(addTerritory);
    updateZoomStage();
    syncVisibleTownOverlays();
  }

  $('mapStatus').textContent = errors.length
    ? `GIS finished · ${countries.length} Country · ${territories.length} Provinces · ${municipalities.length} Municipalities · ${towns.length} Towns · failed: ${errors.join(' + ')} · ${errorDetails.join(' | ')}`
    : `GIS loaded · ${countries.length} Country · ${territories.length} Provinces · ${municipalities.length} Municipalities · ${towns.length} Towns`;
}

function renderGoogleMap() {
  if (!window.google?.maps?.Map) {
    const message = 'Google Maps JavaScript API finished loading but the Map constructor is unavailable. Check Maps JavaScript API activation and API-key restrictions.';
    console.error('AG World map:', message, window.google);
    $('mapStatus').textContent = message;
    return;
  }

  try {
    // Exact V1 base-map path: create the satellite map before any farm or GIS work.
    map = new google.maps.Map($('map'), {
      center: { lat: -29, lng: 24 },
      zoom: 5,
      mapTypeId: 'satellite',
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      gestureHandling: 'greedy',
      tilt: 0,
      rotateControl: false
    });

    map.addListener('zoom_changed', updateZoomStage);
    map.addListener('idle', () => {
      if (map.getZoom() >= 11 && map.getZoom() < 13.5) syncVisibleTownOverlays();
    });
    farms.forEach(addFarm);
    updateZoomStage();
    $('mapStatus').textContent = farms.length
      ? `Satellite map active · ${farms.length} farm records loaded`
      : 'Satellite map active · loading farm records and territory data…';
  } catch (error) {
    console.error('AG World Google Maps initialisation failed:', error);
    $('mapStatus').textContent = `Google Maps initialisation failed: ${error.message}`;
  }
}

function initMap() {
  if (!CONFIG.GOOGLE_MAPS_API_KEY) {
    $('mapStatus').textContent = 'Google satellite mapping is inactive: no API key is available to the dashboard.';
    return;
  }

  if (window.google?.maps?.Map) {
    renderGoogleMap();
    return;
  }

  const existing = document.getElementById('agworld-google-maps-script');
  if (existing) return;

  $('mapStatus').textContent = 'Connecting to Google Maps…';

  window.agWorldMapReady = () => {
    renderGoogleMap();
  };

  window.gm_authFailure = () => {
    $('mapStatus').textContent = 'Google Maps authorisation failed. Check the Maps JavaScript API, billing and GitHub Pages HTTP referrer restriction.';
  };

  // Deliberately use the same simple loader pattern as the earlier V1 build.
  const script = document.createElement('script');
  script.id = 'agworld-google-maps-script';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(CONFIG.GOOGLE_MAPS_API_KEY)}&callback=agWorldMapReady`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    $('mapStatus').textContent = 'Google Maps script could not be downloaded.';
  };
  document.head.appendChild(script);
}

function addTerritory(territory) {
  if (!map || !territory.boundary?.length) return;
  if (territory._polygon) {
    territory._polygon.setMap(map);
    return;
  }
  const level = territory.level || 'province';
  const styles = {
    country: { strokeColor: '#d7e66b', fillColor: '#6f8f3d', strokeWeight: 3, fillOpacity: .035 },
    province: { strokeColor: '#8fb339', fillColor: '#8fb339', strokeWeight: 3.5, fillOpacity: .025 },
    municipality: { strokeColor: '#5fc0d6', fillColor: '#5fc0d6', strokeWeight: 2, fillOpacity: .025 },
    town: { strokeColor: '#f0b44d', fillColor: '#f0b44d', strokeWeight: 1.5, fillOpacity: .018 }
  };
  const style = styles[level] || styles.province;
  const polygon = new google.maps.Polygon({
    paths: territory.boundary,
    strokeColor: style.strokeColor,
    fillColor: style.fillColor,
    strokeOpacity: .92,
    strokeWeight: style.strokeWeight,
    fillOpacity: style.fillOpacity,
    clickable: !creatingFarm,
    // Province borders must always sit above municipality borders where they overlap.
    zIndex: level === 'country' ? 1 : level === 'town' ? 4 : level === 'municipality' ? 6 : level === 'province' ? 10 : 1,
    map
  });
  territory._baseStyle = {
    strokeColor: style.strokeColor,
    fillColor: style.fillColor,
    strokeOpacity: .92,
    strokeWeight: style.strokeWeight,
    fillOpacity: style.fillOpacity,
    zIndex: level === 'country' ? 1 : level === 'town' ? 4 : level === 'municipality' ? 6 : level === 'province' ? 10 : 1
  };
  polygon.addListener('click', () => { if (!creatingFarm) selectTerritory(territory, true); });

  // Municipal territories use floating names rather than map-pin icons.
  // The marker itself is fully transparent; only the municipality name is drawn.
  // Its anchor is the computed visual centre, which is guaranteed to be inside
  // the GIS polygon whenever a valid interior point can be found.
  let marker = null;
  if (level === 'municipality') {
    const municipalityCenter = territory.center || territoryVisualCenter(territory.boundary);
    territory.center = municipalityCenter;
    marker = new google.maps.Marker({
      position: municipalityCenter,
      map,
      title: territory.name,
      clickable: !creatingFarm,
      zIndex: 7,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 0.01,
        fillOpacity: 0,
        strokeOpacity: 0
      },
      label: {
        text: municipalityDisplayName(territory.name),
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: '700'
      }
    });
    marker.addListener('click', () => { if (!creatingFarm) selectTerritory(territory, true); });
    territoryMarkers.push(marker);
  } else if (level !== 'town') {
    marker = new google.maps.Marker({
      position: territory.center || (level === 'province' ? territoryVisualCenter(territory.boundary) : centroid(territory.boundary)),
      map,
      title: territory.name,
      clickable: !creatingFarm,
      label: { text: String(territory.code || (level === 'country' ? 'ZA' : 'P')), color: '#fff', fontSize: '10px', fontWeight: '700' }
    });
    marker.addListener('click', () => selectTerritory(territory, true));
    territoryMarkers.push(marker);
  }
  territory._polygon = polygon;
  territory._marker = marker;
  applyTerritoryControlStyle(territory);
}

function syncVisibleTownOverlays() {
  if (!map) return;
  const zoom = map.getZoom();
  // Demo farms are visible from zoom layer 1 all the way through the map hierarchy.
  farms.forEach(farm => {
    if (farm.demo && farm._marker) farm._marker.setMap(zoom >= 1 ? map : null);
  });
  if (zoom < 11 || zoom >= 13.5) {
    towns.forEach(town => { if (town._polygon) town._polygon.setMap(null); });
    return;
  }
  const bounds = map.getBounds();
  if (!bounds) return;
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const latPad = Math.max(0.15, (ne.lat() - sw.lat()) * 0.35);
  const lngPad = Math.max(0.15, (ne.lng() - sw.lng()) * 0.35);
  const minLat = sw.lat() - latPad, maxLat = ne.lat() + latPad;
  const minLng = sw.lng() - lngPad, maxLng = ne.lng() + lngPad;

  towns.forEach(town => {
    const center = town.center;
    const inView = center && center.lat >= minLat && center.lat <= maxLat && center.lng >= minLng && center.lng <= maxLng;
    if (inView) {
      if (!town._polygon) addTerritory(town);
      else town._polygon.setMap(map);
    } else if (town._polygon) {
      town._polygon.setMap(null);
    }
  });
}

function territoryStrategicStatus(summary) {
  const control = Number(summary.control || 0);
  const contested = Number(summary.contestedControl || 0);
  if (contested > 0 && control === 0 && Number(summary.enemyControl || 0) === 0) return { title: 'MARKET CONTESTED', tone: 'contested' };
  if (control >= 100) return { title: 'FULLY CONTROLLED', tone: 'controlled' };
  if (control >= 76) return { title: 'DOMINATING', tone: 'dominating' };
  if (control >= 51) return { title: 'STRONG PRESENCE', tone: 'strong' };
  if (control >= 26) return { title: 'CONTESTED', tone: 'contested' };
  if (control > 0) return { title: 'ENTERING TERRITORY', tone: 'entering' };
  if (Number(summary.enemyControl || 0) > 0) return { title: 'ENEMY CONTROLLED', tone: 'enemy' };
  return { title: 'UNCONTROLLED', tone: 'neutral' };
}

function renderTerritoryInformationPanel(territory, summary) {
  const panel = document.getElementById('territoryInfoPanel');
  if (!panel) return;

  const level = String(territory.level || 'territory').toUpperCase();
  const status = territoryStrategicStatus(summary);
  const displayName = territory.level === 'municipality'
    ? municipalityDisplayName(territory.name)
    : territory.name;
  const control = Number(summary.control || 0);
  const enemy = Number(summary.enemyControl || 0);
  const contestedPct = Number(summary.contestedControl || 0);
  const neutralPct = summary.total ? Math.max(0, 100 - control - enemy - contestedPct) : 0;

  panel.innerHTML = `
    <div class="territory-info-header">
      <div>
        <div class="territory-info-level">${level} TERRITORY</div>
        <div class="territory-info-name">${displayName}</div>
      </div>
      <button class="territory-info-close" type="button" aria-label="Close territory information">×</button>
    </div>

    <div class="territory-info-control">
      <div class="territory-info-control-value">${control}%</div>
      <div>
        <div class="territory-info-control-title">${MASTER_PLAYER.name.toUpperCase()} CONTROL</div>
        <div class="territory-info-status territory-info-status-${status.tone}">${status.title}</div>
      </div>
    </div>

    <div class="territory-info-progress" aria-label="${control}% Company control">
      <div class="territory-info-progress-company" style="width:${Math.min(100, control)}%"></div>
      <div class="territory-info-progress-enemy" style="width:${Math.min(100, enemy)}%"></div>
      <div class="territory-info-progress-neutral" style="width:${Math.min(100, neutralPct)}%"></div>
    </div>
    <div class="territory-info-legend">
      <span>🟢 ${MASTER_PLAYER.name} ${control}%</span>
      <span>🔴 Enemy ${enemy}%</span>
      <span>🟠 Contested ${contestedPct}%</span>
      <span>⚪ Neutral ${Math.round(neutralPct * 10) / 10}%</span>
    </div>

    <div class="territory-info-grid">
      <div><strong>${summary.total}</strong><span>Total Farms</span></div>
      <div><strong>${summary.company}</strong><span>Our Drone</span></div>
      <div><strong>${summary.competitor}</strong><span>Competitor</span></div>
      <div><strong>${summary.contested || 0}</strong><span>Contested</span></div>
      <div><strong>${summary.neutral}</strong><span>Neutral</span></div>
    </div>

    <div class="territory-info-footer">
      <span>${summary.company} of ${summary.total || 0} Farms + Contractors contribute to ${MASTER_PLAYER.name} market control through assets and relationships.</span>
    </div>`;

  panel.classList.add('show');
  panel.querySelector('.territory-info-close')?.addEventListener('click', () => panel.classList.remove('show'));
}

function selectTerritory(territory, zoom = true) {
  initialiseGameTerritories();
  const summary = territoryGameSummary(territory);
  const territoryFarms = summary.farms;
  const levelLabel = String(territory.level || 'province').toUpperCase();
  renderTerritoryInformationPanel(territory, summary);
  // Keep the fixed strategic territory panel and My Region window in sync with
  // the same canonical territory selection.
  window.__AGWORLD_SELECTED_TERRITORY__ = { ...territory, summary };
  window.dispatchEvent(new CustomEvent('agworld:territory-selected', { detail: { territory, summary } }));

  $('farmCard').classList.add('show');
  $('farmName').textContent = territory.name;
  $('farmMeta').textContent = `${levelLabel} TERRITORY · ${MASTER_PLAYER.name} CONTROL ${summary.control}%`;
  $('farmDrones').textContent = summary.company;
  $('farmTractors').textContent = summary.competitor;
  $('farmCrops').textContent = summary.total;
  $('farmScore').textContent = `${summary.control}%`;
  $('farmLivestock').textContent = summary.neutral;
  $('farmHarvest').textContent = MASTER_PLAYER.name.toUpperCase();
  $('farmService').textContent = `🟢 ${summary.companyDrones || 0} COMPANY DRONES · 🔴 ${summary.competitorDrones || 0} COMPETITOR DRONES · 🟠 ${summary.contested || 0} CONTESTED ENTITIES`;
  $('farmDetailText').textContent =
    `${summary.control}% market control is drone-weighted across ${summary.total} Farms + Contractors: ${summary.companyDrones || 0} Company drones versus ${summary.competitorDrones || 0} Competitor drones. ${summary.contested || 0} entities are currently contested and ${summary.neutral} remain open market.`;
  $('aiText').textContent =
    `${MASTER_PLAYER.name} has ${summary.companyDrones || 0} Company drones versus ${summary.competitorDrones || 0} Competitor drones in this ${levelLabel.toLowerCase()} territory, producing ${summary.control}% drone-weighted control. Competitor control: ${summary.enemyControl}%. Contested entities: ${summary.contested || 0}.`;

  selected = null;
  if (map && zoom) {
    map.panTo(territory.center || centroid(territory.boundary));
    const targetZoom = { country: 5, province: 7, municipality: 10, town: 12 }[territory.level] || 7;
    map.setZoom(targetZoom);
  }
  $('mapStatus').textContent = `${MASTER_PLAYER.name} market influence · ${levelLabel} · ${territory.name} · ${summary.control}% Company · ${summary.enemyControl}% Competitor · ${summary.neutralControl || 0}% Open`;
}


// ---------------------------------------------------------------------------
// Territory Assignment & Geographic Relationships
// Canonical spatial context is derived from the same territory geometry used
// by the map. Entity records retain the resolved hierarchy so relationships can
// be recalculated after movement and survive a reload.
// ---------------------------------------------------------------------------
function agPointInPolygon(point, boundary) {
  if (!point || !Array.isArray(boundary) || boundary.length < 3) return false;
  const x = Number(point.lng), y = Number(point.lat);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  let inside = false;
  for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
    const xi = Number(boundary[i].lng), yi = Number(boundary[i].lat);
    const xj = Number(boundary[j].lng), yj = Number(boundary[j].lat);
    if (![xi, yi, xj, yj].every(Number.isFinite)) continue;
    const hit = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || Number.EPSILON) + xi);
    if (hit) inside = !inside;
  }
  return inside;
}

function agContainingTerritory(point, list) {
  return (Array.isArray(list) ? list : []).find(item => agPointInPolygon(point, item?.boundary)) || null;
}

function agResolveGeography(point) {
  const town = agContainingTerritory(point, towns);
  const municipality = agContainingTerritory(point, municipalities);
  const territory = agContainingTerritory(point, territories);
  const country = agContainingTerritory(point, countries);
  const ids = [country?.id, territory?.id, municipality?.id, town?.id].filter(Boolean).map(String);
  return {
    countryId: country?.id || 'ag-country-south-africa',
    countryName: country?.name || 'South Africa',
    territoryId: territory?.id || null,
    territoryName: territory?.name || null,
    province: territory?.regionLabel || territory?.name || null,
    municipalityId: municipality?.id || null,
    municipalityName: municipality?.name || null,
    townId: town?.id || null,
    townName: town?.name || null,
    territoryIds: ids
  };
}

function agDistanceKm(a, b) {
  const p1 = a?.lat, q1 = a?.lng, p2 = b?.lat, q2 = b?.lng;
  if (![p1,q1,p2,q2].every(v => Number.isFinite(Number(v)))) return Infinity;
  const R = 6371, dLat = (p2-p1)*Math.PI/180, dLng = (q2-q1)*Math.PI/180;
  const h = Math.sin(dLat/2)**2 + Math.cos(p1*Math.PI/180)*Math.cos(p2*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function agAllSpatialEntities() {
  return [
    ...farms.map(f => ({ id:String(f.id), type:'farm', name:f.name, lat:Number(f.center?.lat ?? f.lat), lng:Number(f.center?.lng ?? f.lng), territoryId:f.territoryId })),
    ...contractors.map(e => ({ id:String(e.id), type:'contractor', name:e.name, lat:Number(e.lat), lng:Number(e.lng), territoryId:e.details?.territoryId })),
    ...competitors.map(e => ({ id:String(e.id), type:'competitor', name:e.name, lat:Number(e.lat), lng:Number(e.lng), territoryId:e.details?.territoryId })),
    ...companyFacilities.map(e => ({ id:String(e.id), type:'companyFacility', name:e.name, lat:Number(e.lat), lng:Number(e.lng), territoryId:e.details?.territoryId }))
  ].filter(e => Number.isFinite(e.lat) && Number.isFinite(e.lng));
}

function agRefreshGeographicRelationships(entity) {
  const point = entity?.center || { lat:Number(entity?.lat), lng:Number(entity?.lng) };
  const context = agResolveGeography(point);
  const keyType = entity?.type || 'farm';
  const nearby = agAllSpatialEntities()
    .filter(other => !(String(other.id) === String(entity?.id) && other.type === keyType))
    .map(other => ({ ...other, distanceKm: agDistanceKm(point, other) }))
    .filter(other => other.distanceKm <= 50)
    .sort((a,b) => a.distanceKm - b.distanceKm)
    .slice(0,12)
    .map(other => ({ id:other.id, type:other.type, name:other.name, distanceKm:Math.round(other.distanceKm*10)/10, relationship:'geographic-proximity' }));
  const detail = { context, nearby, updatedAt:new Date().toISOString() };
  if (keyType === 'farm') {
    entity.territoryId = context.territoryId || entity.territoryId || null;
    entity.territoryIds = context.territoryIds;
    entity.geographicRelationships = detail;
  } else {
    entity.details ||= {};
    entity.details.territoryId = context.territoryId || entity.details.territoryId || null;
    entity.details.territoryIds = context.territoryIds;
    entity.details.geographicRelationships = detail;
    entity.details.country = context.countryName;
    entity.details.province = context.province || entity.details.province || '';
    entity.details.municipality = context.municipalityName || entity.details.municipality || '';
    entity.details.nearestTown = context.townName || entity.details.nearestTown || '';
  }
  window.dispatchEvent(new CustomEvent('agworld:geographic-relationships-updated', { detail:{ entity, geography:context, relationships:nearby } }));
  return detail;
}

let agTerritoryAssignmentHooked = false;
function agInstallTerritoryAssignmentHook() {
  if (agTerritoryAssignmentHooked || typeof window.selectTerritory !== 'function') return false;
  const original = window.selectTerritory;
  window.selectTerritory = function(territory, zoom) {
    if (spatialEditState?.action === 'territory' && spatialEditState.entity && territory?.id) {
      const state = spatialEditState;
      const entity = state.entity;
      spatialEditState = null;
      const point = entity.center || { lat:Number(entity.lat), lng:Number(entity.lng) };
      const context = agResolveGeography(point);
      context.territoryId = String(territory.id);
      context.territoryName = territory.name || context.territoryName;
      context.province = territory.regionLabel || territory.name || context.province;
      context.territoryIds = [context.countryId, context.territoryId, context.municipalityId, context.townId].filter(Boolean).map(String);
      if (entity.type === 'farm') {
        entity.territoryId = context.territoryId;
        entity.territoryIds = context.territoryIds;
        entity.geographicRelationships ||= {};
        entity.geographicRelationships.context = context;
        entity.geographicRelationships.updatedAt = new Date().toISOString();
        persistSpatialFarm(entity, state.before, 'territory-assigned').catch(error => { console.warn('Territory save failed', error); toast('Territory assigned locally, but shared save failed'); });
      } else {
        entity.details ||= {};
        entity.details.territoryId = context.territoryId;
        entity.details.territoryIds = context.territoryIds;
        entity.details.province = context.province || entity.details.province || '';
        entity.details.geographicRelationships = agRefreshGeographicRelationships(entity);
        saveDynamicSpatialEntity(entity, state.before, 'territory-assigned').then(() => toast('Territory assigned and saved')).catch(error => { console.warn('Territory save failed', error); toast('Territory assigned locally, but shared save failed'); });
      }
      window.dispatchEvent(new CustomEvent('agworld:territory-assigned', { detail:{ entity, territory, context } }));
      return original.call(this, territory, zoom);
    }
    return original.call(this, territory, zoom);
  };
  agTerritoryAssignmentHooked = true;
  return true;
}
setInterval(agInstallTerritoryAssignmentHook, 500);

let spatialEditState = null;

function spatialPoint(value) {
  if (!value) return null;
  if (typeof value.lat === 'function') return { lat: value.lat(), lng: value.lng() };
  const lat = Number(value.lat), lng = Number(value.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

async function persistSpatialFarm(farm, beforeState, action) {
  saveLocal();
  try {
    await saveFarmToDatabase(farm, beforeState);
    window.dispatchEvent(new CustomEvent('agworld:entity-updated', { detail: { entity: farm, action: action || 'spatial-updated', patch: { center: farm.center, boundary: farm.boundary } } }));
    toast('Map changes saved');
  } catch (error) {
    console.warn('Spatial farm save failed', error);
    toast('Map changed locally; shared save failed');
  }
}

function stopSpatialEdit(silent = false) {
  const state = spatialEditState;
  if (!state) return;
  const farm = state.entity;
  if (farm?._marker) farm._marker.setDraggable(false);
  if (farm?._polygon) farm._polygon.setEditable(false);
  spatialEditState = null;
  if (!silent) toast('Map editing cancelled');
}

function startFarmMove(farm) {
  stopSpatialEdit(true);
  if (!farm?._marker) { toast('This farm has no map marker to move'); return; }
  spatialEditState = { entity: farm, action: 'move', before: cleanFarm(farm) };
  const before = spatialEditState.before;
  farm._marker.setDraggable(true);
  farm._marker.setAnimation(google.maps.Animation.BOUNCE);
  farm._marker.addListener('dragend', async event => {
    if (!spatialEditState || spatialEditState.entity !== farm || spatialEditState.action !== 'move') return;
    farm.center = spatialPoint(event.latLng);
    farm._marker.setAnimation(null);
    farm._marker.setDraggable(false);
    spatialEditState = null;
    agRefreshGeographicRelationships(farm);
    await persistSpatialFarm(farm, before, 'position-updated');
  });
  toast('Drag the farm marker to its new location');
}

function startFarmBoundaryEdit(farm) {
  stopSpatialEdit(true);
  if (!farm?._polygon) { toast('This farm has no boundary to edit'); return; }
  const before = cleanFarm(farm);
  spatialEditState = { entity: farm, action: 'boundary', before };
  farm._polygon.setEditable(true);
  const path = farm._polygon.getPath();
  const save = async () => {
    if (!spatialEditState || spatialEditState.entity !== farm || spatialEditState.action !== 'boundary') return;
    farm.boundary = path.getArray().map(spatialPoint).filter(Boolean);
    if (farm.boundary.length >= 3) farm.center = centroid(farm.boundary);
    farm._marker?.setPosition(farm.center);
    const state = spatialEditState; spatialEditState = null;
    farm._polygon.setEditable(false);
    agRefreshGeographicRelationships(farm);
    await persistSpatialFarm(farm, state.before, 'boundary-updated');
  };
  google.maps.event.addListener(path, 'set_at', () => { clearTimeout(farm.__spatialSaveTimer); farm.__spatialSaveTimer = setTimeout(save, 900); });
  google.maps.event.addListener(path, 'insert_at', () => { clearTimeout(farm.__spatialSaveTimer); farm.__spatialSaveTimer = setTimeout(save, 900); });
  google.maps.event.addListener(path, 'remove_at', () => { clearTimeout(farm.__spatialSaveTimer); farm.__spatialSaveTimer = setTimeout(save, 900); });
  toast('Drag boundary points or add points directly on the farm boundary');
}


function resolveDynamicSpatialEntity(entity) {
  const rawType = String(entity?.type || '');
  const type = rawType === 'company_facility' ? 'companyFacility' : rawType;
  const array = dynamicArray(type);
  return array.find(item => String(item?.id) === String(entity?.id)) || null;
}

async function saveDynamicSpatialEntity(entity, beforeState, action) {
  const cfg = DYNAMIC_LAYER_CONFIG[entity.type];
  const db = getFarmDb();
  const user = window.AGWorldBackend?.getUser?.();
  if (!cfg || !db || !user) throw new Error('You must be signed in to save map changes.');

  const row = {
    id: String(entity.id),
    name: entity.name || null,
    contact_name: entity.contactName || null,
    contact_cell: entity.contactCell || null,
    contact_email: entity.contactEmail || null,
    status: entity.status || 'Active',
    location_lat: Number(entity.lat),
    location_lng: Number(entity.lng),
    details: { ...(entity.details || {}), updatedAt: new Date().toISOString() },
    updated_at: new Date().toISOString(),
    updated_by: user.id
  };
  const { error } = await db.from(cfg.table).update(row).eq('id', row.id);
  if (error) throw error;

  const changedFields = {
    lat: { before: beforeState?.lat ?? null, after: entity.lat },
    lng: { before: beforeState?.lng ?? null, after: entity.lng }
  };
  const { error: auditError } = await db.from(cfg.audit).insert({
    [cfg.auditForeignKey || (entity.type + '_id')]: entity.id,
    action: action || 'position-updated',
    actor_id: user.id,
    source: 'entity_spatial_editor',
    before_state: beforeState || null,
    after_state: { ...entity, changed_fields: changedFields, changed_at: row.updated_at }
  });
  if (auditError) console.warn('Dynamic spatial audit failed', auditError);

  window.dispatchEvent(new CustomEvent('agworld:entity-updated', {
    detail: {
      entity: {
        id: entity.id,
        type: entity.type === 'companyFacility' ? 'company_facility' : entity.type,
        name: entity.name,
        status: entity.status,
        lat: entity.lat,
        lng: entity.lng,
        geometry: { type: 'Point', coordinates: [entity.lng, entity.lat] }
      },
      action: action || 'position-updated',
      patch: { lat: entity.lat, lng: entity.lng }
    }
  }));
}

function startDynamicSpatialMove(entity) {
  const live = resolveDynamicSpatialEntity(entity);
  if (!live?._marker) { toast('This entity is not currently mapped.'); return; }
  stopSpatialEdit(true);
  const before = { ...live, details: { ...(live.details || {}) } };
  spatialEditState = { entity: live, action: 'dynamic-move', before };
  live._marker.setDraggable(true);
  live._marker.setAnimation(google.maps.Animation.BOUNCE);
  const dragListener = live._marker.addListener('dragend', async event => {
    if (!spatialEditState || spatialEditState.entity !== live) return;
    const point = spatialPoint(event.latLng);
    if (!point) return;
    live.lat = point.lat; live.lng = point.lng;
    agRefreshGeographicRelationships(live);
    live._marker.setAnimation(null);
    live._marker.setDraggable(false);
    google.maps.event.removeListener(dragListener);
    spatialEditState = null;
    try {
      await saveDynamicSpatialEntity(live, before, 'position-updated');
      toast('Entity location saved');
    } catch (error) {
      console.warn('Dynamic spatial save failed', error);
      toast('Location moved locally, but shared save failed');
    }
  });
  toast('Drag the entity marker to its new location');
}

window.addEventListener('agworld:spatial-edit-request', event => {
  const { entity, action } = event.detail || {};
  if (!entity) return;
  if (action === 'cancel') { stopSpatialEdit(); return; }
  if (entity.type === 'farm') {
    if (action === 'move') startFarmMove(entity);
    else if (action === 'boundary') startFarmBoundaryEdit(entity);
    else if (action === 'territory') {
      toast('Territory assignment is selected from the existing territory map layer; click a territory to assign it.');
      spatialEditState = { entity, action: 'territory', before: cleanFarm(entity) };
      agInstallTerritoryAssignmentHook();
    }
    return;
  }
  if (action === 'move') {
    startDynamicSpatialMove(entity);
    return;
  }
  if (action === 'territory') {
    const live = resolveDynamicSpatialEntity(entity) || entity;
    spatialEditState = { entity: live, action: 'territory', before: { ...live, details: { ...(live.details || {}) } } };
    agInstallTerritoryAssignmentHook();
    window.dispatchEvent(new CustomEvent('agworld:dynamic-spatial-edit-request', { detail: { entity: live, action } }));
    toast('Select the territory directly on the map to assign this entity.');
    return;
  }
  window.dispatchEvent(new CustomEvent('agworld:dynamic-spatial-edit-request', { detail: { entity, action } }));
  toast('Spatial edit mode sent to the entity map layer');
});

function addFarm(farm) {
  if (!map || !farm?.center) return;

  // Replace stale overlays instead of stacking duplicate farm objects.
  if (farm._polygon) farm._polygon.setMap(null);
  if (farm._marker) farm._marker.setMap(null);

  const hasBoundary = Array.isArray(farm.boundary) && farm.boundary.length >= 3;
  const polygon = hasBoundary ? new google.maps.Polygon({
    paths: farm.boundary,
    strokeColor: '#d7e66b',
    strokeOpacity: 0.98,
    strokeWeight: 3,
    fillColor: '#8fb339',
    fillOpacity: 0.22,
    clickable: !creatingFarm,
    zIndex: 20,
    map
  }) : null;

  if (polygon) polygon.addListener('click', () => { if (!creatingFarm) selectFarm(farm, true); });

  const marker = new google.maps.Marker({
    position: farm.center,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#18c964',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 7
    },
    zIndex: 50,
    map,
    title: farm.name,
    zIndex: 30,
    clickable: !creatingFarm,
    label: { text: 'AG', color: '#fff', fontSize: '10px', fontWeight: '800' }
  });
  marker.addListener('click', () => { if (!creatingFarm) selectFarm(farm, true); });

  farm._polygon = polygon;
  farm._marker = marker;
  renderFarmObjects(farm);
}

function renderFarmObjects(farm) {
  // Keep the demo test visually clean: each demo farm is represented by one
  // green farm icon only. Its drone asset remains in the data for control
  // calculations but does not create a second map marker.
  if (farm.demo) return;
  (farm.objects || []).forEach(object => addObjectMarker(farm, object));
}

function objectPosition(object) {
  if (object.position) return object.position;
  if (object.geometry?.coordinates) return { lng: object.geometry.coordinates[0], lat: object.geometry.coordinates[1] };
  return null;
}

function addObjectMarker(farm, object) {
  if (!map) return;
  const position = objectPosition(object);
  if (!position) return;
  const type = OBJECT_TYPES[object.type] || { label: object.type || 'Object', icon: '•' };
  const marker = new google.maps.Marker({
    position, map, title: `${type.label}${object.name ? ` · ${object.name}` : ''}`,
    label: { text: type.icon, color: '#fff', fontSize: '13px' }
  });
  marker.addListener('click', () => showObject(object, farm));
  marker.__farmObject = object;
  marker.__farmId = farm.id;
  objectMarkers.push(marker);
  object._marker = marker;
}

function municipalityDisplayName(name) {
  // Keep the official database name intact for gameplay/data matching, but
  // remove all generic municipality descriptors from the map label.
  // Handles "Local Municipality", "District Municipality" and a plain
  // trailing "Municipality".
  return String(name || '')
    .replace(/\s*\bLocal\s+Municipality\b\s*/gi, ' ')
    .replace(/\s*\bDistrict\s+Municipality\b\s*/gi, ' ')
    .replace(/\s*\bMunicipality\b\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function updateMunicipalityLabels(zoom) {
  // Increase the name size smoothly as the user zooms into municipal territory.
  // The cap prevents names from becoming oversized while keeping them readable.
  const size = Math.max(11, Math.min(20, 11 + Math.round((zoom - 8) * 3)));
  municipalities.forEach(municipality => {
    const marker = municipality._marker;
    if (!marker) return;
    marker.setLabel({
      text: municipalityDisplayName(municipality.name),
      color: '#ffffff',
      fontSize: `${size}px`,
      fontWeight: '700'
    });
  });
}

function refreshMapVisibility() {
  if (!map) return;
  const zoom = map.getZoom();
  // Legacy placeholder geometry is never rendered; official GIS province
  // geometry is managed by the zoom rules below.
  const showBoundaries = zoom >= 8;
  const showObjects = zoom >= 12;
  // Hierarchical territory visibility:
  // Country (national) → Province → Municipality → Town → Farm.
  countries.forEach(country => {
    if (country._polygon) country._polygon.setMap(zoom < 6 ? map : null);
    if (country._marker) country._marker.setMap(zoom < 5.5 ? map : null);
  });
  // Province geometry is populated from the official GIS service.
  territories.forEach(territory => {
    // Provincial boundaries start at zoom 3 and remain visible through all
    // deeper territory levels so the province context is never lost.
    if (territory._polygon) {
      territory._polygon.setMap(zoom >= 3 ? map : null);
      territory._polygon.setOptions({ zIndex: 10, strokeWeight: zoom >= 8.5 ? 3.5 : 3.5 });
    }
    if (territory._marker) territory._marker.setMap(zoom >= 5.5 && zoom < 7.5 ? map : null);
  });
  updateMunicipalityLabels(zoom);
  municipalities.forEach(municipality => {
    if (municipality._polygon) municipality._polygon.setMap(zoom >= 8 && zoom < 11.5 ? map : null);
    // Show only the floating municipality name — no red/default map pin.
    if (municipality._marker) municipality._marker.setMap(zoom >= 8 && zoom < 11.5 ? map : null);
  });
  syncVisibleTownOverlays();
  farms.forEach(farm => {
    // Farms must remain visible once the user reaches the territory level.
    if (farm._polygon) farm._polygon.setMap(zoom >= 7 ? map : null);
    if (farm._marker) farm._marker.setMap(zoom >= 6 ? map : null);
  });
  objectMarkers.forEach(marker => marker.setMap(showObjects ? map : null));
}

function updateZoomStage() {
  if (!map) return;
  const zoom = map.getZoom();
  const stage = zoom < 5.5 ? 1 : zoom < 8 ? 2 : zoom < 11 ? 3 : zoom < 13 ? 4 : 5;
  const labels = ['COUNTRY · SOUTH AFRICA','PROVINCIAL TERRITORIES','MUNICIPAL TERRITORIES','TOWN TERRITORIES','FARM & ASSET LEVEL'];
  $('zoomStage').textContent = `ZOOM ${stage} · ${labels[stage - 1]}`;
  refreshMapVisibility();
  if (stage >= 3 && selected) showFarmDetail(selected);
}

function selectFarm(farm, zoom = true) {
  if (creatingFarm) return;

  // Clicking the currently selected farm is a toggle: close the Farm
  // Information panel and clear selection instead of leaving it open.
  if (selected && String(selected.id) === String(farm.id) && $('farmCard').classList.contains('show')) {
    $('farmCard').classList.remove('show');
    if (selected._polygon) selected._polygon.setOptions({ strokeWeight: 2, fillOpacity: 0.18, zIndex: 20 });
    selected = null;
    window.__AGWORLD_RUNTIME_FARM_SELECTION_V2__ = null;
    window.dispatchEvent(new CustomEvent('agworld:farm-selection-cleared'));
    $('mapStatus').textContent = 'Farm information panel closed';
    return;
  }

  selected = farm;

  // Canonical runtime selection signal. selectFarm is intentionally scoped inside
  // the GIS loader, so external wrappers around window.selectFarm are not reliable.
  // Every real marker/polygon/AI farm selection passes through this exact point.
  window.__AGWORLD_RUNTIME_FARM_SELECTION_V2__ = {
    farmId: String(farm.id),
    name: farm.name || '',
    timestamp: Date.now()
  };
  window.dispatchEvent(new CustomEvent('agworld:farm-selected', { detail: { farm } }));

  $('farmCard').classList.add('show');
  $('farmName').textContent = farm.name;
  const territory = territories.find(t => t.id === farm.territoryId);
  $('farmMeta').textContent = `${territory ? territory.name + ' · ' : ''}${farm.region} · ${farm.status} · ${farm.owner}`;
  $('farmDrones').textContent = farm.drones || 0;
  $('farmTractors').textContent = farm.tractors || 0;
  $('farmCrops').textContent = (farm.crops || []).length;
  $('farmScore').textContent = farm.opportunityScore ?? '—';
  $('farmLivestock').textContent = farm.livestock ?? '—';
  $('farmHarvest').textContent = farm.annualHarvest || '—';
  $('farmService').textContent = farm.lastService || '—';
  const objects = (farm.objects || []).map(o => OBJECT_TYPES[o.type]?.label || o.type).join(', ');
  $('farmDetailText').textContent = `Crops: ${(farm.crops || []).join(', ') || 'Not recorded'}. ${objects ? `Mapped objects: ${objects}. ` : ''}${farm.drones ? `${farm.drones} company drone asset${farm.drones === 1 ? '' : 's'} recorded.` : 'No company drone recorded — commercial opportunity.'}`;
  $('aiText').textContent = farm.drones === 0
    ? `${farm.name} has no company drone recorded and scores ${farm.opportunityScore ?? '—'}/100. Qualify this opportunity and move the territory forward.`
    : `${farm.name} is an active relationship. Protect the account through service quality and customer satisfaction.`;
  updateFleetTransactionAction(farm, 'farm');

  const updateButton = $('farm3d');
  if (updateButton) {
    updateButton.textContent = 'UPDATE FARM DETAILS';
    updateButton.onclick = () => openEditFarm(selected);
    ensureFarmHistoryButton();
  }
  if (map && zoom) {
    map.panTo(farm.center);
    map.setZoom(12);
    if (farm._marker) farm._marker.setMap(farm.demo ? map : map);
    if (farm._polygon) {
      farm._polygon.setMap(map);
      farm._polygon.setOptions({ strokeWeight: 4, fillOpacity: 0.30, zIndex: 100 });
    }
  }
  showFarmDetail(farm);
  // Reassert Fleet controls after the legacy Farm action lifecycle has rebuilt the action area.
  updateFleetTransactionAction(farm, 'farm');

  // V2.6 live UI bridge. The existing Farm Card is the visual host for the
  // shared Entity Engine. Create the host here, inside the real selection flow,
  // so a Farm selection can never silently omit the V2 layer.
  let v2Host = document.getElementById('agworldV2FarmDetailHost');
  if (!v2Host) {
    v2Host = document.createElement('div');
    v2Host.id = 'agworldV2FarmDetailHost';
    const actions = $('farmActions');
    if (actions) $('farmCard').insertBefore(v2Host, actions);
    else $('farmCard').appendChild(v2Host);
  }

  // V2.7: the host is part of the canonical Farm Card selection lifecycle.
  // Never leave it hidden simply because the enhancement script is still
  // initialising. A visible fallback makes the integration state deterministic.
  v2Host.hidden = false;
  v2Host.style.cssText = 'display:block!important;visibility:visible!important;opacity:1!important;margin-top:10px;padding-top:10px;border-top:1px solid #dce5e8;font-size:9px;color:#60717a;';
  v2Host.innerHTML = '<section class="agworld-v2-live-fallback" style="display:block;background:#f7fafb;border:1px solid #dce5e8;border-radius:6px;padding:8px;"><div style="font-size:8px;font-weight:800;letter-spacing:1px;color:#168aa0;margin-bottom:4px;">AG WORLD V2 ENTITY ENGINE</div><div style="font-size:8px;color:#60717a;">Connecting entity and relationship data…</div></section>';

  const openV2 = () => {
    try {
      if (typeof window.openV2FarmDetail === 'function') {
        window.openV2FarmDetail(farm);
        return true;
      }
      window.dispatchEvent(new CustomEvent('agworld:v2-open-live-farm', { detail: farm }));
      return !!window.AGWorldV2?.LiveFarmDetailBridge;
    } catch (error) {
      console.error('[AG World V2] Farm Card bridge attempt failed', error);
      return false;
    }
  };

  if (!openV2()) {
    // Do not ask the user to reselect the farm. Retry against the same canonical
    // selection while keeping the V2 host visibly present.
    const retryDelays = [100, 300, 800, 1500];
    retryDelays.forEach(delay => {
      setTimeout(() => {
        if (!v2Host.isConnected || openV2()) return;
        v2Host.hidden = false;
        v2Host.style.display = 'block';
        v2Host.innerHTML = '<section class="agworld-v2-live-fallback" style="display:block;background:#fff8ef;border:1px solid #efd8b5;border-radius:6px;padding:8px;"><div style="font-size:8px;font-weight:800;letter-spacing:1px;color:#9b5d22;margin-bottom:4px;">AG WORLD V2 ENTITY ENGINE</div><div style="font-size:8px;color:#7a6044;">V2 is still initialising. This Farm remains selected and the panel will connect automatically.</div></section>';
      }, delay);
    });
  }
}

async function openFarmHistory(farm = selected) {
  if (!farm?.id) { toast('Select a farm first.'); return; }
  const db = getFarmDb();
  if (!db) { toast('Farm history database is not available.'); return; }

  let modal = $('farmHistoryModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'farmHistoryModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(4,10,14,.78);padding:24px;';
    modal.innerHTML = '<div style="width:min(900px,96vw);max-height:88vh;overflow:auto;background:#101a20;border:1px solid rgba(215,230,107,.55);border-radius:18px;box-shadow:0 24px 80px rgba(0,0,0,.65);padding:24px;color:#eaf2f3;"><div style="display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:18px;"><div><div style="color:#d7e66b;font-size:12px;letter-spacing:2px;">CANONICAL FARM AUDIT TRAIL</div><h2 id="farmHistoryTitle" style="margin:4px 0 0;">FARM HISTORY</h2></div><button id="closeFarmHistory" style="background:transparent;border:1px solid #d7e66b;color:#d7e66b;border-radius:8px;padding:8px 12px;cursor:pointer;">CLOSE</button></div><div id="farmHistoryBody">Loading history…</div></div>';
    document.body.appendChild(modal);
    $('closeFarmHistory').onclick = () => modal.remove();
  }

  $('farmHistoryTitle').textContent = 'FARM HISTORY · ' + (farm.name || farm.id);
  $('farmHistoryBody').textContent = 'Loading shared audit trail…';
  modal.style.display = 'flex';

  const { data, error } = await db.from('farm_audit_readable')
    .select('farm_id,actor_name,action,before_state,after_state,created_at')
    .eq('farm_id', String(farm.id))
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Farm history load failed', error);
    $('farmHistoryBody').textContent = 'Could not load farm history: ' + (error.message || error.code || 'Unknown error');
    return;
  }
  if (!data?.length) {
    $('farmHistoryBody').textContent = 'No recorded changes yet.';
    return;
  }

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const rows = [];
  data.forEach(record => {
    const changes = record.after_state?.changed_fields || {};
    const entries = Object.entries(changes);
    if (!entries.length) {
      rows.push('<tr><td>' + escapeHtml(record.actor_name) + '</td><td>Farm record</td><td>—</td><td>—</td><td>' + new Date(record.created_at).toLocaleString() + '</td></tr>');
    } else {
      entries.forEach(([field, change]) => rows.push('<tr><td>' + escapeHtml(record.actor_name) + '</td><td>' + escapeHtml(field) + '</td><td>' + escapeHtml(JSON.stringify(change?.before ?? '—')) + '</td><td>' + escapeHtml(JSON.stringify(change?.after ?? '—')) + '</td><td>' + new Date(record.created_at).toLocaleString() + '</td></tr>'));
    }
  });
  $('farmHistoryBody').innerHTML = '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="text-align:left;color:#d7e66b;"><th style="padding:9px;">CHANGED BY</th><th style="padding:9px;">FIELD</th><th style="padding:9px;">PREVIOUS</th><th style="padding:9px;">NEW</th><th style="padding:9px;">DATE & TIME</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>';
}

function ensureFarmHistoryButton() {
  const card = $('farmCard');
  const updateButton = $('farm3d');
  if (!card || !updateButton) return;

  // Keep both farm actions inside ONE action row. Previously the History
  // button was inserted below UPDATE FARM DETAILS and could disappear behind
  // the fixed bottom game panel.
  let actions = $('farmActions');
  if (!actions) {
    actions = document.createElement('div');
    actions.id = 'farmActions';
    actions.style.cssText = 'display:flex;gap:6px;margin-top:9px;';
    updateButton.insertAdjacentElement('beforebegin', actions);
    actions.appendChild(updateButton);
  }

  actions.style.cssText = 'display:flex;flex-direction:column;gap:6px;margin-top:9px;width:100%;';
  updateButton.style.cssText = 'width:100%;margin-top:0;flex:none;display:block;';
  updateButton.textContent = 'UPDATE FARM DETAILS';
  updateButton.type = 'button';
  updateButton.onclick = () => openEditFarm(selected);

  let button = $('farmHistoryBtn');
  if (!button) {
    button = document.createElement('button');
    button.id = 'farmHistoryBtn';
    button.type = 'button';
    button.textContent = 'FARM HISTORY';
    actions.appendChild(button);
  } else if (button.parentElement !== actions) {
    actions.appendChild(button);
  }
  button.style.cssText = 'width:100%;margin-top:0;flex:none;display:block;';
  button.onclick = () => openFarmHistory(selected);
}

function ensureEditButton() {
  // Legacy helper retained only for compatibility with older map hooks.
  // The Farm Information panel now has ONE action: UPDATE FARM DETAILS.
  const legacy = $('editFarmBtn');
  if (legacy) legacy.remove();
  const updateButton = $('farm3d');
  if (updateButton) {
    updateButton.textContent = 'UPDATE FARM DETAILS';
    updateButton.onclick = () => openEditFarm(selected);
    ensureFarmHistoryButton();
  }
}

function showFarmDetail(farm) {
  // The information panel is the canonical place for both farm actions.
  // Ensure both buttons are attached every time a farm is selected.
  ensureEditButton();
  if (map && map.getZoom() >= 9) {
    $('mapStatus').textContent = `Farm selected · ${farm.name} · boundary and ${(farm.objects || []).length} mapped objects linked to record ${farm.id}`;
  }
}

function showObject(object, farm) {
  const type = OBJECT_TYPES[object.type] || { label: object.type, icon: '•' };
  $('farmCard').classList.add('show');
  ensureEditButton();
  $('farmName').textContent = object.name || type.label;
  $('farmMeta').textContent = `${farm.name} · ${type.label} · ${object.source || 'manual'}`;
  const details = Object.entries(object.properties || {}).filter(([, value]) => value !== '').map(([key, value]) => `${key}: ${value}`).join(' · ');
  $('farmDetailText').textContent = details || `Positioned ${type.label.toLowerCase()} on ${farm.name}.`;
  $('farmDrones').textContent = object.type === 'drone' ? 1 : farm.drones || 0;
  $('farmTractors').textContent = object.type === 'tractor' ? 1 : farm.tractors || 0;
  $('farmCrops').textContent = object.type === 'crop-field' ? 1 : (farm.crops || []).length;
  $('farmScore').textContent = farm.opportunityScore ?? '—';
  $('farmLivestock').textContent = object.type === 'livestock-area' ? (object.properties?.['Estimated head'] || 'AREA') : (farm.livestock ?? '—');
  $('farmHarvest').textContent = farm.annualHarvest || '—';
  $('farmService').textContent = farm.lastService || '—';
}

function national() {
  if (!map) return;
  map.setCenter({ lat: -29, lng: 24 });
  map.setZoom(5);
  $('farmCard').classList.remove('show');
  selected = null;
}

let farmWizardStep = 1;
let farmWizardDraftId = null;
function showFarmWizardStep(step) {
  farmWizardStep = step;
  document.querySelectorAll('.farm-wizard-step').forEach(el => el.hidden = Number(el.dataset.step) !== step);
  const progress = $('farmWizardProgress'), title = $('farmWizardTitle');
  if (progress) progress.textContent = `STEP ${step} OF 4`;
  if (title) title.textContent = step === 1 ? 'SELECT FARM BOUNDARY' : step === 2 ? 'CAPTURE FARM INFORMATION' : step === 3 ? 'SELECT FARM ASSETS' : 'DRONE OWNERSHIP & PURCHASES';
}
function farmDronePortfolioFromForm() {
  const rows=[...document.querySelectorAll('#farmDronePortfolio [data-drone-row]')];
  return rows.map(row=>({supplierType:row.dataset.supplierType,supplierId:row.dataset.supplierId,supplierName:row.dataset.supplierName,quantity:Math.max(0,Number(row.querySelector('input')?.value||0))})).filter(item=>item.quantity>0);
}
function selectedFarmChecklist(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
}

function checklistAssetRecords(equipment) {
  const definitions = {
    'our-drone': { type: 'drone', name: 'Our Drone', assetType: 'our-drone' },
    'competitor-drone': { type: 'competitor-drone', name: 'Competitor Drone', assetType: 'competitor-drone' },
    'tractor-sprayer': { type: 'tractor', name: 'Tractor / Sprayer', assetType: 'tractor-sprayer' },
    'aerial-services': { type: 'aerial-services', name: 'Aerial Services', assetType: 'aerial-services' }
  };
  return equipment.map(value => {
    const definition = definitions[value];
    return definition ? {
      id: `asset-${value}`,
      ...definition,
      source: 'farm_checklist'
    } : null;
  }).filter(Boolean);
}

function syncFarmChecklistUI(farm) {
  const equipment = new Set(
    Array.isArray(farm?.equipmentSelections) ? farm.equipmentSelections :
    (farm?.assets || farm?.objects || []).map(asset => {
      const raw = String(asset?.assetType || asset?.type || asset?.name || '').toLowerCase();
      if (raw.includes('competitor')) return 'competitor-drone';
      if (raw.includes('company drone') || raw === 'drone' || raw.includes('our drone')) return 'our-drone';
      if (raw.includes('tractor')) return 'tractor-sprayer';
      if (raw.includes('aerial')) return 'aerial-services';
      return '';
    }).filter(Boolean)
  );
  document.querySelectorAll('input[name="farmEquipment"]').forEach(input => {
    input.checked = equipment.has(input.value);
  });
  const crops = new Set(Array.isArray(farm?.crops) ? farm.crops : []);
  document.querySelectorAll('input[name="farmCropType"]').forEach(input => {
    input.checked = crops.has(input.value);
  });
}

function wizardBaseFarm() {
  const existing = editingFarmId ? farms.find(f => String(f.id) === String(editingFarmId)) : null;
  const equipmentSelections = selectedFarmChecklist('farmEquipment');
  const cropSelections = selectedFarmChecklist('farmCropType');
  const checklistAssets = checklistAssetRecords(equipmentSelections);
  const checklistTypes = new Set(['drone','competitor-drone','tractor','aerial-services']);
  const retainedObjects = draftObjects
    .filter(object => !checklistTypes.has(String(object?.type || '')))
    .map(object => ({ ...object, properties:{...(object.properties||{})} }));
  const objects = [...retainedObjects, ...checklistAssets];
  const hasOurDrone = equipmentSelections.includes('our-drone');
  const hasTractor = equipmentSelections.includes('tractor-sprayer');

  return {
    ...(existing || {}),
    id: editingFarmId || farmWizardDraftId || `farm-user-${Date.now()}`,
    boundary: newBoundary.map(p => ({ lat:Number(p.lat), lng:Number(p.lng) })),
    center: existing?.center || centroid(newBoundary),
    objects,
    assets: checklistAssets.map(asset => ({ ...asset })),
    equipmentSelections,
    dronePortfolio: farmDronePortfolioFromForm().length ? farmDronePortfolioFromForm() : (existing?.dronePortfolio || []),
    crops: cropSelections,
    drones: hasOurDrone ? 1 : 0,
    tractors: hasTractor ? 1 : 0,
    name: $('newFarmName').value.trim() || existing?.name || '',
    owner: $('newFarmOwner').value.trim() || existing?.owner || '',
    region: $('newFarmRegion').value.trim() || existing?.region || '',
    country: $('newFarmCountry')?.value.trim() || existing?.country || '',
    province: $('newFarmProvince')?.value.trim() || existing?.province || '',
    municipality: $('newFarmMunicipality')?.value.trim() || existing?.municipality || '',
    djiRegion: $('newFarmDjiRegion')?.value.trim() || existing?.djiRegion || '',
    nearestTown: $('newFarmNearestTown')?.value.trim() || existing?.nearestTown || '',
    ownerCell: $('newFarmOwnerCell')?.value.trim() || existing?.ownerCell || '',
    ownerEmail: $('newFarmOwnerEmail')?.value.trim() || existing?.ownerEmail || '',
    accountsManager: $('newFarmAccountsManager')?.value.trim() || existing?.accountsManager || '',
    accountsManagerCell: $('newFarmAccountsManagerCell')?.value.trim() || existing?.accountsManagerCell || '',
    accountsManagerEmail: $('newFarmAccountsManagerEmail')?.value.trim() || existing?.accountsManagerEmail || '',
    cropsOnFarm: $('newFarmCropsOnFarm')?.value.trim() || cropSelections.join(', ') || existing?.cropsOnFarm || '',
    equipmentOnFarm: $('newFarmEquipmentOnFarm')?.value.trim() || checklistAssets.map(asset => asset.name).join(', ') || existing?.equipmentOnFarm || '',
    equipmentStatus: $('newFarmEquipmentStatus')?.value.trim() || existing?.equipmentStatus || '',
    status: $('newFarmStatus').value || existing?.status || 'Prospect',
    annualHarvest: $('newFarmHarvest').value.trim() || existing?.annualHarvest || '',
    lastService: $('newFarmService').value.trim() || existing?.lastService || '',
    notes: $('newFarmNotes').value.trim() || existing?.notes || '',
    source: 'manual',
    updatedAt: new Date().toISOString()
  };
}
async function saveFarmWizardStep(step) {
  if (step === 1 && newBoundary.length < 3) {
    toast('Select and finish a boundary with at least 3 points.');
    return false;
  }
  if (step === 2 && !$('newFarmName').value.trim()) {
    toast('Enter a farm name before saving farm information.');
    return false;
  }

  const farm = wizardBaseFarm();
  farmWizardDraftId = farm.id;

  // Step 1 happens before the user has entered a farm name. The shared farms
  // table requires a name, so persist the boundary as a real database draft
  // instead of allowing the insert to fail and silently block SAVE & NEXT.
  if (step === 1 && !String(farm.name || '').trim()) {
    farm.name = `Untitled Farm ${String(farm.id).replace(/^farm-user-/, '').slice(-8)}`;
  }

  const existingIndex = farms.findIndex(f => String(f.id) === String(farm.id));
  const beforeState = existingIndex >= 0
    ? JSON.parse(JSON.stringify(cleanFarm(farms[existingIndex])))
    : null;

  if (existingIndex >= 0) {
    farms[existingIndex] = { ...farms[existingIndex], ...farm };
  } else {
    farms.push(farm);
  }

  // Keep the exact canonical in-memory record selected by the map and editor.
  // Do not leave selected pointing at a stale pre-save object.
  const activeFarm = farms.find(item => String(item.id) === String(farm.id)) || farm;
  if (selected && String(selected.id) === String(farm.id)) selected = activeFarm;

  window.__AG_WORLD_FARMS = farms;
  saveLocal();

  // Each wizard step is persisted immediately. SAVE & NEXT only advances after
  // the shared backend confirms the step, so the next player can see it too.
  try {
    await saveFarmToDatabase(farm, beforeState);
  } catch (error) {
    console.error('Wizard step database save failed', error);
    const detail = error?.message || error?.details || 'Unknown database error';
    toast(`Step was not saved to the shared database: ${detail}`);
    return false;
  }

  // As soon as Step 2 is saved, make the farm a live part of the map.
  // Do not wait for a page refresh or for Step 3. This is important for the
  // multiplayer test because the saved record and its location are now visible
  // as a normal farm immediately.
  if (step >= 2 && map && farm.center) {
    addFarm(farm);
    refreshMapVisibility();
    window.dispatchEvent(new CustomEvent('agworld:farm-created-or-updated', {
      detail: { farmId: farm.id, action: existingIndex >= 0 ? 'updated' : 'created' }
    }));
  }

  toast(step === 1
    ? 'Boundary saved to the shared farm database'
    : step === 2
      ? 'Farm information saved · farm added to the map'
      : 'Farm assets saved to the shared farm database');
  return true;
}

function openCreateFarm() {
  if (!map) { toast('Add the Google Maps API key first.'); return; }
  editingFarmId = null;
  creatingFarm = true;
  newBoundary = [];
  draftObjects = [];
  placingObjectType = null;
  resetCreateForm();
  farmWizardDraftId = null;
  $('farmCreateModal').classList.remove('show');

  // Step 1 is now map-first: CREATE FARM immediately enters boundary mode.
  startBoundary();
}

function openEditFarm(farm) {
  if (!farm || !map) return;
  editingFarmId = farm.id;
  creatingFarm = false;
  newBoundary = (farm.boundary || []).map(p => ({ lat: Number(p.lat), lng: Number(p.lng) }));
  draftObjects = JSON.parse(JSON.stringify(farm.objects || []));
  syncFarmChecklistUI(farm);
  renderDronePortfolio('farmDronePortfolio', farm.dronePortfolio || []);
  $('newFarmCountry').value = farm.country || '';
  $('newFarmProvince').value = farm.province || '';
  $('newFarmMunicipality').value = farm.municipality || '';
  $('newFarmDjiRegion').value = farm.djiRegion || '';
  $('newFarmNearestTown').value = farm.nearestTown || '';
  $('newFarmName').value = farm.name || '';
  $('newFarmOwner').value = farm.owner || '';
  $('newFarmOwnerCell').value = farm.ownerCell || '';
  $('newFarmOwnerEmail').value = farm.ownerEmail || '';
  $('newFarmAccountsManager').value = farm.accountsManager || '';
  $('newFarmAccountsManagerCell').value = farm.accountsManagerCell || '';
  $('newFarmAccountsManagerEmail').value = farm.accountsManagerEmail || '';
  $('newFarmCropsOnFarm').value = farm.cropsOnFarm || '';
  $('newFarmEquipmentOnFarm').value = farm.equipmentOnFarm || '';
  $('newFarmEquipmentStatus').value = farm.equipmentStatus || '';
  $('newFarmRegion').value = farm.region || '';
  $('newFarmStatus').value = farm.status || 'Prospect';
  $('newFarmHarvest').value = farm.annualHarvest || '';
  $('newFarmService').value = farm.lastService || '';
  $('newFarmNotes').value = farm.notes || '';
  if (boundaryPolygon) boundaryPolygon.setMap(null);
  boundaryPolygon = new google.maps.Polygon({ paths: newBoundary, strokeOpacity: .95, strokeWeight: 3, fillOpacity: .12, map, clickable: false });
  // Editing an existing farm never re-enters boundary creation. The saved
  // boundary remains untouched and the user starts directly at Step 2 with
  // the current canonical database values populated.
  renderObjectEditor();
  $('boundaryStatus').textContent = `Existing boundary loaded · ${newBoundary.length} points`;
  $('objectStatus').textContent = 'Update farm information, then continue to Step 3 to adjust equipment and crops.';
  $('farmCreateModal').querySelector('.farm3d-head strong').textContent = 'UPDATE FARM DETAILS';
  showFarmWizardStep(2);
  $('farmCreateModal').classList.add('show');
}

function startBoundary() {
  if (!map) return;
  creatingFarm = true;
  placingObjectType = null;
  $('farmCreateModal').classList.remove('show');

  // Drawing mode must work at every zoom level. While drawing, temporarily
  // disable all interactive territory/farm overlays so their click handlers
  // cannot consume the map click before the boundary listener receives it.
  farms.forEach(f => {
    if (f._polygon) f._polygon.setOptions({ clickable: false });
    if (f._marker) f._marker.setClickable(false);
  });
  [...countries, ...territories, ...municipalities, ...towns].forEach(t => {
    if (t._polygon) t._polygon.setOptions({ clickable: false });
    if (t._marker) t._marker.setClickable(false);
  });

  $('mapStatus').textContent = 'DRAWING MODE · zoom and click farm boundary points on the satellite map';
  map.setOptions({ draggableCursor: 'crosshair', gestureHandling: 'greedy', clickableIcons: false });
  newBoundary = [];
  if (boundaryPolygon) boundaryPolygon.setMap(null);
  boundaryPolygon = null;
  if (drawListener) google.maps.event.removeListener(drawListener);
  drawListener = map.addListener('click', event => {
    if (!creatingFarm || placingObjectType || !event?.latLng) return;
    newBoundary.push({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    renderDraftBoundary();
    $('mapStatus').textContent = `DRAWING MODE · ${newBoundary.length} boundary points · zoom freely and continue clicking`;
  });
  showBoundaryContinueControl();
  toast('Boundary mode active · zoom freely and click each farm corner');
}

function renderDraftBoundary() {
  if (boundaryPolygon) boundaryPolygon.setMap(null);
  boundaryPolygon = new google.maps.Polygon({
    paths: newBoundary, strokeColor: '#00b8d9', strokeOpacity: .95,
    strokeWeight: 3, fillColor: '#00b8d9', fillOpacity: .12, map, clickable: false
  });
  $('mapStatus').textContent = `DRAWING MODE · ${newBoundary.length} boundary points`;
}

function removeBoundaryContinueControl() {
  // Remove every known map boundary action and any duplicate injected by an
  // older workflow/module. The Step 1 modal buttons are intentionally left
  // alone because they do not use the "SAVE BOUNDARY & CONTINUE" map action.
  document.querySelectorAll(
    '#farmBoundaryContinueControl, .farm-boundary-continue-control, [data-ag-boundary-control="1"], #saveBoundaryContinueMap, #clearBoundaryMap'
  ).forEach(node => {
    const control = node.id === 'saveBoundaryContinueMap' || node.id === 'clearBoundaryMap'
      ? node.closest('#farmBoundaryContinueControl, .farm-boundary-continue-control, [data-ag-boundary-control="1"]') || node
      : node;
    control?.remove();
  });

  document.querySelectorAll('button').forEach(button => {
    if (button.id === 'saveBoundaryContinueMap' || button.id === 'clearBoundaryMap') return;
    if (button.textContent.trim() === 'SAVE BOUNDARY & CONTINUE') {
      button.closest('.farm-boundary-continue-control, [data-ag-boundary-control], div')?.remove();
    }
  });
}

function enforceSingleBoundaryContinueControl() {
  const controls = [...document.querySelectorAll('#farmBoundaryContinueControl, .farm-boundary-continue-control, [data-ag-boundary-control="1"]')];
  if (controls.length <= 1) return;
  controls.slice(0, -1).forEach(control => control.remove());
}

function showBoundaryContinueControl() {
  // Create one canonical map action layer and immediately/continuously remove
  // stale copies that may be injected by legacy map hooks.
  removeBoundaryContinueControl();
  const control = document.createElement('div');
  control.id = 'farmBoundaryContinueControl';
  control.className = 'farm-boundary-continue-control';
  control.dataset.agBoundaryControl = '1';
  control.style.cssText = 'position:absolute;top:72px;left:50%;transform:translateX(-50%);z-index:1400;display:flex;gap:8px;padding:8px;background:rgba(8,18,22,.92);border:1px solid rgba(151,204,76,.55);border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.35)';
  control.innerHTML = '<button type="button" id="saveBoundaryContinueMap" style="background:#9dcc38;color:#10200d;border:0;border-radius:5px;padding:10px 16px;font-weight:900;letter-spacing:.6px;cursor:pointer">SAVE BOUNDARY & CONTINUE</button><button type="button" id="clearBoundaryMap" style="background:#18242a;color:#fff;border:1px solid #52626a;border-radius:5px;padding:10px 12px;font-weight:700;cursor:pointer">CLEAR</button>';
  const host = $('map')?.parentElement || document.body;
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.appendChild(control);
  $('saveBoundaryContinueMap').onclick = finishBoundary;
  $('clearBoundaryMap').onclick = () => { clearBoundary(); startBoundary(); };

  // Catch a second control inserted after this function has returned.
  requestAnimationFrame(enforceSingleBoundaryContinueControl);
  setTimeout(enforceSingleBoundaryContinueControl, 0);

  if (!window.__AG_WORLD_BOUNDARY_CONTROL_OBSERVER) {
    window.__AG_WORLD_BOUNDARY_CONTROL_OBSERVER = new MutationObserver(() => {
      if (!creatingFarm) return;
      enforceSingleBoundaryContinueControl();
      // Remove delayed legacy overlays that use the same visible action text
      // but were not created by this canonical control.
      document.querySelectorAll('button').forEach(button => {
        if (button.id === 'saveBoundaryContinueMap') return;
        if (button.textContent.trim() === 'SAVE BOUNDARY & CONTINUE') {
          button.closest('.farm-boundary-continue-control, [data-ag-boundary-control], div')?.remove();
        }
      });
    });
    window.__AG_WORLD_BOUNDARY_CONTROL_OBSERVER.observe(document.body, { childList: true, subtree: true });
  }
}

async function finishBoundary() {
  if (newBoundary.length < 3) { toast('A farm boundary needs at least 3 points.'); return false; }
  if (drawListener) google.maps.event.removeListener(drawListener);
  drawListener = null;
  creatingFarm = false;
  placingObjectType = null;

  const controlButton = $('saveBoundaryContinueMap');
  if (controlButton) { controlButton.disabled = true; controlButton.textContent = 'SAVING BOUNDARY…'; }

  try {
    const saved = await saveFarmWizardStep(1);
    if (!saved) {
      creatingFarm = true;
      startBoundary();
      return false;
    }
  } catch (error) {
    console.error('Boundary continue save failed', error);
    toast('Could not save boundary: ' + (error?.message || 'Unknown error'));
    creatingFarm = true;
    startBoundary();
    return false;
  } finally {
    if (controlButton) { controlButton.disabled = false; controlButton.textContent = 'SAVE BOUNDARY & CONTINUE'; }
  }

  // Re-enable territory/farm interaction only after the shared database confirms Step 1.
  farms.forEach(f => {
    if (f._polygon) f._polygon.setOptions({ clickable: true });
    if (f._marker) f._marker.setClickable(true);
  });
  [...countries, ...territories, ...municipalities, ...towns].forEach(t => {
    if (t._polygon) t._polygon.setOptions({ clickable: true });
    if (t._marker) t._marker.setClickable(true);
  });
  map.setOptions({ draggableCursor: null, clickableIcons: true });
  refreshMapVisibility();
  removeBoundaryContinueControl();

  $('boundaryStatus').textContent = `Boundary saved · ${newBoundary.length} points`;
  $('objectStatus').textContent = 'Select farm assets in Step 3 after capturing the farm information.';
  showFarmWizardStep(2);
  $('farmCreateModal').querySelector('.farm3d-head strong').textContent = 'CAPTURE FARM INFORMATION';
  $('farmCreateModal').classList.add('show');
  toast('Boundary saved · continue with Step 2');
  return true;
}

function clearBoundary() {
  removeBoundaryContinueControl();
  newBoundary = [];
  draftObjects = [];
  placingObjectType = null;
  if (boundaryPolygon) boundaryPolygon.setMap(null);
  boundaryPolygon = null;
  if (drawListener) google.maps.event.removeListener(drawListener);
  drawListener = null;
  if (map) { map.setOptions({ draggableCursor: null, clickableIcons: true }); refreshMapVisibility(); }
  $('boundaryStatus').textContent = 'No boundary created.';
  $('objectStatus').textContent = 'No object selected.';
  renderObjectEditor();
  $('mapStatus').textContent = 'Satellite map active · farm records loaded';
}

function closeCreateFarm() {
  clearBoundary();
  editingFarmId = null;
  creatingFarm = false;
  $('farmCreateModal').classList.remove('show');
}

function centroid(points) {
  if (!points.length) return { lat: -29, lng: 24 };
  return points.reduce((sum, point) => ({ lat: sum.lat + point.lat / points.length, lng: sum.lng + point.lng / points.length }), { lat: 0, lng: 0 });
}

function pointInside(point, polygon) {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng, xj = polygon[j].lat, yj = polygon[j].lng;
    const intersect = ((yi > point.lng) !== (yj > point.lng)) && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// A map label should sit visually inside the territory, not merely at the
// average of its vertices. This is especially important for large, irregular
// provinces such as the Northern Cape and KwaZulu-Natal.
function territoryVisualCenter(points) {
  if (!points || points.length < 3) return centroid(points || []);

  // Polygon area centroid.
  let signedArea = 0, cx = 0, cy = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const p1 = points[j], p2 = points[i];
    const cross = p1.lng * p2.lat - p2.lng * p1.lat;
    signedArea += cross;
    cx += (p1.lng + p2.lng) * cross;
    cy += (p1.lat + p2.lat) * cross;
  }
  signedArea *= 0.5;
  if (Math.abs(signedArea) > 1e-10) {
    const areaCenter = { lat: cy / (6 * signedArea), lng: cx / (6 * signedArea) };
    if (Number.isFinite(areaCenter.lat) && Number.isFinite(areaCenter.lng) && pointInside(areaCenter, points)) {
      return areaCenter;
    }
  }

  // If the mathematical centroid falls outside an irregular polygon, search
  // the interior around the bounding-box centre and choose the most central
  // valid point.
  const lats = points.map(p => p.lat), lngs = points.map(p => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const boxCenter = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
  if (pointInside(boxCenter, points)) return boxCenter;

  let best = null, bestDistance = Infinity;
  const steps = 32;
  for (let y = 1; y < steps; y++) {
    for (let x = 1; x < steps; x++) {
      const candidate = {
        lat: minLat + ((maxLat - minLat) * y / steps),
        lng: minLng + ((maxLng - minLng) * x / steps)
      };
      if (!pointInside(candidate, points)) continue;
      const d = Math.pow(candidate.lat - boxCenter.lat, 2) + Math.pow(candidate.lng - boxCenter.lng, 2);
      if (d < bestDistance) { bestDistance = d; best = candidate; }
    }
  }
  return best || centroid(points);
}

function chooseObject(type) {
  if (newBoundary.length < 3) { toast('Draw and finish the farm boundary first.'); return; }
  placingObjectType = type;
  creatingFarm = true;
  document.querySelectorAll('.object-palette button').forEach(button => button.classList.toggle('active', button.dataset.object === type));
  $('farmCreateModal').classList.remove('show');
  map.setOptions({ draggableCursor: 'crosshair' });
  $('mapStatus').textContent = `PLACE MODE · click inside boundary to place ${OBJECT_TYPES[type].label}`;
  if (drawListener) google.maps.event.removeListener(drawListener);
  drawListener = map.addListener('click', event => placeObject(event.latLng));
  toast(`Place ${OBJECT_TYPES[type].label} on the farm`);
}

function placeObject(latLng) {
  if (!placingObjectType) return;
  const position = { lat: latLng.lat(), lng: latLng.lng() };
  if (!pointInside(position, newBoundary)) { toast('Object must be placed inside the farm boundary.'); return; }
  const type = placingObjectType;
  const object = {
    id: `obj-${Date.now()}-${draftObjects.length}`,
    type,
    name: OBJECT_TYPES[type].label,
    position,
    source: 'manual',
    createdAt: new Date().toISOString(),
    properties: {}
  };
  draftObjects.push(object);
  if (drawListener) google.maps.event.removeListener(drawListener);
  drawListener = null;
  placingObjectType = null;
  creatingFarm = false;
  map.setOptions({ draggableCursor: null });
  editDraftObject(object.id);
  renderObjectEditor();
  $('farmCreateModal').classList.add('show');
  $('objectStatus').textContent = `${object.name} placed. Edit its details or choose another object.`;
  $('mapStatus').textContent = `Object placed · ${object.name} · ${draftObjects.length} farm objects`;
}

function editDraftObject(id) {
  const object = draftObjects.find(item => item.id === id);
  if (!object) return;
  const type = OBJECT_TYPES[object.type] || { label: object.type, fields: [] };
  const name = window.prompt(`Name for ${type.label}:`, object.name || type.label);
  if (name !== null && name.trim()) object.name = name.trim();
  type.fields.forEach(field => {
    const current = object.properties?.[field] || '';
    const value = window.prompt(`${field}:`, current);
    if (value !== null) {
      object.properties = object.properties || {};
      object.properties[field] = value.trim();
    }
  });
}

function removeDraftObject(id) {
  draftObjects = draftObjects.filter(object => object.id !== id);
  renderObjectEditor();
  $('objectStatus').textContent = 'Object removed from the draft farm.';
}

function renderObjectEditor() {
  const list = $('objectList');
  const summary = $('objectSummary');
  if (!list) return;
  list.innerHTML = draftObjects.map(object => {
    const type = OBJECT_TYPES[object.type] || { label: object.type || 'Object', icon: '•' };
    const detail = Object.values(object.properties || {}).filter(Boolean).slice(0, 2).join(' · ');
    return `<div class="object-row"><span>${type.icon} ${object.name}${detail ? ` · ${detail}` : ''}</span><span><button data-edit="${object.id}">EDIT</button><button data-remove="${object.id}">REMOVE</button></span></div>`;
  }).join('');
  list.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => { editDraftObject(button.dataset.edit); renderObjectEditor(); });
  list.querySelectorAll('[data-remove]').forEach(button => button.onclick = () => removeDraftObject(button.dataset.remove));
  const counts = {};
  draftObjects.forEach(object => counts[object.type] = (counts[object.type] || 0) + 1);
  summary.textContent = draftObjects.length
    ? Object.entries(counts).map(([type, count]) => `${count} × ${OBJECT_TYPES[type]?.label || type}`).join(' · ')
    : 'No objects placed yet.';
}

async function saveFarm() {
  if (newBoundary.length < 3) { toast('Draw the farm boundary first.'); return; }
  const name = $('newFarmName').value.trim();
  if (!name) { toast('Enter a farm name.'); return; }
  const now = new Date().toISOString();
  const objects = draftObjects.map(object => ({ ...object, properties: { ...(object.properties || {}) } }));
  const cropNames = [...new Set(objects.filter(o => o.type === 'crop-field').map(o => o.properties?.['Crop type'] || o.name).filter(Boolean))];
  const droneCount = objects.filter(o => o.type === 'drone').length;
  const tractorCount = objects.filter(o => o.type === 'tractor').length;
  const livestockCount = objects.filter(o => o.type === 'livestock-area').reduce((sum, o) => sum + (Number(o.properties?.['Estimated head']) || 0), 0);
  const id = editingFarmId || farmWizardDraftId || `farm-user-${Date.now()}`;
  const territoryMatch = territories.find(t => (t.regions || []).includes($('newFarmRegion').value.trim()));
  const existing = farms.find(f => f.id === id);
  const beforeState = existing ? cleanFarm(existing) : null;
  const farm = {
    ...(existing || {}), id,
    territoryId: existing?.territoryId || territoryMatch?.id || null,
    name,
    owner: $('newFarmOwner').value.trim() || 'Unknown',
    region: $('newFarmRegion').value.trim() || 'Unassigned',
    status: $('newFarmStatus').value,
    drones: droneCount,
    tractors: tractorCount,
    livestock: livestockCount || objects.filter(o => o.type === 'livestock-area').length,
    annualHarvest: $('newFarmHarvest').value.trim(),
    lastService: $('newFarmService').value.trim(),
    crops: cropNames,
    center: centroid(newBoundary),
    boundary: newBoundary.map(p => ({ lat: p.lat, lng: p.lng })),
    objects,
    opportunityScore: existing?.opportunityScore ?? (droneCount === 0 ? 75 : 20),
    source: existing?.source || 'manual',
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    notes: $('newFarmNotes').value.trim(),
    audit: [...(existing?.audit || []), { action: editingFarmId ? 'updated' : 'created', source: 'manual', at: now }]
  };

  if (existing) {
    const index = farms.findIndex(f => f.id === id);
    if (index >= 0) farms[index] = farm;
    if (existing._polygon) existing._polygon.setMap(null);
    if (existing._marker) existing._marker.setMap(null);
    objectMarkers.filter(m => m.__farmId === id).forEach(m => m.setMap(null));
    objectMarkers = objectMarkers.filter(m => m.__farmId !== id);
  } else {
    farms.push(farm);
  }

  // Update the live world immediately. Database persistence is attempted in
  // parallel so a backend/schema problem can never make the SAVE button appear dead.
  window.__AG_WORLD_FARMS = farms;
  let databaseSaved = true;
  try {
    await saveFarmToDatabase(farm, beforeState);
  } catch (error) {
    databaseSaved = false;
    console.error('Farm database save failed', error);
    toast('Saved locally. Shared database sync failed; retry will be required.');
  }

  window.__AG_WORLD_FARMS = farms;
  const modal = $('farmCreateModal');
  if (modal) modal.classList.remove('show');
  if (boundaryPolygon) { try { boundaryPolygon.setMap(null); } catch (_) {} }
  boundaryPolygon = null;
  selected = farm;
  newBoundary = [];
  draftObjects = [];
  creatingFarm = false;
  placingObjectType = null;
  editingFarmId = null;
  resetCreateForm();
  try { saveLocal(); } catch (error) { console.warn('Farm local save failed', error); }
  try { addFarm(farm); } catch (error) { console.warn('Farm redraw failed', error); }
  try { selectFarm(farm, true); } catch (error) { console.warn('Farm selection refresh failed', error); }
  try { refreshMapVisibility(); } catch (error) { console.warn('Farm visibility refresh failed', error); }
  const patch = {id:farm.id,name:farm.name,owner:farm.owner,region:farm.region,status:farm.status,drones:farm.drones,tractors:farm.tractors,livestock:farm.livestock,annualHarvest:farm.annualHarvest,lastService:farm.lastService,crops:farm.crops,objects:farm.objects,opportunityScore:farm.opportunityScore,notes:farm.notes,updatedAt:farm.updatedAt};
  window.AGWorldSharedFarms?.updateDetails?.(farm, patch)?.catch(error => console.warn('Shared farm detail sync failed', error));
  $('mapStatus').textContent = databaseSaved
    ? `Farm saved · ${farm.name} · ${farm.objects.length} mapped objects · database synced`
    : `Farm saved locally · ${farm.name} · shared database sync pending`;
  toast(databaseSaved
    ? (existing ? 'Farm record updated' : 'Farm record created')
    : 'Farm saved locally; database sync pending');
}

function resetCreateForm() {
  ['newFarmCountry','newFarmProvince','newFarmMunicipality','newFarmDjiRegion','newFarmNearestTown','newFarmName','newFarmOwner','newFarmOwnerCell','newFarmOwnerEmail','newFarmAccountsManager','newFarmAccountsManagerCell','newFarmAccountsManagerEmail','newFarmCropsOnFarm','newFarmEquipmentOnFarm','newFarmEquipmentStatus','newFarmRegion','newFarmHarvest','newFarmService','newFarmNotes'].forEach(id => { if ($(id)) $(id).value = ''; });
  if ($('newFarmStatus')) $('newFarmStatus').value = 'Prospect';
  document.querySelectorAll('input[name="farmEquipment"], input[name="farmCropType"]').forEach(input => { input.checked = false; });
  draftObjects = [];
  renderObjectEditor();
}

function exportData() {
  const blob = new Blob([JSON.stringify({ territories, farms: farms.map(cleanFarm) }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = 'ag-world-farms.json'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
  toast('Farm dataset exported');
}

function importData() {
  if (!map) { toast('Add the Google Maps API key first.'); return; }
  $('datasetFile').click();
}

async function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    let data = JSON.parse(text);
    let incoming = [];
    if (Array.isArray(data)) incoming = data;
    else if (Array.isArray(data.farms)) incoming = data.farms;
    else if (data.type === 'FeatureCollection') incoming = geoJsonToFarms(data);
    else throw new Error('Unsupported JSON structure');
    incoming = incoming.map(normalizeImportedFarm).filter(Boolean);
    const byId = new Map(farms.map(f => [f.id, f]));
    incoming.forEach(f => byId.set(f.id, f));
    farms = [...byId.values()];
    saveLocal();
    farms.forEach(farm => { if (!farm._marker) addFarm(farm); });
    updateZoomStage();
    $('mapStatus').textContent = `Dataset imported · ${incoming.length} farm records`;
    toast(`${incoming.length} farm records imported`);
  } catch (error) {
    toast('Import failed: use AG World farm JSON or GeoJSON.');
  }
  event.target.value = '';
}

function geoJsonToFarms(featureCollection) {
  return featureCollection.features.map((feature, index) => {
    const geometry = feature.geometry, properties = feature.properties || {};
    if (!geometry) return null;
    let boundary, center;
    if (geometry.type === 'Polygon') {
      const ring = geometry.coordinates?.[0] || [];
      boundary = ring.map(c => ({ lat: c[1], lng: c[0] }));
      center = centroid(boundary);
    } else if (geometry.type === 'Point') {
      center = { lat: geometry.coordinates[1], lng: geometry.coordinates[0] };
      boundary = [
        { lat: center.lat - .01, lng: center.lng - .01 },
        { lat: center.lat - .01, lng: center.lng + .01 },
        { lat: center.lat + .01, lng: center.lng + .01 },
        { lat: center.lat + .01, lng: center.lng - .01 }
      ];
    }
    if (!boundary) return null;
    return normalizeImportedFarm({
      id: properties.id || `import-${Date.now()}-${index}`,
      name: properties.name || properties.farm_name || `Imported Farm ${index + 1}`,
      owner: properties.owner || properties.farmer || 'Unknown',
      region: properties.region || properties.province || 'Imported',
      status: properties.status || 'Prospect',
      drones: Number(properties.drones) || 0,
      tractors: Number(properties.tractors) || 0,
      livestock: Number(properties.livestock) || 0,
      crops: Array.isArray(properties.crops) ? properties.crops : typeof properties.crops === 'string' ? properties.crops.split(',').map(x => x.trim()).filter(Boolean) : [],
      annualHarvest: properties.annualHarvest || '',
      lastService: properties.lastService || '',
      opportunityScore: Number(properties.opportunityScore) || 0,
      center, boundary, objects: Array.isArray(properties.objects) ? properties.objects : [], source: 'import'
    });
  });
}

function normalizeImportedFarm(farm) {
  if (!farm || !Array.isArray(farm.boundary) || farm.boundary.length < 3) return null;
  const boundary = farm.boundary.map(p => ({ lat: Number(p.lat), lng: Number(p.lng) }));
  return { ...farm, id: farm.id || `import-${Date.now()}-${Math.random()}`, center: farm.center || centroid(boundary), boundary, objects: Array.isArray(farm.objects) ? farm.objects : [], source: 'import', updatedAt: new Date().toISOString() };
}

function createScene(farm) {
  if (!window.THREE) { toast('3D library is still loading.'); return; }
  const host = $('farmScene');
  host.innerHTML = '';
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xb8c5b2);
  camera = new THREE.PerspectiveCamera(42, Math.max(host.clientWidth, 1) / Math.max(host.clientHeight, 1), .1, 1000);
  camera.position.set(16, 14, 18); camera.lookAt(0, 0, 0);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(host.clientWidth, host.clientHeight); renderer.shadowMap.enabled = true;
  host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x66705e, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.position.set(8, 18, 10); sun.castShadow = true; scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(34, 26), new THREE.MeshStandardMaterial({ color: 0x788d65, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const field = new THREE.Mesh(new THREE.PlaneGeometry(18, 10), new THREE.MeshStandardMaterial({ color: 0x9cae55 }));
  field.rotation.x = -Math.PI / 2; field.position.y = .03; scene.add(field);
  sceneObjects = [];
  addFarmBuildings(farm); addFarmEquipment(farm); addFarmLivestock(farm);
  const road = new THREE.Mesh(new THREE.BoxGeometry(34, .05, 1.2), new THREE.MeshStandardMaterial({ color: 0x8d8170 }));
  road.position.set(0, .05, 5); scene.add(road);
  sceneFarm = new THREE.Group(); scene.add(sceneFarm); sceneObjects.forEach(object => sceneFarm.add(object));
  animateScene();
}

function box(x, y, z, sx, sy, sz, color) {
  const object = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), new THREE.MeshStandardMaterial({ color }));
  object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true; sceneObjects.push(object); return object;
}
function addFarmBuildings(farm) {
  const count = (farm.objects || []).filter(o => o.type === 'building').length || 1;
  for (let i = 0; i < count; i++) { const x = -5 + (i % 2) * 7, z = -2 + Math.floor(i / 2) * 4; box(x, 1, z, 4, 2, 3, 0xd6d0c1); box(x, 2.5, z, 4.3, 1, 3.2, 0x7a6755); }
}
function addFarmEquipment(farm) {
  const tractors = (farm.objects || []).filter(o => o.type === 'tractor').length || farm.tractors || 0;
  for (let i = 0; i < tractors; i++) { const x = -7 + (i % 3) * 2.8, z = 2 + Math.floor(i / 3) * 2; box(x, .45, z, 1.5, .8, 1, 0x40515a); box(x, .95, z, 1, .3, .8, 0x687b82); }
  const drones = (farm.objects || []).filter(o => o.type === 'drone').length || farm.drones || 0;
  for (let i = 0; i < drones; i++) { const d = new THREE.Group(); d.add(new THREE.Mesh(new THREE.BoxGeometry(.8, .22, .5), new THREE.MeshStandardMaterial({ color: 0x222a2d }))); d.position.set(5 + i * 2.1, 2.2, 3); sceneObjects.push(d); }
  const competitorDrones = (farm.objects || []).filter(o => o.type === 'competitor-drone').length;
  for (let i = 0; i < competitorDrones; i++) { const d = new THREE.Group(); d.add(new THREE.Mesh(new THREE.BoxGeometry(.7, .18, .45), new THREE.MeshStandardMaterial({ color: 0x777777 }))); d.position.set(5 + i * 2.1, 2.8, -2); sceneObjects.push(d); }
  const dams = (farm.objects || []).filter(o => o.type === 'dam').length;
  for (let i = 0; i < dams; i++) { const water = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, .12, 32), new THREE.MeshStandardMaterial({ color: 0x447d91, roughness: .3 })); water.position.set(-4 + i * 5, .08, -7); sceneObjects.push(water); }
}
function addFarmLivestock(farm) {
  const areas = (farm.objects || []).filter(o => o.type === 'livestock-area').length;
  for (let i = 0; i < areas; i++) box(5 + i * 4, .3, -6, 3, .5, 2.5, 0x6e6254);
}
function animateScene() { if (!renderer) return; animationId = requestAnimationFrame(animateScene); if (sceneFarm) sceneFarm.rotation.y += .0025; renderer.render(scene, camera); }
function open3D() { if (!selected) { toast('Select a farm first.'); return; } $('sceneTitle').textContent = selected.name.toUpperCase(); $('sceneMeta').textContent = `${selected.region} · ${selected.status}`; $('sceneSummary').textContent = `${selected.drones || 0} drones · ${selected.tractors || 0} tractors · ${(selected.objects || []).length} mapped objects · ${(selected.crops || []).length} crop types`; $('farm3dModal').classList.add('show'); createScene(selected); }
function close3D() { cancelAnimationFrame(animationId); if (renderer) { renderer.dispose(); renderer = null; } sceneObjects = []; sceneFarm = null; $('farmScene').innerHTML = ''; $('farm3dModal').classList.remove('show'); }

$('nationalBtn').onclick = national;
$('satelliteBtn').onclick = () => { if (map) map.setMapTypeId('satellite'); else toast('Add the Google Maps API key in config.js first.'); };
$('resetBtn').onclick = national;
$('createFarmBtn').onclick = openCreateFarm;
$('closeCreateFarm').onclick = closeCreateFarm;
$('startBoundary').onclick = startBoundary;
$('finishBoundary').onclick = finishBoundary;
$('clearBoundary').onclick = clearBoundary;
// Wizard buttons are explicit button actions (never form submits). Keep the
// click flow visible and robust even if the modal is embedded by another shell.
['saveBoundaryStep','nextBoundaryStep','saveInfoStep','nextInfoStep','saveAssetsStep'].forEach(id => {
  const button = $(id);
  if (button) button.type = 'button';
});

$('saveBoundaryStep').onclick = async event => {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  try { await saveFarmWizardStep(1); }
  catch (error) { console.error('SAVE BOUNDARY failed', error); toast('Boundary save failed: ' + (error?.message || 'Unknown error')); }
};
$('nextBoundaryStep').onclick = async event => {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const button = $('nextBoundaryStep');
  if (button) { button.disabled = true; button.textContent = 'SAVING…'; }
  try {
    const saved = await saveFarmWizardStep(1);
    if (saved) showFarmWizardStep(2);
  } catch (error) {
    console.error('SAVE & NEXT boundary failed', error);
    toast('Could not save boundary: ' + (error?.message || 'Unknown error'));
  } finally {
    if (button) { button.disabled = false; button.textContent = 'SAVE & NEXT →'; }
  }
};
$('saveInfoStep').onclick = async event => {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  try { await saveFarmWizardStep(2); }
  catch (error) { console.error('SAVE FARM INFORMATION failed', error); toast('Farm information save failed: ' + (error?.message || 'Unknown error')); }
};
$('nextInfoStep').onclick = async event => {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const button = $('nextInfoStep');
  if (button) { button.disabled = true; button.textContent = 'SAVING FARM…'; }

  try {
    // The exact same canonical save path is used by every authenticated player.
    // A successful save is required before advancing, so no player's edit can
    // appear to succeed locally while failing to reach the shared Farms world.
    const saved = await saveFarmWizardStep(2);
    if (!saved) throw new Error('Farm information was not saved to the shared Farms database.');
    showFarmWizardStep(3);
    toast('Farm information saved · continue with farm assets');
  }
  catch (error) {
    console.error('SAVE & CONTINUE information failed', error);
    toast('Could not save farm information: ' + (error?.message || 'Unknown error'));
  } finally {
    if (button) { button.disabled = false; button.textContent = 'SAVE & CONTINUE →'; }
  }
};
const saveAssetsButton = $('saveAssetsStep');
if (saveAssetsButton) saveAssetsButton.onclick = async event => {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  try { const saved = await saveFarmWizardStep(3); if (saved) { const farm=farms.find(item=>String(item.id)===String(editingFarmId||farmWizardDraftId)); renderDronePortfolio('farmDronePortfolio', farm?.dronePortfolio || []); showFarmWizardStep(4); toast('Farm assets saved · continue with drone ownership'); } }
  catch (error) { console.error('SAVE FARM ASSETS failed', error); toast('Farm assets save failed: ' + (error?.message || 'Unknown error')); }
};

// Step 3 is a checklist-driven finish action. The final click saves the
// selected equipment and crops to the canonical shared farm record, refreshes
// the live map, then closes the wizard.
async function finishFarmWizard() {
  const button = $('saveFarm');
  if (button) { button.disabled = true; button.textContent = 'SAVING FARM…'; }
  try {
    const saved = await saveFarmWizardStep(4);
    if (!saved) return false;

    const id = editingFarmId || farmWizardDraftId;
    const farm = farms.find(item => String(item.id) === String(id));
    if (!farm) throw new Error('Saved farm record could not be found after Step 3.');

    if (selected && String(selected.id) === String(farm.id)) selected = farm;
    window.__AG_WORLD_FARMS = farms;
    try { saveLocal(); } catch (error) { console.warn('Farm local save failed', error); }
    try { addFarm(farm); } catch (error) { console.warn('Farm redraw failed', error); }
    try { refreshMapVisibility(); } catch (error) { console.warn('Farm visibility refresh failed', error); }

    await syncDronePurchaseRelationships('farm', farm.id, farm.dronePortfolio || []);

    const patch = {
      id:farm.id,
      name:farm.name,
      owner:farm.owner,
      region:farm.region,
      status:farm.status,
      drones:farm.drones,
      tractors:farm.tractors,
      crops:farm.crops,
      assets:farm.assets,
      objects:farm.objects,
      equipmentSelections:farm.equipmentSelections,
      updatedAt:farm.updatedAt
    };
    window.AGWorldSharedFarms?.updateDetails?.(farm, patch)
      ?.catch(error => console.warn('Shared final farm sync failed', error));

    selected = farm;
    if ($('farmCreateModal')) $('farmCreateModal').classList.remove('show');
    if (boundaryPolygon) { try { boundaryPolygon.setMap(null); } catch (_) {} }
    boundaryPolygon = null;
    newBoundary = [];
    draftObjects = [];
    creatingFarm = false;
    placingObjectType = null;
    editingFarmId = null;
    farmWizardDraftId = null;
    resetCreateForm();
    // Re-render the Farm Information panel from the canonical saved record.
    // selected is temporarily cleared so selectFarm cannot interpret this as a
    // second click and toggle the panel closed.
    try {
      selected = null;
      selectFarm(farm, false);
    } catch (error) { console.warn('Farm panel refresh failed', error); }

    $('mapStatus').textContent = `Farm completed · ${farm.name} · shared Farms database updated`;
    toast('Farm saved and finished · live map updated');
    return true;
  } catch (error) {
    console.error('Unexpected SAVE & FINISH FARM error', error);
    toast('Could not finish farm: ' + (error?.message || 'Unknown error'));
    return false;
  } finally {
    if (button) { button.disabled = false; button.textContent = 'SAVE & FINISH FARM'; }
  }
}

// Explicit button action: prevents browser/default behaviour from swallowing
// the final shared-database save.
const finishFarmButton = $('saveFarm');
if (finishFarmButton) {
  finishFarmButton.type = 'button';
  finishFarmButton.onclick = async event => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    await finishFarmWizard();
  };
}
$('importBtn').onclick = importData;
$('exportBtn').onclick = exportData;
$('datasetFile').onchange = handleImport;
document.querySelectorAll('.object-palette button').forEach(button => button.onclick = () => chooseObject(button.dataset.object));
$('farm3d').onclick = () => openEditFarm(selected);
const farmHistoryButton = $('farmHistoryBtn');
if (farmHistoryButton) farmHistoryButton.onclick = () => openFarmHistory(selected);

// Remove any legacy second action injected by older hooks/modules.
new MutationObserver(() => {
  const legacy = $('editFarmBtn');
  if (legacy) legacy.remove();
}).observe(document.body, { childList: true, subtree: true });
$('close3d').onclick = close3D;
$('close3dBottom').onclick = close3D;
$('farm3dModal').onclick = event => { if (event.target.id === 'farm3dModal') close3D(); };
// The farm creation workflow is a protected multi-step process. Clicking the
// backdrop must NEVER discard the in-progress boundary or captured farm data.
// The wizard may only be closed through its explicit close/cancel controls.
$('farmCreateModal').onclick = event => {
  if (event.target.id === 'farmCreateModal') {
    event.preventDefault();
    event.stopPropagation();
    toast('Farm creation is still open · use the close button if you want to cancel.');
  }
};
const aiAction = $('aiAction');
if (aiAction) aiAction.onclick = () => { const farm = farms.filter(f => (f.drones || 0) === 0).sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0))[0]; if (farm) selectFarm(farm); };
document.querySelectorAll('.mission').forEach(mission => mission.onclick = () => toast(`Mission opened: ${mission.querySelector('strong').textContent}`));
document.querySelectorAll('.nav button').forEach(button => button.onclick = () => { document.querySelectorAll('.nav button').forEach(x => x.classList.remove('active')); button.classList.add('active'); toast(`${button.textContent.trim()} selected`); });
window.addEventListener('resize', () => { const host = $('farmScene'); if (renderer && host.clientWidth) { camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight); } });
// Authentication can remove the login gate after the map has already been
// created. A Google map initialised while its container is hidden may appear
// blank in a fresh/incognito session. Re-layout it after authentication and
// retry the GIS load if the first background request raced the login flow.
function refreshMapAfterAuthentication() {
  if (!map) {
    loadFarms().catch(error => console.warn('AG World map retry failed', error));
    return;
  }
  try {
    google.maps.event.trigger(map, 'resize');
    const center = map.getCenter() || new google.maps.LatLng(-29, 24);
    map.setCenter(center);
    updateZoomStage();
    syncVisibleTownOverlays();
  } catch (error) {
    console.warn('AG World map post-login refresh failed', error);
  }
  // Reload the canonical shared Farms layer immediately after authentication.
  // A second player has no creator localStorage cache, so farms must hydrate
  // directly from the shared database into that player's live world.
  setTimeout(() => {
    loadFarmDatabaseOverrides()
      .catch(error => console.warn('Shared farm database load failed', error));
  }, 0);

  // If a session reached the map before GIS completed, make one controlled
  // retry. This is particularly important for a second player/incognito window.
  if ((!municipalities.length || !towns.length) && !window.__AG_WORLD_GIS_RETRYING) {
    window.__AG_WORLD_GIS_RETRYING = true;
    setTimeout(() => {
      loadSpatialLayersInBackground()
        .catch(error => console.warn('AG World GIS retry failed', error))
        .finally(() => { window.__AG_WORLD_GIS_RETRYING = false; });
    }, 350);
  }
}
window.addEventListener('gamechanger:authenticated', refreshMapAfterAuthentication);
window.addEventListener('agworld:supabase-authenticated', refreshMapAfterAuthentication);
window.addEventListener('agworld:player-ready', refreshMapAfterAuthentication);
window.addEventListener('pageshow', () => setTimeout(refreshMapAfterAuthentication, 100));
loadFarms();
window.AG_WORLD_WORLD = {
  get countries(){ return countries; },
  get provinces(){ return territories; },
  get municipalities(){ return municipalities; },
  get towns(){ return towns; },
  get farms(){ return farms; },
  selectTerritory, selectFarm
};


window.addEventListener('agworld:farms-reset', () => {
  setTimeout(() => loadFarmDatabaseOverrides().catch(error => console.warn('Farm database override failed', error)), 0);
});
// Keep every browser session synchronised with the canonical shared Farms database.
setInterval(() => {
  if (farms.length) loadFarmDatabaseOverrides().catch(() => {});
}, 5000);


// ---------------------------------------------------------------------------
// SHARED DYNAMIC GAME LAYERS
// Contractors and Competitors use the same canonical multiplayer pattern as
// Farms: shared database -> live map -> identical view for every player.
// Static territory boundaries are never edited by these workflows.
// ---------------------------------------------------------------------------
const contractors = [];
const competitors = [];
const companyFacilities = [];
let dynamicEntityType = null;
let dynamicEntityId = null;
let dynamicEntityLocation = null;
let dynamicEntityLocationListener = null;

const DYNAMIC_LAYER_CONFIG = {
  contractor: {
    table: 'contractors',
    audit: 'contractor_audit',
    plural: 'Contractors',
    title: 'CREATE CONTRACTOR',
    label: 'Contractor',
    markerLabel: 'C',
    color: '#31b6c7',
    step3Eyebrow: 'STEP 3 · SERVICES & CAPABILITY',
    options: [
      ['Drone Services', 'Commercial drone services'],
      ['Aerial Spraying', 'Agricultural aerial application'],
      ['Mapping & Surveying', 'Mapping, GIS and survey capability'],
      ['Training', 'Operational and pilot training'],
      ['Maintenance', 'Equipment maintenance capability'],
      ['Other Agricultural Services', 'Other agricultural services']
    ]
  },
  competitor: {
    table: 'competitors',
    audit: 'competitor_audit',
    plural: 'Competitors',
    title: 'CREATE COMPETITOR',
    label: 'Competitor',
    markerLabel: 'X',
    color: '#d59a3b',
    step3Eyebrow: 'STEP 3 · MARKET INTELLIGENCE',
    options: [
      ['Drone Services', 'Competing drone activity'],
      ['Aerial Spraying', 'Competing aerial application'],
      ['Mapping & Surveying', 'Competing mapping or GIS services'],
      ['Sales & Distribution', 'Sales or distribution activity'],
      ['Training', 'Competing training capability'],
      ['Other Activity', 'Other competitive agricultural activity']
    ]
  },
  companyFacility: {
    table: 'company_facilities',
    audit: 'company_facility_audit',
    auditForeignKey: 'company_facility_id',
    plural: 'Company Facilities',
    title: 'CREATE COMPANY FACILITY',
    label: 'Company Facility',
    markerLabel: 'AG',
    color: '#4d9f61',
    step3Eyebrow: 'STEP 3 · FACILITY CAPABILITY',
    options: [
      ['Head Office', 'Company head office or administration centre'],
      ['Regional Office', 'Regional operations or management base'],
      ['Operations Base', 'Operational deployment facility'],
      ['Drone Hub', 'Drone storage, deployment and support hub'],
      ['Training Centre', 'Training and competency development facility'],
      ['Workshop & Maintenance', 'Workshop, repair and maintenance capability'],
      ['Warehouse & Logistics', 'Equipment, stock and logistics facility']
    ]
  }
};

function dynamicConfig() { return DYNAMIC_LAYER_CONFIG[dynamicEntityType]; }
function dynamicArray(type) {
  if (type === 'contractor') return contractors;
  if (type === 'competitor') return competitors;
  if (type === 'companyFacility') return companyFacilities;
  return [];
}

function dynamicDronePortfolioFromForm() {
  const rows = [...document.querySelectorAll('#dynamicDronePortfolio [data-drone-row]')];
  return rows.map(row => ({ supplierType: row.dataset.supplierType, supplierId: row.dataset.supplierId, supplierName: row.dataset.supplierName, quantity: Math.max(0, Number(row.querySelector('input')?.value || 0)) })).filter(item => item.quantity > 0);
}
function renderDronePortfolio(containerId, existing = []) {
  const facilities = window.AG_WORLD_WORLD?.getCompanyFacilities?.() || [], competitors = window.AG_WORLD_WORLD?.getCompetitors?.() || [];
  const old = new Map((existing || []).map(item => [String(item.supplierType)+':'+String(item.supplierId), Number(item.quantity)||0]));
  const rows=[...facilities.map(e=>({supplierType:'companyFacility',supplierId:e.id,supplierName:e.name,label:'Company Facility'})),...competitors.map(e=>({supplierType:'competitor',supplierId:e.id,supplierName:e.name,label:'Competitor'}))];
  $(containerId).innerHTML=rows.length?rows.map(r=>'<label class="farm-check-option" data-drone-row data-supplier-type="'+r.supplierType+'" data-supplier-id="'+String(r.supplierId).replace(/"/g,'&quot;')+'" data-supplier-name="'+String(r.supplierName).replace(/"/g,'&quot;')+'"><span class="check-icon">'+(r.supplierType==='companyFacility'?'✦':'◇')+'</span><span><b>'+r.supplierName+'</b><small>'+r.label+' · number of drones purchased from / linked to this supplier</small></span><input type="number" min="0" step="1" value="'+(old.get(r.supplierType+':'+r.supplierId)||0)+'"></label>').join(''):'<div class="farm-assets-status">No Company Facilities or Competitors are currently available.</div>';
}
async function syncDronePurchaseRelationships(entityType, entityId, portfolio) {
  for (const item of portfolio) await window.AGWorldDynamicEntityAPI.createRelationship({sourceEntityType:entityType,sourceEntityId:entityId,targetEntityType:item.supplierType,targetEntityId:item.supplierId,relationshipType:item.supplierType==='companyFacility'?'purchased_drones_from':'uses_competitor_drones_from',status:'active',metadata:{droneQuantity:item.quantity,dronePortfolio:true,supplierName:item.supplierName}});
}
function dynamicDetailsFromForm() {
  const capabilities = [...document.querySelectorAll('#dynamicChecklist input[type="checkbox"]:checked')].map(input => input.value);
  return {
    country: $('dynamicCountry').value.trim(),
    province: $('dynamicProvince').value.trim(),
    municipality: $('dynamicMunicipality').value.trim(),
    nearestTown: $('dynamicNearestTown').value.trim(),
    website: $('dynamicWebsite').value.trim(),
    notes: $('dynamicNotes').value.trim(),
    capabilities,
    dronePortfolio: dynamicDronePortfolioFromForm()
  };
}

function renderDynamicChecklist(type, selected = []) {
  const cfg = DYNAMIC_LAYER_CONFIG[type];
  const values = new Set(selected || []);
  $('dynamicChecklist').innerHTML = `
    <section class="farm-checklist-card">
      <div class="farm-checklist-heading"><span>01 · ${cfg.plural.toUpperCase()}</span><strong>Select all that apply</strong></div>
      ${cfg.options.map(([name, description]) => `<label class="farm-check-option"><input type="checkbox" value="${name}" ${values.has(name) ? 'checked' : ''}><span class="check-icon">✦</span><span><b>${name}</b><small>${description}</small></span></label>`).join('')}
    </section>
  `;
}

function showDynamicStep(step) {
  document.querySelectorAll('.dynamic-entity-step').forEach(section => {
    section.hidden = Number(section.dataset.dynamicStep) !== Number(step);
  });
  const cfg = dynamicConfig();
  const titles = ['SELECT LOCATION', `${cfg.label.toUpperCase()} INFORMATION`, 'SERVICES & CAPABILITY', 'DRONE OWNERSHIP & PURCHASES'];
  $('dynamicEntityProgress').textContent = `STEP ${step} OF 4`;
  $('dynamicEntityStepTitle').textContent = titles[step - 1];
}

function resetDynamicEntityForm() {
  ['dynamicCountry','dynamicProvince','dynamicMunicipality','dynamicNearestTown','dynamicName','dynamicContactName','dynamicContactCell','dynamicContactEmail','dynamicWebsite','dynamicNotes']
    .forEach(id => { const input = $(id); if (input) input.value = ''; });
  $('dynamicStatus').value = 'Active';
}

function configureDynamicEntityForm(type) {
  const cfg = DYNAMIC_LAYER_CONFIG[type];
  $('dynamicEntityModalTitle').textContent = cfg.title;
  $('dynamicEntityModalSubtitle').textContent = `Shared ${cfg.label.toLowerCase()} game-layer record`;
  $('dynamicLocationHeading').textContent = `Place the ${cfg.label}`;
  $('dynamicInfoEyebrow').textContent = `STEP 2 · ${cfg.label.toUpperCase()} INTELLIGENCE`;
  $('dynamicInfoHeading').textContent = `Capture ${cfg.label} Information`;
  $('dynamicInfoDescription').textContent = `Create the shared ${cfg.label.toLowerCase()} record used by the live map and future gameplay systems.`;
  $('dynamicNameLabel').firstChild.textContent = `${cfg.label} Name`;
  $('dynamicContactLabel').firstChild.textContent = type === 'contractor' ? 'Primary Contact' : 'Primary Contact / Intelligence Source';
  $('dynamicStep3Eyebrow').textContent = cfg.step3Eyebrow;
  $('dynamicStep3Heading').textContent = `Complete the ${cfg.label} Record`;
  $('dynamicStep3Description').textContent = `Select every service or activity that applies to this ${cfg.label.toLowerCase()}. These selections become part of the shared game layer.`;
  renderDynamicChecklist(type);
  renderDronePortfolio('dynamicDronePortfolio', []);
}

function openDynamicEntity(type) {
  if (!map) { toast('Map is still loading.'); return; }
  dynamicEntityType = type;
  dynamicEntityId = 'dyn-' + type + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
  dynamicEntityLocation = null;
  resetDynamicEntityForm();
  configureDynamicEntityForm(type);
  $('dynamicLocationStatus').textContent = 'No location selected.';
  showDynamicStep(1);
  $('dynamicEntityModal').classList.add('show');
}

function stopDynamicLocationMode() {
  if (dynamicEntityLocationListener) {
    try { google.maps.event.removeListener(dynamicEntityLocationListener); } catch (_) {}
    dynamicEntityLocationListener = null;
  }
  try { map?.setOptions({ draggableCursor: null, crosshairCursor: null }); } catch (_) {}
}

function startDynamicLocationMode() {
  if (!map) return;
  stopDynamicLocationMode();
  $('dynamicEntityModal').classList.remove('show');
  map.setOptions({ draggableCursor: 'crosshair', crosshairCursor: 'crosshair' });
  $('mapStatus').textContent = `LOCATION MODE · click the map to place the ${dynamicConfig().label.toLowerCase()}`;
  toast(`Click the map to place the ${dynamicConfig().label.toLowerCase()}`);
  dynamicEntityLocationListener = google.maps.event.addListener(map, 'click', event => {
    if (!event?.latLng) return;
    dynamicEntityLocation = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    stopDynamicLocationMode();
    $('dynamicLocationStatus').textContent = `Location selected · ${dynamicEntityLocation.lat.toFixed(6)}, ${dynamicEntityLocation.lng.toFixed(6)}`;
    $('dynamicEntityModal').classList.add('show');
    $('mapStatus').textContent = `${dynamicConfig().label} location selected · continue with the workflow`;
  });
}

async function saveDynamicEntity(step) {
  const cfg = dynamicConfig();
  const db = getFarmDb();
  const user = window.AGWorldBackend?.getUser?.();
  if (!cfg || !db || !user) throw new Error('You must be signed in to save this shared game-layer record.');
  if (!dynamicEntityLocation) throw new Error('Select a location on the map first.');
  if (step >= 2 && !$('dynamicName').value.trim()) throw new Error(`${cfg.label} name is required before saving Step 2.`);

  const array = dynamicArray(dynamicEntityType);
  const existing = array.find(item => String(item.id) === String(dynamicEntityId));
  const before = existing ? JSON.parse(JSON.stringify(existing)) : null;
  const details = {
    ...(existing?.details || {}),
    ...(existing ? {} : { demo: false }),
    ...dynamicDetailsFromForm(),
    updatedAt: new Date().toISOString(),
    workflowStep: step
  };

  const row = {
    id: String(dynamicEntityId),
    name: $('dynamicName').value.trim() || null,
    contact_name: $('dynamicContactName').value.trim() || null,
    contact_cell: $('dynamicContactCell').value.trim() || null,
    contact_email: $('dynamicContactEmail').value.trim() || null,
    status: $('dynamicStatus').value || 'Active',
    location_lat: Number(dynamicEntityLocation.lat),
    location_lng: Number(dynamicEntityLocation.lng),
    details,
    updated_at: new Date().toISOString(),
    updated_by: user.id
  };

  let error;
  if (existing) ({ error } = await db.from(cfg.table).update(row).eq('id', row.id));
  else ({ error } = await db.from(cfg.table).insert(row));
  if (error) throw error;

  const entity = hydrateDynamicEntity(row, dynamicEntityType);
  const index = array.findIndex(item => String(item.id) === entity.id);
  if (index >= 0) array[index] = { ...array[index], ...entity };
  else array.push(entity);

  const changedFields = {};
  const beforeState = before || {};
  Object.keys({ ...beforeState, ...entity }).forEach(key => {
    if (key === '_marker') return;
    const a = JSON.stringify(beforeState[key] ?? null);
    const b = JSON.stringify(entity[key] ?? null);
    if (a !== b) changedFields[key] = { before: beforeState[key] ?? null, after: entity[key] ?? null };
  });

  const { error: auditError } = await db.from(cfg.audit).insert({
    [cfg.auditForeignKey || (dynamicEntityType + '_id')]: entity.id,
    action: before ? 'updated' : 'created',
    actor_id: user.id,
    source: dynamicEntityType + '_editor',
    before_state: before,
    after_state: { ...entity, changed_fields: changedFields, changed_at: row.updated_at }
  });
  if (auditError) throw new Error(`Record saved, but history could not be recorded: ${auditError.message || auditError.code}`);

  if (step >= 2 && entity.name) {
    renderDynamicEntity(entity);
    refreshMapVisibility();
    window.dispatchEvent(new CustomEvent('agworld:dynamic-layer-updated', { detail: { type: dynamicEntityType, id: entity.id } }));
  }
  return entity;
}

function hydrateDynamicEntity(row, type) {
  const details = row.details && typeof row.details === 'object' ? row.details : {};
  return {
    id: String(row.id),
    type,
    name: row.name || '',
    contactName: row.contact_name || '',
    contactCell: row.contact_cell || '',
    contactEmail: row.contact_email || '',
    status: row.status || 'Active',
    lat: Number(row.location_lat),
    lng: Number(row.location_lng),
    details,
    updatedAt: row.updated_at
  };
}


// Programmatic entry point for controlled/admin world population.
// This uses the SAME dynamic-entity tables, hydration, rendering and audit
// model as the visible Create Contractor / Create Company Facility workflow.
window.AGWorldDynamicEntityAPI = window.AGWorldDynamicEntityAPI || {};
window.AGWorldDynamicEntityAPI.create = async function(type, input) {
  const cfg = DYNAMIC_LAYER_CONFIG[type];
  const db = getFarmDb();
  const user = window.AGWorldBackend?.getUser?.();
  if (!cfg || !db || !user) throw new Error('You must be signed in to create this shared game-layer record.');

  const lat = Number(input?.lat), lng = Number(input?.lng);
  if (!input?.name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('A name and valid map location are required.');
  }

  const id = String(input.id || ('dyn-' + type + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)));
  const array = dynamicArray(type);
  const existing = array.find(item => String(item.id) === id || String(item.name).toLowerCase() === String(input.name).toLowerCase());
  if (existing) return existing;

  const row = {
    id,
    name: String(input.name).trim(),
    contact_name: input.contactName || null,
    contact_cell: input.contactCell || null,
    contact_email: input.contactEmail || null,
    status: input.status || 'Active',
    location_lat: lat,
    location_lng: lng,
    details: { demo: false, ...(input.details || {}), updatedAt: new Date().toISOString(), workflowStep: 3 },
    updated_at: new Date().toISOString(),
    updated_by: user.id
  };

  const { error } = await db.from(cfg.table).insert(row);
  if (error) throw new Error(error.message || error.code || 'Unable to create shared game-layer record');

  const entity = hydrateDynamicEntity(row, type);
  array.push(entity);
  const { error: auditError } = await db.from(cfg.audit).insert({
    [cfg.auditForeignKey || (type + '_id')]: entity.id,
    action: 'created',
    actor_id: user.id,
    source: type + '_controlled_population',
    before_state: null,
    after_state: { ...entity, changed_at: row.updated_at }
  });
  if (auditError) console.warn('Entity created but audit write failed', auditError);

  renderDynamicEntity(entity);
  refreshMapVisibility();
  window.dispatchEvent(new CustomEvent('agworld:dynamic-layer-updated', { detail: { type, id: entity.id, source: 'controlled_population' } }));
  return entity;
};

// One-time administrative classifier for legacy records that existed before
// the demo/user world-data split. It does not run automatically.
window.AGWorldDynamicEntityAPI.snapshotExistingAsDemo = async function(type) {
  const cfg = DYNAMIC_LAYER_CONFIG[type];
  const db = getFarmDb();
  const user = window.AGWorldBackend?.getUser?.();
  if (!cfg || !db || !user) throw new Error('You must be signed in to classify existing records.');
  const { data, error } = await db.from(cfg.table).select('id,details');
  if (error) throw new Error(error.message || error.code || 'Unable to load existing records');

  let marked = 0;
  for (const row of (data || [])) {
    const details = row.details && typeof row.details === 'object' ? row.details : {};
    if (details.demo === true || details.seeded === true || String(row.id).startsWith('demo-') || String(row.id).startsWith('seed-')) continue;
    const nextDetails = {
      ...details,
      demo: true,
      demoBaselineAt: new Date().toISOString(),
      demoBaselineReason: 'Legacy AG World testing dataset'
    };
    const { error: updateError } = await db.from(cfg.table)
      .update({ details: nextDetails, updated_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', row.id);
    if (updateError) throw new Error(updateError.message || updateError.code || 'Unable to classify record as demo');
    marked++;
  }
  return { type, marked };
};

// Canonical relationship policy for the AG World game layer.
// Relationships are governed by the entity pair, regardless of which entity is
// stored as source or target.
const AGWORLD_RELATIONSHIP_TYPE_ALIASES = {
  farm: 'farm',
  farms: 'farm',
  contractor: 'contractor',
  contractors: 'contractor',
  competitor: 'competitor',
  competitors: 'competitor',
  companyfacility: 'companyFacility',
  companyfacilities: 'companyFacility',
  company_facility: 'companyFacility',
  company_facilities: 'companyFacility',
  company: 'companyFacility'
};

function canonicalRelationshipEntityType(type) {
  const key = String(type || '').trim().replace(/[\s_-]+/g, '').toLowerCase();
  return AGWORLD_RELATIONSHIP_TYPE_ALIASES[key] || String(type || '').trim();
}

function relationshipPairKey(a, b) {
  return [canonicalRelationshipEntityType(a), canonicalRelationshipEntityType(b)].sort().join('|');
}

const AGWORLD_ALLOWED_RELATIONSHIP_PAIRS = new Set([
  relationshipPairKey('farm', 'contractor'),
  relationshipPairKey('farm', 'competitor'),
  relationshipPairKey('farm', 'companyFacility'),
  relationshipPairKey('contractor', 'competitor'),
  relationshipPairKey('contractor', 'companyFacility'),
  relationshipPairKey('competitor', 'competitor')
]);

function validateAGWorldRelationshipPair(sourceType, sourceId, targetType, targetId) {
  const source = canonicalRelationshipEntityType(sourceType);
  const target = canonicalRelationshipEntityType(targetType);

  if (!source || !target) throw new Error('Both entities must have a valid entity type.');
  if (String(sourceId) === String(targetId) && source === target) {
    throw new Error('An entity cannot be linked to itself.');
  }

  const key = relationshipPairKey(source, target);
  if (!AGWORLD_ALLOWED_RELATIONSHIP_PAIRS.has(key)) {
    throw new Error('This relationship is not allowed by AG World relationship rules: ' + source + ' cannot be linked to ' + target + '.');
  }
  return { source, target, pairKey: key };
}

// Expose the policy so relationship UI and future workflows can use the exact
// same rule set before submitting a relationship.
window.AGWorldRelationshipPolicy = {
  canonicalType: canonicalRelationshipEntityType,
  isAllowed(sourceType, targetType) {
    return AGWORLD_ALLOWED_RELATIONSHIP_PAIRS.has(relationshipPairKey(sourceType, targetType));
  },
  validate: validateAGWorldRelationshipPair,
  allowedPairs: [
    ['farm', 'contractor'],
    ['farm', 'competitor'],
    ['farm', 'companyFacility'],
    ['contractor', 'competitor'],
    ['contractor', 'companyFacility'],
    ['competitor', 'competitor']
  ]
};

window.AGWorldDynamicEntityAPI.createRelationship = async function(input) {
  const db = getFarmDb();
  const user = window.AGWorldBackend?.getUser?.();
  if (!db || !user) throw new Error('You must be signed in to create relationships.');

  const sourceType = canonicalRelationshipEntityType(input.sourceEntityType || 'contractor');
  const targetType = canonicalRelationshipEntityType(input.targetEntityType || 'farm');
  validateAGWorldRelationshipPair(sourceType, input.sourceEntityId, targetType, input.targetEntityId);

  const row = {
    source_entity_id: String(input.sourceEntityId),
    source_entity_type: sourceType,
    target_entity_id: String(input.targetEntityId),
    target_entity_type: targetType,
    relationship_type: input.relationshipType || 'linked',
    status: input.status || 'active',
    metadata: input.metadata || {},
    created_by: user.id
  };

  // WORLD RULE: a Farm may have only one active Contractor, regardless of
  // relationship direction or relationship label.
  if (row.status === 'active' && relationshipPairKey(sourceType, targetType) === relationshipPairKey('farm', 'contractor')) {
    const farmId = sourceType === 'farm' ? row.source_entity_id : row.target_entity_id;
    const contractorId = sourceType === 'contractor' ? row.source_entity_id : row.target_entity_id;
    const { data: activeRows, error: assignedError } = await db.from('entity_relationships')
      .select('id,source_entity_id,source_entity_type,target_entity_id,target_entity_type')
      .eq('status', 'active');
    if (assignedError) throw new Error(assignedError.message || assignedError.code || 'Unable to verify the Farm contractor assignment');

    const conflict = (activeRows || []).find(existing => {
      const a = canonicalRelationshipEntityType(existing.source_entity_type);
      const b = canonicalRelationshipEntityType(existing.target_entity_type);
      if (relationshipPairKey(a, b) !== relationshipPairKey('farm', 'contractor')) return false;
      const existingFarmId = a === 'farm' ? String(existing.source_entity_id) : String(existing.target_entity_id);
      const existingContractorId = a === 'contractor' ? String(existing.source_entity_id) : String(existing.target_entity_id);
      return existingFarmId === String(farmId) && existingContractorId !== String(contractorId);
    });

    if (conflict) {
      throw new Error('This Farm is already linked to another Contractor. A Farm may only have one active Contractor.');
    }
  }

  const { data: existingRows, error: checkError } = await db.from('entity_relationships')
    .select('id')
    .eq('source_entity_id', row.source_entity_id)
    .eq('target_entity_id', row.target_entity_id)
    .eq('relationship_type', row.relationship_type)
    .limit(1);
  if (checkError) throw new Error(checkError.message || checkError.code || 'Unable to check relationships');
  if (existingRows && existingRows.length) return existingRows[0];

  const { data, error } = await db.from('entity_relationships').insert(row).select().single();
  if (error) throw new Error(error.message || error.code || 'Unable to create relationship');
  window.dispatchEvent(new CustomEvent('agworld:relationship-created', { detail: { relationship: data } }));
  return data;
};
// Repairs relationships created before the one-contractor-per-farm world rule.
// Duplicate assignments are preserved as history but made inactive; the active
// assignment retained is the geographically closest Contractor where distance
// metadata exists.
window.AGWorldDynamicEntityAPI.repairUniqueContractorFarmAssignments = async function(options = {}) {
  const db = getFarmDb();
  const user = window.AGWorldBackend?.getUser?.();
  if (!db || !user) throw new Error('You must be signed in to repair Contractor assignments.');

  const { data: allRows, error } = await db.from('entity_relationships')
    .select('id,source_entity_id,target_entity_id,source_entity_type,target_entity_type,relationship_type,status,metadata')
    .eq('status', 'active');
  if (error) throw new Error(error.message || error.code || 'Unable to load Contractor-Farm assignments');

  // Treat Contractor-Farm links as directional-independent. Older records may
  // have been written in either direction or with different relationship labels.
  const rows = (allRows || []).filter(row =>
    relationshipPairKey(row.source_entity_type, row.target_entity_type) === relationshipPairKey('farm', 'contractor')
  );

  const groups = new Map();
  rows.forEach(row => {
    const source = canonicalRelationshipEntityType(row.source_entity_type);
    const farmId = source === 'farm' ? row.source_entity_id : row.target_entity_id;
    const key = String(farmId);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });

  const duplicates = [...groups.entries()].filter(([, list]) => list.length > 1);
  const preview = {
    farmsChecked: groups.size,
    conflictingFarms: duplicates.length,
    duplicateRelationships: duplicates.reduce((sum, [, list]) => sum + list.length - 1, 0),
    retained: [],
    deactivated: []
  };
  if (options.preview) return preview;

  for (const [farmId, list] of duplicates) {
    const ranked = [...list].sort((a, b) => {
      const da = Number(a.metadata?.distanceKm);
      const dbm = Number(b.metadata?.distanceKm);
      const va = Number.isFinite(da) ? da : Number.POSITIVE_INFINITY;
      const vb = Number.isFinite(dbm) ? dbm : Number.POSITIVE_INFINITY;
      if (va !== vb) return va - vb;
      return String(a.id).localeCompare(String(b.id));
    });
    const keep = ranked[0];
    preview.retained.push({ farmId, relationshipId: keep.id, contractorId: canonicalRelationshipEntityType(keep.source_entity_type) === 'contractor' ? keep.source_entity_id : keep.target_entity_id });

    for (const duplicate of ranked.slice(1)) {
      const metadata = {
        ...(duplicate.metadata && typeof duplicate.metadata === 'object' ? duplicate.metadata : {}),
        uniquenessRepair: {
          repairedAt: new Date().toISOString(),
          reason: 'Farm may only have one active Contractor',
          replacedByRelationshipId: keep.id,
          repairedBy: user.id
        }
      };
      const { error: updateError } = await db.from('entity_relationships')
        .update({ status: 'inactive', metadata })
        .eq('id', duplicate.id);
      if (updateError) throw new Error(updateError.message || updateError.code || 'Unable to deactivate duplicate Contractor assignment');
      preview.deactivated.push({
        farmId,
        relationshipId: duplicate.id,
        contractorId: canonicalRelationshipEntityType(duplicate.source_entity_type) === 'contractor' ? duplicate.source_entity_id : duplicate.target_entity_id,
        retainedRelationshipId: keep.id
      });
    }
  }

  window.dispatchEvent(new CustomEvent('agworld:contractor-farm-assignments-repaired', { detail: preview }));
  window.dispatchEvent(new CustomEvent('agworld:entity-updated', { detail: { reason: 'unique-contractor-farm-repair' } }));
  if (typeof refreshTerritoryControl === 'function') refreshTerritoryControl();
  return preview;
};

// Direct marker-click diagnostic. This instruments the source click path itself.
function directMarkerDiagnostic(stage, detail = '', error = null) {
  const active = window.__AGWORLD_DIRECT_MARKER_DIAGNOSTIC__;
  if (!active) return;
  const entry = { stage, detail: detail == null ? '' : String(detail), error: error ? String(error?.message || error) : '', timestamp: Date.now() };
  active.steps.push(entry); active.lastStage = stage; active.updatedAt = entry.timestamp;

  // Diagnostics remain available in memory for troubleshooting, but the
  // on-screen diagnostic window is hidden during normal AG World operation.
  // Set this flag manually only when a future debugging session needs the UI.
  if (window.__AGWORLD_SHOW_DIRECT_MARKER_DIAGNOSTIC__ !== true) {
    document.getElementById('agworldDirectMarkerDiagnostic')?.remove();
    return;
  }

  let box = document.getElementById('agworldDirectMarkerDiagnostic');
  if (!box) {
    box = document.createElement('div'); box.id = 'agworldDirectMarkerDiagnostic';
    box.style.cssText = 'position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:50000;width:min(760px,calc(100vw - 28px));max-height:80vh;overflow:auto;background:#102126;color:#f2f6f4;border:2px solid #9dcc38;border-radius:12px;box-shadow:0 20px 70px rgba(0,0,0,.55);padding:16px;font:13px/1.5 Arial,sans-serif';
    document.body.appendChild(box);
  }
  const failed = active.steps.find(step => step.error);
  const esc = value => String(value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rows = active.steps.map((step, index) => '<div style="padding:5px 0;border-bottom:1px solid rgba(255,255,255,.08)"><b style="color:' + (step.error ? '#ff7b72' : '#9dcc38') + '">' + (index + 1) + '. ' + esc(step.stage) + '</b>' + (step.detail ? '<div style="color:#c5d0d5;padding-left:8px">' + esc(step.detail) + '</div>' : '') + (step.error ? '<div style="color:#ff7b72;padding-left:8px">ERROR: ' + esc(step.error) + '</div>' : '') + '</div>').join('');
  box.innerHTML = '<button id="agworldDirectMarkerDiagClose" style="float:right;background:#20373e;color:#fff;border:1px solid #55747c;border-radius:6px;padding:4px 9px;cursor:pointer">CLOSE</button><div style="font-size:16px;color:#9dcc38;font-weight:800">DIRECT MARKER CLICK DIAGNOSTIC</div><div style="margin:7px 0 10px;color:#c5d0d5"><b>' + esc(active.entityType).toUpperCase() + '</b> · ' + esc(active.name) + ' · ID: ' + esc(active.entityId) + '</div><div style="margin:8px 0;padding:9px;background:' + (failed ? '#4a2020' : '#172e35') + ';border-radius:7px"><b>LAST SUCCESSFUL STAGE:</b> ' + esc(active.lastStage) + '</div>' + rows;
  box.querySelector('#agworldDirectMarkerDiagClose')?.addEventListener('click', () => box.remove());
}

function beginDirectMarkerDiagnostic(entity) {
  window.__AGWORLD_DIRECT_MARKER_DIAGNOSTIC__ = {
    token: Date.now() + ':' + Math.random().toString(36).slice(2), entityId: String(entity?.id || ''), entityType: String(entity?.type || ''), name: String(entity?.name || ''),
    steps: [], startedAt: Date.now(), lastStage: 'STARTED'
  };
  directMarkerDiagnostic('MARKER CLICK RECEIVED');
}

function renderDynamicEntity(entity) {
  if (map) window.__AGWORLD_GOOGLE_MAP__ = map;
  if (!map || !entity?.name || !Number.isFinite(entity.lat) || !Number.isFinite(entity.lng)) return;
  const cfg = DYNAMIC_LAYER_CONFIG[entity.type];
  if (entity._marker) entity._marker.setMap(null);
  entity._marker = new google.maps.Marker({
    position: { lat: entity.lat, lng: entity.lng },
    map,
    title: `${cfg.label}: ${entity.name}`,
    label: { text: cfg.markerLabel, color: '#ffffff', fontWeight: '800' },
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: cfg.color,
      fillOpacity: 1,
      strokeColor: '#0c1519',
      strokeWeight: 2,
      scale: 11
    }
  });
  // Map icons must use the exact same canonical selection path as every other
  // entity selection. Read the live marker position first because hydration can
  // replace the backing entity object while the marker remains on the map.
  entity._marker.addListener('click', () => {
    beginDirectMarkerDiagnostic(entity);
    try {
      const livePosition = entity._marker?.getPosition?.();
      if (livePosition) {
        entity.lat = Number(livePosition.lat());
        entity.lng = Number(livePosition.lng());
        directMarkerDiagnostic('LIVE MARKER POSITION RESOLVED', 'lat=' + entity.lat + ', lng=' + entity.lng);
      } else {
        directMarkerDiagnostic('LIVE MARKER POSITION UNAVAILABLE', 'Marker returned no live position');
      }
      directMarkerDiagnostic('ENTERING selectDynamicEntity');
      selectDynamicEntity(entity, true);
      directMarkerDiagnostic('selectDynamicEntity RETURNED');
    } catch (error) {
      directMarkerDiagnostic('DIRECT MARKER PATH THREW', '', error);
      console.error('[AG World] Direct marker selection failed', error);
    }
  });

  // Keep a marker-backed runtime position registry. Relationship rendering must
  // be able to resolve an entity from the live marker layer even while the
  // backing dynamic arrays are being refreshed or replaced.
  const position = entity._marker.getPosition?.();
  if (position) {
    window.__AGWORLD_RELATIONSHIP_POSITIONS__ ||= new Map();
    window.__AGWORLD_RELATIONSHIP_POSITIONS__.set(
      networkEntityKey ? networkEntityKey(entity.type === 'companyFacility' ? 'company_facility' : entity.type, entity.id) : String(entity.id),
      { lat: position.lat(), lng: position.lng(), entity }
    );
  }
}

function updateFleetTransactionAction(entity, type) {
  // FINAL VISIBLE UI CONNECTION:
  // Keep Fleet controls inside the persistent Farm/Entity action area. The V2
  // Entity Engine may rebuild its own host, but #farmActions is part of the
  // stable card shell and survives Farm and Contractor detail rendering.
  const card = $('farmCard');
  if (!card) return false;

  const eligible = type === 'farm' || type === 'contractor';
  let actions = $('farmActions');
  if (!actions) {
    actions = document.createElement('div');
    actions.id = 'farmActions';
    actions.className = 'farm-actions';
    card.appendChild(actions);
  }

  let quick = $('fleetQuickActions');
  if (!quick) {
    quick = document.createElement('section');
    quick.id = 'fleetQuickActions';
    actions.appendChild(quick);
  } else if (quick.parentElement !== actions) {
    actions.appendChild(quick);
  }

  if (!eligible) {
    quick.hidden = true;
    return false;
  }

  const drone = dronePortfolioInfluence(type, entity);
  const entityLabel = type === 'contractor' ? 'CONTRACTOR' : 'FARM';

  quick.hidden = false;
  quick.style.cssText = [
    'display:block!important',
    'visibility:visible!important',
    'opacity:1!important',
    'position:relative!important',
    'z-index:1002!important',
    'width:100%!important',
    'margin:0!important',
    'padding:8px!important',
    'border:1px solid rgba(22,138,160,.28)!important',
    'border-radius:6px!important',
    'background:rgba(240,248,249,.96)!important'
  ].join(';');

  let title = $('fleetQuickActionsTitle');
  if (!title) {
    title = document.createElement('div');
    title.id = 'fleetQuickActionsTitle';
    quick.appendChild(title);
  }
  title.textContent = 'ENTITY FLEET · ' + entityLabel;
  title.style.cssText = 'display:block!important;font-size:8px!important;font-weight:800!important;letter-spacing:.8px!important;color:#168aa0!important;margin:0 0 6px!important;';

  let buttons = $('fleetQuickButtons');
  if (!buttons) {
    buttons = document.createElement('div');
    buttons.id = 'fleetQuickButtons';
    quick.appendChild(buttons);
  }
  buttons.style.cssText = 'display:flex!important;gap:6px!important;width:100%!important;margin:0!important;';

  let sell = $('fleetQuickSell');
  if (!sell) {
    sell = document.createElement('button');
    sell.id = 'fleetQuickSell';
    sell.type = 'button';
    buttons.appendChild(sell);
  } else if (sell.parentElement !== buttons) {
    buttons.appendChild(sell);
  }

  let history = $('fleetQuickHistory');
  if (!history) {
    history = document.createElement('button');
    history.id = 'fleetQuickHistory';
    history.type = 'button';
    buttons.appendChild(history);
  } else if (history.parentElement !== buttons) {
    buttons.appendChild(history);
  }

  sell.textContent = '🚁 SELL / MANAGE FLEET · ' + drone.totalDrones;
  history.textContent = '📊 SALES HISTORY';

  const buttonCss = [
    'flex:1 1 0!important',
    'width:50%!important',
    'min-width:0!important',
    'margin:0!important',
    'padding:8px 6px!important',
    'font-size:8px!important',
    'line-height:1.15!important',
    'display:block!important',
    'visibility:visible!important',
    'opacity:1!important',
    'position:relative!important',
    'z-index:1003!important',
    'cursor:pointer!important'
  ].join(';');

  sell.style.cssText = buttonCss + ';pointer-events:auto!important;touch-action:manipulation!important;';
  history.style.cssText = buttonCss + ';pointer-events:auto!important;touch-action:manipulation!important;';
  sell.dataset.fleetAction = 'transaction';
  sell.dataset.fleetDirect = '1';
  sell.dataset.entityType = type;
  sell.dataset.entityId = String(entity.id);
  history.dataset.fleetAction = 'history';
  history.dataset.fleetDirect = '1';
  history.dataset.entityType = type;
  history.dataset.entityId = String(entity.id);
  window.__AGWORLD_FLEET_SELECTED_ENTITY__ = { type, id:String(entity.id), entity, updatedAt:Date.now() };

  // One canonical path for the visible gameplay controls. Resolve from the
  // button dataset at click time so a rebuilt Entity/Farm card can never retain
  // a stale closure from the previous selection.
  const runQuickFleetAction = async (event, action) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const source = event?.currentTarget;
    const liveType = source?.dataset?.entityType || type;
    const liveId = source?.dataset?.entityId || String(entity.id);
    try {
      const result = action === 'history'
        ? await openFleetManagement(liveType, liveId)
        : openFleetTransaction(liveType, liveId);

      const modalId = action === 'history' ? 'fleetManagementModal' : 'fleetTransactionModal';
      const modal = $(modalId);
      if (!modal || modal.hidden) throw new Error((action === 'history' ? 'Fleet History' : 'Fleet Transaction')+' window did not open.');
      window.__AGWORLD_FLEET_UI_STATE__ = {
        ...(window.__AGWORLD_FLEET_UI_STATE__ || {}),
        lastAction: action,
        lastActionAt: Date.now(),
        lastActionEntityId: String(liveId),
        lastActionEntityType: liveType,
        lastActionError: ''
      };
      return result;
    } catch (error) {
      const message = String(error?.message || error);
      console.error('[AG World] visible Fleet quick action failed', { action, liveType, liveId, error });
      toast('Fleet action failed: '+message);
      window.__AGWORLD_FLEET_UI_STATE__ = {
        ...(window.__AGWORLD_FLEET_UI_STATE__ || {}),
        lastAction: action,
        lastActionAt: Date.now(),
        lastActionEntityId: String(liveId),
        lastActionEntityType: liveType,
        lastActionError: message,
        lastActionErrorAt: Date.now()
      };
      return false;
    }
  };
  sell.onclick = event => runQuickFleetAction(event, 'transaction');
  history.onclick = event => runQuickFleetAction(event, 'history');

  // Legacy IDs remain wired for older integrations, but the visible controls
  // above are now the canonical gameplay controls.
  const legacySell = $('fleetTransactionAction');
  const legacyHistory = $('fleetHistoryAction');
  if (legacySell) { legacySell.hidden = true; legacySell.onclick = () => openFleetTransaction(type, entity.id); }
  if (legacyHistory) { legacyHistory.hidden = true; legacyHistory.onclick = () => openFleetManagement(type, entity.id); }

  window.__AGWORLD_FLEET_UI_STATE__ = {
    entityId: String(entity.id),
    entityType: type,
    entityName: entity.name || '',
    visible: true,
    host: 'farmActions',
    updatedAt: Date.now()
  };

  // Reassert once after the current selection lifecycle finishes. This covers
  // the Farm V2 host and Entity Detail renderer without polling the map.
  requestAnimationFrame(() => {
    if (!quick.isConnected) return;
    quick.hidden = false;
    quick.style.display = 'block';
    sell.style.display = 'block';
    history.style.display = 'block';
  });

  return true;
}

function selectDynamicEntity(entity, zoom = true) {
  const directDiag = window.__AGWORLD_DIRECT_MARKER_DIAGNOSTIC__;
  const isDirectDiagnosticSelection = directDiag && String(directDiag.entityId) === String(entity?.id || '') && String(directDiag.entityType) === String(entity?.type || '');
  if (isDirectDiagnosticSelection) directMarkerDiagnostic('selectDynamicEntity ENTERED');
  if (!entity?.id) { if (isDirectDiagnosticSelection) directMarkerDiagnostic('ENTITY VALIDATION FAILED', 'Missing entity.id'); return; }
  const cfg = DYNAMIC_LAYER_CONFIG[entity.type];
  if (!cfg) { if (isDirectDiagnosticSelection) directMarkerDiagnostic('ENTITY VALIDATION FAILED', 'Unknown type: ' + String(entity.type)); return; }
  if (isDirectDiagnosticSelection) directMarkerDiagnostic('ENTITY VALIDATED', 'type=' + entity.type + ', id=' + entity.id + ', lat=' + entity.lat + ', lng=' + entity.lng);

  // Keep the runtime record, but do not create a second selection protocol.
  // The working Farm-card relationship click dispatches exactly one event:
  // agworld:dynamic-entity-selected. A direct marker click must now do the
  // identical thing with the identical entity object.
  selected = null;
  window.__AGWORLD_RUNTIME_DYNAMIC_ENTITY_SELECTION_V2__ = {
    entityId: String(entity.id),
    entityType: entity.type,
    name: entity.name || '',
    timestamp: Date.now()
  };
  if (isDirectDiagnosticSelection) directMarkerDiagnostic('RUNTIME SELECTION STATE WRITTEN');

  if (isDirectDiagnosticSelection) directMarkerDiagnostic('ENTITY CARD UPDATE START');

  // Dynamic entities use the existing Farm information card shell. Some
  // deployments do not contain every legacy Farm-only field, so card updates
  // must never be allowed to abort the canonical relationship selection path.
  const setCardText = (id, value) => {
    const node = $(id);
    if (!node) {
      if (isDirectDiagnosticSelection) directMarkerDiagnostic('CARD FIELD NOT PRESENT', id);
      return false;
    }
    node.textContent = value == null ? '' : String(value);
    return true;
  };
  const farmCardNode = $('farmCard');
  if (farmCardNode) {
    farmCardNode.classList.add('show');
  } else if (isDirectDiagnosticSelection) {
    directMarkerDiagnostic('CARD FIELD NOT PRESENT', 'farmCard');
  }

  setCardText('farmName', entity.name || cfg.label);
  setCardText('farmMeta', `${cfg.label.toUpperCase()} · ${entity.status || 'Active'} · ${entity.details?.nearestTown || entity.details?.municipality || 'Mapped location'}`);
  setCardText('farmDrones', entity.type === 'contractor' ? (entity.details?.capabilities?.filter?.(x => /drone/i.test(x)).length || 0) : '—');
  setCardText('farmTractors', entity.type === 'competitor' ? (entity.details?.capabilities?.length || 0) : '—');
  setCardText('farmCrops', entity.type === 'companyFacility' ? (entity.details?.capabilities?.length || 0) : '—');
  setCardText('farmScore', entity.status || 'Active');
  setCardText('farmLivestock', entity.contactName || '—');
  setCardText('farmHarvest', entity.contactCell || '—');
  setCardText('farmService', entity.contactEmail || '—');
  const capabilities = Array.isArray(entity.details?.capabilities) ? entity.details.capabilities.join(', ') : '';
  setCardText('farmDetailText', entity.details?.notes || capabilities || `${cfg.label} location and intelligence record.`);
  setCardText('aiText', `${cfg.label} is an interconnected AG World game-layer entity. Relationships, activity, documents, media and notes are managed through the V2 Entity Engine.`);
  updateFleetTransactionAction(entity, entity.type);

  if (isDirectDiagnosticSelection) directMarkerDiagnostic('ENTITY CARD UPDATE COMPLETED');

  // This helper is intentionally the ONE direct-selection handoff. It is the
  // exact event used by EntityDetailPanelV2.openRelatedEntity when the user
  // clicks Contractor/Competitor/Company Facility inside the Farm relationship
  // card. Do not add V2 compatibility events or direct bridge calls here.
  const enterWorkingRelationshipPath = () => {
    if (isDirectDiagnosticSelection) directMarkerDiagnostic('ABOUT TO DISPATCH agworld:dynamic-entity-selected');
    try {
      const dispatched = window.dispatchEvent(new CustomEvent('agworld:dynamic-entity-selected', { detail: { entity } }));
      if (isDirectDiagnosticSelection) directMarkerDiagnostic('EVENT DISPATCH COMPLETED', 'dispatchEvent returned ' + dispatched);
      return dispatched;
    } catch (error) {
      if (isDirectDiagnosticSelection) directMarkerDiagnostic('EVENT DISPATCH THREW', '', error);
      throw error;
    }
  };

  const updateButton = $('farm3d');
  if (updateButton) {
    const updateLabel = 'UPDATE ' + String(cfg.label || 'ENTITY').toUpperCase() + ' DETAILS';
    updateButton.textContent = updateLabel;
    updateButton.type = 'button';
    updateButton.onclick = () => {
      // Dynamic entities now mirror the Farm card action. The button enters the
      // canonical Entity Engine first, then opens its shared edit form.
      enterWorkingRelationshipPath();
      let editorAttempts = 0;
      const openEditor = () => {
        const host = document.querySelector('#agworldV2FarmDetailHost, #agworldV2EntityDetailHost');
        if (!host) {
          if (++editorAttempts < 20) setTimeout(openEditor, 60);
          else toast('Entity details panel did not open. Please select Entity Details and use Edit entity.');
          return;
        }
        const detailsTab = host.querySelector('[data-tab="details"]');
        if (detailsTab && !detailsTab.classList.contains('is-active')) detailsTab.click();
        requestAnimationFrame(() => {
          const editButton = host.querySelector('[data-entity-action="edit-details"]');
          if (editButton) editButton.click();
        });
      };
      requestAnimationFrame(openEditor);
    };
  }

  if (map && zoom) {
    if (isDirectDiagnosticSelection) directMarkerDiagnostic('MAP PAN START');
    map.panTo({ lat: entity.lat, lng: entity.lng });
    map.setZoom(Math.max(map.getZoom() || 0, 12));
    if (entity._marker) entity._marker.setMap(map);
    if (isDirectDiagnosticSelection) directMarkerDiagnostic('MAP PAN COMMAND COMPLETED');
  } else if (isDirectDiagnosticSelection) {
    directMarkerDiagnostic('MAP PAN SKIPPED', 'map=' + Boolean(map) + ', zoom=' + Boolean(zoom));
  }

  // Direct icon click now enters the same canonical path as clicking the
  // relationship inside the Farm card. This is deliberately the final action
  // in selection, after the base card and map state are stable.
  enterWorkingRelationshipPath();

  if (isDirectDiagnosticSelection) directMarkerDiagnostic('SELECTION PATH COMPLETED');
  const mapStatusNode = $('mapStatus');
  if (mapStatusNode) mapStatusNode.textContent = `${cfg.label} selected · ${entity.name}`;
  else if (isDirectDiagnosticSelection) directMarkerDiagnostic('CARD FIELD NOT PRESENT', 'mapStatus');
}

// V2 Relationship Network Layer. The network is derived only from active
// relationship records; it is never hard-coded into the map.
const relationshipNetworkState = {
  overlays: [],
  selectedEntity: null,
  requestVersion: 0
};

function clearRelationshipNetwork() {
  relationshipNetworkState.overlays.forEach(overlay => {
    try { overlay.setMap(null); } catch (_) {}
  });
  relationshipNetworkState.overlays = [];
}

function canonicalEntityType(type) {
  const raw = String(type || 'farm').trim();
  const key = raw.toLowerCase().replace(/[\\s_-]+/g, '');
  if (key === 'companyfacility') return 'company_facility';
  if (key === 'farm') return 'farm';
  if (key === 'contractor') return 'contractor';
  if (key === 'competitor') return 'competitor';
  return raw.toLowerCase().replace(/[\\s-]+/g, '_');
}

function networkEntityKey(type, id) {
  return canonicalEntityType(type) + ':' + String(id || '');
}

function normaliseRelationshipRecord(r) {
  const value = (camel, snake) => r?.[camel] ?? r?.[snake];
  return {
    id: r?.id,
    sourceId: value('sourceEntityId', 'source_entity_id'),
    sourceType: value('sourceEntityType', 'source_entity_type') || 'farm',
    targetId: value('targetEntityId', 'target_entity_id'),
    targetType: value('targetEntityType', 'target_entity_type') || 'farm',
    relationshipType: value('relationshipType', 'relationship_type') || 'works_with',
    status: String(r?.status || 'active').toLowerCase(),
    metadata: r?.metadata || {}
  };
}

function entityPositionForNetwork(type, id, selectedSelection = null) {
  const wantedId = String(id);

  // The currently selected marker is already the authoritative runtime entity.
  // Use its live coordinates directly instead of depending on a second array
  // lookup. This is essential for Contractors, Competitors and Company
  // Facilities whose selection can occur before any later layer refresh.
  if (
    selectedSelection &&
    String(selectedSelection.id) === wantedId &&
    Number.isFinite(Number(selectedSelection.lat)) &&
    Number.isFinite(Number(selectedSelection.lng))
  ) {
    return {
      lat: Number(selectedSelection.lat),
      lng: Number(selectedSelection.lng),
      entity: selectedSelection.entity || null
    };
  }
  const canonicalType = canonicalEntityType(type);
  const registry = window.__AGWORLD_RELATIONSHIP_POSITIONS__;
  const registryPoint = registry?.get(networkEntityKey(canonicalType, wantedId));
  if (registryPoint &&
      Number.isFinite(Number(registryPoint.lat)) &&
      Number.isFinite(Number(registryPoint.lng))) {
    return registryPoint;
  }

  const normalType = canonicalType === 'company_facility' ? 'companyFacility' : canonicalType;

  if (normalType === 'farm') {
    const farm = farms.find(item => String(item.id) === wantedId);
    if (!farm) return null;
    const point = farm.center || (farm.boundary?.length ? centroid(farm.boundary) : null);
    return point ? { lat: Number(point.lat), lng: Number(point.lng), entity: farm } : null;
  }

  const arrays = {
    contractor: contractors,
    competitor: competitors,
    companyFacility: companyFacilities
  };
  const item = (arrays[normalType] || []).find(row => String(row.id) === wantedId);
  if (!item || !Number.isFinite(Number(item.lat)) || !Number.isFinite(Number(item.lng))) return null;
  return { lat: Number(item.lat), lng: Number(item.lng), entity: item };
}

function relationshipNetworkStyle(type) {
  const styles = {
    works_with: { strokeColor: '#39b7c9', icons: [] },
    supported_by: { strokeColor: '#6f8f3d', icons: [] },
    supplies: { strokeColor: '#d7e66b', icons: [] },
    serves: { strokeColor: '#69a7d4', icons: [] },
    competes_with: { strokeColor: '#e37a5f', icons: [] },
    owned_by: { strokeColor: '#a486d8', icons: [] },
    manages: { strokeColor: '#f0b44d', icons: [] },
    partnered_with: { strokeColor: '#8fb339', icons: [] }
  };
  return styles[type] || { strokeColor: '#9aa9af', icons: [] };
}

async function renderRelationshipNetwork(selection) {
  if (!map || !selection?.id) return;
  const requestVersion = ++relationshipNetworkState.requestVersion;
  relationshipNetworkState.selectedEntity = selection;
  clearRelationshipNetwork();

  const db = getFarmDb();
  if (!db) return;

  const entityId = String(selection.id);
  const selectedType = canonicalEntityType(selection.type || 'farm');

  // Always read the canonical active relationship set and filter locally.
  // This removes PostgREST compound-filter parsing from the runtime selection
  // path entirely. The relationship graph is intentionally small and is the
  // same shared graph used by every entity type.
  // Read the full canonical graph. Older relationship rows may have a null
  // status (the normaliser treats null as active), so filtering in PostgREST
  // with .eq('status', 'active') can silently remove valid dynamic links before
  // the renderer ever sees them.
  const result = await db
    .from('entity_relationships')
    .select('*');

  if (requestVersion !== relationshipNetworkState.requestVersion) return;

  if (result.error) {
    console.warn('Relationship network query failed', result.error);
    $('mapStatus').textContent = 'RELATIONSHIP NETWORK · database query failed';
    return;
  }

  // Keep the normaliser's backward-compatible default: a missing status is
  // active. Only an explicitly inactive/disabled relationship is excluded.
  const allRelationships = (result.data || [])
    .map(normaliseRelationshipRecord)
    .filter(rel => !['inactive', 'disabled', 'archived'].includes(String(rel.status || 'active').toLowerCase()));
  window.__AGWORLD_ACTIVE_RELATIONSHIPS__ = allRelationships;

  // Entity IDs are globally unique across the game layer.
  const relationships = allRelationships.filter(rel =>
    String(rel.sourceId) === entityId ||
    String(rel.targetId) === entityId
  );

  if (!relationships.length) {
    $('mapStatus').textContent = 'RELATIONSHIP NETWORK · no active connections';
  }

  relationships.forEach(rel => {
    const source = entityPositionForNetwork(rel.sourceType, rel.sourceId, selection);
    const target = entityPositionForNetwork(rel.targetType, rel.targetId, selection);
    if (!source || !target) return;

    const style = relationshipNetworkStyle(rel.relationshipType);
    const path = [{ lat: source.lat, lng: source.lng }, { lat: target.lat, lng: target.lng }];

    // Relationship links must remain visually dominant over satellite imagery,
    // territory fills and entity boundaries. Render a wide translucent halo
    // beneath a bright core rather than relying on a single thin polyline.
    const glow = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: style.strokeColor,
      strokeOpacity: .46,
      strokeWeight: 12,
      zIndex: 980,
      map
    });
    const line = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#ffffff',
      strokeOpacity: .98,
      strokeWeight: 4,
      zIndex: 990,
      icons: [{
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 4,
          strokeColor: style.strokeColor,
          strokeWeight: 2,
          fillColor: style.strokeColor,
          fillOpacity: 1
        },
        offset: '62%'
      }],
      map
    });
    const core = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: style.strokeColor,
      strokeOpacity: 1,
      strokeWeight: 2,
      zIndex: 995,
      map
    });
    relationshipNetworkState.overlays.push(glow, line, core);

    const selectedIsSource = String(rel.sourceId) === entityId;
    const otherType = selectedIsSource ? rel.targetType : rel.sourceType;
    const otherId = selectedIsSource ? rel.targetId : rel.sourceId;
    const other = entityPositionForNetwork(otherType, otherId);
    if (!other) return;

    const label = String(rel.relationshipType || '').replaceAll('_', ' ').toUpperCase();
    const midpoint = {
      lat: (source.lat + target.lat) / 2,
      lng: (source.lng + target.lng) / 2
    };

    // A visible midpoint badge makes each relationship unmistakable even when
    // its endpoints are close together or lie inside an entity boundary.
    const badge = new google.maps.Marker({
      position: midpoint,
      map,
      zIndex: 1010,
      title: label,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: style.strokeColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      },
      label: {
        text: '↔',
        color: '#ffffff',
        fontSize: '13px',
        fontWeight: '800'
      }
    });

    const node = new google.maps.Marker({
      position: { lat: other.lat, lng: other.lng },
      map,
      zIndex: 1020,
      title: label,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 11,
        fillColor: style.strokeColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      },
      label: {
        text: label.length > 12 ? label.slice(0, 12) : label,
        color: '#ffffff',
        fontSize: '8px',
        fontWeight: '800'
      }
    });

    badge.addListener('click', () => {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: source.lat, lng: source.lng });
      bounds.extend({ lat: target.lat, lng: target.lng });
      map.fitBounds(bounds, 80);
    });
    node.addListener('click', () => {
      if (otherType === 'farm') {
        const farm = farms.find(item => String(item.id) === String(otherId));
        if (farm) selectFarm(farm, true);
      } else {
        const dynamicType = otherType === 'company_facility' ? 'companyFacility' : otherType;
        const item = (dynamicArray(dynamicType) || []).find(row => String(row.id) === String(otherId));
        if (item) selectDynamicEntity(item, true);
      }
    });
    relationshipNetworkState.overlays.push(badge, node);
  });

  const relationshipCount = relationships.length;
  $('mapStatus').textContent = relationshipCount
    ? `RELATIONSHIP NETWORK · ${relationshipCount} active connection${relationshipCount === 1 ? '' : 's'}`
    : 'RELATIONSHIP NETWORK · no active connections';

  const overlayCount = relationshipNetworkState.overlays.length;
  window.__AGWORLD_RELATIONSHIP_DEBUG__ = {
    entityId,
    entityType: selectedType,
    relationshipCount,
    overlayCount,
    timestamp: Date.now()
  };

  window.dispatchEvent(new CustomEvent('agworld:relationship-network-rendered', {
    detail: { entityId, entityType: selectedType, relationshipCount, overlayCount }
  }));
}

let relationshipNetworkTimer = null;
let pendingRelationshipSelection = null;

function scheduleRelationshipNetwork(selection) {
  // Collapse duplicate or near-simultaneous selection signals into one
  // deterministic render of the latest entity. This is particularly important
  // for dynamic markers, whose card selection and map-pan events happen in the
  // same click cycle.
  pendingRelationshipSelection = selection;
  if (relationshipNetworkTimer) clearTimeout(relationshipNetworkTimer);

  relationshipNetworkTimer = setTimeout(() => {
    relationshipNetworkTimer = null;
    const latest = pendingRelationshipSelection;
    pendingRelationshipSelection = null;
    if (!latest) return;

    renderRelationshipNetwork(latest).catch(error => {
      console.warn('Relationship network render failed', error);
    });
  }, 140);
}

// Legacy relationship listeners remain only as a fallback for older builds.
// The canonical V2 renderer is the single runtime path whenever it is loaded.
// Without this guard, these closed-over legacy listeners still render in parallel
// even after window.renderRelationshipNetwork has been replaced, creating a
// second request/overlay lifecycle that can make non-Farm selections appear
// data-complete while their visual links are missing.
window.addEventListener('agworld:farm-selected', event => {
  if (window.__AGWORLD_RELATIONSHIP_NETWORK_CANONICAL_V2__) return;
  const farm = event?.detail?.farm;
  if (farm) scheduleRelationshipNetwork({ id: farm.id, type: 'farm' });
});
window.addEventListener('agworld:dynamic-entity-selected', event => {
  if (window.__AGWORLD_RELATIONSHIP_NETWORK_CANONICAL_V2__) return;
  const entity = event?.detail?.entity;
  if (entity) scheduleRelationshipNetwork({
    id: entity.id,
    type: entity.type === 'companyFacility' ? 'company_facility' : entity.type,
    lat: Number(entity.lat),
    lng: Number(entity.lng),
    entity
  });
});
window.addEventListener('agworld:farm-selection-cleared', () => {
  if (window.__AGWORLD_RELATIONSHIP_NETWORK_CANONICAL_V2__) return;
  clearRelationshipNetwork();
});

async function loadDynamicLayer(type) {
  const cfg = DYNAMIC_LAYER_CONFIG[type];
  const db = getFarmDb();
  if (!db) return;
  const { data, error } = await db.from(cfg.table).select('*').order('updated_at', { ascending: true });
  if (error) { console.warn(cfg.label + ' layer load failed', error); return; }
  const array = dynamicArray(type);
  const byId = new Map(array.map(item => [String(item.id), item]));
  const seen = new Set();
  (data || []).filter(row => shouldIncludeWorldRecord(type, row)).forEach(row => {
    const fresh = hydrateDynamicEntity(row, type);
    seen.add(fresh.id);
    const current = byId.get(fresh.id);
    if (current?._marker) fresh._marker = current._marker;
    const index = array.findIndex(item => item.id === fresh.id);
    if (index >= 0) array[index] = fresh; else array.push(fresh);
    if (fresh.name) renderDynamicEntity(fresh);
  });
  for (let i = array.length - 1; i >= 0; i--) {
    if (!seen.has(String(array[i].id))) {
      try { array[i]._marker?.setMap(null); } catch (_) {}
      array.splice(i, 1);
    }
  }
  refreshMapVisibility();
}

async function loadDynamicLayers() {
  await Promise.allSettled([
    loadDynamicLayer('contractor'),
    loadDynamicLayer('competitor'),
    loadDynamicLayer('companyFacility')
  ]);
  window.dispatchEvent(new CustomEvent('agworld:dynamic-layers-loaded', {
    detail: { contractors, competitors, companyFacilities }
  }));
}

$('createContractorBtn').onclick = () => openDynamicEntity('contractor');
$('createCompetitorBtn').onclick = () => openDynamicEntity('competitor');
$('createCompanyFacilityBtn').onclick = () => openDynamicEntity('companyFacility');
$('closeDynamicEntity').onclick = () => {
  stopDynamicLocationMode();
  $('dynamicEntityModal').classList.remove('show');
};
$('dynamicEntityModal').onclick = event => {
  if (event.target.id === 'dynamicEntityModal') {
    event.preventDefault();
    toast('Creation is still open · use the close button if you want to cancel.');
  }
};
$('dynamicSelectLocation').onclick = startDynamicLocationMode;
$('dynamicSaveLocation').onclick = async () => {
  try {
    await saveDynamicEntity(1);
    showDynamicStep(2);
    toast('Location saved to the shared database');
  } catch (error) { toast('Could not save location: ' + (error.message || error)); }
};
$('dynamicSaveInfo').onclick = async () => {
  try { await saveDynamicEntity(2); toast(`${dynamicConfig().label} information saved · live map updated`); }
  catch (error) { toast('Could not save record: ' + (error.message || error)); }
};
$('dynamicNextInfo').onclick = async () => {
  const button = $('dynamicNextInfo');
  button.disabled = true;
  try {
    const entity = await saveDynamicEntity(2);
    if (!entity.name) throw new Error(`${dynamicConfig().label} name is required.`);
    renderDynamicChecklist(dynamicEntityType, entity.details?.capabilities || []);
    renderDronePortfolio('dynamicDronePortfolio', entity.details?.dronePortfolio || []);
    showDynamicStep(3);
  } catch (error) { toast('Could not continue: ' + (error.message || error)); }
  finally { button.disabled = false; }
};
$('dynamicNextAssets').onclick = async () => {
  const button = $('dynamicNextAssets'); button.disabled = true;
  try { const entity = await saveDynamicEntity(3); renderDronePortfolio('dynamicDronePortfolio', entity.details?.dronePortfolio || []); showDynamicStep(4); }
  catch (error) { toast('Could not continue: ' + (error.message || error)); } finally { button.disabled = false; }
};
$('dynamicFinish').onclick = async () => {
  const button = $('dynamicFinish');
  button.disabled = true;
  try {
    const portfolio = dynamicDronePortfolioFromForm();
    if (dynamicEntityType === 'contractor' && !portfolio.length) throw new Error('A Contractor must have at least one drone relationship with either a Company Facility or a Competitor.');
    const entity = await saveDynamicEntity(4);
    await syncDronePurchaseRelationships(dynamicEntityType, entity.id, portfolio);
    $('dynamicEntityModal').classList.remove('show');
    dynamicEntityId = null;
    dynamicEntityLocation = null;
    toast(`${dynamicConfig().label} saved and finished · shared live map updated`);
    renderDynamicEntity(entity);
  } catch (error) { toast('Could not finish: ' + (error.message || error)); }
  finally { button.disabled = false; }
};

window.addEventListener('agworld:supabase-authenticated', () => setTimeout(loadDynamicLayers, 0));
window.addEventListener('agworld:player-ready', () => setTimeout(loadDynamicLayers, 0));
window.addEventListener('gamechanger:authenticated', () => setTimeout(loadDynamicLayers, 0));
window.addEventListener('pageshow', () => setTimeout(loadDynamicLayers, 300));
// Initial hydration covers an already-authenticated player who opened the game
// without triggering a fresh auth event in this page lifecycle.
setTimeout(() => loadDynamicLayers().catch(() => {}), 1200);
setInterval(() => { if (map) loadDynamicLayers().catch(() => {}); }, 5000);

window.AG_WORLD_WORLD.getContractors = () => contractors;
window.AG_WORLD_WORLD.getCompetitors = () => competitors;
window.AG_WORLD_WORLD.getCompanyFacilities = () => companyFacilities;

// SALES & FLEET · explicit public bridge for Developer Mode and gameplay UI.
// The Fleet functions historically lived inside this GIS module, which meant the
// buttons could work while diagnostics incorrectly reported the API as missing.
window.openFleetTransaction = (type,id) => openFleetTransaction(type,id);
window.openFleetManagement = (type,id) => openFleetManagement(type,id);
window.AGWorldFleetUI = {
  openTransaction: window.openFleetTransaction,
  openManagement: window.openFleetManagement,
  selected(){
    // The Developer Mode runs in a separate tab and reads the live AG World
    // window. Always resolve the MOST RECENT canonical selection. Previously a
    // stale contractor selection could win over a newer Farm selection, leaving
    // the Fleet diagnostic disconnected from the entity visible on screen.
    const candidates=[];
    const dynamic=window.__AGWORLD_RUNTIME_DYNAMIC_ENTITY_SELECTION_V2__;
    if(dynamic && (dynamic.entityType==='contractor'||dynamic.entityType==='farm')) candidates.push({type:dynamic.entityType,id:String(dynamic.entityId),name:dynamic.name||'',timestamp:Number(dynamic.timestamp||0)});
    const farmSignal=window.__AGWORLD_RUNTIME_FARM_SELECTION_V2__;
    if(farmSignal?.farmId) candidates.push({type:'farm',id:String(farmSignal.farmId),name:farmSignal.name||'',timestamp:Number(farmSignal.timestamp||0)});
    const fleetState=window.__AGWORLD_FLEET_UI_STATE__;
    if(fleetState && (fleetState.entityType==='contractor'||fleetState.entityType==='farm') && fleetState.entityId!=null) candidates.push({type:fleetState.entityType,id:String(fleetState.entityId),name:fleetState.entityName||'',timestamp:Number(fleetState.updatedAt||0)});
    if(selected?.id) candidates.push({type:'farm',id:String(selected.id),name:selected.name||'',timestamp:Number(farmSignal?.timestamp||0)});
    candidates.sort((a,b)=>b.timestamp-a.timestamp);
    const latest=candidates[0];
    return latest?{type:latest.type,id:latest.id,name:latest.name||''}:null;
  },
  ensureQuickActions(type,id){
    const entity=salesEntityList(type).find(e=>String(e.id)===String(id));
    if(!entity) throw new Error('Selected Farm or Contractor is no longer available.');
    updateFleetTransactionAction(entity,type);
    const quick=document.getElementById('fleetQuickActions');
    const actions=document.getElementById('farmActions');
    return {
      entity:{id:String(entity.id),name:entity.name||''},
      type,
      host:!!actions,
      quickActions:!!quick,
      sellButton:!!document.getElementById('fleetQuickSell'),
      historyButton:!!document.getElementById('fleetQuickHistory')
    };
  },
  health(options={}){
    const repair=options.repair!==false;
    const current=this.selected();
    let repaired=false, repairError='';
    if(repair && current){
      try {
        const entity=salesEntityList(current.type).find(e=>String(e.id)===String(current.id));
        if(entity){
          updateFleetTransactionAction(entity,current.type);
          repaired=true;
        }
      } catch(error) {
        repairError=String(error?.message||error);
      }
    }
    const actions=document.getElementById('farmActions');
    const quick=document.getElementById('fleetQuickActions');
    const sell=document.getElementById('fleetQuickSell');
    const history=document.getElementById('fleetQuickHistory');
    const card=document.getElementById('farmCard');
    const visible=node=>!!(node && node.isConnected && node.hidden!==true && getComputedStyle(node).display!=='none' && getComputedStyle(node).visibility!=='hidden');
    const result={
      selected:current,
      eligible:!!current,
      card:!!card,
      host:!!actions,
      quickActions:!!quick,
      sellButton:!!sell,
      historyButton:!!history,
      quickVisible:visible(quick),
      sellVisible:visible(sell),
      historyVisible:visible(history),
      repaired,
      repairError,
      healthy:!!(current && actions && quick && sell && history && visible(quick) && visible(sell) && visible(history))
    };
    window.__AGWORLD_FLEET_UI_HEALTH__={...result,checkedAt:Date.now()};
    return result;
  }
};
