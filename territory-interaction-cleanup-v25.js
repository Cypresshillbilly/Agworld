// Territory interaction cleanup: v25
// Keeps the Territory Intelligence Panel as the single territory UI.
(() => {
  let selectedTerritory = null;

  function restoreTerritoryStyle(territory) {
    if (!territory?._polygon) return;
    if (typeof applyTerritoryControlStyle === 'function') applyTerritoryControlStyle(territory);
  }

  function highlightTerritory(territory) {
    if (!territory?._polygon) return;
    restoreTerritoryStyle(selectedTerritory);
    selectedTerritory = territory;
    window.__AG_WORLD_SELECTED_TERRITORY = territory;

    const level = territory.level || 'province';
    const controlStyle = typeof territoryControlStyle === 'function' ? territoryControlStyle(territory) : {};
    const base = territory._baseStyle || {};
    const zIndex = level === 'province' ? 40 : level === 'municipality' ? 35 : level === 'town' ? 32 : 30;

    territory._polygon.setOptions({
      strokeColor: '#ffffff',
      strokeOpacity: 1,
      strokeWeight: Math.max(Number(base.strokeWeight || 2) + 2, 4),
      fillColor: controlStyle.fillColor || base.fillColor,
      fillOpacity: Math.min(0.42, Math.max(Number(controlStyle.fillOpacity || base.fillOpacity || 0), 0.18)),
      zIndex
    });
  }

  // Replace the legacy territory click flow. The previous implementation also
  // populated #farmCard, creating the duplicate popup beneath the Territory
  // Intelligence Panel.
  selectTerritory = function (territory, zoom = true) {
    if (!territory) return;

    if (typeof initialiseGameTerritories === 'function') initialiseGameTerritories();
    const summary = typeof territoryGameSummary === 'function'
      ? territoryGameSummary(territory)
      : { total: 0, company: 0, competitor: 0, neutral: 0, control: 0, enemyControl: 0 };

    if (typeof renderTerritoryInformationPanel === 'function') {
      renderTerritoryInformationPanel(territory, summary);
    }

    // Explicitly disable the legacy territory popup/card.
    const legacyCard = document.getElementById('farmCard');
    if (legacyCard) legacyCard.classList.remove('show');

    // Territory selection is separate from farm selection so zoom changes
    // cannot re-open farm details for a GIS territory.
    selected = null;
    highlightTerritory(territory);

    if (map && zoom) {
      const center = territory.center || (typeof centroid === 'function' ? centroid(territory.boundary || []) : null);
      if (center) map.panTo(center);
      const targetZoom = { country: 5, province: 7, municipality: 10, town: 12 }[territory.level] || 7;
      map.setZoom(targetZoom);
    }

    const levelLabel = String(territory.level || 'territory').toUpperCase();
    const status = document.getElementById('mapStatus');
    if (status) {
      status.textContent = `${MASTER_PLAYER.name} territory selected · ${levelLabel} · ${territory.name} · ${summary.control}% control · ${summary.company}/${summary.total} farms`;
    }
  };

  // Closing the intelligence panel must never reveal the old territory card.
  document.addEventListener('click', event => {
    if (event.target.closest('.territory-info-close')) {
      const legacyCard = document.getElementById('farmCard');
      if (legacyCard) legacyCard.classList.remove('show');
    }
  });
})();