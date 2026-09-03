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

    /* Logout control on the legacy Profile page. */
    .ag-profile-logout {
      position:absolute !important; right:18px !important; bottom:18px !important; z-index:60 !important;
      border:1px solid #ccd7dc !important; background:#fff !important; color:#26343d !important;
      border-radius:5px !important; padding:8px 13px !important; font:700 9px Arial,sans-serif !important;
      letter-spacing:.7px !important; cursor:pointer !important; box-shadow:0 2px 8px rgba(20,35,45,.12) !important;
    }
    .ag-profile-logout:hover { background:#f0f6f7 !important; }

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
    body.ag-game-mode .farm-card,
    body.ag-game-mode .ag-profile-logout { display:none !important; }
    body.ag-game-mode .map-area,
    body.ag-game-mode .map { position:absolute !important; inset:0 !important; width:100% !important; height:100% !important; background:#050706 !important; }
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

    const logout = () => {
      sessionStorage.removeItem('agworld.authenticated');
      localStorage.removeItem('agworld.rememberedLogin');
      document.body.classList.remove('ag-profile-mode', 'ag-game-mode', 'ag-premium-mode');
      window.__AG_WORLD_VIEW = 'login';
      window.__AG_WORLD_PREMIUM_MODE = false;
      document.getElementById('ag-login-gate')?.remove();
      window.location.reload();
    };

    window.agWorldEnterProfile = enterProfile;
    window.agWorldEnterPremium = enterGame;
    window.agWorldExitPremium = enterProfile;
    window.agWorldLogout = logout;

    /* Add one logout button to the legacy Profile page only. */
    const addLogout = () => {
      if (document.querySelector('.ag-profile-logout')) return;
      const button = document.createElement('button');
      button.className = 'ag-profile-logout';
      button.type = 'button';
      button.textContent = 'LOG OFF';
      button.setAttribute('aria-label', 'Log off AG World');
      button.addEventListener('click', logout);
      document.body.appendChild(button);
    };

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

    window.addEventListener('agworld:authenticated', () => {
      enterProfile();
      addLogout();
    });

    if (sessionStorage.getItem('agworld.authenticated') === '1') {
      enterProfile();
      addLogout();
    } else {
      document.body.classList.remove('ag-profile-mode', 'ag-game-mode', 'ag-premium-mode');
      window.__AG_WORLD_VIEW = 'login';
      window.__AG_WORLD_PREMIUM_MODE = false;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();