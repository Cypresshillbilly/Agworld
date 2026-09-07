(function (global) {
  'use strict';

  const apiBase = '/api';

  function toGeoJSONGeometry(farm) {
    const boundary = Array.isArray(farm.boundary) ? farm.boundary : [];
    if (boundary.length >= 3) {
      const ring = boundary.map(p => [Number(p.lng), Number(p.lat)]);
      const first = ring[0], last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
      return { type: 'Polygon', coordinates: [ring] };
    }
    if (farm.center) return { type: 'Point', coordinates: [Number(farm.center.lng), Number(farm.center.lat)] };
    return null;
  }

  function fromLegacyFarm(farm) {
    return {
      id: farm.id,
      type: 'farm',
      name: farm.name,
      description: farm.notes || '',
      status: String(farm.status || 'Prospect').toLowerCase(),
      geometry: toGeoJSONGeometry(farm),
      territoryIds: farm.territoryIds || (farm.region ? [farm.region] : []),
      metadata: {
        owner: farm.owner || null,
        farmSize: farm.farmSize || farm.hectares || null,
        crops: Array.isArray(farm.crops) ? farm.crops : [],
        livestock: farm.livestock || null,
        annualHarvest: farm.annualHarvest || null,
        lastService: farm.lastService || null,
        opportunityScore: farm.opportunityScore || 0,
        source: farm.source || 'legacy'
      },
      createdAt: farm.createdAt || null,
      updatedAt: farm.updatedAt || null,
      legacy: farm
    };
  }

  function toLegacyFarm(entity) {
    const geometry = entity.geometry || null;
    let boundary = [], center = null;
    if (geometry && geometry.type === 'Polygon') {
      boundary = (geometry.coordinates[0] || []).slice(0, -1).map(c => ({ lat: Number(c[1]), lng: Number(c[0]) }));
    } else if (geometry && geometry.type === 'Point') {
      center = { lat: Number(geometry.coordinates[1]), lng: Number(geometry.coordinates[0]) };
    }

    if (!center && boundary.length) {
      center = boundary.reduce((acc, p) => ({ lat: acc.lat + p.lat / boundary.length, lng: acc.lng + p.lng / boundary.length }), { lat: 0, lng: 0 });
    }

    return {
      id: entity.id,
      name: entity.name,
      owner: entity.metadata?.owner || null,
      region: entity.territoryIds?.[0] || null,
      status: entity.status,
      notes: entity.description || null,
      center,
      boundary,
      crops: entity.metadata?.crops || [],
      livestock: entity.metadata?.livestock || null,
      annualHarvest: entity.metadata?.annualHarvest || null,
      lastService: entity.metadata?.lastService || null,
      opportunityScore: entity.metadata?.opportunityScore || 0,
      source: entity.metadata?.source || 'v2'
    };
  }

  class FarmRepositoryAdapter {
    constructor(options) {
      this.legacyBaseUrl = (options && options.legacyBaseUrl) || apiBase + '/farms';
    }

    async list() {
      const response = await fetch(this.legacyBaseUrl);
      if (!response.ok) throw new Error('Unable to load farms');
      const payload = await response.json();
      return (payload.farms || []).map(fromLegacyFarm);
    }

    async get(id) {
      const response = await fetch(this.legacyBaseUrl + '/' + encodeURIComponent(id));
      if (!response.ok) throw new Error('Unable to load farm');
      return fromLegacyFarm(await response.json());
    }

    async create(entity) {
      const response = await fetch(this.legacyBaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toLegacyFarm(entity))
      });
      if (!response.ok) throw new Error('Unable to create farm');
      const result = await response.json();
      return this.get(result.id || entity.id);
    }

    async update(id, entity) {
      const response = await fetch(this.legacyBaseUrl + '/' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toLegacyFarm(entity))
      });
      if (!response.ok) throw new Error('Unable to update farm');
      return this.get(id);
    }
  }

  class FarmEntityService {
    constructor(adapter) {
      this.adapter = adapter || new FarmRepositoryAdapter();
    }

    list(filters) {
      return this.adapter.list(filters);
    }

    get(id) {
      return this.adapter.get(id);
    }

    create(input) {
      const entity = global.AGWorldV2.EntitySchema.createEntity(Object.assign({}, input, { type: 'farm' }));
      return this.adapter.create(entity);
    }

    update(id, input) {
      return this.adapter.update(id, Object.assign({}, input, { type: 'farm', id }));
    }
  }

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.FarmAdapter = { fromLegacyFarm, toLegacyFarm, toGeoJSONGeometry };
  global.AGWorldV2.FarmRepositoryAdapter = FarmRepositoryAdapter;
  global.AGWorldV2.FarmEntityService = FarmEntityService;
})(window);
