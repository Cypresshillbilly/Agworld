(function (global) {
  'use strict';

  class EntityService {
    constructor(repository) {
      this.repository = repository;
    }

    list(filters) { return this.repository.list(filters); }
    get(id) { return this.repository.get(id); }

    create(input) {
      const entity = global.AGWorldV2.EntitySchema.createEntity(input);
      return this.repository.create(entity);
    }

    update(id, input) {
      if (!id) throw new Error('Entity id is required');
      return this.repository.update(id, input);
    }

    remove(id) {
      if (!id) throw new Error('Entity id is required');
      return this.repository.remove(id);
    }
  }

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.EntityService = EntityService;
})(window);