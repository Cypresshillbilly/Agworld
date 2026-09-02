const CONFIG = window.AG_WORLD_CONFIG || {};

let farms = [];
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

async function loadFarms() {
  try {
    const response = await fetch('data/farms.json');
    if (!response.ok) throw new Error('farm data');
    const base = (await response.json()).farms || [];
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem('agworld-farms-v2') || '[]'); } catch (_) {}
    const byId = new Map(base.map(f => [f.id, f]));
    stored.forEach(f => byId.set(f.id, f));
    farms = [...byId.values()];
    initMap();
  } catch (error) {
    $('mapStatus').textContent = 'Farm data could not be loaded.';
  }
}

function initMap() {
  if (!CONFIG.GOOGLE_MAPS_API_KEY) {
    $('mapStatus').textContent = 'Google satellite mapping is configured but inactive: add the API key in config.js.';
    return;
  }
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(CONFIG.GOOGLE_MAPS_API_KEY)}&libraries=drawing&callback=agWorldMapReady`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

window.agWorldMapReady = () => {
  map = new google.maps.Map($('map'), {
    center: { lat: -29, lng: 24 }, zoom: 5, mapTypeId: 'satellite',
    fullscreenControl: false, streetViewControl: false, mapTypeControl: false,
    gestureHandling: 'greedy', tilt: 0, rotateControl: false
  });
  map.addListener('zoom_changed', updateZoomStage);
  farms.forEach(addFarm);
  updateZoomStage();
  $('mapStatus').textContent = `Satellite map active · ${farms.length} farm records loaded`;
};

function addFarm(farm) {
  if (!map) return;
  const polygon = new google.maps.Polygon({
    paths: farm.boundary || [], strokeOpacity: .9, strokeWeight: 2,
    fillOpacity: .16, clickable: true, map
  });
  polygon.addListener('click', () => { if (!creatingFarm) selectFarm(farm, true); });

  const marker = new google.maps.Marker({
    position: farm.center, map, title: farm.name,
    label: { text: 'AG', color: '#fff', fontSize: '9px', fontWeight: '700' }
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
  const showBoundaries = zoom >= 8;
  const showObjects = zoom >= 12;
  farms.forEach(farm => {
    if (farm._polygon) farm._polygon.setMap(showBoundaries ? map : null);
    if (farm._marker) farm._marker.setMap(map);
  });
  objectMarkers.forEach(marker => marker.setMap(showObjects ? map : null));
}

function updateZoomStage() {
  if (!map) return;
  const zoom = map.getZoom();
  const stage = zoom < 7 ? 1 : zoom < 9 ? 2 : zoom < 12 ? 3 : 4;
  $('zoomStage').textContent = `ZOOM ${stage} · ${['NATIONAL OVERVIEW', 'REGIONAL FARMS', 'FARM BOUNDARY', 'INTERACTIVE FARM'][stage - 1]}`;
  refreshMapVisibility();
  if (stage >= 3 && selected) showFarmDetail(selected);
}

function selectFarm(farm, zoom = true) {
  if (creatingFarm) return;
  selected = farm;
  $('farmCard').classList.add('show');
  $('farmName').textContent = farm.name;
  $('farmMeta').textContent = `${farm.region} · ${farm.status} · ${farm.owner}`;
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
  if (map && zoom) { map.panTo(farm.center); map.setZoom(12); }
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
  const existing = farms.find(f => f.id === id);
  const farm = {
    ...(existing || {}), id,
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
  const blob = new Blob([JSON.stringify({ farms: farms.map(cleanFarm) }, null, 2)], { type: 'application/json' });
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
$('aiAction').onclick = () => { const farm = farms.filter(f => (f.drones || 0) === 0).sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0))[0]; if (farm) selectFarm(farm); };
document.querySelectorAll('.mission').forEach(mission => mission.onclick = () => toast(`Mission opened: ${mission.querySelector('strong').textContent}`));
document.querySelectorAll('.nav button').forEach(button => button.onclick = () => { document.querySelectorAll('.nav button').forEach(x => x.classList.remove('active')); button.classList.add('active'); toast(`${button.textContent.trim()} selected`); });
window.addEventListener('resize', () => { const host = $('farmScene'); if (renderer && host.clientWidth) { camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight); } });
loadFarms();
