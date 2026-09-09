window.AG_WORLD_CONFIG = window.AG_WORLD_CONFIG || {
  GOOGLE_MAPS_API_KEY: "AIzaSyCD9AmDQdsBEqrxJqcexoF5lrlrvsi_drE"
};

window.AGWORLD_SPATIAL_SOURCES = {
  municipalities: 'https://law.drdlr.gov.za/server/rest/services/LAW_Spatial_Admin_Boundaries/MapServer/115/query?where=1%3D1&outFields=MUNICNAME%2CMUNICCODE%2COBJECTID&returnGeometry=true&outSR=4326&f=geojson',
  towns: 'https://law.drdlr.gov.za/server/rest/services/LAW_Spatial_Admin_Boundaries/MapServer/130/query?where=1%3D1&outFields=S12_NAME%2CTOWN_EXT%2CSGTOWN%2COBJECTID&returnGeometry=true&outSR=4326&f=geojson'
};
