(function (global) {
  'use strict';

  const RelationshipTypes = Object.freeze({
    WORKS_WITH: 'works_with',
    CUSTOMER_OF: 'customer_of',
    COMPETES_WITH: 'competes_with',
    ASSOCIATED_WITH: 'associated_with',
    OWNS: 'owns',
    OPERATES: 'operates',
    SERVES: 'serves',
    SUPPLIES: 'supplies',
    LOCATED_IN: 'located_in'
  });

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.RelationshipTypes = RelationshipTypes;
})(window);