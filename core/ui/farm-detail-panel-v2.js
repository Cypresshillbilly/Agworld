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
    panel.style.cssText = 'position:absolute;right:22px;top:92px;width:min(420px,calc(100vw - 44px));max-height:calc(100vh - 120px);overflow:auto;z-index:1500;display:none;background:rgba(10,18,22,.98);border:1px solid rgba(0,184,217,.65);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.55);color:#f4f7f1;';
    document.body.appendChild(panel);
    const relationshipRepository = new global.AGWorldV2.RelationshipRepository({ baseUrl: (global.AG_WORLD_API?.baseUrl || '') + '/api/v2/relationships' });
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

  global.addEventListener('agworld:v2-open-live-farm', e => global.AGWorldV2.LiveFarmDetailBridge?.open(e.detail));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installLiveBridge);
  else installLiveBridge();

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.FarmDetailPanelV2 = FarmDetailPanelV2;
})(window);