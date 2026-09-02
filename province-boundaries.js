/* AG World South African provincial territory layer.
   Uses the official National Spatial Planning Data Repository / Municipal Demarcation Board
   province feature layer as a live KML overlay on the Google satellite map.
*/
(() => {
  const KML_QUERY_URL = 'https://nspdr.dlrrd.gov.za/server/rest/services/NationalDatasets/MunicipalDemarcationBoard/MapServer/5/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=ProvinceCode%2CProvinceName%2CCountry&returnGeometry=true&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&returnZ=false&returnM=false&returnDistinctValues=false&returnExtentsOnly=false&f=kmz';
  let provinceLayer = null;
  let mapRef = null;

  function addProvinceLayer(map) {
    mapRef = map;
    if (!window.google?.maps?.KmlLayer) return;
    provinceLayer = new google.maps.KmlLayer({
      url: KML_QUERY_URL,
      map,
      preserveViewport: true,
      suppressInfoWindows: false,
      zIndex: 4
    });
    window.__AG_WORLD_PROVINCE_LAYER = provinceLayer;
    window.__AG_WORLD_PROVINCE_LAYER_URL = KML_QUERY_URL;
    provinceLayer.addListener('status_changed', () => {
      const status = provinceLayer.getStatus();
      if (status !== 'OK' && window.showToast) window.showToast('Provincial GIS layer unavailable: ' + status);
    });
  }

  function syncVisibility() {
    if (!provinceLayer || !mapRef) return;
    const zoom = mapRef.getZoom() || 5;
    // Provinces are a national/regional territory layer. Keep them visible through
    // regional/farm-boundary zoom, then let farm-level visual assets take precedence.
    provinceLayer.setMap(zoom < 12 ? mapRef : null);
  }

  window.agWorldAddProvinceLayer = addProvinceLayer;
  window.agWorldSyncProvinceLayer = syncVisibility;

  const waitForMap = () => {
    if (window.map) addProvinceLayer(window.map);
    if (window.google?.maps && document.getElementById('map') && typeof window.agWorldMapReady === 'function') {
      const original = window.agWorldMapReady;
      if (!window.__AG_WORLD_MAP_READY_WRAPPED) {
        window.__AG_WORLD_MAP_READY_WRAPPED = true;
        window.agWorldMapReady = () => {
          original();
          const m = window.map;
          if (m) {
            addProvinceLayer(m);
            m.addListener('zoom_changed', syncVisibility);
            syncVisibility();
          }
        };
      }
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', waitForMap);
  else waitForMap();
  setTimeout(waitForMap, 1000);
  setTimeout(waitForMap, 2500);
})();
