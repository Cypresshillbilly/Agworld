/* AG WORLD — three distinct views.
   1. Login screen       -> controlled by ag-auth.js
   2. Profile screen     -> authenticated HUD/profile experience
   3. Full game view     -> deliberate full-screen game map
*/
(() => {
  const css = `
    /* PROFILE SCREEN: HUD + clean live map background only. */
    .ag-hud { display:block !important; }
    body.ag-profile-mode { display:block !important; background:#050706 !important; overflow:hidden !important; }
    body.ag-profile-mode .app-shell {
      position:fixed !important; inset:0 !important; width:100vw !important; height:100vh !important;
      max-width:none !important; max-height:none !important; margin:0 !important; transform:none !important;
      border-radius:0 !important; box-shadow:none !important; background:#050706 !important;
    }
    body.ag-profile-mode .sidebar,
    body.ag-profile-mode .missions,
    body.ag-profile-mode .bottom,
    body.ag-profile-mode .map-header,
    body.ag-profile-mode .map-status,
    body.ag-profile-mode .farm-card { display:none !important; }
    body.ag-profile-mode .map-area,
    body.ag-profile-mode .map { position:absolute !important; inset:0 !important; width:100% !important; height:100% !important; background:#050706 !important; }

    /* FULL GAME VIEW: only the game map; the profile HUD is completely removed. */
    body.ag-game-mode { display:block !important; background:#050706 !important; overflow:hidden !important; }
    body.ag-game-mode .app-shell {
      position:fixed !important; inset:0 !important; width:100vw !important; height:100vh !important;
      max-width:none !important; max-height:none !important; margin:0 !important; transform:none !important;
      border-radius:0 !important; box-shadow:none !important; background:#050706 !important;
    }
    body.ag-game-mode .ag-hud,
    body.ag-game-mode .sidebar,
    body.ag-game-mode .missions,
    body.ag-game-mode .bottom,
    body.ag-game-mode .map-header,
    body.ag-game-mode .map-status,
    body.ag-game-mode .farm-card { display:none !important; }
    body.ag-game-mode .map-area,
    body.ag-game-mode .map { position:absolute !important; inset:0 !important; width:100% !important; height:100% !important; background:#050706 !important; }

    .ag-hud .ag-menu { cursor:pointer !important; }
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

    /* ONLY a deliberate map click moves Profile -> Full Game. */
    document.addEventListener('pointerup', (event) => {
      if (!document.body.classList.contains('ag-profile-mode')) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target && target.closest('#map')) enterGame();
    }, true);

    /* Escape always moves Full Game -> Profile. */
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && document.body.classList.contains('ag-game-mode')) enterProfile();
    });

    /* Game-view menu returns to the Profile screen. */
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

    /* Authentication and authenticated refresh ALWAYS start at Profile. */
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
