/* GAME CHANGER Agriculture build — mission cards are rendered ONLY from the Administrator Mission Library. */
(function(){
  'use strict';
  if (/\/admin\.html$/i.test(window.location.pathname)) return;

  const KEY = 'gamechanger.missions';
  const SALES_ROLE = 'agriculture_sales';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const readLibrary = () => {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  };

  function belongsToAgriSales(mission){
    const build = String(mission?.build || '').trim().toLowerCase();
    const role = String(mission?.role || '*').trim().toLowerCase();
    const agriculture = build === 'agriculture' || build === 'agri build' || build === 'agri';
    const sales = role === '*' || role === SALES_ROLE || role === 'salesman' || role === 'sales person' || role === 'salesperson';
    return agriculture && sales;
  }

  function priorityLabel(value){
    const v = String(value || 'Normal').trim().toUpperCase();
    return v === 'HIGH' ? 'HIGH' : v === 'LOW' ? 'LOW' : 'NORMAL';
  }

  function render(){
    const panel = document.querySelector('.missions');
    if (!panel) return false;

    /* Remove every old/mock mission card. The library is the sole source of truth. */
    panel.querySelectorAll('.mission').forEach(card => card.remove());

    const sectionTitle = panel.querySelector('.section-title');
    if (sectionTitle) sectionTitle.textContent = 'Assigned missions';

    const missions = readLibrary().filter(belongsToAgriSales);
    const anchor = sectionTitle || panel.lastElementChild;

    if (!missions.length) {
      const empty = document.createElement('div');
      empty.className = 'mission mission-empty';
      empty.innerHTML = '<div class="tag">MISSION LIBRARY</div><strong>No missions assigned</strong><p>Your Administrator has not assigned a mission under Agri Build / Sales person yet.</p><div class="reward">NO MOCK MISSIONS · CONTROLLED BY MISSION LIBRARY</div>';
      anchor?.insertAdjacentElement('afterend', empty);
      return true;
    }

    missions.forEach(mission => {
      const card = document.createElement('div');
      card.className = 'mission';
      card.dataset.adminMissionId = String(mission.id || '');
      card.dataset.action = String(mission.type || 'custom').toLowerCase();
      const type = String(mission.type || 'CUSTOM').trim().toUpperCase();
      const priority = priorityLabel(mission.priority);
      const objective = String(mission.objective || '').trim();
      const success = String(mission.success || '').trim();
      const xp = Number(mission.xp || 0);
      card.innerHTML = `<div class="tag">${esc(type)} · ${esc(priority)} PRIORITY</div><strong>${esc(mission.name || 'Untitled mission')}</strong>${objective ? `<p>${esc(objective)}</p>` : ''}<div class="reward">+${Number.isFinite(xp) ? xp : 0} XP${success ? ` · ${esc(success)}` : ''}</div>`;
      anchor?.insertAdjacentElement('afterend', card);
    });
    return true;
  }

  function start(){
    let lastSignature = '';
    const refresh = () => {
      const signature = localStorage.getItem(KEY) || '';
      if (signature !== lastSignature) {
        lastSignature = signature;
        render();
      } else if (!document.querySelector('.missions .mission')) {
        render();
      }
    };
    refresh();
    window.addEventListener('storage', event => { if (event.key === KEY) { lastSignature = ''; refresh(); } });
    window.addEventListener('gamechanger:missions-changed', () => { lastSignature = ''; refresh(); });
    setInterval(refresh, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
