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

/* Load core administrator mission tooling only on the administrator page. */
(function(){
  if (!/\/admin\.html$/i.test(window.location.pathname)) return;
  const missionEngine = document.createElement('script');
  missionEngine.src = 'core/mission-engine.js?v=20260903-mission-folders';
  missionEngine.defer = true;
  document.head.appendChild(missionEngine);
  const missionLibrary = document.createElement('script');
  missionLibrary.src = 'core/mission-library.js?v=20260903-mission-folders';
  missionLibrary.defer = true;
  document.head.appendChild(missionLibrary);
})();
