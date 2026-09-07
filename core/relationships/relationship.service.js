(function (global) {
  'use strict';

  class RelationshipService {
    constructor(repository) {
      this.repository = repository || new global.AGWorldV2.RelationshipRepository();
    }

    list(entityId) { return this.repository.list(entityId); }
    connect(sourceEntityId, relationshipType, targetEntityId, metadata) {
      return this.repository.create({
        sourceEntityId,
        relationshipType,
        targetEntityId,
        metadata: metadata || {}
      });
    }
    disconnect(id) { return this.repository.remove(id); }
  }

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.RelationshipService = RelationshipService;
})(window);