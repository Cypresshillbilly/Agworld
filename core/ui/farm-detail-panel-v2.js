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

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.FarmDetailPanelV2 = FarmDetailPanelV2;
})(window);