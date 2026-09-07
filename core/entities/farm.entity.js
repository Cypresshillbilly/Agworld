(function (global) {
  'use strict';

  function createFarm(input) {
    return global.AGWorldV2.EntitySchema.createEntity(Object.assign({
      type: 'farm',
      metadata: { owner: null, farmSize: null, crops: [], livestock: null }
    }, input || {}, { type: 'farm' }));
  }

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.FarmEntity = { create: createFarm };
})(window);