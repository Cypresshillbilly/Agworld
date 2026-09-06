/* GAME CHANGER role registry and build-aware application loader. */
window.GAME_CHANGER_ROLES={
 administrator:{id:'administrator',label:'MASTER ADMINISTRATOR',landing:'master-admin.html',profilePage:'master-admin.html',environment:'platform'},
 agriculture_administrator:{id:'agriculture_administrator',label:'AGRICULTURE ADMINISTRATOR',landing:'admin.html',profilePage:'admin.html',environment:'agriculture'},
 agriculture_sales:{id:'agriculture_sales',label:'AGRICULTURE SALES REPRESENTATIVE',landing:'index.html',profilePage:'index.html',environment:'agriculture'}
};
(function(){
 const path=(window.location.pathname.split('/').pop()||'index.html').toLowerCase();
 const load=src=>new Promise(resolve=>{if(document.querySelector('script[data-gc-module="'+src+'"]'))return resolve();const s=document.createElement('script');s.src=src;s.defer=true;s.dataset.gcModule=src;s.onload=resolve;s.onerror=resolve;document.head.appendChild(s);});
 load('core/bootstrap.js?v=master-architecture-v1');
 const start=()=>{
   if(path==='admin.html'){
     const build=window.GAME_CHANGER_BUILD?.current();
     if(build?.id==='agriculture'){
       load('core/mission-engine.js?v=agriculture-admin-v1');
       load('core/mission-library.js?v=agriculture-admin-v1');
       load('core/admin-ui-polish.js?v=agriculture-admin-v1');
     }
     return;
   }
   if(path==='index.html'||path===''){
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
 if(window.GAME_CHANGER_READY)window.GAME_CHANGER_READY.then(start);else window.addEventListener('gamechanger:core-ready',start,{once:true});
})();