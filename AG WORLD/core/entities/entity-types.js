(function (global) {
  'use strict';

  const definitions = {
    farm: {
      label: 'Farm',
      geometry: ['Point', 'Polygon', 'MultiPolygon'],
      fields: ['owner', 'farmSize', 'crops', 'livestock']
    },
    contractor: {
      label: 'Contractor',
      geometry: ['Point'],
      fields: ['services', 'equipment', 'operatingCapacity']
    },
    competitor: {
      label: 'Competitor',
      geometry: ['Point', 'Polygon'],
      fields: ['brand', 'products', 'services', 'marketInformation']
    },
    company: {
      label: 'Company',
      geometry: ['Point', 'Polygon'],
      fields: ['brandIdentity', 'products', 'services']
    },
    company_facility: {
      label: 'Company Facility',
      geometry: ['Point', 'Polygon'],
      fields: ['facilityType', 'address', 'services', 'operatingCapacity']
    }
  };

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.EntityTypes = Object.freeze(definitions);
})(window);