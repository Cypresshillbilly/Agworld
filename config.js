window.AG_WORLD_CONFIG = {
  GOOGLE_MAPS_API_KEY: "AIzaSyCD9AmDQdsBEqrxJqcexoF5lrlrvsi_drE"
};

// Spatial feature services are defined before app.js runs. app.js loads these
// independently; if either remote layer is unavailable the base Google map
// still initializes normally.
const AGWORLD_SPATIAL_SOURCES = {
  // Stable national DLRRD Surveyor-General ArcGIS services in WGS84.
  municipalities: 'https://law.drdlr.gov.za/server/rest/services/LAW_Spatial_Admin_Boundaries/MapServer/115/query?where=1%3D1&outFields=MUNICNAME%2CMUNICCODE%2COBJECTID&returnGeometry=true&outSR=4326&f=geojson',
  towns: 'https://law.drdlr.gov.za/server/rest/services/LAW_Spatial_Admin_Boundaries/MapServer/130/query?where=1%3D1&outFields=S12_NAME%2CTOWN_EXT%2CSGTOWN%2COBJECTID&returnGeometry=true&outSR=4326&f=geojson'
};
