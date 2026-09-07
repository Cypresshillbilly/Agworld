(function (global) {
  'use strict';

  class EntityRepository {
    constructor(options) {
      this.baseUrl = (options && options.baseUrl) || '/api/v2/entities';
    }

    async list(filters) {
      const params = new URLSearchParams();
      Object.entries(filters || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') params.set(key, value);
      });
      const response = await fetch(this.baseUrl + (params.toString() ? '?' + params : ''));
      if (!response.ok) throw new Error('Unable to load entities');
      return response.json();
    }

    async get(id) {
      const response = await fetch(this.baseUrl + '/' + encodeURIComponent(id));
      if (!response.ok) throw new Error('Unable to load entity');
      return response.json();
    }

    async create(entity) {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entity)
      });
      if (!response.ok) throw new Error('Unable to create entity');
      return response.json();
    }

    async update(id, entity) {
      const response = await fetch(this.baseUrl + '/' + encodeURIComponent(id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entity)
      });
      if (!response.ok) throw new Error('Unable to update entity');
      return response.json();
    }

    async remove(id) {
      const response = await fetch(this.baseUrl + '/' + encodeURIComponent(id), { method: 'DELETE' });
      if (!response.ok) throw new Error('Unable to delete entity');
      return true;
    }
  }

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.EntityRepository = EntityRepository;
})(window);