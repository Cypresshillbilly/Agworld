(function (global) {
  'use strict';

  const DB_URL = 'https://vcnkspaljmsjvonftfcw.supabase.co';
  const DB_KEY = 'sb_publishable_azAO3PoKko79ccwSJFjkhQ_L67ZM85o';

  const state = global.__AGWORLD_RELATIONSHIP_CANONICAL_STATE__ || {
    overlays: [],
    selected: null,
    timer: null,
    request: 0
  };
  global.__AGWORLD_RELATIONSHIP_CANONICAL_STATE__ = state;

  function canonicalType(type) {
    const key = String(type || 'farm').trim().toLowerCase().replace(/[\s_-]+/g, '');
    if (key === 'companyfacility') return 'company_facility';
    if (key === 'contractor') return 'contractor';
    if (key === 'competitor') return 'competitor';
    return 'farm';
  }

  function key(type, id) {
    return canonicalType(type) + ':' + String(id);
  }

  function clear() {
    state.overlays.forEach(overlay => {
      try { overlay.setMap(null); } catch (_) {}
    });
    state.overlays = [];
  }

  function worldMap(selection) {
    // The Farm path worked because the Farm object always carries its live
    // marker. Dynamic entities can be re-hydrated after their marker is
    // created, so their selected object is not guaranteed to carry _marker.
    // Resolve the one canonical Google Map from any live game-layer marker.
    const direct = selection?.entity?._marker?.getMap?.();
    if (direct) return direct;

    const wantedType = canonicalType(selection?.type);
    const wantedId = String(selection?.id || '');
    const registry = global.__AGWORLD_RELATIONSHIP_POSITIONS__;
    const cached = registry?.get?.(key(wantedType, wantedId));
    const cachedMap = cached?.entity?._marker?.getMap?.();
    if (cachedMap) return cachedMap;

    const pools = [
      global.AG_WORLD_WORLD?.farms,
      global.__AG_WORLD_FARMS,
      typeof global.AG_WORLD_WORLD?.getContractors === 'function' ? global.AG_WORLD_WORLD.getContractors() : null,
      global.__AG_WORLD_CONTRACTORS,
      typeof global.AG_WORLD_WORLD?.getCompetitors === 'function' ? global.AG_WORLD_WORLD.getCompetitors() : null,
      global.__AG_WORLD_COMPETITORS,
      typeof global.AG_WORLD_WORLD?.getCompanyFacilities === 'function' ? global.AG_WORLD_WORLD.getCompanyFacilities() : null,
      global.__AG_WORLD_COMPANY_FACILITIES
    ];

    for (const pool of pools) {
      for (const entity of (Array.isArray(pool) ? pool : [])) {
        const candidate = entity?._marker?.getMap?.();
        if (candidate) return candidate;
      }
    }

    return global.__AGWORLD_GOOGLE_MAP__ || global.AG_WORLD_WORLD?.map || null;
  }

  function pointFromMarker(entity) {
    const point = entity?._marker?.getPosition?.();
    if (!point) return null;
    const lat = Number(point.lat());
    const lng = Number(point.lng());
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng, entity } : null;
  }

  function position(type, id, selection) {
    const wanted = String(id);
    const wantedType = canonicalType(type);
    if (
      selection &&
      String(selection.id) === wanted &&
      canonicalType(selection.type) === wantedType &&
      Number.isFinite(Number(selection.lat)) &&
      Number.isFinite(Number(selection.lng))
    ) {
      return { lat: Number(selection.lat), lng: Number(selection.lng), entity: selection.entity || null };
    }

    const registry = global.__AGWORLD_RELATIONSHIP_POSITIONS__;
    const cached = registry?.get?.(key(wantedType, wanted));
    if (cached && Number.isFinite(Number(cached.lat)) && Number.isFinite(Number(cached.lng))) {
      return { lat: Number(cached.lat), lng: Number(cached.lng), entity: cached.entity || null };
    }

    if (wantedType === 'farm') {
      const farms = global.AG_WORLD_WORLD?.farms || global.__AG_WORLD_FARMS || [];
      const farm = farms.find(item => String(item.id) === wanted);
      if (!farm) return null;
      const markerPoint = pointFromMarker(farm);
      if (markerPoint) return markerPoint;
      const center = farm.center;
      if (center && Number.isFinite(Number(center.lat)) && Number.isFinite(Number(center.lng))) {
        return { lat: Number(center.lat), lng: Number(center.lng), entity: farm };
      }
      return null;
    }

    const getter = wantedType === 'contractor'
      ? global.AG_WORLD_WORLD?.getContractors
      : wantedType === 'competitor'
        ? global.AG_WORLD_WORLD?.getCompetitors
        : global.AG_WORLD_WORLD?.getCompanyFacilities;

    const fallback = wantedType === 'contractor'
      ? global.__AG_WORLD_CONTRACTORS
      : wantedType === 'competitor'
        ? global.__AG_WORLD_COMPETITORS
        : global.__AG_WORLD_COMPANY_FACILITIES;
    const items = [
      ...(typeof getter === 'function' ? (getter() || []) : []),
      ...(Array.isArray(fallback) ? fallback : [])
    ];
    const entity = items.find(item => String(item?.id) === wanted);
    if (!entity) return null;

    const markerPoint = pointFromMarker(entity);
    if (markerPoint) return markerPoint;

    const lat = Number(entity.lat ?? entity.details?.lat ?? entity.location?.lat);
    const lng = Number(entity.lng ?? entity.details?.lng ?? entity.location?.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng, entity } : null;
  }

  function normalise(row) {
    return {
      id: row?.id,
      sourceId: row?.source_entity_id ?? row?.sourceEntityId,
      sourceType: row?.source_entity_type ?? row?.sourceEntityType ?? 'farm',
      targetId: row?.target_entity_id ?? row?.targetEntityId,
      targetType: row?.target_entity_type ?? row?.targetEntityType ?? 'farm',
      relationshipType: row?.relationship_type ?? row?.relationshipType ?? 'works_with',
      status: String(row?.status || 'active').toLowerCase()
    };
  }

  function style(type) {
    const colors = {
      works_with: '#39b7c9',
      supported_by: '#6f8f3d',
      supplies: '#d7e66b',
      serves: '#69a7d4',
      competes_with: '#e37a5f',
      owned_by: '#a486d8',
      manages: '#f0b44d',
      partnered_with: '#8fb339'
    };
    return colors[type] || '#39b7c9';
  }

  async function render(selection, attempt) {
    if (!selection?.id) return;
    const request = ++state.request;
    state.selected = selection;

    const map = worldMap(selection);
    if (!map) {
      if ((attempt || 0) < 8) {
        setTimeout(() => {
          if (request === state.request) render(selection, (attempt || 0) + 1).catch(console.warn);
        }, 180);
      }
      return;
    }

    const db = global.supabase?.createClient?.(DB_URL, DB_KEY);
    if (!db) return;

    const { data, error } = await db
      .from('entity_relationships')
      .select('*')
      .eq('status', 'active');

    if (request !== state.request) return;
    if (error) {
      console.warn('[AG World] Canonical relationship query failed', error);
      return;
    }

    const entityId = String(selection.id);
    const relationships = (data || []).map(normalise).filter(rel =>
      String(rel.sourceId) === entityId || String(rel.targetId) === entityId
    );

    const candidates = relationships.map(rel => ({
      rel,
      source: position(rel.sourceType, rel.sourceId, selection),
      target: position(rel.targetType, rel.targetId, selection)
    }));
    const resolved = candidates.filter(item => item.source && item.target);

    // Dynamic layers can still be hydrating when their selection event fires.
    // Do not clear a valid network with an empty transient result; retry from
    // the exact same canonical selection after the layer/markers are ready.
    if (relationships.length && !resolved.length) {
      global.__AGWORLD_RELATIONSHIP_DEBUG__ = {
        entityId,
        entityType: canonicalType(selection.type),
        relationshipCount: relationships.length,
        resolvedCount: 0,
        overlayCount: state.overlays.length,
        waitingForPositions: true,
        timestamp: Date.now(),
        canonical: true
      };
      if ((attempt || 0) < 12) {
        setTimeout(() => {
          if (request === state.request) render(selection, (attempt || 0) + 1).catch(console.warn);
        }, 220);
      }
      return;
    }

    // Clear only when this latest selection has a usable render result.
    clear();

    resolved.forEach(({ rel, source, target }) => {
      const color = style(rel.relationshipType);
      const path = [
        { lat: source.lat, lng: source.lng },
        { lat: target.lat, lng: target.lng }
      ];

      const glow = new google.maps.Polyline({
        path, geodesic: true, strokeColor: color, strokeOpacity: .48,
        strokeWeight: 12, zIndex: 980, map
      });
      const core = new google.maps.Polyline({
        path, geodesic: true, strokeColor: '#ffffff', strokeOpacity: .98,
        strokeWeight: 4, zIndex: 990,
        icons: [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 4, strokeColor: color, strokeWeight: 2,
            fillColor: color, fillOpacity: 1
          },
          offset: '62%'
        }],
        map
      });
      const accent = new google.maps.Polyline({
        path, geodesic: true, strokeColor: color, strokeOpacity: 1,
        strokeWeight: 2, zIndex: 995, map
      });

      state.overlays.push(glow, core, accent);
    });

    global.__AGWORLD_RELATIONSHIP_DEBUG__ = {
      entityId,
      entityType: canonicalType(selection.type),
      relationshipCount: relationships.length,
      resolvedCount: resolved.length,
      overlayCount: state.overlays.length,
      timestamp: Date.now(),
      canonical: true
    };

    global.dispatchEvent(new CustomEvent('agworld:relationship-network-rendered', {
      detail: global.__AGWORLD_RELATIONSHIP_DEBUG__
    }));
  }

  function schedule(selection) {
    state.selected = selection;
    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(() => {
      state.timer = null;
      render(state.selected, 0).catch(error => console.warn('[AG World] Canonical relationship render failed', error));
    }, 60);
  }

  // Replace the legacy renderer's global hooks. Existing Farm and dynamic
  // selection listeners now resolve through one canonical scheduler.
  global.renderRelationshipNetwork = render;
  global.scheduleRelationshipNetwork = schedule;
  global.clearRelationshipNetwork = clear;

  global.addEventListener('agworld:farm-selected', event => {
    const farm = event?.detail?.farm;
    if (farm) schedule({ id: farm.id, type: 'farm', entity: farm });
  });

  global.addEventListener('agworld:dynamic-entity-selected', event => {
    const entity = event?.detail?.entity;
    if (entity) {
      schedule({
        id: entity.id,
        type: entity.type === 'companyFacility' ? 'company_facility' : entity.type,
        lat: Number(entity.lat),
        lng: Number(entity.lng),
        entity
      });
    }
  });

  global.addEventListener('agworld:farm-selection-cleared', () => {
    ++state.request;
    clear();
  });

  // Re-run the same canonical selection after asynchronous dynamic-layer
  // hydration. Farms already have stable geometry; this closes the timing gap
  // that affected Contractors, Competitors and Company Facilities.
  global.addEventListener('agworld:dynamic-layers-loaded', () => {
    if (state.selected && canonicalType(state.selected.type) !== 'farm') {
      schedule(state.selected);
    }
  });

  global.__AGWORLD_RELATIONSHIP_NETWORK_CANONICAL_V2__ = true;
})(window);
