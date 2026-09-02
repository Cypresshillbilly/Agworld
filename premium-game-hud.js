/* AG WORLD — premium strategy HUD skin.
   Uses the existing game HUD structure, but restyles it with a restrained
   bronze/parchment/charcoal visual language inspired by premium 4X strategy
   games. No third-party game assets are copied.
*/
(() => {
  const css = `
  :root{--ag-gold:#d7c27a;--ag-gold-hi:#f0df9b;--ag-bronze:#806b3e;--ag-ink:#101312;--ag-panel:rgba(18,20,18,.91);--ag-panel2:rgba(30,29,24,.88);--ag-line:rgba(214,194,132,.42);--ag-muted:#aaa58e}
  .ag-hud{font-family:Georgia,'Times New Roman',serif;color:#eee9d8;text-shadow:0 1px 2px #000;letter-spacing:.15px}
  .ag-hud:before{content:'';position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 110px rgba(0,0,0,.38)}
  .ag-topbar{height:76px;padding:0 26px;gap:0;background:linear-gradient(180deg,rgba(9,11,10,.96) 0%,rgba(13,14,12,.88) 70%,rgba(13,14,12,0) 100%);align-items:center;border-bottom:1px solid rgba(215,194,122,.16)}
  .ag-emblem{position:absolute;left:50%;top:4px;transform:translateX(-50%);height:62px;width:280px;min-width:280px;margin:0;padding:0;border:0;justify-content:center;gap:0;display:flex}
  .ag-emblem-mark{display:none}
  .ag-emblem-title{position:relative;font-family:Georgia,'Times New Roman',serif;font-size:36px;line-height:1;font-weight:900;letter-spacing:5px;color:#eee9d8;text-transform:uppercase;text-shadow:0 2px 4px #000,0 0 16px rgba(0,0,0,.7)}
  .ag-emblem-title b{color:#d7c84f}
  .ag-emblem:after{content:'';position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:210px;height:1px;background:linear-gradient(90deg,transparent,var(--ag-gold),transparent);box-shadow:0 0 8px rgba(215,194,122,.25)}
  .ag-resource{height:48px;margin:0;padding:0 18px;border-right:1px solid rgba(214,194,132,.18);min-width:118px;justify-content:center}
  .ag-resource:first-of-type{margin-left:0}
  .ag-resource span{font-size:7px;letter-spacing:1.7px;color:#aaa58e}
  .ag-resource strong{font-size:15px;line-height:18px;color:#eee9d8}
  .ag-resource strong em{color:var(--ag-gold-hi);font-size:9px}
  .ag-topbar>.ag-resource:nth-of-type(2){margin-left:2px}
  .ag-turn{margin:0 16px 0 auto;min-width:138px;text-align:right}
  .ag-turn small{font-size:7px;letter-spacing:1.6px;color:#aaa58e}
  .ag-turn strong{font-size:12px;color:#ddd7c3}
  .ag-menu-button{margin:0;width:38px;height:38px;border:1px solid var(--ag-line);background:linear-gradient(180deg,rgba(56,51,38,.85),rgba(15,16,14,.92));color:var(--ag-gold-hi);box-shadow:inset 0 1px rgba(255,255,255,.12),0 3px 12px rgba(0,0,0,.45);border-radius:2px}

  .ag-leader,.ag-objective-main,.ag-selected,.ag-filter,.ag-notice,.ag-world-label,.ag-world-menu,.ag-action{background:linear-gradient(145deg,var(--ag-panel2),var(--ag-panel));border-color:var(--ag-line);border-radius:2px;box-shadow:0 8px 25px rgba(0,0,0,.48),inset 0 1px rgba(255,255,255,.08),inset 0 -1px rgba(0,0,0,.55)}
  .ag-leader{left:24px;top:91px;width:306px;min-height:91px;padding:10px;border-left:3px solid var(--ag-gold)}
  .ag-portrait{width:67px;height:67px;border-color:var(--ag-gold);box-shadow:0 0 0 2px rgba(0,0,0,.6),inset 0 0 15px rgba(0,0,0,.45)}
  .ag-leader-name{font-size:19px;letter-spacing:1.8px}
  .ag-leader-role{font-size:7px;color:#aaa58e;letter-spacing:1.3px}
  .ag-level{color:var(--ag-gold-hi);font-size:8px;letter-spacing:1.4px;margin-top:8px}
  .ag-xp{height:4px;background:#171a17;border:1px solid rgba(214,194,132,.18);padding:1px}
  .ag-xp i{background:linear-gradient(90deg,#a9924c,#e3ce79);box-shadow:0 0 7px rgba(215,194,122,.3)}
  .ag-xptext{font-size:7px;color:#bdb7a3}

  .ag-objective{right:24px;top:91px;width:315px}
  .ag-objective-main{min-height:91px;padding:12px 40px 11px 53px;border-left:3px solid var(--ag-gold);border-radius:2px}
  .ag-objective-icon{left:15px;top:17px;width:28px;height:28px;border-color:var(--ag-gold);box-shadow:0 0 0 2px rgba(0,0,0,.35)}
  .ag-objective-icon:before{border-color:var(--ag-gold)}
  .ag-objective-label{font-size:7px;letter-spacing:1.8px;color:var(--ag-gold-hi)}
  .ag-objective-title{font-size:16px;letter-spacing:.6px;margin-top:8px}
  .ag-objective-sub{font-size:7px;color:#aaa58e}
  .ag-objective-arrow{color:var(--ag-gold-hi)}
  .ag-objective-panel{background:rgba(14,15,13,.97);border-color:var(--ag-line);padding:14px}
  .ag-objective-panel h4{color:var(--ag-gold-hi);font-size:7px}
  .ag-objective-panel p{font-size:10px;color:#d2cdbb}
  .ag-objective-panel div{font-size:8px;color:#aaa58e}

  .ag-notices{right:24px;top:197px;width:250px;gap:7px}
  .ag-notice{padding:8px 11px;border-left:2px solid var(--ag-gold);background:rgba(13,15,14,.74);border-radius:1px}
  .ag-notice small{font-size:6px;letter-spacing:1.5px;color:var(--ag-gold-hi)}
  .ag-notice span{font-size:8px;color:#d5d0bf}

  .ag-world{left:24px;bottom:24px;width:295px;height:126px}
  .ag-minimap{width:108px;height:108px;border:2px solid var(--ag-gold);background:radial-gradient(circle at 35% 28%,#59635c,#26332e 40%,#0b1211 74%,#050807);box-shadow:0 8px 28px rgba(0,0,0,.72),inset 0 0 22px rgba(0,0,0,.6),0 0 0 2px rgba(0,0,0,.5)}
  .ag-minimap:before{inset:11px;background:linear-gradient(160deg,#4e5b52,#1d2a26 62%,#0a1110);box-shadow:inset 7px 7px 13px rgba(255,255,255,.08),inset -10px -12px 17px rgba(0,0,0,.6)}
  .ag-minimap:after{color:rgba(215,194,122,.72)}
  .ag-world-label{left:82px;bottom:15px;width:198px;height:50px;padding:9px 18px;border-left:0;border-radius:0 2px 2px 0}
  .ag-world-label strong{font-size:9px;letter-spacing:1.7px;color:var(--ag-gold-hi)}
  .ag-world-label span{font-size:7px;color:#aaa58e}
  .ag-world-menu{left:81px;bottom:67px;width:212px;padding:8px;border-color:var(--ag-line)}
  .ag-world-menu button{padding:9px;background:rgba(255,255,255,.025);border-color:rgba(214,194,132,.14);font-size:8px;color:#d0cbb9}
  .ag-world-menu button:hover{border-color:var(--ag-gold);color:var(--ag-gold-hi);background:rgba(215,194,122,.08)}

  .ag-actions{right:24px;bottom:24px;width:355px}
  .ag-selected{padding:10px 13px;margin-bottom:8px;min-height:51px;border-left:3px solid var(--ag-gold)}
  .ag-selected small{font-size:6px;letter-spacing:1.7px;color:#aaa58e}
  .ag-selected strong{font-size:15px;letter-spacing:.7px}
  .ag-selected em{color:var(--ag-gold-hi);font-size:8px;letter-spacing:1px}
  .ag-action-row{gap:4px}
  .ag-action{width:58px;height:52px;border-color:rgba(214,194,132,.35);position:relative}
  .ag-action:before{content:'';position:absolute;inset:3px;border:1px solid rgba(214,194,132,.09);pointer-events:none}
  .ag-action .ico{font-size:16px;color:var(--ag-gold-hi)}
  .ag-action span{font-size:5.5px;letter-spacing:1px;color:#c9c3b1}
  .ag-action:hover{border-color:var(--ag-gold);background:linear-gradient(180deg,rgba(67,59,39,.92),rgba(17,18,15,.95))}

  .ag-filter{right:24px;bottom:91px;width:286px;padding:15px;border-color:var(--ag-gold);border-radius:2px}
  .ag-filter-head{padding-bottom:10px;border-color:rgba(214,194,132,.18)}
  .ag-filter-head strong{font-size:8px;color:var(--ag-gold-hi)}
  .ag-filter-item{font-size:8px;color:#d0cbb9;padding:7px 4px}
  .ag-filter-item input{width:14px;height:14px;border-color:#77715f}
  .ag-filter-item input:checked{border-color:var(--ag-gold);background:#3c3521}
  .ag-filter-item input:checked:after{color:var(--ag-gold-hi)}
  .ag-filter-legend{font-size:6.5px;color:#aaa58e}
  .ag-green{background:#65b36b}.ag-red{background:#b85b55}

  /* Premium map treatment: let the satellite imagery remain the hero. */
  .map{filter:saturate(.9) contrast(1.04)}
  .ag-hud .ag-topbar,.ag-hud .ag-leader,.ag-hud .ag-objective,.ag-hud .ag-world,.ag-hud .ag-actions{backdrop-filter:blur(3px)}
  @media(max-width:900px){.ag-emblem{transform:translateX(-50%) scale(.72)}.ag-topbar{height:66px;padding:0 10px}.ag-leader{top:77px;left:10px}.ag-objective{top:77px;right:10px}.ag-notices{right:10px;top:180px}.ag-world{left:10px;bottom:10px}.ag-actions{right:10px;bottom:10px}}
  `;

  function apply(){
    if(document.getElementById('ag-world-premium-style')) return;
    const style=document.createElement('style');
    style.id='ag-world-premium-style';
    style.textContent=css;
    document.head.appendChild(style);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply); else apply();
})();
