/* GAME CHANGER Agriculture build — the Salesman Profile reads its missions from the Administrator Mission Library. */
(function(){
  'use strict';
  if (/\/admin\.html$/i.test(window.location.pathname)) return;

  const KEY = 'gamechanger.missions';
  const normal = value => String(value || '').trim().toLowerCase().replace(/[\s_-]+/g,' ');
  const read = () => {
    try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; }
    catch (_) { return []; }
  };
  const isAgriculture = mission => ['agriculture','agri build','agri'].includes(normal(mission?.build));
  const isSalesRole = mission => {
    const role = normal(mission?.role || '*');
    return role === '*' || ['agriculture sales','agriculture sales representative','agriculture salesman','salesman','sales person','salesperson'].includes(role) || role.replace(/ /g,'_') === 'agriculture_sales';
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function render(){
    const panel = document.querySelector('.missions');
    const sectionTitle = panel?.querySelector('.section-title');
    if (!panel || !sectionTitle) return false;

    const missions = read().filter(isAgriculture).filter(isSalesRole);
    panel.querySelectorAll('.mission').forEach(card => card.remove());
    sectionTitle.textContent = 'Assigned missions';

    let anchor = sectionTitle;
    if (!missions.length) {
      const empty = document.createElement('div');
      empty.className = 'mission mission-empty';
      empty.innerHTML = '<div class="tag">MISSION LIBRARY</div><strong>No missions assigned</strong><p>The Administrator has not assigned any missions to the Agri Build / Sales person profile yet.</p><div class="reward">MISSIONS ARE CONTROLLED BY THE ADMINISTRATOR</div>';
      anchor.insertAdjacentElement('afterend', empty);
      return true;
    }

    missions.forEach(mission => {
      const card = document.createElement('div');
      card.className = 'mission';
      card.dataset.action = normal(mission.type).replace(/ /g,'-') || 'custom';
      card.dataset.adminMissionId = mission.id || '';
      const type = String(mission.type || 'Custom').toUpperCase();
      const priority = String(mission.priority || 'Normal').toUpperCase();
      const objective = mission.objective || 'Complete the assigned mission and record the required outcome.';
      const success = mission.success || 'Mission completed according to the defined success criteria.';
      const xp = Number(mission.xp ?? mission.profileXp ?? 0);
      card.innerHTML = `<div class="tag">${esc(type)} · ${esc(priority)} PRIORITY</div><strong>${esc(mission.name || 'Untitled mission')}</strong><p>${esc(objective)}</p><div class="reward">+${Number.isFinite(xp) ? xp : 0} XP · ${esc(success)}</div>`;
      anchor.insertAdjacentElement('afterend', card);
      anchor = card;
    });
    return true;
  }

  function start(){
    let tries = 0;
    const timer = setInterval(() => { tries += 1; if (render() || tries > 120) clearInterval(timer); }, 100);
    window.addEventListener('storage', event => { if (event.key === KEY) render(); });
    window.addEventListener('gamechanger:missions-changed', render);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
