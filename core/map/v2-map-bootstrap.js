(function (global) {
  'use strict';

  async function attachFarmLayer(map, options) {
    if (!map) throw new Error('A Google Map instance is required');
    if (!global.AGWorldV2?.FarmEntityService || !global.AGWorldV2?.FarmLayerV2) {
      throw new Error('V2 Farm Engine modules are not loaded');
    }

    const service = new global.AGWorldV2.FarmEntityService(
      (options && options.adapter) || undefined
    );
    const layer = new global.AGWorldV2.FarmLayerV2({
      map,
      service,
      onSelect: options && options.onSelect
    });

    global.AGWorldV2.farmLayer = layer;
    await layer.load();
    global.dispatchEvent(new CustomEvent('agworld:v2-farm-layer-ready', { detail: { layer } }));
    return layer;
  }

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.attachFarmLayer = attachFarmLayer;
})(window);