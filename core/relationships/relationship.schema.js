(function (global) {
  'use strict';

  function createRelationship(input) {
    const relationship = Object.assign({
      id: null,
      sourceEntityId: null,
      relationshipType: null,
      targetEntityId: null,
      status: 'active',
      metadata: {},
      createdAt: null,
      updatedAt: null
    }, input || {});

    if (!relationship.sourceEntityId) throw new Error('Source entity is required');
    if (!relationship.targetEntityId) throw new Error('Target entity is required');
    if (!relationship.relationshipType) throw new Error('Relationship type is required');

    return relationship;
  }

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.RelationshipSchema = { createRelationship };
})(window);