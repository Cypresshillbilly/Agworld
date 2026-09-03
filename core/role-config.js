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

/* Load the core Mission Engine enhancements wherever the role registry is loaded. */
(function(){
  if (!/\/admin\.html$/i.test(window.location.pathname)) return;
  const script = document.createElement('script');
  script.src = 'core/mission-engine.js?v=20260903-role-build-scope';
  script.defer = true;
  document.head.appendChild(script);
})();
