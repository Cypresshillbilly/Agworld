/* AG WORLD — two authenticated experiences.
   1. Login screen -> controlled by ag-auth.js
   2. Legacy Profile page -> original app-shell with map as a window
   3. Full Game view -> deliberate full-screen map with the game HUD
*/
(() => {
  const css = `
    /* The legacy profile page is the authenticated default. */
    body.ag-profile-mode { display:block !important; background:#050706 !important; overflow:auto !important; }

    /* Full Game is deliberately entered from the legacy map. */
    body.ag-game-mode { display:block !important; background:#050706 !important; overflow:hidden !important; }
    body.ag-game-mode .app-shell {
      position:fixed !important; inset:0 !important; width:100vw !important; height:100vh !important;
      max-width:none !important; max-height:none !important; margin:0 !important; transform:none !important;
      border-radius:0 !important; box-shadow:none !important; background:#050706 !important;
    }
    body.ag-game-mode .sidebar,
    body.ag-game-mode .missions,
    body.ag-game-mode .bottom,
    body.ag-game-mode .map-header,
    body.ag-game-mode .map-status,
    body.ag-game-mode .farm-card { display:none !important; }
    body.ag-game-mode .map-area,
    body.ag-game-mode .map { position:absolute !important; inset:0 !important; width:100% !important; height:100% !important; background:#050706 !important; }

    /* Game HUD is visible only in Full Game. */
    body.ag-game-mode .ag-hud { display:block !important; }
  `;

  function install() {
    if (document.getElementById('ag-world-view-mode-style')) return;
    const style = document.createElement('style');
    style.id = 'ag-world-view-mode-style';
    style.textContent = css;
    document.head.appendChild(style);

    const enterProfile = () => {
      document.body.classList.remove('ag-game-mode', 'ag-premium-mode');
      document.body.classList.add('ag-profile-mode');
      window.__AG_WORLD_VIEW = 'profile';
      window.__AG_WORLD_PREMIUM_MODE = false;
    };

    const enterGame = () => {
      document.body.classList.remove('ag-profile-mode');
      document.body.classList.add('ag-game-mode', 'ag-premium-mode');
      window.__AG_WORLD_VIEW = 'game';
      window.__AG_WORLD_PREMIUM_MODE = true;
    };

    window.agWorldEnterProfile = enterProfile;
    window.agWorldEnterPremium = enterGame;
    window.agWorldExitPremium = enterProfile;

    /* ONLY a deliberate click/tap on the legacy map enters Full Game. */
    document.addEventListener('pointerup', (event) => {
      if (!document.body.classList.contains('ag-profile-mode')) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target && target.closest('#map')) enterGame();
    }, true);

    /* Esc always returns Full Game -> legacy Profile page. */
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && document.body.classList.contains('ag-game-mode')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        enterProfile();
      }
    }, true);

    /* The game HUD menu also returns to the legacy Profile page. */
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target || !document.body.classList.contains('ag-game-mode')) return;
      const menu = target.closest('.ag-hud .ag-menu');
      if (menu) {
        event.preventDefault();
        event.stopPropagation();
        enterProfile();
      }
    }, true);

    /* Login and every authenticated refresh ALWAYS start on the legacy Profile page. */
    window.addEventListener('agworld:authenticated', enterProfile);
    if (sessionStorage.getItem('agworld.authenticated') === '1') enterProfile();
    else {
      document.body.classList.remove('ag-profile-mode', 'ag-game-mode', 'ag-premium-mode');
      window.__AG_WORLD_VIEW = 'login';
      window.__AG_WORLD_PREMIUM_MODE = false;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
