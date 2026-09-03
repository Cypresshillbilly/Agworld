/* GAME CHANGER Administrator branding — use the supplied artwork, not text approximations. */
(() => {
  'use strict';
  if (!/\/admin\.html$/i.test(window.location.pathname)) return;

  const ASSET = 'assets/branding/game-changer/';
  const STACKED = ASSET + 'primary/game_changer_primary_white.png?v=20260903-admin-brand-v3';
  const HORIZONTAL = ASSET + 'horizontal/game_changer_horizontal_dark.png?v=20260903-admin-brand-v3';
  const ICON = ASSET + 'icon/game_changer_icon_dark.png?v=20260903-admin-brand-v3';

  function makeImage(src, alt, className) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    img.className = className;
    img.decoding = 'async';
    return img;
  }

  function install() {
    /* Long/narrow section: official stacked logo. */
    const sideMark = document.querySelector('.admin-side .gc-mark');
    if (sideMark) {
      sideMark.replaceChildren();
      sideMark.removeAttribute('style');
      sideMark.className = 'gc-mark';
      sideMark.appendChild(makeImage(STACKED, 'GAME CHANGER', 'gc-official-logo gc-stacked-logo'));
    }

    /* Wide section: official horizontal logo. */
    const eyebrow = document.querySelector('.admin-main .topbar .eyebrow');
    if (eyebrow) {
      eyebrow.replaceChildren();
      eyebrow.className = 'eyebrow gc-wide-brand';
      eyebrow.appendChild(makeImage(HORIZONTAL, 'GAME CHANGER', 'gc-horizontal-logo'));
    }

    /* Official icon in the administrator identity card. */
    const avatar = document.querySelector('.admin-side .admin-avatar');
    if (avatar) {
      avatar.replaceChildren();
      avatar.classList.add('gc-icon-avatar');
      avatar.appendChild(makeImage(ICON, 'GAME CHANGER', 'gc-icon-logo'));
    }

    let style = document.getElementById('gc-admin-brand-clean');
    if (!style) {
      style = document.createElement('style');
      style.id = 'gc-admin-brand-clean';
      document.head.appendChild(style);
    }
    style.textContent = `
      /* Remove legacy text/logo layers. */
      .admin-side .gc-mark{display:flex!important;align-items:flex-start!important;justify-content:flex-start!important;width:100%!important;height:96px!important;margin:0 0 4px!important;padding:0!important;background:none!important;font-size:0!important;line-height:0!important;color:transparent!important;overflow:hidden!important}
      .admin-side .gc-mark span,.admin-side .gc-mark small{display:none!important}

      /* Official stacked source artwork — preserve natural aspect ratio. */
      .admin-side .gc-mark .gc-stacked-logo{display:block!important;width:auto!important;max-width:205px!important;height:90px!important;max-height:90px!important;object-fit:contain!important;object-position:left top!important;background:transparent!important;border:0!important;box-shadow:none!important}

      /* Official horizontal source artwork for the wide header. */
      .admin-main .topbar .gc-wide-brand{display:flex!important;align-items:center!important;width:auto!important;height:38px!important;margin:0!important;padding:0!important;background:none!important;color:transparent!important;font-size:0!important;line-height:0!important;letter-spacing:0!important}
      .admin-main .topbar .gc-horizontal-logo{display:block!important;width:245px!important;max-width:245px!important;height:34px!important;max-height:34px!important;object-fit:contain!important;object-position:left center!important;background:transparent!important;border:0!important;box-shadow:none!important}

      /* Official icon — gives the administrator identity block a branded focal point. */
      .admin-side .admin-avatar.gc-icon-avatar{display:grid!important;place-items:center!important;padding:7px!important;overflow:hidden!important;background:#fff!important;border:1px solid rgba(168,213,31,.55)!important;border-radius:50%!important;box-shadow:0 0 0 3px rgba(168,213,31,.08)!important}
      .admin-side .admin-avatar .gc-icon-logo{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;background:transparent!important;border:0!important;box-shadow:none!important}
    `;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
