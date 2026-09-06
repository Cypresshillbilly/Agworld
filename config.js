window.AG_WORLD_CONFIG = {
  GOOGLE_MAPS_API_KEY: "AIzaSyCD9AmDQdsBEqrxJqcexoF5lrlrvsi_drE"
};

// Spatial feature services are defined before app.js runs. app.js loads these
// independently; if either remote layer is unavailable the base Google map
// still initializes normally.
const AGWORLD_SPATIAL_SOURCES = {
  municipalities: 'https://nspdr.dlrrd.gov.za/server/rest/services/NationalDatasets/MunicipalDemarcationBoard/MapServer/3/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson',
  towns: 'https://gis.westerncape.gov.za/server2/rest/services/SpatialDataWarehouse/AfriGIS_Boundaries/MapServer/9/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson'
};
