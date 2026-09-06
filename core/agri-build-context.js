/* Compatibility adapter. Build state is owned by core/build-registry.js. */
(function(){
  'use strict';
  const bind=()=>{
    if(!window.GAME_CHANGER_BUILD) return;
    const buttons=[...document.querySelectorAll('.build-switch button')];
    const refresh=()=>{
      const active=window.GAME_CHANGER_BUILD.get();
      buttons.forEach(button=>{
        const target=/agri|agriculture/i.test(button.textContent||'')?'agriculture':'financial_services';
        button.classList.toggle('active',active===target);
        button.setAttribute('aria-pressed',String(active===target));
      });
    };
    buttons.forEach(button=>{
      if(button.dataset.gcBuildBound) return;
      button.dataset.gcBuildBound='1';
      button.addEventListener('click',()=>{
        window.GAME_CHANGER_BUILD.set(/agri|agriculture/i.test(button.textContent||'')?'agriculture':'financial_services');
        refresh();
      });
    });
    refresh();
    window.addEventListener('gamechanger:build-changed',refresh);
  };
  if(window.GAME_CHANGER_READY) window.GAME_CHANGER_READY.then(bind); else window.addEventListener('gamechanger:core-ready',bind,{once:true});
})();