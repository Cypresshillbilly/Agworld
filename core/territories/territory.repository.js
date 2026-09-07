(function (global) {
  'use strict';

  class TerritoryRepository {
    constructor(options) {
      this.baseUrl = (options && options.baseUrl) || '/api/v2/territories';
    }

    async list(filters) {
      const params = new URLSearchParams(filters || {});
      const response = await fetch(this.baseUrl + (params.toString() ? '?' + params : ''));
      if (!response.ok) throw new Error('Unable to load territories');
      return response.json();
    }

    async get(id) {
      const response = await fetch(this.baseUrl + '/' + encodeURIComponent(id));
      if (!response.ok) throw new Error('Unable to load territory');
      return response.json();
    }
  }

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.TerritoryRepository = TerritoryRepository;
})(window);