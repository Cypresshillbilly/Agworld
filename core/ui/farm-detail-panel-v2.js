(function (global) {
  'use strict';

  class FarmDetailPanelV2 extends global.AGWorldV2.EntityDetailPanelV2 {
    constructor(options) {
      super(options);
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

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }


  function installLiveBridge() {
    if (global.AGWorldV2.LiveFarmDetailBridge) return;
    const panel = document.createElement('div');
    panel.id = 'agworldV2FarmDetailHost';
    panel.style.cssText = 'position:fixed;right:22px;top:92px;width:min(420px,calc(100vw - 44px));max-height:calc(100vh - 120px);overflow:auto;z-index:99999;display:none;background:rgba(10,18,22,.98);border:2px solid #00b8d9;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.75);color:#f4f7f1;';
    document.body.appendChild(panel);
    const apiBase = global.AG_WORLD_API?.baseUrl || global.AGWORLD_API_BASE_URL || 'https://ag-world-api.onrender.com';
    const relationshipRepository = new global.AGWorldV2.RelationshipRepository({ baseUrl: apiBase.replace(/\\/$/, '') + '/api/v2/relationships' });
    const detailPanel = new FarmDetailPanelV2({ container: panel, relationshipRepository });
    const originalClose = detailPanel.close.bind(detailPanel);
    detailPanel.close = () => { originalClose(); panel.style.display = 'none'; };
    global.AGWorldV2.LiveFarmDetailBridge = {
      open(farm) {
        if (!farm?.id) return;
        const entity = global.AGWorldV2.FarmEntity.create({
          id: String(farm.id), name: farm.name || 'Unnamed farm', description: farm.description || '', status: farm.status || 'active',
          territoryIds: farm.territoryId ? [String(farm.territoryId)] : [],
          geometry: farm.boundary ? { type:'Polygon', coordinates: farm.boundary } : null,
          metadata: { owner:farm.owner, farmSize:farm.farmSize, crops:farm.crops || [], livestock:farm.livestock, annualHarvest:farm.annualHarvest, lastService:farm.lastService, opportunityScore:farm.opportunityScore }
        });
        panel.style.display = 'block'; detailPanel.open(entity);
      },
      close() { detailPanel.close(); }
    };
  }

  global.openV2FarmDetail = function (farm) {
    try {
      installLiveBridge();
      const bridge = global.AGWorldV2 && global.AGWorldV2.LiveFarmDetailBridge;
      if (!bridge) throw new Error('V2 Farm Detail Bridge was not installed');
      bridge.open(farm);
    } catch (error) {
      console.error('[AG World V2] Unable to open Farm Detail Panel', error);
      const existing = document.getElementById('agworldV2DetailError');
      const errorBox = existing || document.createElement('div');
      errorBox.id = 'agworldV2DetailError';
      errorBox.style.cssText = 'position:fixed;right:22px;top:92px;z-index:100000;width:min(420px,calc(100vw - 44px));padding:18px;background:#2b1010;color:#fff;border:2px solid #ff6b6b;border-radius:12px;font:13px Arial;';
      errorBox.textContent = 'AG World V2 Detail Panel error: ' + (error && error.message ? error.message : String(error));
      if (!existing) document.body.appendChild(errorBox);
    }
  };

  global.addEventListener('agworld:v2-open-live-farm', e => global.openV2FarmDetail(e.detail));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installLiveBridge);
  else installLiveBridge();

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.FarmDetailPanelV2 = FarmDetailPanelV2;
  global.__AGWORLD_V2_FARM_DETAIL_READY__ = true;
})(window);