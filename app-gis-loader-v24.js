const CONFIG = window.AG_WORLD_CONFIG || {};
// Current build is running the territory-control demo dataset only.
window.AG_WORLD_DEMO_MODE = true;

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

  const rows = Array.isArray(data) ? data : [];
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

function calculateTerritoryControl(territory) {
  const territoryFarms = territoryFarmSet(territory);
  const total = territoryFarms.length;
  const company = territoryFarms.filter(f => farmAssetControl(f) === 'company').length;
  const competitor = territoryFarms.filter(f => farmAssetControl(f) === 'competitor').length;
  const neutral = total - company - competitor;
  const control = total ? Math.round((company / total) * 1000) / 10 : 0;
  const enemyControl = total ? Math.round((competitor / total) * 1000) / 10 : 0;
  return { total, company, competitor, neutral, control, enemyControl };
}

function territoryControlStyle(territory) {
  const game = territory.game || calculateTerritoryControl(territory);
  const control = Number(game.control || 0);
  const enemy = Number(game.enemyControl || 0);

  // Company influence is green. Enemy-dominated areas are red. Neutral
  // territories remain muted until farms are placed there.
  if (control >= 100) return { fillColor: '#00c853', strokeColor: '#00e676', fillOpacity: 0.34 };
  if (control >= 76) return { fillColor: '#19d46b', strokeColor: '#46f08b', fillOpacity: 0.28 };
  if (control >= 51) return { fillColor: '#4caf50', strokeColor: '#76d275', fillOpacity: 0.23 };
  if (control >= 26) return { fillColor: '#8bc34a', strokeColor: '#b4df78', fillOpacity: 0.19 };
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
    territory.owner = territory.game.control > 0 ? MASTER_PLAYER.name : 'Uncontrolled';
    territory.status = territory.game.control >= 100
      ? 'Controlled'
      : territory.game.control > 0
        ? 'Contested'
        : territory.game.enemyControl > 0
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
    ...game
  };
}

function refreshTerritoryControl() {
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
  seedDemoFarms();
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
  const neutralPct = summary.total ? Math.max(0, 100 - control - enemy) : 0;

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
      <span>⚪ Neutral ${Math.round(neutralPct * 10) / 10}%</span>
    </div>

    <div class="territory-info-grid">
      <div><strong>${summary.total}</strong><span>Total Farms</span></div>
      <div><strong>${summary.company}</strong><span>Our Drone</span></div>
      <div><strong>${summary.competitor}</strong><span>Competitor</span></div>
      <div><strong>${summary.neutral}</strong><span>Neutral</span></div>
    </div>

    <div class="territory-info-footer">
      <span>${summary.company} / ${summary.total || 0} farms currently contribute to ${MASTER_PLAYER.name} control.</span>
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

  $('farmCard').classList.add('show');
  $('farmName').textContent = territory.name;
  $('farmMeta').textContent = `${levelLabel} TERRITORY · ${MASTER_PLAYER.name} CONTROL ${summary.control}%`;
  $('farmDrones').textContent = summary.company;
  $('farmTractors').textContent = summary.competitor;
  $('farmCrops').textContent = summary.total;
  $('farmScore').textContent = `${summary.control}%`;
  $('farmLivestock').textContent = summary.neutral;
  $('farmHarvest').textContent = MASTER_PLAYER.name.toUpperCase();
  $('farmService').textContent = `${summary.company} OUR FARMS · ${summary.competitor} ENEMY FARMS`;
  $('farmDetailText').textContent =
    `${summary.control}% territory control is calculated from ${summary.total} created farms: ${summary.company} under ${MASTER_PLAYER.name} control (Our Drone), ${summary.competitor} controlled by competitors (Competitor drone), and ${summary.neutral} neutral.`;
  $('aiText').textContent =
    `${MASTER_PLAYER.name} controls ${summary.company}/${summary.total} farms in this ${levelLabel.toLowerCase()} territory = ${summary.control}% control. Enemy control: ${summary.enemyControl}%.`;

  selected = null;
  if (map && zoom) {
    map.panTo(territory.center || centroid(territory.boundary));
    const targetZoom = { country: 5, province: 7, municipality: 10, town: 12 }[territory.level] || 7;
    map.setZoom(targetZoom);
  }
  $('mapStatus').textContent = `${MASTER_PLAYER.name} territory control · ${levelLabel} · ${territory.name} · ${summary.control}% · ${summary.company}/${summary.total} farms`;
}
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

  updateButton.style.cssText = 'width:50%;margin-top:0;flex:1;';
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
  button.style.cssText = 'width:50%;margin-top:0;flex:1;';
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
  if (progress) progress.textContent = `STEP ${step} OF 3`;
  if (title) title.textContent = step === 1 ? 'SELECT FARM BOUNDARY' : step === 2 ? 'CAPTURE FARM INFORMATION' : 'SELECT FARM ASSETS';
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
  try { await saveFarmWizardStep(3); }
  catch (error) { console.error('SAVE FARM ASSETS failed', error); toast('Farm assets save failed: ' + (error?.message || 'Unknown error')); }
};

// Step 3 is a checklist-driven finish action. The final click saves the
// selected equipment and crops to the canonical shared farm record, refreshes
// the live map, then closes the wizard.
async function finishFarmWizard() {
  const button = $('saveFarm');
  if (button) { button.disabled = true; button.textContent = 'SAVING FARM…'; }
  try {
    const saved = await saveFarmWizardStep(3);
    if (!saved) return false;

    const id = editingFarmId || farmWizardDraftId;
    const farm = farms.find(item => String(item.id) === String(id));
    if (!farm) throw new Error('Saved farm record could not be found after Step 3.');

    if (selected && String(selected.id) === String(farm.id)) selected = farm;
    window.__AG_WORLD_FARMS = farms;
    try { saveLocal(); } catch (error) { console.warn('Farm local save failed', error); }
    try { addFarm(farm); } catch (error) { console.warn('Farm redraw failed', error); }
    try { refreshMapVisibility(); } catch (error) { console.warn('Farm visibility refresh failed', error); }

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

function dynamicDetailsFromForm() {
  const capabilities = [...document.querySelectorAll('#dynamicChecklist input[type="checkbox"]:checked')].map(input => input.value);
  return {
    country: $('dynamicCountry').value.trim(),
    province: $('dynamicProvince').value.trim(),
    municipality: $('dynamicMunicipality').value.trim(),
    nearestTown: $('dynamicNearestTown').value.trim(),
    website: $('dynamicWebsite').value.trim(),
    notes: $('dynamicNotes').value.trim(),
    capabilities
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
  const titles = ['SELECT LOCATION', `${cfg.label.toUpperCase()} INFORMATION`, 'COMPLETE RECORD'];
  $('dynamicEntityProgress').textContent = `STEP ${step} OF 3`;
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
    const livePosition = entity._marker?.getPosition?.();
    if (livePosition) {
      entity.lat = Number(livePosition.lat());
      entity.lng = Number(livePosition.lng());
    }
    selectDynamicEntity(entity, true);
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

function selectDynamicEntity(entity, zoom = true) {
  if (!entity?.id) return;
  const cfg = DYNAMIC_LAYER_CONFIG[entity.type];
  if (!cfg) return;

  // Dynamic entities use the same visible Farm Card host as Farms, but keep
  // their own canonical selection signal and V2 entity type.
  selected = null;
  window.__AGWORLD_RUNTIME_DYNAMIC_ENTITY_SELECTION_V2__ = {
    entityId: String(entity.id),
    entityType: entity.type,
    name: entity.name || '',
    timestamp: Date.now()
  };

  $('farmCard').classList.add('show');
  $('farmName').textContent = entity.name || cfg.label;
  $('farmMeta').textContent = `${cfg.label.toUpperCase()} · ${entity.status || 'Active'} · ${entity.details?.nearestTown || entity.details?.municipality || 'Mapped location'}`;
  $('farmDrones').textContent = entity.type === 'contractor' ? (entity.details?.capabilities?.filter?.(x => /drone/i.test(x)).length || 0) : '—';
  $('farmTractors').textContent = entity.type === 'competitor' ? (entity.details?.capabilities?.length || 0) : '—';
  $('farmCrops').textContent = entity.type === 'companyFacility' ? (entity.details?.capabilities?.length || 0) : '—';
  $('farmScore').textContent = entity.status || 'Active';
  $('farmLivestock').textContent = entity.contactName || '—';
  $('farmHarvest').textContent = entity.contactCell || '—';
  $('farmService').textContent = entity.contactEmail || '—';
  const capabilities = Array.isArray(entity.details?.capabilities) ? entity.details.capabilities.join(', ') : '';
  $('farmDetailText').textContent = entity.details?.notes || capabilities || `${cfg.label} location and intelligence record.`;
  $('aiText').textContent = `${cfg.label} is an interconnected AG World game-layer entity. Relationships, activity, documents, media and notes are managed through the V2 Entity Engine.`;

  const updateButton = $('farm3d');
  if (updateButton) {
    updateButton.textContent = 'VIEW ENTITY DETAILS';
    updateButton.onclick = () => {
      // Publish both the V2 canonical selection event and the legacy-compatible
  // dynamic event. The canonical relationship renderer subscribes directly to
  // these selection signals, so clicking the map icon follows the same route
  // as selecting the entity through the card or detail workflow.
  window.dispatchEvent(new CustomEvent('agworld:v2-entity-selected', { detail: { entity } }));
  window.dispatchEvent(new CustomEvent('agworld:dynamic-entity-selected', { detail: { entity } }));
    };
  }

  if (map && zoom) {
    map.panTo({ lat: entity.lat, lng: entity.lng });
    map.setZoom(Math.max(map.getZoom() || 0, 12));
    if (entity._marker) entity._marker.setMap(map);
  }

  // Emit the canonical V2 selection event and explicitly redraw the
  // relationship network around every non-Farm entity.
  // One canonical selection event drives the relationship renderer. Do not
  // start a second parallel render here: the old event + direct-call pattern
  // created two competing requests, allowing a later empty/unresolved render
  // to clear links produced by the first one.
  window.dispatchEvent(new CustomEvent('agworld:dynamic-entity-selected', { detail: { entity } }));

  // The Farm path is event-driven. Dynamic entities also emit that canonical
  // event, but explicitly hand the same selection object to the canonical
  // scheduler as a reliability bridge. Both calls collapse into the same
  // debounced canonical renderer, so there is still only one overlay lifecycle.
  const relationshipSelection = {
    id: entity.id,
    type: entity.type === 'companyFacility' ? 'company_facility' : entity.type,
    lat: Number(entity.lat),
    lng: Number(entity.lng),
    entity
  };
  // IMPORTANT: call the lexical canonical scheduler directly. The GIS loader
  // may be executed in a scope where top-level functions are not exposed as
  // window properties, so window.scheduleRelationshipNetwork can be undefined
  // even though the Farm event path can still reach this exact scheduler.
  scheduleRelationshipNetwork(relationshipSelection);

  // Dynamic layer hydration can replace marker references shortly after a
  // click. Re-schedule the same canonical selection after that settles.
  setTimeout(() => {
    const current = window.__AGWORLD_RUNTIME_DYNAMIC_ENTITY_SELECTION_V2__;
    if (current && String(current.entityId) === String(entity.id) &&
        String(current.entityType) === String(entity.type)) {
      scheduleRelationshipNetwork(relationshipSelection);
    }
  }, 320);

  $('mapStatus').textContent = `${cfg.label} selected · ${entity.name}`;
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
  (data || []).forEach(row => {
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
    showDynamicStep(3);
  } catch (error) { toast('Could not continue: ' + (error.message || error)); }
  finally { button.disabled = false; }
};
$('dynamicFinish').onclick = async () => {
  const button = $('dynamicFinish');
  button.disabled = true;
  try {
    const entity = await saveDynamicEntity(3);
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
