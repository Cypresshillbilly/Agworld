(function (global) {
  'use strict';

  const ENTITY_TYPES = Object.freeze({
    FARM: 'farm',
    CONTRACTOR: 'contractor',
    COMPETITOR: 'competitor',
    COMPANY: 'company',
    COMPANY_FACILITY: 'company_facility'
  });

  const GEOMETRY_TYPES = Object.freeze({
    POINT: 'Point',
    POLYGON: 'Polygon',
    MULTI_POLYGON: 'MultiPolygon'
  });

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function createEntity(input) {
    const entity = Object.assign({
      id: null,
      type: null,
      name: '',
      description: '',
      status: 'active',
      geometry: null,
      territoryIds: [],
      metadata: {},
      createdAt: null,
      updatedAt: null
    }, input || {});

    assert(Object.values(ENTITY_TYPES).includes(entity.type), 'Invalid entity type');
    assert(typeof entity.name === 'string' && entity.name.trim(), 'Entity name is required');

    return entity;
  }

  function isSupportedGeometry(geometry) {
    return !geometry || Object.values(GEOMETRY_TYPES).includes(geometry.type);
  }

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.EntitySchema = {
    ENTITY_TYPES,
    GEOMETRY_TYPES,
    createEntity,
    isSupportedGeometry
  };
})(window);