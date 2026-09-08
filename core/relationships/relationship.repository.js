(function (global) {
  'use strict';

  class RelationshipRepository {
    constructor(options) {
      this.baseUrl = (options && options.baseUrl) || ((global.AG_WORLD_API && global.AG_WORLD_API.baseUrl ? global.AG_WORLD_API.baseUrl : '') + '/api/v2/relationships');
    }

    async list(entityId) {
      const url = entityId ? this.baseUrl + '?entityId=' + encodeURIComponent(entityId) : this.baseUrl;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Unable to load relationships');
      return response.json();
    }

    async create(input) {
      const relationship = global.AGWorldV2.RelationshipSchema.createRelationship(input);
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relationship)
      });
      if (!response.ok) throw new Error('Unable to create relationship');
      return response.json();
    }

    async remove(id) {
      const response = await fetch(this.baseUrl + '/' + encodeURIComponent(id), { method: 'DELETE' });
      if (!response.ok) throw new Error('Unable to delete relationship');
      return true;
    }

    // The current API exposes create and delete as the stable mutation
    // contract. Replacing a relationship keeps the manager compatible with
    // that contract while still giving the UI a true edit workflow.
    async replace(id, input) {
      if (!id) return this.create(input);
      await this.remove(id);
      return this.create(input);
    }
  }

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.RelationshipRepository = RelationshipRepository;
})(window);