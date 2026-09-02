/* AG World South African provincial territory layer.
   Source: National Spatial Planning Data Repository / Municipal Demarcation Board.
   The source is the official Province polygon layer. We request GeoJSON directly
   because Google's KmlLayer is deprecated in the current Maps JavaScript API.
*/
(() => {
  const PROVINCE_GEOJSON_URL = 'https://nspdr.dlrrd.gov.za/server/rest/services/NationalDatasets/MunicipalDemarcationBoard/MapServer/5/query?where=1%3D1&outFields=ProvinceCode%2CProvinceName%2CCountry&returnGeometry=true&outSR=4326&f=geojson';
  let provinceData = null;
  let provinceLabels = [];
  let mapRef = null;
  let loaded = false;

  function geometryPoints(geometry, out = []) {
    if (!geometry) return out;
    const type = geometry.getType();
    if (type === 'Point') { out.push(geometry.get()); return out; }
    if (type === 'MultiPoint') geometry.getArray().forEach(g => geometryPoints(g, out));
    if (type === 'LineString' || type === 'LinearRing') geometry.getArray().forEach(p => out.push(p));
    if (type === 'MultiLineString' || type === 'Polygon') geometry.getArray().forEach(g => geometryPoints(g, out));
    if (type === 'MultiPolygon' || type === 'GeometryCollection') geometry.getArray().forEach(g => geometryPoints(g, out));
    return out;
  }

  function labelPosition(feature) {
    const points = geometryPoints(feature.getGeometry());
    if (!points.length) return null;
    const sum = points.reduce((a, p) => ({lat: a.lat + p.lat(), lng: a.lng + p.lng()}), {lat:0,lng:0});
    return {lat: sum.lat / points.length, lng: sum.lng / points.length};
  }

  function styleProvince(feature) {
    return {
      fillColor: '#b8cf45',
      fillOpacity: 0.025,
      strokeColor: '#d7e66b',
      strokeOpacity: 0.78,
      strokeWeight: 2.2,
      clickable: true,
      zIndex: 3
    };
  }

  function clearLabels() {
    provinceLabels.forEach(m => m.setMap(null));
    provinceLabels = [];
  }

  function createLabels() {
    if (!provinceData || !mapRef) return;
    clearLabels();
    provinceData.forEach(feature => {
      const pos = labelPosition(feature);
      const name = feature.getProperty('ProvinceName');
      if (!pos || !name) return;
      const marker = new google.maps.Marker({
        position: pos,
        map: mapRef,
        title: name,
        label: {text: String(name).toUpperCase(), color: '#f2f6d1', fontSize: '11px', fontWeight: '800'},
        icon: {path: google.maps.SymbolPath.CIRCLE, scale: 0, fillOpacity: 0, strokeOpacity: 0}
      });
      marker.__provinceName = name;
      provinceLabels.push(marker);
    });
  }

  function syncVisibility() {
    if (!provinceData || !mapRef) return;
    const zoom = mapRef.getZoom() || 5;
    const visible = zoom < 12;
    provinceData.setMap(visible ? mapRef : null);
    provinceLabels.forEach(m => m.setMap(visible ? mapRef : null));
  }

  function loadProvinceData(map) {
    if (loaded || !map || !window.google?.maps?.Data) return;
    loaded = true;
    mapRef = map;
    provinceData = new google.maps.Data({map});
    provinceData.setStyle(styleProvince);
    provinceData.addListener('click', event => {
      const name = event.feature.getProperty('ProvinceName');
      if (name) {
        mapRef.panTo(event.latLng);
        if (window.showToast) window.showToast(`${name} province selected`);
      }
    });
    provinceData.loadGeoJson(PROVINCE_GEOJSON_URL, null, features => {
      provinceData = provinceData;
      features.forEach(feature => {});
      createLabels();
      syncVisibility();
      if (window.showToast) window.showToast('South African provincial boundaries loaded');
    });
    window.__AG_WORLD_PROVINCE_DATA = provinceData;
    window.__AG_WORLD_PROVINCE_SOURCE = PROVINCE_GEOJSON_URL;
    map.addListener('zoom_changed', syncVisibility);
  }

  // app.js exposes its map variable as a global lexical binding. Because this
  // file is loaded after app.js, the binding can be read directly here.
  function hookMapReady() {
    if (window.__AG_WORLD_PROVINCE_HOOKED) return;
    if (typeof window.agWorldMapReady !== 'function') return;
    const original = window.agWorldMapReady;
    window.__AG_WORLD_PROVINCE_HOOKED = true;
    window.agWorldMapReady = () => {
      original();
      if (typeof map !== 'undefined' && map) loadProvinceData(map);
    };
    if (typeof map !== 'undefined' && map) loadProvinceData(map);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hookMapReady);
  else hookMapReady();
  setTimeout(hookMapReady, 500);
  setTimeout(hookMapReady, 1500);
})();
