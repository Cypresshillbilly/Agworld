(function (global) {
  'use strict';

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  class FarmDetailPanelV2 extends global.AGWorldV2.EntityDetailPanelV2 {
    constructor(options) {
      super(options);
    }

    // The existing Farm Card is now the primary V2 entity panel.
    // The legacy card owns the summary; this V2 section adds the shared
    // entity-engine capabilities without opening a second competing card.
    tabs() {
      return [
        ['details', 'Entity Details'],
        ['intelligence', 'Intelligence'],
        ['lifecycle', 'Lifecycle'],
        ['spatial', 'Map & Location'],
        ['relationships', 'Relationships'],
        ['activity', 'Activity'],
        ['documents', 'Documents'],
        ['media', 'Media'],
        ['notes', 'Notes']
      ];
    }

    open(entity) {
      this.entity = entity;
      this.activeTab = 'relationships';
      this.render();
    }

    render() {
      super.render();
      const header = this.container?.querySelector('.agworld-v2-detail-header');
      if (header) {
        const close = header.querySelector('[data-action="close"]');
        if (close) close.remove();
        const type = header.querySelector('.agworld-v2-entity-type');
        if (type) type.textContent = 'AG WORLD V2 ENTITY ENGINE';
        const title = header.querySelector('h2');
        if (title) title.textContent = 'CONNECTED ENTITY DATA';
        const status = header.querySelector('.agworld-v2-status');
        if (status) status.textContent = 'LIVE';
      }
    }

    renderContent() {
      if (this.activeTab !== 'details') return super.renderContent();

      const target = this.container.querySelector('.agworld-v2-detail-content');
      const farm = this.entity;
      const data = farm.metadata || {};
      const rows = [
        ['Owner', data.owner],
        ['Farm size', data.farmSize],
        ['Crops', Array.isArray(data.crops) ? data.crops.join(', ') : data.crops],
        ['Livestock', data.livestock],
        ['Annual harvest', data.annualHarvest],
        ['Last service', data.lastService],
        ['Opportunity score', data.opportunityScore]
      ].filter(([, value]) => value !== null && value !== undefined && value !== '');

      target.innerHTML = rows.length
        ? '<dl>' + rows.map(([label,value]) => '<dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd>').join('') + '</dl>'
        : '<p>No farm details have been added yet.</p>';
    }
  }

  function installEmbeddedStyles() {
    if (document.getElementById('agworldV2FarmDetailStyles')) return;
    const style = document.createElement('style');
    style.id = 'agworldV2FarmDetailStyles';
    style.textContent = `
      #agworldV2FarmDetailHost{display:block!important;visibility:visible!important;opacity:1!important;margin-top:10px;padding-top:10px;border-top:1px solid #dce5e8}
      #agworldV2FarmDetailHost .agworld-v2-detail-panel{font-family:inherit;color:#25343d}
      #agworldV2FarmDetailHost .agworld-v2-detail-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
      #agworldV2FarmDetailHost .agworld-v2-entity-type{font-size:8px;letter-spacing:1px;color:#168aa0;font-weight:800}
      #agworldV2FarmDetailHost h2{font-size:11px;margin:2px 0}
      #agworldV2FarmDetailHost .agworld-v2-status{font-size:8px;color:#5f727b}
      #agworldV2FarmDetailHost .agworld-v2-detail-tabs{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}
      #agworldV2FarmDetailHost .agworld-v2-detail-tabs button{width:auto;margin:0;padding:5px 7px;background:#eef4f5;color:#53666e;border:1px solid #d6e1e4;border-radius:4px;font-size:8px}
      #agworldV2FarmDetailHost .agworld-v2-detail-tabs button.is-active{background:#168aa0;color:#fff;border-color:#168aa0}
      #agworldV2FarmDetailHost .agworld-v2-detail-content{background:#f7fafb;border:1px solid #e0e8ea;border-radius:5px;padding:8px;font-size:9px;line-height:1.4}
      #agworldV2FarmDetailHost .agworld-v2-detail-content p{margin:0;color:#667780}
      #agworldV2FarmDetailHost .agworld-v2-detail-content ul{margin:0;padding-left:16px}
      #agworldV2FarmDetailHost .agworld-v2-detail-content li{margin:3px 0}
      #agworldV2FarmDetailHost .agworld-v2-detail-content dl{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:0}
      #agworldV2FarmDetailHost .agworld-v2-detail-content dt{font-weight:700;color:#63747c}
      #agworldV2FarmDetailHost .agworld-v2-detail-content dd{margin:0;text-align:right;color:#26343d}
      #agworldV2FarmDetailHost .agworld-intelligence-toolbar{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px}
      #agworldV2FarmDetailHost .agworld-intelligence-toolbar strong{font-size:9px;letter-spacing:.5px;color:#36515a}
      #agworldV2FarmDetailHost .agworld-intelligence-toolbar button,#agworldV2FarmDetailHost .agworld-intelligence-metrics>button,#agworldV2FarmDetailHost .agworld-intelligence-form button,#agworldV2FarmDetailHost .agworld-intelligence-add button{width:auto;margin:0;padding:5px 8px;background:#168aa0;color:#fff;border:1px solid #168aa0;border-radius:4px;font-size:8px;font-weight:700}
      #agworldV2FarmDetailHost .agworld-metric-row{margin:7px 0}
      #agworldV2FarmDetailHost .agworld-metric-head{display:flex;justify-content:space-between;font-size:8px;color:#53666e;margin-bottom:3px}
      #agworldV2FarmDetailHost .agworld-metric-bar{height:6px;background:#e5edef;border-radius:4px;overflow:hidden}
      #agworldV2FarmDetailHost .agworld-metric-bar i{display:block;height:100%;background:#168aa0;border-radius:4px}
      #agworldV2FarmDetailHost .agworld-intelligence-list{display:grid;gap:6px}
      #agworldV2FarmDetailHost .agworld-intelligence-item{padding:7px;border:1px solid #dce7e9;border-radius:5px;background:#fff;font-size:8px}
      #agworldV2FarmDetailHost .agworld-intelligence-item small{display:block;margin-top:3px;color:#819198}
      #agworldV2FarmDetailHost .agworld-intelligence-item button{float:right;width:auto;margin:3px 0 0;padding:3px 6px;background:#fff;color:#8a5a5a;border:1px solid #e6caca;border-radius:4px;font-size:8px}
      #agworldV2FarmDetailHost .agworld-intelligence-form,#agworldV2FarmDetailHost .agworld-intelligence-add{display:grid;gap:7px}
      #agworldV2FarmDetailHost .agworld-intelligence-form label{display:grid;grid-template-columns:1fr 58px;align-items:center;gap:8px;font-size:8px;font-weight:700;color:#53666e}
      #agworldV2FarmDetailHost .agworld-intelligence-form input,#agworldV2FarmDetailHost .agworld-intelligence-add textarea{width:100%;box-sizing:border-box;padding:5px;border:1px solid #d6e1e4;border-radius:4px;background:#fff;color:#26343d;font:inherit;font-size:8px}
      #agworldV2FarmDetailHost .agworld-intelligence-add textarea{resize:vertical}
      #agworldV2FarmDetailHost .agworld-relationship-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
      #agworldV2FarmDetailHost .agworld-relationship-toolbar strong{font-size:9px;color:#36515a;letter-spacing:.4px}
      #agworldV2FarmDetailHost .agworld-relationship-toolbar button,#agworldV2FarmDetailHost .agworld-relationship-form-actions button{width:auto;margin:0;padding:5px 8px;background:#168aa0;color:#fff;border:1px solid #168aa0;border-radius:4px;font-size:8px;font-weight:700}
      #agworldV2FarmDetailHost .agworld-relationship-list{display:grid;gap:6px}
      #agworldV2FarmDetailHost .agworld-relationship-card{padding:7px;border:1px solid #dce7e9;border-radius:5px;background:#fff}
      #agworldV2FarmDetailHost .agworld-relationship-open{display:block;width:100%;padding:0!important;margin:0 0 3px!important;border:0!important;background:transparent!important;color:#168aa0!important;text-align:left;font-size:9px!important;font-weight:800}
      #agworldV2FarmDetailHost .agworld-relationship-meta{font-size:8px;color:#667780}
      #agworldV2FarmDetailHost .agworld-relationship-purpose{margin-top:4px;font-size:8px;color:#43555c}
      #agworldV2FarmDetailHost .agworld-relationship-actions{display:flex;gap:5px;margin-top:6px}
      #agworldV2FarmDetailHost .agworld-relationship-actions button{width:auto;margin:0;padding:3px 6px;background:#eef4f5;color:#53666e;border:1px solid #d6e1e4;border-radius:4px;font-size:8px}
      #agworldV2FarmDetailHost .agworld-relationship-form{display:grid;gap:7px}
      #agworldV2FarmDetailHost .agworld-relationship-form label{display:grid;gap:3px;font-size:8px;font-weight:700;color:#53666e}
      #agworldV2FarmDetailHost .agworld-relationship-form select,#agworldV2FarmDetailHost .agworld-relationship-form textarea{width:100%;box-sizing:border-box;padding:5px;border:1px solid #d6e1e4;border-radius:4px;background:#fff;color:#26343d;font:inherit;font-size:8px}
      #agworldV2FarmDetailHost .agworld-relationship-form textarea{resize:vertical}
      #agworldV2FarmDetailHost .agworld-relationship-form-actions{display:flex;justify-content:flex-end}
    `;
    document.head.appendChild(style);
  }

  function installLiveBridge() {
    const existingBridge = global.AGWorldV2?.LiveFarmDetailBridge;
    if (existingBridge) return true;

    const card = document.getElementById('farmCard');
    if (!card) return false;

    installEmbeddedStyles();

    let host = document.getElementById('agworldV2FarmDetailHost');
    if (!host) {
      host = document.createElement('div');
      host.id = 'agworldV2FarmDetailHost';
      host.style.display = 'none';
      const actions = document.getElementById('farmActions');
      if (actions) card.insertBefore(host, actions);
      else card.appendChild(host);
    }

    const apiBase = global.AG_WORLD_API?.baseUrl || global.AGWORLD_API_BASE_URL || 'https://ag-world-api.onrender.com';
    const relationshipRepository = new global.AGWorldV2.RelationshipRepository({
      baseUrl: apiBase.replace(/\/$/, '') + '/api/v2/relationships'
    });

    const detailPanel = new FarmDetailPanelV2({ container: host, relationshipRepository });
    const originalClose = detailPanel.close.bind(detailPanel);
    detailPanel.close = () => {
      originalClose();
      host.style.display = 'none';
    };

    global.AGWorldV2.LiveFarmDetailBridge = {
      open(farm) {
        if (!farm?.id) return;
        const entity = global.AGWorldV2.FarmEntity.create({
          id: String(farm.id),
          name: farm.name || 'Unnamed farm',
          description: farm.description || '',
          status: farm.status || 'active',
          territoryIds: farm.territoryId ? [String(farm.territoryId)] : [],
          geometry: farm.boundary ? { type:'Polygon', coordinates: farm.boundary } : null,
          metadata: {
            owner:farm.owner,
            farmSize:farm.farmSize,
            crops:farm.crops || [],
            livestock:farm.livestock,
            annualHarvest:farm.annualHarvest,
            lastService:farm.lastService,
            opportunityScore:farm.opportunityScore
          }
        });
        // The Farm Card is the canonical V2 host. Force visibility here as a
        // final guard against earlier bootstrap code leaving the placeholder
        // inline-hidden.
        host.hidden = false;
        host.style.display = 'block';
        host.style.visibility = 'visible';
        host.style.opacity = '1';
        detailPanel.open(entity);
      },
      close() { detailPanel.close(); }
    };
    return true;
  }

  global.openV2FarmDetail = function (farm) {
    try {
      if (!installLiveBridge()) {
        global.addEventListener('DOMContentLoaded', () => global.openV2FarmDetail(farm), { once:true });
        return;
      }
      const bridge = global.AGWorldV2?.LiveFarmDetailBridge;
      if (!bridge) throw new Error('V2 Farm Detail Bridge was not installed');
      bridge.open(farm);
    } catch (error) {
      console.error('[AG World V2] Unable to integrate Farm Detail Panel', error);
      const host = document.getElementById('farmCard');
      if (host) {
        let errorBox = document.getElementById('agworldV2DetailError');
        if (!errorBox) {
          errorBox = document.createElement('div');
          errorBox.id = 'agworldV2DetailError';
          errorBox.style.cssText = 'margin-top:10px;padding:8px;background:#fff1f1;color:#8a2d2d;border:1px solid #f0b6b6;border-radius:5px;font-size:9px;';
          const actions = document.getElementById('farmActions');
          if (actions) host.insertBefore(errorBox, actions); else host.appendChild(errorBox);
        }
        errorBox.textContent = 'AG World V2 Entity Engine error: ' + (error?.message || String(error));
      }
    }
  };

  class DynamicEntityDetailPanelV2 extends global.AGWorldV2.EntityDetailPanelV2 {
    tabs() {
      return [
        ['details', 'Entity Details'],
        ['lifecycle', 'Lifecycle'],
        ['spatial', 'Map & Location'],
        ['relationships', 'Relationships'],
        ['activity', 'Activity'],
        ['documents', 'Documents'],
        ['media', 'Media'],
        ['notes', 'Notes']
      ];
    }

    open(entity) {
      this.entity = entity;
      this.activeTab = 'relationships';
      this.render();
    }

    render() {
      super.render();
      const header = this.container?.querySelector('.agworld-v2-detail-header');
      if (!header) return;
      const close = header.querySelector('[data-action="close"]');
      if (close) close.remove();
      const type = header.querySelector('.agworld-v2-entity-type');
      if (type) type.textContent = 'AG WORLD V2 ENTITY ENGINE · ' + (global.AGWorldV2.EntityTypes?.[this.entity.type]?.label || this.entity.type).toUpperCase();
      const title = header.querySelector('h2');
      if (title) title.textContent = this.entity.name || 'CONNECTED ENTITY DATA';
      const status = header.querySelector('.agworld-v2-status');
      if (status) status.textContent = String(this.entity.status || 'active').toUpperCase();
    }

    renderContent() {
      if (this.activeTab !== 'details') return super.renderContent();
      const target = this.container.querySelector('.agworld-v2-detail-content');
      const data = this.entity.metadata || {};
      const rows = [
        ['Primary contact', data.contactName],
        ['Mobile', data.contactCell],
        ['Email', data.contactEmail],
        ['Country', data.country],
        ['Province', data.province],
        ['Municipality', data.municipality],
        ['Nearest town', data.nearestTown],
        ['Capabilities', Array.isArray(data.capabilities) ? data.capabilities.join(', ') : data.capabilities],
        ['Website', data.website],
        ['Notes', data.notes]
      ].filter(([, value]) => value !== null && value !== undefined && value !== '');
      target.innerHTML = rows.length
        ? '<dl>' + rows.map(([label,value]) => '<dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd>').join('') + '</dl>'
        : '<p>No entity details have been added yet.</p>';
    }
  }

  function installDynamicLiveBridge() {
    if (global.AGWorldV2?.LiveDynamicEntityDetailBridge) return true;
    if (!installLiveBridge()) return false;

    const host = document.getElementById('agworldV2FarmDetailHost');
    if (!host) return false;

    const apiBase = global.AG_WORLD_API?.baseUrl || global.AGWORLD_API_BASE_URL || 'https://ag-world-api.onrender.com';
    const relationshipRepository = new global.AGWorldV2.RelationshipRepository({
      baseUrl: apiBase.replace(/\/$/, '') + '/api/v2/relationships'
    });
    const detailPanel = new DynamicEntityDetailPanelV2({ container: host, relationshipRepository });

    global.AGWorldV2.LiveDynamicEntityDetailBridge = {
      open(dynamicEntity) {
        if (!dynamicEntity?.id) return;
        const typeMap = {
          contractor: 'contractor',
          competitor: 'competitor',
          companyFacility: 'company_facility'
        };
        const type = typeMap[dynamicEntity.type] || dynamicEntity.type;
        const entity = global.AGWorldV2.EntitySchema.createEntity({
          id: String(dynamicEntity.id),
          type,
          name: dynamicEntity.name || 'Unnamed entity',
          description: dynamicEntity.details?.notes || '',
          status: dynamicEntity.status || 'active',
          territoryIds: [dynamicEntity.details?.province, dynamicEntity.details?.municipality].filter(Boolean),
          geometry: Number.isFinite(Number(dynamicEntity.lat)) && Number.isFinite(Number(dynamicEntity.lng))
            ? { type: 'Point', coordinates: [Number(dynamicEntity.lng), Number(dynamicEntity.lat)] }
            : null,
          metadata: {
            contactName: dynamicEntity.contactName,
            contactCell: dynamicEntity.contactCell,
            contactEmail: dynamicEntity.contactEmail,
            ...(dynamicEntity.details || {})
          }
        });
        host.hidden = false;
        host.style.display = 'block';
        host.style.visibility = 'visible';
        host.style.opacity = '1';
        detailPanel.open(entity);
      },
      close() { detailPanel.close(); }
    };
    return true;
  }

  // Dynamic entity cards are rendered by the legacy GIS runtime immediately
  // after selection. Opening V2 synchronously can therefore be overwritten by
  // that legacy render, leaving the "Preparing connected entity data…" placeholder
  // visible forever. Use the same post-selection handoff pattern that made the
  // Farm card deterministic: defer, verify the live host, and retry briefly.
  let dynamicSelectionToken = 0;

  function showDynamicV2Error(error) {
    const host = document.getElementById('agworldV2FarmDetailHost');
    if (!host) return;
    host.hidden = false;
    host.style.display = 'block';
    host.style.visibility = 'visible';
    host.style.opacity = '1';
    host.innerHTML = '<div style="padding:8px;background:#fff1f1;color:#8a2d2d;border:1px solid #f0b6b6;border-radius:5px;font-size:9px;">AG World V2 Entity Engine error: ' +
      esc(error?.message || String(error)) + '</div>';
  }

  global.openV2DynamicEntityDetail = function (entity, attempt, token) {
    const currentAttempt = Number(attempt || 0);
    const currentToken = token == null ? dynamicSelectionToken : token;
    if (currentToken !== dynamicSelectionToken || !entity?.id) return;

    try {
      if (!installDynamicLiveBridge()) {
        if (currentAttempt < 12) {
          setTimeout(() => global.openV2DynamicEntityDetail(entity, currentAttempt + 1, currentToken), 80);
        }
        return;
      }

      // Always re-query the host after the GIS runtime has completed its own
      // card render. The dynamic bridge and the Farm bridge intentionally use
      // the exact same canonical host.
      const host = document.getElementById('agworldV2FarmDetailHost');
      if (!host) {
        if (currentAttempt < 12) {
          setTimeout(() => global.openV2DynamicEntityDetail(entity, currentAttempt + 1, currentToken), 80);
        }
        return;
      }

      global.AGWorldV2.LiveDynamicEntityDetailBridge.open(entity);
    } catch (error) {
      console.error('[AG World V2] Unable to open dynamic entity detail', error);
      if (currentAttempt < 3) {
        setTimeout(() => global.openV2DynamicEntityDetail(entity, currentAttempt + 1, currentToken), 100);
      } else {
        showDynamicV2Error(error);
      }
    }
  };

  function openDynamicFromCanonicalSelection(entity) {
    const token = ++dynamicSelectionToken;
    // Allow the actual GIS selection function to finish rendering the base
    // Contractor/Competitor/Company Facility card before V2 replaces the
    // placeholder. This mirrors the fixed Farm selection handoff.
    setTimeout(() => {
      global.openV2DynamicEntityDetail(entity, 0, token);
    }, 120);
  }

  global.addEventListener('agworld:dynamic-entity-selected', e => {
    const entity = e?.detail?.entity;
    if (entity) openDynamicFromCanonicalSelection(entity);
  });

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.DynamicEntityDetailPanelV2 = DynamicEntityDetailPanelV2;

  // Primary integration: the GIS loader emits this from inside its actual
  // local selectFarm function. Do not depend on window.selectFarm, which is not
  // the public runtime function in this application.
  const openFromCanonicalSelection = e => {
    const farm = e?.detail?.farm;
    if (farm) global.openV2FarmDetail(farm);
  };
  global.addEventListener('agworld:farm-selected', openFromCanonicalSelection);

  // Backwards-compatible bridge for older callers.
  global.addEventListener('agworld:v2-open-live-farm', e => global.openV2FarmDetail(e.detail));

  // Last-resort canonical V2 host watchdog.
  // The GIS runtime owns the visible Farm Card and can replace its innerHTML
  // after a selection event has already fired. When that happens, the static
  // "Preparing connected entity data…" fallback can remain visible even though
  // the V2 bridge itself is ready. Re-open from the current canonical runtime
  // selection whenever that fallback is detected. This applies equally to
  // Farms, Contractors, Competitors and Company Facilities.
  let v2HostWatchdogScheduled = false;

  function dynamicEntityFromRuntimeSelection() {
    const selection = global.__AGWORLD_RUNTIME_DYNAMIC_ENTITY_SELECTION_V2__;
    if (!selection?.entityId) return null;

    const world = global.AG_WORLD_WORLD || {};
    const canonicalType = selection.entityType === 'companyFacility'
      ? 'companyFacility'
      : selection.entityType;
    const sources = canonicalType === 'contractor'
      ? [world.getContractors?.(), global.__AG_WORLD_CONTRACTORS]
      : canonicalType === 'competitor'
        ? [world.getCompetitors?.(), global.__AG_WORLD_COMPETITORS]
        : [world.getCompanyFacilities?.(), global.__AG_WORLD_COMPANY_FACILITIES];

    for (const source of sources) {
      const list = Array.isArray(source) ? source : [];
      const entity = list.find(item => String(item?.id) === String(selection.entityId));
      if (entity) return entity;
    }
    return null;
  }

  function v2HostNeedsRecovery() {
    const host = document.getElementById('agworldV2FarmDetailHost');
    if (!host) return false;
    const text = String(host.textContent || '');
    return /Preparing connected entity data|Connecting entity and relationship data|V2 is still initialising/i.test(text);
  }

  function recoverCanonicalV2Host() {
    if (!v2HostNeedsRecovery()) return;

    const farmSelection = global.__AGWORLD_RUNTIME_FARM_SELECTION_V2__;
    if (farmSelection?.farmId) {
      const world = global.AG_WORLD_WORLD || {};
      const farms = global.__AG_WORLD_FARMS || world.farms || world.getFarms?.() || [];
      const farm = (Array.isArray(farms) ? farms : []).find(item => String(item?.id) === String(farmSelection.farmId));
      if (farm && typeof global.openV2FarmDetail === 'function') {
        global.openV2FarmDetail(farm);
        return;
      }
    }

    const dynamicEntity = dynamicEntityFromRuntimeSelection();
    if (dynamicEntity && typeof global.openV2DynamicEntityDetail === 'function') {
      global.openV2DynamicEntityDetail(dynamicEntity, 0, dynamicSelectionToken);
    }
  }

  function scheduleCanonicalV2Recovery() {
    if (v2HostWatchdogScheduled) return;
    v2HostWatchdogScheduled = true;
    setTimeout(() => {
      v2HostWatchdogScheduled = false;
      recoverCanonicalV2Host();
    }, 0);
  }

  global.addEventListener('agworld:farm-selected', () => {
    [0, 80, 220, 600].forEach(delay => setTimeout(recoverCanonicalV2Host, delay));
  });
  global.addEventListener('agworld:dynamic-entity-selected', () => {
    [0, 120, 260, 650].forEach(delay => setTimeout(recoverCanonicalV2Host, delay));
  });

  const watchV2Host = () => {
    const card = document.getElementById('farmCard');
    if (!card || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => {
      if (v2HostNeedsRecovery()) scheduleCanonicalV2Recovery();
    });
    observer.observe(card, { childList:true, subtree:true, characterData:true });
  };

  const initialiseLiveBridge = () => {
    installLiveBridge();
    watchV2Host();

    // If the GIS selection happened before this module finished loading, replay
    // the current canonical selection exactly once.
    const runtimeSelection = global.__AGWORLD_RUNTIME_FARM_SELECTION_V2__;
    if (runtimeSelection?.farmId && global.AG_WORLD_WORLD?.farms) {
      const farm = global.AG_WORLD_WORLD.farms.find(f => String(f.id) === String(runtimeSelection.farmId));
      if (farm) global.openV2FarmDetail(farm);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseLiveBridge);
  } else {
    initialiseLiveBridge();
  }

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.FarmDetailPanelV2 = FarmDetailPanelV2;
  global.__AGWORLD_V2_FARM_DETAIL_READY__ = true;
})(window);
