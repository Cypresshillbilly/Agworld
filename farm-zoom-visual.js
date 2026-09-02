/* AG World automatic farm-level visualisation.
   When the map reaches the interactive farm stage, open the existing farm
   visual automatically. app.js owns selected-farm state and rendering.
*/
(() => {
  let lastOpenedStage = '';
  let lastOpenedFarmName = '';
  let opening = false;

  function atFarmStage() {
    const stage = document.getElementById('zoomStage')?.textContent || '';
    return /ZOOM\s+[34]/i.test(stage) || /INTERACTIVE\s+FARM/i.test(stage);
  }

  function tryOpen() {
    if (opening || !atFarmStage()) return;
    const stage = document.getElementById('zoomStage')?.textContent?.trim() || '';
    const farmName = document.getElementById('farmName')?.textContent?.trim() || '';
    const button = document.getElementById('farm3d');
    const modal = document.getElementById('farm3dModal');
    if (!button || !farmName || farmName === 'Farm') return;
    if (modal?.classList.contains('show')) return;
    if (stage === lastOpenedStage && farmName === lastOpenedFarmName) return;

    lastOpenedStage = stage;
    lastOpenedFarmName = farmName;
    opening = true;
    setTimeout(() => {
      try { button.click(); } finally { opening = false; }
    }, 150);
  }

  function connect() {
    const stage = document.getElementById('zoomStage');
    const card = document.getElementById('farmCard');
    if (!stage && !card) return false;
    const observer = new MutationObserver(() => setTimeout(tryOpen, 30));
    if (stage) observer.observe(stage, { childList:true, characterData:true, subtree:true });
    if (card) observer.observe(card, { childList:true, characterData:true, attributes:true, subtree:true });
    document.addEventListener('click', () => setTimeout(tryOpen, 120));
    setTimeout(tryOpen, 700);
    return true;
  }

  function loadGameHud() {
    if (document.querySelector('script[data-ag-world-game-hud]')) return;
    const s = document.createElement('script');
    s.src = 'game-hud.js?v=20260902';
    s.dataset.agWorldGameHud = 'true';
    document.body.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadGameHud();
      if (!connect()) setTimeout(connect, 800);
    });
  } else {
    loadGameHud();
    if (!connect()) setTimeout(connect, 800);
  }
})();
