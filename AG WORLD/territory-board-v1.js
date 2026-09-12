/* Canonical territory geometry, selection, visibility and market control. */
function farmAssetControl(farm) {
  const assets = [...(farm?.assets||[]),...(farm?.objects||[])];
  const types = assets.map(asset => String(
    asset?.type || asset?.assetType || asset?.name || asset?.label || ''
  ).toLowerCase());
  const hasOurDrone = types.some(type =>
    type === 'drone' || type === 'our drone' || type === 'our-drone' || type.includes('our drone') || type.includes('company drone')
  );
  const hasCompetitorDrone = types.some(type =>
    type === 'competitor-drone' || type === 'competitor drone' || type.includes('competitor')
  );
  if (hasOurDrone&&hasCompetitorDrone)return 'contested';
  if(hasOurDrone)return 'company';if(hasCompetitorDrone)return 'competitor';
  const status=String(farm?.status||farm?.details?.status||'').toLowerCase().trim();
  const owner=String(farm?.owner||farm?.details?.owner||'').toLowerCase().trim();
  if(status==='competitor'||owner==='competitor')return 'competitor';
  if(['customer','client','active customer','owned'].includes(status)||['the company','company'].includes(owner))return 'company';
  return 'neutral';
}

function contractorAssetControl(contractor) { return farmAssetControl(contractor); }

function territoryFarmSet(territory) {
  const level = territory.level || 'province';
  if (level === 'farm') return farms.filter(f => f.id === territory.id);
  if (level === 'town') return farms.filter(f => f.townId === territory.id);
  if (level === 'municipality') return farms.filter(f => f.municipalityId === territory.id);
  if (level === 'province') return farms.filter(f => f.territoryId === territory.id);
  if (level === 'region') return farms.filter(f=>countries.some(c=>SADC_COUNTRIES.has(c.countryCode)&&entityInCountry(f,c)));
  if (level === 'country') return farms.filter(f=>entityInCountry(f,territory));
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
        ? towns.find(t => territoryContains(t,p))?.id
        : null);
    let territoryId = contractor?.territoryId || details.territoryId;
    if (!territoryId && Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
      territoryId = territories.find(t => territoryContains(t,p))?.id || null;
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
  if (level === 'region') return index.country.filter(f=>countries.some(c=>SADC_COUNTRIES.has(c.countryCode)&&entityInCountry(f,c)));
  if (level === 'country') return index.country.filter(c=>entityInCountry(c,territory));
  if (level === 'town') return (index.town.get(String(territory.id)) || []).slice();
  if (level === 'municipality') return (index.municipality.get(String(territory.id)) || []).slice();
  if (level === 'province') return (index.province.get(String(territory.id)) || []).slice();
  return [];
}


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
  const company=direct==='company'||direct==='contested'||component.company;
  const competitor=direct==='competitor'||direct==='contested'||component.competitor;
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
    total: 1,
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
  const contestedControl=total?Math.round(contested/total*1000)/10:0, neutralControl=pct(Math.max(0,marketWeight-companyDroneWeight-competitorDroneWeight));

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

  if(!control&&!enemy)return {fillColor:'#607d8b',strokeColor:'#90a4ae',fillOpacity:.12};
  if(Math.abs(control-enemy)<.1)return {fillColor:'#ff9800',strokeColor:'#ffcc80',fillOpacity:.24};
  if(enemy>control)return {fillColor:'#df5252',strokeColor:'#ff8a80',fillOpacity:.16+.2*enemy/100};
  return {fillColor:control>=50?'#27b85c':'#80bb43',strokeColor:'#b8ec24',fillOpacity:.16+.2*control/100};
}

function applyTerritoryControlStyle(territory) {
  if (!territory || !territory._polygon) return;
  const base = territory._baseStyle || {};
  const controlStyle = window.agWorldGetLayerState?.().control===false?{strokeColor:base.strokeColor,fillColor:base.fillColor,fillOpacity:.025}:territoryControlStyle(territory);
  territory._polygon.setOptions({
    strokeColor: controlStyle.strokeColor,
    fillColor: controlStyle.fillColor,
    fillOpacity: controlStyle.fillOpacity,
    strokeOpacity: base.strokeOpacity ?? .92,
    strokeWeight: base.strokeWeight,
    zIndex: base.zIndex,
    ...(territory===selectedBoardTerritory?{strokeColor:'#eff9fc',strokeWeight:Math.max(4,(base.strokeWeight||2)+1),strokeOpacity:1}: {})
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
  if (level === 'country') return [...territories, ...municipalities, ...towns].filter(t=>t.countryCode===territory.countryCode);
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
    farmEntities: territoryFarmSet(territory),
    contractorEntities: territoryContractorSet(territory),
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
  if(selectedBoardTerritory){
    const live=selectedBoardTerritory.level==='region'?selectedBoardTerritory:[...countries,...territories,...municipalities,...towns].find(t=>t.id===selectedBoardTerritory.id);
    if(live){selectedBoardTerritory=live;window.__AGWORLD_SELECTED_TERRITORY__=live;window.__AG_WORLD_SELECTED_TERRITORY=live;applyTerritoryControlStyle(live);renderTerritoryInformationPanel(live,territoryGameSummary(live));}
  }
}

let boardRefreshQueued=false;
for(const event of ['agworld:farm-database-loaded','agworld:dynamic-layers-loaded','agworld:geographic-relationships-updated'])window.addEventListener(event,()=>{
  if(boardRefreshQueued)return;boardRefreshQueued=true;
  setTimeout(()=>{boardRefreshQueued=false;refreshTerritoryControl();},120);
});

function normaliseSpatialFeatures(geojson, level) {
  const features = geojson?.features || [];
  return features.map((feature, index) => {
    const p = feature.properties || {};
    const sourceName = p.shapeName || p.MAP_TITLE || p.PROVINCE || p.MUNICNAME || p.NameCode || p.S12_NAME || p.SGADMIN || p.SGTOWN || p.TOWN || p.SHRT_ENGL || p.NAME || p.name || `${level} ${index + 1}`;
    // Correct the upstream display typo while retaining the original properties.
    const name = level==='province'&&p.iso==='ZAF'&&sourceName==='Nothern Cape'?'Northern Cape':sourceName;
    const sourceId = p.code || p.shapeID || p.iso || p.ISO3_CODE || p.MUNICCODE || p.MUNICCD || p.CODE || p.AG_SGAD_ID || p.OBJECTID || index + 1;
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
      geometry: feature.geometry,
      countryCode:p.iso||p.shapeGroup||'ZAF',
      iso2:p.iso2,
      center:p.label?{lng:p.label[0],lat:p.label[1]}:center,
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

const territoryGeometryCache=new WeakMap();
function territoryContains(territory,point){
  if(!point||!Number.isFinite(point.lat)||!Number.isFinite(point.lng))return false;
  const g=territory.geometry;
  if(!g)return pointInPolygon(point,territory.boundary);
  let polygons=territoryGeometryCache.get(g);
  if(!polygons){polygons=(g.type==='Polygon'?[g.coordinates]:g.coordinates).map(rings=>{
    const paths=rings.map(r=>r.map(p=>({lng:p[0],lat:p[1]}))),outer=paths[0];
    return {paths,west:Math.min(...outer.map(p=>p.lng)),east:Math.max(...outer.map(p=>p.lng)),south:Math.min(...outer.map(p=>p.lat)),north:Math.max(...outer.map(p=>p.lat))};
  });territoryGeometryCache.set(g,polygons);}
  return polygons.some(p=>point.lng>=p.west&&point.lng<=p.east&&point.lat>=p.south&&point.lat<=p.north&&pointInPolygon(point,p.paths[0])&&!p.paths.slice(1).some(r=>pointInPolygon(point,r)));
}
function entityInCountry(entity,country){
  if(!country.id&&!country.boundary&&!country.geometry)return true; // aggregate callers with no geographic scope
  const point=entity.center||contractorPoint(entity);
  if(Number.isFinite(point.lat)&&Number.isFinite(point.lng))return territoryContains(country,point);
  return !!entity.countryCode&&entity.countryCode===country.countryCode;
}
function territoryPaths(territory){
  const g=territory.geometry;if(!g)return territory.boundary;
  return (g.type==='Polygon'?[g.coordinates]:g.coordinates).flatMap(poly=>poly.map(r=>r.map(p=>({lng:p[0],lat:p[1]}))));
}
function linkHierarchySpatialParents() {
  municipalities.forEach(m => {
    const province = territories.find(p => territoryContains(p,m.center));
    if (province) {m.parentId = province.id;m.countryCode=province.countryCode||'ZAF';}
  });
  towns.forEach(t => {
    const municipality = municipalities.find(m => pointInPolygon(t.center, m.boundary));
    if (municipality) {t.parentId = municipality.id;t.countryCode=municipality.countryCode||'ZAF';}
  });
  farms.forEach(f => {
    const center = f.center || (f.boundary?.length ? centroid(f.boundary) : null);
    if(!center)return;
    const province=territories.find(p=>territoryContains(p,center));
    if(province)f.territoryId=province.id;
    const municipality = municipalities.find(m => pointInPolygon(center, m.boundary));
    const town = towns.find(t => pointInPolygon(center, t.boundary));
    if (municipality) f.municipalityId = municipality.id;
    if (town) f.townId = town.id;
  });
}


// Layer data is fetched only when the player reaches the relevant world level.
// Each layer is cached for the session once loaded.
const AGWORLD_WORLD_LOD = { country: 1, provinces: 2, municipalities: 3, towns: 4, farms: 5 };
const spatialLayerState = {
  country: { status: 'idle', promise: null },
  provinces: { status: 'idle', promise: null },
  municipalities: { status: 'idle', promise: null },
  towns: { status: 'idle', promise: null }
};
const spatialSources = {
  country: 'data/gis/africa/index.json',
  provinces: 'https://law.drdlr.gov.za/server/rest/services/LAW_Spatial_Admin_Boundaries/MapServer/109/query?where=1%3D1&outFields=OBJECTID%2CPROVINCE&returnGeometry=true&outSR=4326&geometryPrecision=5&f=geojson',
  municipalities: 'https://law.drdlr.gov.za/server/rest/services/LAW_Spatial_Admin_Boundaries/MapServer/115/query?where=1%3D1&outFields=OBJECTID%2CMAP_TITLE&returnGeometry=true&outSR=4326&maxAllowableOffset=0.001&geometryPrecision=5&f=geojson',
  towns: 'https://law.drdlr.gov.za/server/rest/services/LAW_Spatial_Admin_Boundaries/MapServer/130/query?where=1%3D1&outFields=OBJECTID%2CSGTOWN%2CTOWN_EXT%2CSGTOWNCODE&returnGeometry=true&outSR=4326&f=geojson'
};

function progressiveStageForZoom(zoom) {
  return zoom < 5.5 ? 1 : zoom < 8 ? 2 : zoom < 11 ? 3 : zoom < 13 ? 4 : 5;
}

let africaManifest=null,activeBoardCountry='ZAF',boardRegion='SADC';
const SADC_COUNTRIES=new Set(['AGO','BWA','COM','COD','SWZ','LSO','MDG','MWI','MUS','MOZ','NAM','SYC','ZAF','TZA','ZMB','ZWE']);
const provinceLoads=new Map();
async function loadAfricanCountries(){
  const response=await fetch(spatialSources.country,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('Africa board index: '+response.status);
  const manifest=await response.json();
  if(!Array.isArray(manifest.countryFiles)||!Array.isArray(manifest.countries))throw Error('Africa board index is invalid');
  const layers=await Promise.all(manifest.countryFiles.map(file=>fetchSpatialLayer('data/gis/africa/'+file,'Country boundary',30000)));
  const records=normaliseSpatialFeatures({features:layers.flatMap(l=>l.features)},'country');
  const sa=records.find(c=>c.countryCode==='ZAF');
  if(!sa)throw Error('South Africa country boundary missing');
  countries.forEach(c=>{c._polygon?.setMap(null);c._marker?.setMap(null);});
  const old=countries[0];Object.assign(old,sa,{id:old.id,_polygon:null,_marker:null});
  countries.splice(0,countries.length,old,...records.filter(c=>c!==sa));
  africaManifest=manifest;
  if(map)countries.forEach(addTerritory);
  reportAgWorldBootPhase('world',76,'LOADING AFRICA TERRITORIES');
  return manifest;
}
function loadCountryProvinces(iso=activeBoardCountry){
  if(provinceLoads.has(iso)){if(iso===activeBoardCountry&&territories.some(t=>t.countryCode===iso&&t._polygon))spatialLayerState.provinces.status='loaded';return provinceLoads.get(iso);}
  const promise=loadSpatialLayerOnce('country').then(async()=>{
    const entry=africaManifest?.countries.find(c=>c.iso===iso);if(!entry)throw Error('Country unavailable: '+iso);
    const layers=await Promise.all(entry.provinceFiles.map(file=>fetchSpatialLayer('data/gis/africa/'+file,entry.name+' provinces',30000)));
    const records=normaliseSpatialFeatures({features:layers.flatMap(l=>l.features)},'province');
    const country=countries.find(c=>c.countryCode===iso);
    const key=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    records.forEach(record=>{
      record.parentId=country.id;record.source='geoBoundaries / '+entry.source;
      const target=iso==='ZAF'?territories.find(t=>key(t.regions?.[0])===key(record.name)):null;
      if(target){target._polygon?.setMap(null);target._marker?.setMap(null);const id=target.id;Object.assign(target,record,{id,_polygon:null,_marker:null});}
      else territories.push(record);
    });
    if(map)territories.filter(t=>t.countryCode===iso).forEach(addTerritory);
    if(iso===activeBoardCountry)spatialLayerState.provinces.status='loaded';
    refreshTerritoryControl();refreshMapVisibility();return records;
  }).catch(error=>{provinceLoads.delete(iso);if(iso===activeBoardCountry)spatialLayerState.provinces.status='error';console.error('AG World provincial boundary failed:',iso,error);return null;});
  provinceLoads.set(iso,promise);spatialLayerState.provinces.status='loading';return promise;
}
function loadSpatialLayerOnce(kind) {
  if(kind==='provinces')return loadCountryProvinces();
  const state=spatialLayerState[kind];if(!state)return Promise.resolve();
  if(state.status==='loaded')return Promise.resolve();if(state.status==='loading')return state.promise;
  state.status='loading';
  state.promise=(kind==='country'?loadAfricanCountries():fetchSpatialLayerWithRetry(spatialSources[kind],kind+' boundary',90000,3)).then(layer=>{
    if(kind==='municipalities'){
      municipalities.forEach(t=>{t._polygon?.setMap(null);t._marker?.setMap(null);});
      municipalities=normaliseSpatialFeatures(layer,'municipality');linkHierarchySpatialParents();
      if(map)municipalities.forEach(addTerritory);
    }
    if(kind==='towns'){towns=normaliseSpatialFeatures(layer,'town');linkHierarchySpatialParents();}
    state.status='loaded';refreshTerritoryControl();refreshMapVisibility();return layer;
  }).catch(error=>{state.status='error';state.promise=null;console.error('AG World progressive GIS layer failed:',kind,error);return null;});
  return state.promise;
}

function ensureSpatialLayersForZoom(zoom) {
  if (!farmDataBooted) return;
  const stage = progressiveStageForZoom(zoom);
  // Country outlines load first; first divisions are fetched only for the explored country.
  loadSpatialLayerOnce('country');
  if (stage >= AGWORLD_WORLD_LOD.provinces) loadSpatialLayerOnce('provinces');
  if (activeBoardCountry==='ZAF' && stage >= AGWORLD_WORLD_LOD.municipalities) loadSpatialLayerOnce('municipalities');
  if (activeBoardCountry==='ZAF' && stage >= AGWORLD_WORLD_LOD.towns) loadSpatialLayerOnce('towns');
}

async function loadSpatialLayersInBackground() {
  // Compatibility entry point retained for existing callers.
  // It now loads only the layer required by the current zoom, never the whole world.
  ensureSpatialLayersForZoom(map?.getZoom?.() ?? 5);
}

function renderGoogleMap() {
  if (map) return;
  if (!window.google?.maps?.Map) {
    const message = 'Google Maps JavaScript API finished loading but the Map constructor is unavailable. Check Maps JavaScript API activation and API-key restrictions.';
    console.error('AG World map:', message, window.google);
    $('mapStatus').textContent = message;
    rejectInitialMap(new Error(message));
    return;
  }

  try {
    // Exact V1 base-map path: create the satellite map before any farm or GIS work.
    map = new google.maps.Map($('map'), {
      center: { lat: -16.5, lng: 33.5 },
      zoom: 3.5,
      mapTypeId: 'satellite',
      fullscreenControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      gestureHandling: 'greedy',
      tilt: 0,
      rotateControl: false,
      isFractionalZoomEnabled:true
    });

    window.__AGWORLD_GOOGLE_MAP__=map;
    // Idle can fire before Google validates the key. Wait for rendered tiles.
    google.maps.event.addListenerOnce(map, 'tilesloaded', resolveInitialMap);
    if (spatialLayerState.country.status === 'loaded') countries.forEach(addTerritory);
    map.addListener('zoom_changed', updateZoomStage);
    map.addListener('idle', () => {
      const zoom = map.getZoom();
      ensureSpatialLayersForZoom(zoom);
      if (zoom >= 11 && zoom < 13 && spatialLayerState.towns.status === 'loaded') syncVisibleTownOverlays();
    });
    // No farm overlays at initial map creation.
    ensureSpatialLayersForZoom(map.getZoom());
    updateZoomStage();
    $('mapStatus').textContent = farms.length
      ? `Satellite map active · ${farms.length} farm records loaded`
      : 'Satellite map active · loading farm records and territory data…';
  } catch (error) {
    console.error('AG World Google Maps initialisation failed:', error);
    $('mapStatus').textContent = `Google Maps initialisation failed: ${error.message}`;
    rejectInitialMap(error);
  }
}

function initMap() {
  reportAgWorldBootPhase('map', 58, 'LOADING MAP ENGINE');
  if (!CONFIG.GOOGLE_MAPS_API_KEY) {
    $('mapStatus').textContent = 'Google satellite mapping is inactive: no API key is available to the dashboard.';
    rejectInitialMap(new Error('Google Maps is not configured.'));
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
    window.__AGWORLD_WORLD_BOOTED__ = false;
    mapAuthorisationError = new Error('Google Maps authorisation failed.');
    window.dispatchEvent(new CustomEvent('agworld:world-failed',{detail:{message:'Google Maps authorisation failed.'}}));
    rejectInitialMap(new Error('Google Maps authorisation failed.'));
  };

  // Deliberately use the same simple loader pattern as the earlier V1 build.
  const script = document.createElement('script');
  script.id = 'agworld-google-maps-script';
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(CONFIG.GOOGLE_MAPS_API_KEY)}&callback=agWorldMapReady`;
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    $('mapStatus').textContent = 'Google Maps script could not be downloaded.';
    rejectInitialMap(new Error('Google Maps could not be downloaded.'));
  };
  document.head.appendChild(script);
}

function territoryLabelIcon(name){
  const width=Math.min(200,Math.max(54,String(name||'').length*7));
  // A transparent, nonzero footprint gives text labels a mouse and keyboard target.
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="24"><rect width="100%" height="100%" fill="transparent"/></svg>';
  return {url:'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg),scaledSize:new google.maps.Size(width,24),anchor:new google.maps.Point(width/2,12),labelOrigin:new google.maps.Point(width/2,12)};
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
    paths: territoryPaths(territory),
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
  polygon.addListener('click', () => { if (!creatingFarm) window.selectTerritory(territory, level==='country'||level==='province'); });

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
      icon: territoryLabelIcon(municipalityDisplayName(territory.name)),
      label: {
        text: municipalityDisplayName(territory.name),
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: '700'
      }
    });
    marker.addListener('click', () => { if (!creatingFarm) selectTerritory(territory, false); });
    territoryMarkers.push(marker);
  } else if (level === 'province') {
    marker = new google.maps.Marker({
      position: territory.center || (level === 'province' ? territoryVisualCenter(territory.boundary) : centroid(territory.boundary)),
      map,
      title: territory.name,
      clickable: !creatingFarm,
      icon:provinceSymbolIcon(territory,map.getZoom()),
      label: { text: String(territory.regions?.[0]||territory.name).toUpperCase(), color: '#eff9fc', fontSize: '12px', fontWeight: '700' }
    });
    marker.addListener('click', () => selectTerritory(territory, level==='province'));
    territoryMarkers.push(marker);
  }
  if(level==='country'&&territory.iso2){
    marker=new google.maps.Marker({position:territory.center,map,title:territory.name,clickable:true,zIndex:15,
      icon:countryFlagIcon(territory,map.getZoom())});
    marker.addListener('click',()=>{if(!creatingFarm)window.selectTerritory(territory,true);});
    territoryMarkers.push(marker);
  }
  territory._polygon = polygon;
  territory._marker = marker;
  applyTerritoryControlStyle(territory);
}

function syncVisibleTownOverlays() {
  if (!map) return;
  const zoom = map.getZoom();
  if (activeBoardCountry!=='ZAF'||window.agWorldGetLayerState?.().towns===false||progressiveStageForZoom(zoom) !== AGWORLD_WORLD_LOD.towns) {
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

function renderTerritoryInformationPanel(territory,summary){
 const panel=$('territoryInfoPanel');if(!panel)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const national=territory.level==='country',scope=territory.level==='region'?'REGIONAL':national?'NATIONAL':String(territory.level||'territory').toUpperCase();
 const name=territory.level==='municipality'?municipalityDisplayName(territory.name):territory.name;
 const control=Number(summary.control||0),enemy=Number(summary.enemyControl||0),neutral=Number(summary.neutralControl||0);
 const status=territoryStrategicStatus(summary);
 const metrics=[[summary.farms.total,'Total Farms'],[summary.contractors.total,'Contractors'],[summary.company,'Company Entities'],[summary.competitor,'Competitor Entities'],[summary.contested,'Contested'],[summary.neutral,'Open Market']];
 panel.dataset.territoryId=territory.id;panel.dataset.territoryLevel=territory.level;
 panel.dataset.companyControl=control;panel.dataset.enemyControl=enemy;
 panel.innerHTML='<nav class="ag-territory-breadcrumb" aria-label="Territory navigation"><button type="button" data-territory-up="sadc">SADC · 16 countries</button>'+ (territory.level!=='region'?'<button type="button" data-territory-up="country">'+esc(countries.find(c=>c.countryCode===(territory.countryCode||activeBoardCountry))?.name||'Country')+'</button>':'')+'</nav><div class="territory-national-layout">'+
  '<section class="territory-national-left"><div class="territory-info-header"><div><div class="territory-info-level">'+scope+' TERRITORY</div><div class="territory-info-name">'+esc(name)+'</div></div></div>'+
  '<div class="territory-info-control"><div class="territory-info-control-value">'+control+'%</div><div><div class="territory-info-control-title">THE COMPANY CONTROL</div><div class="territory-info-status">'+esc(status.title)+'</div></div></div>'+
  '<div class="territory-info-progress" aria-label="'+control+'% Company, '+enemy+'% Competitor, '+neutral+'% Open market"><div class="territory-info-progress-company" style="width:'+control+'%"></div><div class="territory-info-progress-enemy" style="width:'+enemy+'%"></div><div class="territory-info-progress-neutral" style="width:'+neutral+'%"></div></div>'+
  '<div class="territory-info-legend"><span>🟢 Company '+control+'%</span><span>🔴 Competitor '+enemy+'%</span><span>⚪ Open market '+neutral+'%</span></div></section>'+
  '<section class="territory-national-right"><div class="territory-info-grid">'+metrics.map(([value,label])=>'<div><strong>'+value+'</strong><span>'+label+'</span></div>').join('')+
  '<div class="territory-national-scope"><strong>'+scope+'</strong><span>Selected Scope</span></div></div><div class="ag-territory-basis">'+summary.total+' farms + contractors · drone quantities and recorded relationships/status</div></section></div>';
 panel.querySelector('[data-territory-up=sadc]').onclick=fitSADC;const up=panel.querySelector('[data-territory-up=country]');if(up)up.onclick=()=>selectTerritory(countries.find(c=>c.countryCode===(territory.countryCode||activeBoardCountry)),true);
 panel.classList.add('show');
}

let selectedBoardTerritory=null;
let nationalBoardInitialised=false;
let countryFlagOverviewZoom=3.6;
function countryFlagIcon(territory,zoom){
  const width=Math.round(Math.max(28,Math.min(80,64*Math.pow(.65,Number(zoom)-countryFlagOverviewZoom))));
  const height=width;
  return {url:'data/gis/africa/symbols/'+territory.iso2+'.svg',scaledSize:new google.maps.Size(width,height),anchor:new google.maps.Point(width/2,height/2)};
}
function provinceSymbolIcon(territory,zoom){
 const key=String(territory.regions?.[0]||territory.name).toLowerCase().replace(/[^a-z]/g,'');
 const local=territory.countryCode==='ZAF';
 const width=Math.round(Math.max(36,Math.min(68,62*Math.pow(.85,Number(zoom)-6))));
 const iso=countries.find(c=>c.countryCode===territory.countryCode)?.iso2||'za';
 return {url:local?'data/gis/africa/symbols/provinces/'+key+'.svg':'data/gis/africa/symbols/'+iso+'.svg',scaledSize:new google.maps.Size(width,width),anchor:new google.maps.Point(width/2,width/2),labelOrigin:new google.maps.Point(width/2,width+7)};
}
function selectSADC(){selectTerritory({id:'region-sadc',name:'SADC',level:'region',countryCount:16},false);}
function selectTerritory(territory, zoom=false) {
  if(!territory)return;
  const previous=selectedBoardTerritory;
  selectedBoardTerritory=territory;
  window.__AG_WORLD_SELECTED_TERRITORY=territory;
  const summary=territoryGameSummary(territory);
  territory.game=summary;
  window.__AGWORLD_SELECTED_TERRITORY__=territory;
  window.__AGWORLD_TERRITORY_SCOPE__=territory.level==='country'?'NATIONAL':String(territory.level||'territory').toUpperCase();
  window.__AGWORLD_TERRITORY_STARTUP__='AFRICA';
  if(previous&&previous!==territory)applyTerritoryControlStyle(previous);
  applyTerritoryControlStyle(territory);
  renderTerritoryInformationPanel(territory,summary);
  window.dispatchEvent(new CustomEvent('agworld:territory-selected',{detail:{territory,summary}}));
  // Country and province clicks select statistics and reveal the next division.
  if(territory.level==='country'){activeBoardCountry=territory.countryCode||'ZAF';if(map&&zoom){fitTerritories([territory],5.5,7.7);loadCountryProvinces(activeBoardCountry);}else refreshMapVisibility();}
  else if(map&&zoom){if(territory.level==='province'){fitTerritories([territory],8,10.8);if(activeBoardCountry==='ZAF')loadSpatialLayerOnce('municipalities');}else{map.panTo(territory.center||centroid(territory.boundary));map.setZoom({municipality:10,town:12}[territory.level]||7);}}
  const status=$('mapStatus');if(status)status.textContent=territory.name+' · '+window.__AGWORLD_TERRITORY_SCOPE__+' · '+summary.control+'% Company influence';
}
function fitTerritories(records,minZoom=1,maxZoom=5.49){
  if(!map||!records.length)return;
  // Mainland rings keep remote islands from pulling a country's focus offshore.
  const points=records.flatMap(c=>c.boundary||[]),host=map.getDiv(),padding=56;
  let south=90,north=-90,west=180,east=-180;
  points.forEach(p=>{south=Math.min(south,p.lat);north=Math.max(north,p.lat);west=Math.min(west,p.lng);east=Math.max(east,p.lng);});
  const mercator=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
  const yNorth=mercator(north),ySouth=mercator(south);
  const latitude=(2*Math.atan(Math.exp((yNorth+ySouth)/2))-Math.PI/2)*180/Math.PI;
  const xFraction=Math.max(.00001,(east-west)/360),yFraction=Math.max(.00001,(yNorth-ySouth)/(2*Math.PI));
  const width=Math.max(128,host.clientWidth-padding*2),height=Math.max(128,host.clientHeight-padding*2);
  const zoom=Math.min(maxZoom,Math.log2(width/(256*xFraction)),Math.log2(height/(256*yFraction)));
  const fittedZoom=Math.max(minZoom,zoom);
  map.setCenter({lat:latitude,lng:(west+east)/2});map.setZoom(fittedZoom);updateZoomStage();return fittedZoom;
}
function fitSouthAfrica(){fitTerritories([countries[0]]);}
function fitAfrica(){boardRegion='AFRICA';fitTerritories(countries,1,4.5);}
function fitSADC(){boardRegion='SADC';selectSADC();const zoom=fitTerritories(countries.filter(c=>SADC_COUNTRIES.has(c.countryCode)),1,4.8);if(Number.isFinite(zoom))countryFlagOverviewZoom=zoom;refreshMapVisibility();}
function initialiseNationalBoard(){
  if(nationalBoardInitialised||!map||!africaManifest)return;
  nationalBoardInitialised=true;fitSADC();
  if(!$('africaBtn')){const b=document.createElement('button');b.id='africaBtn';b.textContent='AFRICA';b.onclick=fitAfrica;document.querySelector('.map-tools')?.prepend(b);}
  if(!$('sadcBtn')){const b=document.createElement('button');b.id='sadcBtn';b.textContent='SADC';b.onclick=fitSADC;document.querySelector('.map-tools')?.prepend(b);}
  if(!$('agBoundaryCredits')){const a=document.createElement('a');a.id='agBoundaryCredits';a.href='data/gis/africa/attribution.html';a.target='_blank';a.rel='noopener';a.textContent='Boundaries: Natural Earth · geoBoundaries';document.querySelector('.map-header .map-tools')?.append(a);}
}
window.AGWorldTerritoryBoard={getSelection:()=>selectedBoardTerritory,getCountry:()=>activeBoardCountry,fitSouthAfrica,fitAfrica,fitSADC,stageForZoom:progressiveStageForZoom};
window.addEventListener('agworld:player-visible',()=>{
  // Frame the region after the authenticated screen has its final dimensions.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(nationalBoardInitialised){window.AGWorldDrawers?.layout();fitSADC();}}));
},{once:true});

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
  const zoom=map.getZoom(),stage=progressiveStageForZoom(zoom),filters=window.agWorldGetLayerState?.()||{};
  for(const [records,level] of [[countries,1],[territories,2],[municipalities,3]]){
    records.forEach(t=>{
      const visible=(level===1?stage===1&&(boardRegion==='AFRICA'||SADC_COUNTRIES.has(t.countryCode)):level===2?(stage===2||(activeBoardCountry!=='ZAF'&&stage>2))&&t.countryCode===activeBoardCountry:stage===3&&activeBoardCountry==='ZAF');
      t._polygon?.setMap(visible&&filters[level===1?'countries':level===2?'provinces':'municipalities']!==false?map:null);
      // Boundaries and symbols can be switched independently at the same scale.
      t._marker?.setMap(visible&&filters[level===1?'country-icons':level===2?'province-icons':'municipalities']!==false?map:null);
      if(visible&&level===1&&t._marker&&t.iso2)t._marker.setIcon(countryFlagIcon(t,zoom));
      if(visible&&level===2&&t._marker)t._marker.setIcon(provinceSymbolIcon(t,zoom));
      if(visible)applyTerritoryControlStyle(t);
    });
  }
  updateMunicipalityLabels(zoom);syncVisibleTownOverlays();
  const detail=stage>=AGWORLD_WORLD_LOD.farms;
  farms.forEach(f=>{f._polygon?.setMap(detail&&filters.territory!==false?map:null);f._marker?.setMap(detail&&filters.farms!==false?map:null);});
  const objectLayers={drone:'company-drones','competitor-drone':'competitor-drones',tractor:'machinery','crop-field':'crops','livestock-area':'livestock',dam:'water',irrigation:'water',building:'infrastructure'};
  objectMarkers.forEach(m=>m.setMap(detail&&filters[objectLayers[m.__farmObject?.type]]!==false?map:null));
  // Hydration and zoom share this rule; late data must not expose low-level icons.
  for(const [key,list] of [['contractors',window.AG_WORLD_WORLD?.getContractors?.()||[]],['competitors',window.AG_WORLD_WORLD?.getCompetitors?.()||[]],['facilities',window.AG_WORLD_WORLD?.getCompanyFacilities?.()||[]]])list.forEach(e=>e._marker?.setMap(detail&&filters[key]!==false?map:null));
}

function updateZoomStage() {
  if (!map) return;
  const zoom = map.getZoom();
  const stage = progressiveStageForZoom(zoom);
  const labels = ['COUNTRIES · '+(boardRegion==='SADC'?'SADC':'SUB-SAHARAN AFRICA'),'PROVINCIAL TERRITORIES','MUNICIPAL TERRITORIES','TOWN TERRITORIES','FARM & ASSET LEVEL'];
  $('zoomStage').textContent = `ZOOM ${stage} · ${labels[stage - 1]}`;
  ensureSpatialLayersForZoom(zoom);
  if (stage >= AGWORLD_WORLD_LOD.farms) {
    farms.forEach(farm => { if (!farm._marker && !farm._polygon) addFarm(farm); });
  }
  refreshMapVisibility();
  if (stage >= 3 && selected) showFarmDetail(selected);
}


function national() {
  if(!map||!countries[0])return;
  selectTerritory(countries[0],false);fitSouthAfrica();
}

function addFarm(farm) {
  if (!map || !farm?.center) return;

  // Replace stale overlays instead of stacking duplicate farm objects.
  if (farm._polygon) farm._polygon.setMap(null);
  if (farm._marker) farm._marker.setMap(null);
  objectMarkers=objectMarkers.filter(marker=>{if(String(marker.__farmId)!==String(farm.id))return true;marker.setMap(null);return false;});
  const detail=progressiveStageForZoom(map.getZoom())>=AGWORLD_WORLD_LOD.farms;

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
    map:detail?map:null
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
    map:detail?map:null,
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
    position, map:progressiveStageForZoom(map.getZoom())>=AGWORLD_WORLD_LOD.farms?map:null, title: `${type.label}${object.name ? ` · ${object.name}` : ''}`,
    label: { text: type.icon, color: '#fff', fontSize: '13px' }
  });
  marker.addListener('click', () => showObject(object, farm));
  marker.__farmObject = object;
  marker.__farmId = farm.id;
  objectMarkers.push(marker);
  object._marker = marker;
}


function renderDynamicEntity(entity) {
  if (map) window.__AGWORLD_GOOGLE_MAP__ = map;
  if (!map || !entity?.name || !Number.isFinite(entity.lat) || !Number.isFinite(entity.lng)) return;
  const cfg = DYNAMIC_LAYER_CONFIG[entity.type];
  if (entity._marker) entity._marker.setMap(null);
  entity._marker = new google.maps.Marker({
    position: { lat: entity.lat, lng: entity.lng },
    map:progressiveStageForZoom(map.getZoom())>=AGWORLD_WORLD_LOD.farms?map:null,
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

