/* AG World automatic farm-level visualisation.
   The game HUD is loaded once by index.html. This file only handles
   automatic farm-stage visualisation and must never inject a second HUD.
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!connect()) setTimeout(connect, 800);
    });
  } else {
    if (!connect()) setTimeout(connect, 800);
  }
})();
