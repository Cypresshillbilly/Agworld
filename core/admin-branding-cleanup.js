/* GAME CHANGER Administrator branding cleanup.
   Removes all previous text/background logo layers and mounts the source transparent master artwork once. */
(() => {
  'use strict';
  if (!/\/admin\.html$/i.test(window.location.pathname)) return;

  const LOGO = 'assets/branding/game-changer/game_changer_master_transparent.png?v=20260903-brand-clean';

  function install() {
    const sideMark = document.querySelector('.admin-side .gc-mark');
    if (sideMark) {
      sideMark.replaceChildren();
      sideMark.removeAttribute('style');
      sideMark.className = 'gc-mark';
      const img = document.createElement('img');
      img.src = LOGO;
      img.alt = 'GAME CHANGER';
      img.className = 'gc-official-logo gc-side-logo';
      sideMark.appendChild(img);
    }

    const eyebrow = document.querySelector('.admin-main .topbar .eyebrow');
    if (eyebrow) {
      eyebrow.replaceChildren();
      eyebrow.textContent = 'GAME CHANGER · ADMINISTRATOR';
      eyebrow.style.backgroundImage = 'none';
      eyebrow.style.width = 'auto';
      eyebrow.style.height = 'auto';
      eyebrow.style.fontSize = '9px';
      eyebrow.style.lineHeight = 'normal';
      eyebrow.style.color = '#6f8d22';
    }

    let style = document.getElementById('gc-admin-brand-clean');
    if (!style) {
      style = document.createElement('style');
      style.id = 'gc-admin-brand-clean';
      style.textContent = `
        .admin-side .gc-mark{display:flex!important;align-items:flex-start!important;justify-content:flex-start!important;width:100%!important;height:92px!important;margin:0 0 4px!important;padding:0!important;background:none!important;font-size:0!important;line-height:0!important;color:transparent!important;overflow:hidden!important}
        .admin-side .gc-mark .gc-official-logo{display:block!important;width:100%!important;max-width:220px!important;height:auto!important;max-height:92px!important;object-fit:contain!important;object-position:left top!important;background:transparent!important;border:0!important;box-shadow:none!important}
        .admin-side .gc-mark span,.admin-side .gc-mark small{display:none!important}
        .admin-main .topbar .eyebrow{background:none!important;background-image:none!important;display:block!important;width:auto!important;height:auto!important;margin:0!important;padding:0!important}
      `;
      document.head.appendChild(style);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
