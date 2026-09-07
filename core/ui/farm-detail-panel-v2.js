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

  const initialiseLiveBridge = () => {
    installLiveBridge();

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
