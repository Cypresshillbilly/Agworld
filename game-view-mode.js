/* AG WORLD dual-layer view controller.
   Logged-in users land in the HUD strategy view.
   The HUD is the fixed authenticated starting view; Escape/menu can return to the hub.
*/
(() => {
  const css = `
    /* HUD is the fixed authenticated landing view. */
    .ag-hud { display:block !important; }
    body.ag-premium-mode .ag-hud { display:block !important; }

    body.ag-premium-mode { display:block !important; background:#050706 !important; overflow:hidden !important; }
    body.ag-premium-mode .app-shell {
      position:fixed !important; inset:0 !important; width:100vw !important; height:100vh !important;
      max-width:none !important; max-height:none !important; margin:0 !important; transform:none !important;
      border-radius:0 !important; box-shadow:none !important; background:#050706 !important;
    }
    body.ag-premium-mode .sidebar,
    body.ag-premium-mode .missions,
    body.ag-premium-mode .bottom,
    body.ag-premium-mode .map-header,
    body.ag-premium-mode .map-status,
    body.ag-premium-mode .farm-card { display:none !important; }
    body.ag-premium-mode .map-area { position:absolute !important; inset:0 !important; width:100% !important; height:100% !important; background:#050706 !important; }
    body.ag-premium-mode .map { position:absolute !important; inset:0 !important; width:100% !important; height:100% !important; }

    .ag-hud .ag-menu { cursor:pointer !important; }
    .ag-hud .ag-menu::after { content:'HUB'; position:absolute; right:calc(100% + 8px); top:50%; transform:translateY(-50%); font:900 6px Arial,sans-serif; letter-spacing:1.5px; color:#cdbf86; opacity:.0; transition:opacity .15s ease; pointer-events:none; }
    .ag-hud .ag-menu:hover::after { opacity:1; }
  `;

  function install() {
    if (document.getElementById('ag-world-view-mode-style')) return;
    const style = document.createElement('style');
    style.id = 'ag-world-view-mode-style';
    style.textContent = css;
    document.head.appendChild(style);

    const enter = () => {
      document.body.classList.add('ag-premium-mode');
      window.__AG_WORLD_PREMIUM_MODE = true;
    };
    const exit = () => {
      document.body.classList.remove('ag-premium-mode');
      window.__AG_WORLD_PREMIUM_MODE = false;
    };
    window.agWorldEnterPremium = enter;
    window.agWorldExitPremium = exit;

    /* Clicking the map deliberately enters the full-screen game view. */
    document.addEventListener('pointerup', (event) => {
      if (!document.body.classList.contains('ag-premium-mode')) {
        const target = event.target instanceof Element ? event.target : null;
        if (target && target.closest('#map')) enter();
      }
    }, true);

    /* Escape returns from full-screen game view to the HUD. */
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && document.body.classList.contains('ag-premium-mode')) exit();
    });

    /* The full-screen game's menu returns to the HUD. */
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target || !document.body.classList.contains('ag-premium-mode')) return;
      const menu = target.closest('.ag-hud .ag-menu');
      if (menu) {
        event.preventDefault();
        event.stopPropagation();
        exit();
      }
    }, true);

    /* Login and every authenticated page refresh start in HUD mode. */
    window.addEventListener('agworld:authenticated', enter);
    if (sessionStorage.getItem('agworld.authenticated') === '1') enter();
    else exit();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
