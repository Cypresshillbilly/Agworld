/* AG WORLD — three distinct views.
   1. Login screen       -> controlled by ag-auth.js
   2. Profile screen     -> legacy authenticated profile page
   3. Full game view     -> V1 full-screen game map
*/
(() => {
  const css = `
    /* PROFILE SCREEN: keep the legacy profile page, but make it fill the browser window. */
    body.ag-profile-mode { display:block !important; background:#eef1f3 !important; overflow:hidden !important; }
    body.ag-profile-mode .app-shell {
      position:fixed !important; inset:0 !important;
      width:100vw !important; height:100vh !important;
      max-width:none !important; max-height:none !important;
      margin:0 !important; transform:none !important;
      border-radius:0 !important; box-shadow:none !important;
    }

    /* The legacy Profile page keeps its original internal structure. */
    body.ag-profile-mode .sidebar { width:14.0625vw !important; }
    body.ag-profile-mode .missions { left:14.0625vw !important; width:22.265625vw !important; height:79.2682927vh !important; }
    body.ag-profile-mode .map-area { left:36.328125vw !important; height:79.2682927vh !important; }
    body.ag-profile-mode .bottom { left:14.0625vw !important; height:20.7317073vh !important; }

    /* Full Game View: only the V1 game map; Profile page is completely hidden. */
    body.ag-game-mode { display:block !important; background:#050706 !important; overflow:hidden !important; }
    body.ag-game-mode .app-shell {
      position:fixed !important; inset:0 !important;
      width:100vw !important; height:100vh !important;
      max-width:none !important; max-height:none !important;
      margin:0 !important; transform:none !important;
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

    /* Only a deliberate click on the Profile page's map enters Full Game. */
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

    document.addEventListener('pointerup', (event) => {
      if (!document.body.classList.contains('ag-profile-mode')) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target && target.closest('#map')) enterGame();
    }, true);

    window.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (!document.body.classList.contains('ag-game-mode')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      enterProfile();
    }, true);

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