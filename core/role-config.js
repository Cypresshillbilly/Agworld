/* GAME CHANGER core role registry — industry-neutral role routing. */
window.GAME_CHANGER_ROLES = {
  administrator: { id:'administrator', label:'ADMINISTRATOR', landing:'admin.html', profilePage:'admin.html', environment:'platform' },
  agriculture_sales: { id:'agriculture_sales', label:'AGRICULTURE SALES REPRESENTATIVE', landing:'index.html', profilePage:'index.html', environment:'agriculture' }
};
(function(){
  const path=window.location.pathname;
  if(/\/admin\.html$/i.test(path)){
    const mission=document.createElement('script'); mission.src='core/mission-engine.js?v=20260903-role-build-scope-v2'; mission.defer=true; document.head.appendChild(mission);
    const library=document.createElement('script'); library.src='core/mission-library.js?v=20260903-mission-delete-v2'; library.defer=true; document.head.appendChild(library);
    const polish=document.createElement('script'); polish.src='core/admin-ui-polish.js?v=20260903-admin-v5'; polish.defer=true; document.head.appendChild(polish);
    return;
  }
  if(/\/index\.html$/i.test(path)||path==='/'||path===''){
    const sync=document.createElement('script'); sync.src='core/agri-mission-sync.js?v=20260903-authoritative-v3'; sync.defer=true; document.head.appendChild(sync);
  }
})();
