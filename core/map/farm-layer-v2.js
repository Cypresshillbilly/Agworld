(function (global) {
  'use strict';

  class FarmLayerV2 {
    constructor(options) {
      this.map = options.map;
      this.service = options.service || new global.AGWorldV2.FarmEntityService();
      this.overlays = new Map();
      this.visible = true;
      this.onSelect = options.onSelect || null;
    }

    async load() {
      const farms = await this.service.list();
      farms.forEach(farm => this.render(farm));
      return farms;
    }

    render(farm) {
      this.remove(farm.id);
      const geometry = farm.geometry;
      if (!geometry || !this.map || !global.google?.maps) return;

      let overlay;
      if (geometry.type === 'Polygon') {
        const path = (geometry.coordinates[0] || []).map(([lng, lat]) => ({ lat, lng }));
        overlay = new google.maps.Polygon({
          paths: path,
          map: this.visible ? this.map : null,
          clickable: true,
          strokeOpacity: 0.9,
          strokeWeight: 2,
          fillOpacity: 0.16,
          zIndex: 20
        });
      } else if (geometry.type === 'Point') {
        const [lng, lat] = geometry.coordinates;
        overlay = new google.maps.Marker({
          position: { lat, lng },
          map: this.visible ? this.map : null,
          title: farm.name
        });
      }

      if (!overlay) return;
      overlay.addListener('click', () => {
        global.dispatchEvent(new CustomEvent('agworld:v2-entity-selected', { detail: { entity: farm } }));
        if (typeof this.onSelect === 'function') this.onSelect(farm);
      });
      this.overlays.set(String(farm.id), overlay);
    }

    remove(id) {
      const overlay = this.overlays.get(String(id));
      if (overlay) {
        overlay.setMap(null);
        this.overlays.delete(String(id));
      }
    }

    setVisible(visible) {
      this.visible = Boolean(visible);
      this.overlays.forEach(overlay => overlay.setMap(this.visible ? this.map : null));
    }

    clear() {
      this.overlays.forEach(overlay => overlay.setMap(null));
      this.overlays.clear();
    }
  }

  global.AGWorldV2 = global.AGWorldV2 || {};
  global.AGWorldV2.FarmLayerV2 = FarmLayerV2;
})(window);