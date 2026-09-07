/* AG World farm visual controller.
   Interactive 3D/visual farm mode is manual-only. Map zooming, map clicks and
   farm-card mutations must never open it automatically. */
(() => {
  window.AG_WORLD_AUTO_OPEN_FARM_VISUAL = false;
  // Intentionally no observers or click handlers here.
  // app-gis-loader-v24.js owns selection; its OPEN FARM IN 3D button is the
  // sole entry point into the interactive visual.
})();
