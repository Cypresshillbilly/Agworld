const CONFIG = window.AG_WORLD_CONFIG || {};

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
  const copy = JSON.parse(JSON.stringify(farm));
  delete copy._polygon;
  delete copy._marker;
  return copy;
}

function saveLocal() {
  localStorage.setItem('agworld-farms-v2', JSON.stringify(farms.map(cleanFarm)));
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

function normaliseSpatialFeatures(geojson, level) {
  const features = geojson?.features || [];
  return features.map((feature, index) => {
    const p = feature.properties || {};
    const name = p.MAP_TITLE || p.PROVINCE || p.MUNICNAME || p.NameCode || p.S12_NAME || p.SGADMIN || p.SGTOWN || p.TOWN || p.SHRT_ENGL || p.NAME || p.name || `${level} ${index + 1}`;
    const sourceId = p.ISO3_CODE || p.MUNICCODE || p.MUNICCD || p.CODE || p.AG_SGAD_ID || p.OBJECTID || index + 1;
    const boundary = geometryToBoundary(feature.geometry);
    const center = boundary.length ? centroid(boundary) : null;
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
    const byId = new Map(base.map(f => [f.id, f]));
    stored.forEach(f => byId.set(f.id, f));
    farms = [...byId.values()];
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

async function loadSpatialLayersInBackground() {
  console.info('AG World GIS loader v10 started');
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
  const municipalPromise = fetchSpatialLayer(spatialSources.municipalities, 'municipal boundaries', 60000);
  const townPromise = fetchSpatialLayer(spatialSources.towns, 'town boundaries');

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

  if (map) {
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
    clickable: true,
    // Province borders must always sit above municipality borders where they overlap.
    zIndex: level === 'country' ? 1 : level === 'town' ? 4 : level === 'municipality' ? 6 : level === 'province' ? 10 : 1,
    map
  });
  polygon.addListener('click', () => selectTerritory(territory, true));

  // Town markers were the main source of lag. At town level the boundary itself
  // is the interactive target, so markers are unnecessary.
  let marker = null;
  if (level !== 'town') {
    marker = new google.maps.Marker({
      position: territory.center || centroid(territory.boundary),
      map,
      title: territory.name,
      label: { text: String(territory.code || (level === 'country' ? 'ZA' : level === 'municipality' ? 'M' : 'P')), color: '#fff', fontSize: '10px', fontWeight: '700' }
    });
    marker.addListener('click', () => selectTerritory(territory, true));
    territoryMarkers.push(marker);
  }
  territory._polygon = polygon;
  territory._marker = marker;
}

function syncVisibleTownOverlays() {
  if (!map) return;
  const zoom = map.getZoom();
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

function selectTerritory(territory, zoom = true) {
  const descendants = new Set([territory.id]);
  if ((territory.level || 'province') === 'country') territories.filter(p => p.parentId === territory.id).forEach(p => descendants.add(p.id));
  if ((territory.level || 'province') === 'province') municipalities.filter(m => m.parentId === territory.id).forEach(m => descendants.add(m.id));
  if ((territory.level || 'province') === 'municipality') towns.filter(t => t.parentId === territory.id).forEach(t => descendants.add(t.id));
  const territoryFarms = farms.filter(f => descendants.has(f.townId) || descendants.has(f.municipalityId) || descendants.has(f.territoryId));
  const opportunity = territoryFarms.reduce((sum, f) => sum + (Number(f.opportunityScore) || 0), 0);
  $('farmCard').classList.add('show');
  $('farmName').textContent = territory.name;
  const levelLabel = String(territory.level || 'province').toUpperCase();
  $('farmMeta').textContent = `${levelLabel} · ${territory.regionLabel || territory.name || 'AG WORLD'} · ${territory.status || 'Active'}`;
  $('farmDrones').textContent = territoryFarms.reduce((n, f) => n + (Number(f.drones) || 0), 0);
  $('farmTractors').textContent = territoryFarms.reduce((n, f) => n + (Number(f.tractors) || 0), 0);
  $('farmCrops').textContent = territoryFarms.length;
  $('farmScore').textContent = territoryFarms.length ? Math.round(opportunity / territoryFarms.length) : '—';
  $('farmLivestock').textContent = territoryFarms.reduce((n, f) => n + (Number(f.livestock) || 0), 0) || '—';
  $('farmHarvest').textContent = territory.owner || 'UNASSIGNED';
  $('farmService').textContent = `${territoryFarms.length} FARMS`;
  $('farmDetailText').textContent = territory.description || `${territoryFarms.length} farms linked to this territory. Select a farm by zooming in or clicking its marker.`;
  $('aiText').textContent = `${territoryFarms.length} mapped farms · Territory score ${territory.control ?? 0}% · ${territoryFarms.filter(f => f.status !== 'Customer').length} active opportunities.`;
  selected = null;
  if (map && zoom) {
    map.panTo(territory.center || centroid(territory.boundary));
    map.setZoom(7);
  }
  $('mapStatus').textContent = `Territory selected · ${territory.name} · ${territoryFarms.length} linked farms`;
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
    clickable: true,
    zIndex: 20,
    map
  }) : null;

  if (polygon) polygon.addListener('click', () => { if (!creatingFarm) selectFarm(farm, true); });

  const marker = new google.maps.Marker({
    position: farm.center,
    map,
    title: farm.name,
    zIndex: 30,
    label: { text: 'AG', color: '#fff', fontSize: '10px', fontWeight: '800' }
  });
  marker.addListener('click', () => { if (!creatingFarm) selectFarm(farm, true); });

  farm._polygon = polygon;
  farm._marker = marker;
  renderFarmObjects(farm);
}

function renderFarmObjects(farm) {
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
  municipalities.forEach(municipality => {
    if (municipality._polygon) municipality._polygon.setMap(zoom >= 8 && zoom < 11.5 ? map : null);
    if (municipality._marker) municipality._marker.setMap(zoom >= 8 && zoom < 10.5 ? map : null);
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
  selected = farm;
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
  ensureEditButton();
  if (map && zoom) {
    map.panTo(farm.center);
    map.setZoom(12);
    if (farm._marker) farm._marker.setMap(map);
    if (farm._polygon) {
      farm._polygon.setMap(map);
      farm._polygon.setOptions({ strokeWeight: 4, fillOpacity: 0.30, zIndex: 100 });
    }
  }
  showFarmDetail(farm);
}

function ensureEditButton() {
  if ($('editFarmBtn')) return;
  const button = document.createElement('button');
  button.id = 'editFarmBtn';
  button.textContent = 'EDIT FARM RECORD';
  button.style.marginTop = '6px';
  $('farm3d').insertAdjacentElement('afterend', button);
  button.onclick = () => openEditFarm(selected);
}

function showFarmDetail(farm) {
  if (map && map.getZoom() >= 9) {
    $('mapStatus').textContent = `Farm selected · ${farm.name} · boundary and ${(farm.objects || []).length} mapped objects linked to record ${farm.id}`;
  }
}

function showObject(object, farm) {
  const type = OBJECT_TYPES[object.type] || { label: object.type, icon: '•' };
  $('farmCard').classList.add('show');
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

function openCreateFarm() {
  if (!map) { toast('Add the Google Maps API key first.'); return; }
  editingFarmId = null;
  creatingFarm = true;
  newBoundary = [];
  draftObjects = [];
  placingObjectType = null;
  resetCreateForm();
  $('farmCreateModal').classList.add('show');
  $('boundaryStatus').textContent = 'No boundary created.';
  $('objectStatus').textContent = 'Draw a boundary first, then choose an object type.';
  $('farmCreateModal').querySelector('.farm3d-head strong').textContent = 'CREATE FARM';
  toast('Create Farm mode ready');
}

function openEditFarm(farm) {
  if (!farm || !map) return;
  editingFarmId = farm.id;
  creatingFarm = false;
  newBoundary = (farm.boundary || []).map(p => ({ lat: Number(p.lat), lng: Number(p.lng) }));
  draftObjects = JSON.parse(JSON.stringify(farm.objects || []));
  $('newFarmName').value = farm.name || '';
  $('newFarmOwner').value = farm.owner || '';
  $('newFarmRegion').value = farm.region || '';
  $('newFarmStatus').value = farm.status || 'Prospect';
  $('newFarmHarvest').value = farm.annualHarvest || '';
  $('newFarmService').value = farm.lastService || '';
  $('newFarmNotes').value = farm.notes || '';
  if (boundaryPolygon) boundaryPolygon.setMap(null);
  boundaryPolygon = new google.maps.Polygon({ paths: newBoundary, strokeOpacity: .95, strokeWeight: 3, fillOpacity: .12, map, clickable: false });
  renderObjectEditor();
  $('boundaryStatus').textContent = `Existing boundary loaded · ${newBoundary.length} points`;
  $('objectStatus').textContent = 'Edit the record or place additional objects.';
  $('farmCreateModal').querySelector('.farm3d-head strong').textContent = 'EDIT FARM RECORD';
  $('farmCreateModal').classList.add('show');
}

function startBoundary() {
  if (!map) return;
  creatingFarm = true;
  placingObjectType = null;
  $('farmCreateModal').classList.remove('show');
  $('mapStatus').textContent = 'DRAWING MODE · click the farm boundary points on the satellite map';
  map.setOptions({ draggableCursor: 'crosshair' });
  newBoundary = [];
  if (boundaryPolygon) boundaryPolygon.setMap(null);
  boundaryPolygon = null;
  if (drawListener) google.maps.event.removeListener(drawListener);
  drawListener = map.addListener('click', event => {
    if (!creatingFarm || placingObjectType) return;
    newBoundary.push({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    renderDraftBoundary();
  });
  toast('Click each boundary corner');
}

function renderDraftBoundary() {
  if (boundaryPolygon) boundaryPolygon.setMap(null);
  boundaryPolygon = new google.maps.Polygon({
    paths: newBoundary, strokeColor: '#00b8d9', strokeOpacity: .95,
    strokeWeight: 3, fillColor: '#00b8d9', fillOpacity: .12, map, clickable: false
  });
  $('mapStatus').textContent = `DRAWING MODE · ${newBoundary.length} boundary points`;
}

function finishBoundary() {
  if (newBoundary.length < 3) { toast('A farm boundary needs at least 3 points.'); return; }
  if (drawListener) google.maps.event.removeListener(drawListener);
  drawListener = null;
  creatingFarm = false;
  placingObjectType = null;
  map.setOptions({ draggableCursor: null });
  $('farmCreateModal').classList.add('show');
  $('boundaryStatus').textContent = `Boundary captured · ${newBoundary.length} points`;
  $('objectStatus').textContent = 'Choose an object type, then click its position on the map.';
  renderObjectEditor();
  toast('Boundary captured');
}

function clearBoundary() {
  newBoundary = [];
  draftObjects = [];
  placingObjectType = null;
  if (boundaryPolygon) boundaryPolygon.setMap(null);
  boundaryPolygon = null;
  if (drawListener) google.maps.event.removeListener(drawListener);
  drawListener = null;
  if (map) { map.setOptions({ draggableCursor: null }); refreshMapVisibility(); }
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

function saveFarm() {
  if (newBoundary.length < 3) { toast('Draw the farm boundary first.'); return; }
  const name = $('newFarmName').value.trim();
  if (!name) { toast('Enter a farm name.'); return; }
  const now = new Date().toISOString();
  const objects = draftObjects.map(object => ({ ...object, properties: { ...(object.properties || {}) } }));
  const cropNames = [...new Set(objects.filter(o => o.type === 'crop-field').map(o => o.properties?.['Crop type'] || o.name).filter(Boolean))];
  const droneCount = objects.filter(o => o.type === 'drone').length;
  const tractorCount = objects.filter(o => o.type === 'tractor').length;
  const livestockCount = objects.filter(o => o.type === 'livestock-area').reduce((sum, o) => sum + (Number(o.properties?.['Estimated head']) || 0), 0);
  const id = editingFarmId || `farm-user-${Date.now()}`;
  const territoryMatch = territories.find(t => (t.regions || []).includes($('newFarmRegion').value.trim()));
  const existing = farms.find(f => f.id === id);
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

  saveLocal();
  if (boundaryPolygon) boundaryPolygon.setMap(null);
  boundaryPolygon = null;
  addFarm(farm);
  selected = farm;
  newBoundary = [];
  draftObjects = [];
  creatingFarm = false;
  placingObjectType = null;
  editingFarmId = null;
  $('farmCreateModal').classList.remove('show');
  $('farmCard').classList.remove('show');
  resetCreateForm();
  selectFarm(farm, true);
  refreshMapVisibility();
  $('mapStatus').textContent = `Farm saved · ${farm.name} · ${farm.objects.length} mapped objects · local dataset updated`;
  toast(existing ? 'Farm record updated' : 'Farm record created');
}

function resetCreateForm() {
  ['newFarmName', 'newFarmOwner', 'newFarmRegion', 'newFarmHarvest', 'newFarmService', 'newFarmNotes'].forEach(id => { if ($(id)) $(id).value = ''; });
  if ($('newFarmStatus')) $('newFarmStatus').value = 'Prospect';
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
$('saveFarm').onclick = saveFarm;
$('importBtn').onclick = importData;
$('exportBtn').onclick = exportData;
$('datasetFile').onchange = handleImport;
document.querySelectorAll('.object-palette button').forEach(button => button.onclick = () => chooseObject(button.dataset.object));
$('farm3d').onclick = open3D;
$('close3d').onclick = close3D;
$('close3dBottom').onclick = close3D;
$('farm3dModal').onclick = event => { if (event.target.id === 'farm3dModal') close3D(); };
$('farmCreateModal').onclick = event => { if (event.target.id === 'farmCreateModal') closeCreateFarm(); };
const aiAction = $('aiAction');
if (aiAction) aiAction.onclick = () => { const farm = farms.filter(f => (f.drones || 0) === 0).sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0))[0]; if (farm) selectFarm(farm); };
document.querySelectorAll('.mission').forEach(mission => mission.onclick = () => toast(`Mission opened: ${mission.querySelector('strong').textContent}`));
document.querySelectorAll('.nav button').forEach(button => button.onclick = () => { document.querySelectorAll('.nav button').forEach(x => x.classList.remove('active')); button.classList.add('active'); toast(`${button.textContent.trim()} selected`); });
window.addEventListener('resize', () => { const host = $('farmScene'); if (renderer && host.clientWidth) { camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight); } });
loadFarms();
window.AG_WORLD_WORLD = {
  get countries(){ return countries; },
  get provinces(){ return territories; },
  get municipalities(){ return municipalities; },
  get towns(){ return towns; },
  get farms(){ return farms; },
  selectTerritory, selectFarm
};
