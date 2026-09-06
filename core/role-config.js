/* GAME CHANGER core role registry and deterministic page module loader. */
window.GAME_CHANGER_ROLES = {
  administrator: { id:'administrator', label:'ADMINISTRATOR', landing:'admin.html', profilePage:'admin.html', environment:'platform' },
  agriculture_sales: { id:'agriculture_sales', label:'AGRICULTURE SALES REPRESENTATIVE', landing:'index.html', profilePage:'index.html', environment:'agriculture' }
};
(function(){
  const path=window.location.pathname;
  const load=src=>{
    const s=document.createElement('script');s.src=src;s.defer=true;document.head.appendChild(s);return s;
  };
  load('core/bootstrap.js?v=architecture-v1');
  const start=()=>{
    if(/\/admin\.html$/i.test(path)){
      load('core/mission-engine.js?v=architecture-v1');
      load('core/mission-library.js?v=architecture-v1');
      load('core/admin-ui-polish.js?v=architecture-v1');
      return;
    }
    if(/\/index\.html$/i.test(path)||path==='/'||path===''){
      load('core/agri-mission-sync.js?v=architecture-v1');
      load('core/agri-mission-detail.js?v=architecture-v1');
    }
  };
  if(window.GAME_CHANGER_READY) window.GAME_CHANGER_READY.then(start); else window.addEventListener('gamechanger:core-ready',start,{once:true});
})();