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

  // Temporary live runtime instrumentation. This records the exact Farm and
  // Contractor render paths without changing the renderer's behaviour.
  const runtimeTrace = global.__AGWORLD_RELATIONSHIP_RUNTIME_TRACE__ || {};
  global.__AGWORLD_RELATIONSHIP_RUNTIME_TRACE__ = runtimeTrace;

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

  function traceKey(selection) {
    return canonicalType(selection?.type) + ':' + String(selection?.id || '');
  }

  function plainPoint(point) {
    if (!point) return null;
    const lat = Number(point.lat);
    const lng = Number(point.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }

  function mapSnapshot(map, selection) {
    const markerMap = selection?.entity?._marker?.getMap?.() || null;
    const center = map?.getCenter?.();
    return {
      exists: !!map,
      isCanonicalMap: !!map && map === global.__AGWORLD_GOOGLE_MAP__,
      isSelectionMarkerMap: !!map && !!markerMap && map === markerMap,
      markerHasMap: !!markerMap,
      zoom: Number(map?.getZoom?.()) || null,
      center: center ? { lat: Number(center.lat()), lng: Number(center.lng()) } : null
    };
  }

  function clear() {
    state.overlays.forEach(overlay => {
      try { overlay.setMap(null); } catch (_) {}
    });
    state.overlays = [];
  }

  function worldMap(selection) {
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

  function renderRuntimeDiagnostic(comparison) {
    let box = document.getElementById('agworldRelationshipRuntimeDiagnostic');
    if (!box) {
      box = document.createElement('div');
      box.id = 'agworldRelationshipRuntimeDiagnostic';
      box.style.cssText = [
        'position:fixed','right:12px','bottom:12px','z-index:20000',
        'width:min(420px,calc(100vw - 24px))','padding:12px 14px',
        'background:rgba(7,18,22,.94)','border:1px solid rgba(157,204,56,.55)',
        'border-radius:10px','box-shadow:0 12px 34px rgba(0,0,0,.35)',
        'color:#edf3ed','font:11px/1.45 Arial,sans-serif'
      ].join(';');
      document.body.appendChild(box);
    }
    const farm = comparison.farm;
    const contractor = comparison.contractor;
    const diff = comparison.firstDifference
      ? comparison.firstDifference.field + ' | Farm: ' + comparison.firstDifference.farm + ' | Contractor: ' + comparison.firstDifference.contractor
      : 'No structural difference captured';
    box.innerHTML =
      '<b style="color:#9dcc38;letter-spacing:.7px">RELATIONSHIP RUNTIME COMPARISON</b>' +
      '<div style="margin-top:7px"><b>Farm</b> · rel ' + farm.relationshipCount + ' · resolved ' + farm.resolvedCount + ' · overlays ' + farm.overlayCount + ' · attached ' + farm.allOverlaysAttached + '</div>' +
      '<div><b>Contractor</b> · rel ' + contractor.relationshipCount + ' · resolved ' + contractor.resolvedCount + ' · overlays ' + contractor.overlayCount + ' · attached ' + contractor.allOverlaysAttached + '</div>' +
      '<div style="margin-top:7px;color:#f0c66a"><b>FIRST DIFFERENCE:</b> ' + diff + '</div>';
  }

  function publishTrace(trace) {
    runtimeTrace[trace.key] = trace;
    global.__AGWORLD_RELATIONSHIP_DEBUG__ = trace;
    global.dispatchEvent(new CustomEvent('agworld:relationship-runtime-trace', { detail: trace }));

    const farm = Object.values(runtimeTrace).filter(item => item.entityType === 'farm').sort((a, b) => b.timestamp - a.timestamp)[0];
    const contractor = Object.values(runtimeTrace).filter(item => item.entityType === 'contractor').sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!farm || !contractor) return;

    // Compare renderer health, not raw relationship totals. Farm and Contractor
    // can legitimately have different numbers of connections.
    const checks = [
      ['map.exists', farm.map.exists, contractor.map.exists],
      ['map.isCanonicalMap', farm.map.isCanonicalMap, contractor.map.isCanonicalMap],
      ['selectedCoordinatesPresent', !!farm.selectedCoordinates, !!contractor.selectedCoordinates],
      ['allCandidatesResolved', farm.candidates.every(x => x.sourceResolved && x.targetResolved), contractor.candidates.every(x => x.sourceResolved && x.targetResolved)],
      ['overlaysPerResolvedRelationship', farm.resolvedCount ? farm.overlayCount / farm.resolvedCount : 0, contractor.resolvedCount ? contractor.overlayCount / contractor.resolvedCount : 0],
      ['allOverlaysAttached', farm.allOverlaysAttached, contractor.allOverlaysAttached],
      ['selectionMarkerOnResolvedMap', farm.map.isSelectionMarkerMap, contractor.map.isSelectionMarkerMap]
    ];

    const firstDifference = checks.find(item => item[1] !== item[2]) || null;
    const comparison = {
      comparedAt: Date.now(),
      farm,
      contractor,
      firstDifference: firstDifference ? { field: firstDifference[0], farm: firstDifference[1], contractor: firstDifference[2] } : null
    };

    global.__AGWORLD_RELATIONSHIP_RUNTIME_COMPARISON__ = comparison;
    renderRuntimeDiagnostic(comparison);
    console.groupCollapsed('[AG World] Relationship runtime comparison');
    console.table({
      Farm: {
        selectedCoordinates: JSON.stringify(farm.selectedCoordinates),
        map: JSON.stringify(farm.map),
        relationshipCount: farm.relationshipCount,
        resolvedCount: farm.resolvedCount,
        overlayCount: farm.overlayCount,
        allOverlaysAttached: farm.allOverlaysAttached
      },
      Contractor: {
        selectedCoordinates: JSON.stringify(contractor.selectedCoordinates),
        map: JSON.stringify(contractor.map),
        relationshipCount: contractor.relationshipCount,
        resolvedCount: contractor.resolvedCount,
        overlayCount: contractor.overlayCount,
        allOverlaysAttached: contractor.allOverlaysAttached
      }
    });
    console.log('First relevant difference:', comparison.firstDifference);
    console.log('Full comparison:', comparison);
    console.groupEnd();
    global.dispatchEvent(new CustomEvent('agworld:relationship-runtime-comparison', { detail: comparison }));
  }

  async function render(selection, attempt) {
    if (!selection?.id) return;

    const request = ++state.request;
    state.selected = selection;
    const entityType = canonicalType(selection.type);
    const entityId = String(selection.id);
    const map = worldMap(selection);
    const selectedPosition = position(entityType, entityId, selection);
    const trace = {
      key: traceKey(selection),
      entityId,
      entityType,
      attempt: Number(attempt || 0),
      selectedCoordinates: plainPoint(selectedPosition),
      selectionInputCoordinates: {
        lat: Number.isFinite(Number(selection.lat)) ? Number(selection.lat) : null,
        lng: Number.isFinite(Number(selection.lng)) ? Number(selection.lng) : null
      },
      map: mapSnapshot(map, selection),
      relationshipCount: 0,
      resolvedCount: 0,
      overlayCount: state.overlays.length,
      allOverlaysAttached: false,
      candidates: [],
      timestamp: Date.now(),
      canonical: true
    };

    if (!map) {
      trace.reason = 'map-unavailable';
      publishTrace(trace);
      if ((attempt || 0) < 8) {
        setTimeout(() => {
          if (request === state.request) render(selection, (attempt || 0) + 1).catch(console.warn);
        }, 180);
      }
      return;
    }

    const db = global.supabase?.createClient?.(DB_URL, DB_KEY);
    if (!db) {
      trace.reason = 'supabase-unavailable';
      publishTrace(trace);
      return;
    }

    const { data, error } = await db
      .from('entity_relationships')
      .select('*')
      .eq('status', 'active');

    if (request !== state.request) return;

    if (error) {
      trace.reason = 'relationship-query-error';
      trace.error = error?.message || String(error);
      publishTrace(trace);
      console.warn('[AG World] Canonical relationship query failed', error);
      return;
    }

    const relationships = (data || []).map(normalise).filter(rel =>
      (String(rel.sourceId) === entityId && canonicalType(rel.sourceType) === entityType) ||
      (String(rel.targetId) === entityId && canonicalType(rel.targetType) === entityType)
    );

    const candidates = relationships.map(rel => ({
      rel,
      source: position(rel.sourceType, rel.sourceId, selection),
      target: position(rel.targetType, rel.targetId, selection)
    }));

    const resolved = candidates.filter(item => item.source && item.target);
    const unresolved = candidates.filter(item => !item.source || !item.target);

    trace.relationshipCount = relationships.length;
    trace.resolvedCount = resolved.length;
    trace.candidates = candidates.map(item => ({
      relationshipId: item.rel.id,
      sourceType: canonicalType(item.rel.sourceType),
      sourceId: String(item.rel.sourceId),
      sourceCoordinates: plainPoint(item.source),
      sourceResolved: !!item.source,
      targetType: canonicalType(item.rel.targetType),
      targetId: String(item.rel.targetId),
      targetCoordinates: plainPoint(item.target),
      targetResolved: !!item.target
    }));

    if (relationships.length && unresolved.length) {
      trace.reason = 'waiting-for-unresolved-endpoints';
      trace.unresolved = trace.candidates.filter(item => !item.sourceResolved || !item.targetResolved);
      trace.overlayCount = state.overlays.length;
      publishTrace(trace);

      if ((attempt || 0) < 20) {
        setTimeout(() => {
          if (request === state.request) render(selection, (attempt || 0) + 1).catch(console.warn);
        }, 180);
      }

      if (!resolved.length) return;
    }

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

    trace.reason = 'render-complete';
    trace.overlayCount = state.overlays.length;
    trace.allOverlaysAttached = state.overlays.length > 0 && state.overlays.every(overlay => {
      try { return overlay.getMap?.() === map; } catch (_) { return false; }
    });
    trace.timestamp = Date.now();

    publishTrace(trace);

    global.dispatchEvent(new CustomEvent('agworld:relationship-network-rendered', {
      detail: trace
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

  // The V2 detail panels are opened from this canonical selection event. Listen
  // to it directly as well so Contractors, Competitors and Company Facilities
  // enter the exact same relationship render scheduler as Farms.
  global.addEventListener('agworld:v2-entity-selected', event => {
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

  global.addEventListener('agworld:dynamic-layers-loaded', () => {
    if (state.selected && canonicalType(state.selected.type) !== 'farm') {
      schedule(state.selected);
    }
  });

  global.__AGWORLD_RELATIONSHIP_NETWORK_CANONICAL_V2__ = true;
})(window);
