/* GAME CHANGER Agriculture build — sync Administrator missions to the Salesman Profile. */
(function(){
  'use strict';
  if (/\/admin\.html$/i.test(window.location.pathname)) return;

  const KEY = 'gamechanger.missions';
  const SALES_ROLE = 'agriculture_sales';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const read = () => {
    try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; }
    catch (_) { return []; }
  };
  const isAgriculture = mission => /^agriculture$/i.test(String(mission?.build || '').trim());
  const isSalesMission = mission => {
    const role = String(mission?.role || '*').trim().toLowerCase();
    return role === '*' || role === SALES_ROLE || role === 'salesman' || role === 'sales person' || role === 'salesperson';
  };
  const typeLabel = type => {
    const value = String(type || 'Mission').trim().toUpperCase();
    return value === 'FOLLOW-UP' ? 'FOLLOW-UP' : value;
  };
  const defaultDescription = mission => {
    const type = String(mission?.type || '').toLowerCase();
    if (type === 'visit') return 'Complete the assigned customer visit and record the outcome.';
    if (type === 'training') return 'Complete the assigned training activity and record the result.';
    if (type === 'opportunity') return 'Progress the assigned opportunity and record the next action.';
    return 'Complete this assigned mission according to the mission objective and success criteria.';
  };

  function render(){
    const panel = document.querySelector('.missions');
    if (!panel) return false;
    const missions = read().filter(isAgriculture).filter(isSalesMission);
    const title = panel.querySelector('h1');
    if (title) title.textContent = 'MISSION CONTROL';
    panel.querySelectorAll('.mission').forEach(card => card.remove());

    const sectionTitle = panel.querySelector('.section-title');
    if (sectionTitle) sectionTitle.textContent = missions.length ? 'Assigned missions' : 'Assigned missions';

    const anchor = sectionTitle || panel.lastElementChild;
    if (!missions.length) {
      const empty = document.createElement('div');
      empty.className = 'mission mission-empty';
      empty.innerHTML = '<div class="tag">MISSION LIBRARY</div><strong>No missions assigned</strong><p>There are currently no missions under Agri Build / Sales person for this profile.</p><div class="reward">MISSIONS ARE CONTROLLED BY THE ADMINISTRATOR</div>';
      anchor?.insertAdjacentElement('afterend', empty);
      return true;
    }

    missions.forEach(mission => {
      const card = document.createElement('div');
      card.className = 'mission';
      card.dataset.action = String(mission.type || 'custom').toLowerCase();
      card.dataset.adminMissionId = mission.id || '';
      const priority = String(mission.priority || 'Normal').toUpperCase();
      const type = typeLabel(mission.type);
      const description = mission.objective || defaultDescription(mission);
      const reward = Number(mission.xp ?? mission.profileXp ?? 0);
      card.innerHTML = `<div class="tag">${esc(type)} · ${esc(priority)} PRIORITY</div><strong>${esc(mission.name || 'Untitled mission')}</strong><p>${esc(description)}</p><div class="reward">+${Number.isFinite(reward) ? reward : 0} XP · ${esc(mission.success || 'Mission progress')}</div>`;
      anchor?.insertAdjacentElement('afterend', card);
    });
    return true;
  }

  function start(){
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (render() || tries > 80) clearInterval(timer);
    }, 100);
    window.addEventListener('storage', event => { if (event.key === KEY) render(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
