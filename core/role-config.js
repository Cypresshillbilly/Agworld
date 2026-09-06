/* GAME CHANGER core role registry and deterministic build-aware page loader. */
window.GAME_CHANGER_ROLES = {
  administrator: { id:'administrator', label:'ADMINISTRATOR', landing:'admin.html', profilePage:'admin.html', environment:'platform' },
  agriculture_sales: { id:'agriculture_sales', label:'AGRICULTURE SALES REPRESENTATIVE', landing:'index.html', profilePage:'index.html', environment:'agriculture' }
};
(function(){
  const path=(window.location.pathname.split('/').pop()||'index.html').toLowerCase();
  const load=src=>new Promise(resolve=>{
    if(document.querySelector('script[data-gc-module="'+src+'"]')) return resolve();
    const s=document.createElement('script');s.src=src;s.defer=true;s.dataset.gcModule=src;s.onload=resolve;s.onerror=resolve;document.head.appendChild(s);
  });
  load('core/bootstrap.js?v=admin-stable-v2');
  const start=()=>{
    if(path==='admin.html'){
      load('core/mission-engine.js?v=admin-stable-v2');
      load('core/mission-library.js?v=admin-stable-v2');
      load('core/admin-ui-polish.js?v=admin-stable-v2');
      return;
    }
    if(path==='index.html' || path===''){
      const build=window.GAME_CHANGER_BUILD?.current();
      if(build?.id==='agriculture'){
        const manifest=window.GAME_CHANGER_AGRICULTURE_BUILD;
        load(manifest?.login?.module||'builds/agriculture/login/login.module.js');
        load(manifest?.modules?.missions||'builds/agriculture/missions/missions.module.js');
        load(manifest?.modules?.profile||'builds/agriculture/profile/profile.module.js');
      }
    }
  };
  window.addEventListener('gamechanger:build-changed',()=>location.reload());
  if(window.GAME_CHANGER_READY) window.GAME_CHANGER_READY.then(start); else window.addEventListener('gamechanger:core-ready',start,{once:true});
})();