/* GAME CHANGER core role registry — industry-neutral role routing. */
window.GAME_CHANGER_ROLES = {
  administrator: {
    id: 'administrator',
    label: 'ADMINISTRATOR',
    landing: 'admin.html',
    profilePage: 'admin.html',
    environment: 'platform'
  },
  agriculture_sales: {
    id: 'agriculture_sales',
    label: 'AGRICULTURE SALES REPRESENTATIVE',
    landing: 'index.html',
    profilePage: 'index.html',
    environment: 'agriculture'
  }
};

/* Administrator-only enhancements. */
(function(){
  if (!/\/admin\.html$/i.test(window.location.pathname)) return;
  const mission = document.createElement('script');
  mission.src = 'core/mission-engine.js?v=20260903-role-build-scope';
  mission.defer = true;
  document.head.appendChild(mission);
  const library = document.createElement('script');
  library.src = 'core/mission-library.js?v=20260903-mission-delete';
  library.defer = true;
  document.head.appendChild(library);
  const polish = document.createElement('script');
  polish.src = 'core/admin-ui-polish.js?v=20260903-admin-v4';
  polish.defer = true;
  document.head.appendChild(polish);
})();
