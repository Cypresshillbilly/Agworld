/* GAME CHANGER Administrator UI polish.
   Keeps the admin workspace responsive and removes legacy/text logo layers. */
(function(){
  'use strict';
  if (!/\/admin\.html$/i.test(window.location.pathname)) return;

  const ROOT = 'assets/branding/game-changer/';
  const STACKED = ROOT + 'primary/game_changer_primary_white.png?v=20260903-admin-v4';
  const HORIZONTAL = ROOT + 'horizontal/game_changer_horizontal_dark.png?v=20260903-admin-v4';
  const ICON = ROOT + 'icon/game_changer_icon_dark.png?v=20260903-admin-v4';

  const css = document.createElement('style');
  css.id = 'gc-admin-ui-polish';
  css.textContent = `
    html,body{width:100%;min-width:0;overflow-x:hidden}
    .admin-shell{width:100%;min-height:100vh;grid-template-columns:230px minmax(0,1fr)!important}
    .admin-side{min-width:0;box-sizing:border-box;position:sticky;top:0;height:100vh;overflow-y:auto;overflow-x:hidden}
    .admin-main{min-width:0;box-sizing:border-box;width:100%;overflow-x:hidden}
    .gc-mark{height:92px;display:flex;align-items:flex-start;justify-content:flex-start;font-size:0!important;letter-spacing:0!important;line-height:1!important;overflow:hidden}
    .gc-mark .gc-official-stacked{display:block;width:min(155px,100%);height:auto;max-height:88px;object-fit:contain;object-position:left top}
    .topbar{min-width:0}
    .gc-wide-brand{display:block!important;height:42px!important;width:min(255px,42vw)!important;margin:0 0 7px!important;overflow:hidden}
    .gc-wide-brand .gc-official-horizontal{display:block;width:100%;height:100%;object-fit:contain;object-position:left center}
    .admin-avatar{overflow:hidden!important;padding:0!important}
    .admin-avatar .gc-official-icon{width:100%;height:100%;display:block;object-fit:cover;border-radius:50%}
    .metrics{grid-template-columns:repeat(4,minmax(0,1fr))!important}
    .grid{grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr)!important}
    .panel,.metric,.territory{min-width:0;box-sizing:border-box}
    .territory-grid{grid-template-columns:minmax(0,1.5fr) repeat(3,minmax(0,1fr))!important}
    @media(max-width:1050px){
      .admin-shell{grid-template-columns:210px minmax(0,1fr)!important}
      .admin-side{padding:22px 16px!important}
      .admin-main{padding:24px 22px 30px!important}
      .metrics{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      .territory-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      .grid{grid-template-columns:1fr!important}
    }
    @media(max-width:720px){
      .admin-shell{display:block!important}
      .admin-side{position:relative;height:auto;max-height:none;border-right:0!important;border-bottom:1px solid var(--gc-line);padding:16px!important}
      .gc-mark{height:62px!important;align-items:center!important}
      .gc-mark .gc-official-stacked{width:125px;max-height:58px}
      .admin-user{margin:14px 0!important}
      .admin-nav{grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
      .admin-nav button{padding:9px 10px;font-size:8px}
      .admin-main{padding:18px 14px 24px!important}
      .topbar{align-items:flex-start!important;flex-direction:column!important}
      .gc-wide-brand{width:220px!important;height:38px!important}
      .metrics,.territory-grid{grid-template-columns:1fr!important}
    }
    @media(max-width:460px){
      .admin-nav{grid-template-columns:1fr}
      .admin-main{padding:14px 10px 20px!important}
      .buildbar{align-items:flex-start!important;flex-direction:column!important}
      .form-grid{grid-template-columns:1fr!important}
      .field.full{grid-column:auto!important}
    }
  `;
  document.head.appendChild(css);

  function image(src, alt, className){
    const img=document.createElement('img');
    img.src=src; img.alt=alt; img.className=className; img.decoding='async';
    return img;
  }

  function install(){
    const mark=document.querySelector('.admin-side .gc-mark');
    if(mark){
      mark.replaceChildren(image(STACKED,'GAME CHANGER','gc-official-stacked'));
      mark.removeAttribute('style');
      mark.classList.add('gc-official-mark');
    }

    const eyebrow=document.querySelector('.admin-main .topbar .eyebrow');
    if(eyebrow){
      eyebrow.replaceChildren(image(HORIZONTAL,'GAME CHANGER','gc-official-horizontal'));
      eyebrow.textContent='';
      eyebrow.classList.add('gc-wide-brand');
    }

    const avatar=document.querySelector('.admin-side .admin-avatar');
    if(avatar){
      avatar.replaceChildren(image(ICON,'GAME CHANGER','gc-official-icon'));
      avatar.classList.add('gc-official-avatar');
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
