/* GAME CHANGER Agriculture build — mission cards are rendered ONLY from the Administrator Mission Library. */
(function(){
  'use strict';
  if (/\/admin\.html$/i.test(window.location.pathname)) return;

  const KEY = 'gamechanger.missions';
  const SALES_ROLE = 'agriculture_sales';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const readLibrary = () => { try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; } catch (_) { return []; } };

  function belongsToAgriSales(mission){
    const build = String(mission?.build || '').trim().toLowerCase();
    const role = String(mission?.role || '*').trim().toLowerCase();
    const agriculture = build === 'agriculture' || build === 'agri build' || build === 'agri';
    const sales = role === '*' || role === SALES_ROLE || role === 'salesman' || role === 'sales person' || role === 'salesperson';
    return agriculture && sales;
  }

  function render(){
    const panel = document.querySelector('.missions');
    if (!panel) return false;

    const library = readLibrary().filter(belongsToAgriSales);
    const current = [...panel.querySelectorAll('.mission')];
    const currentIds = current.map(card => card.dataset.adminMissionId || '').filter(Boolean);
    const desiredIds = library.map(mission => String(mission.id || ''));
    const correct = current.length === library.length && currentIds.length === desiredIds.length && currentIds.every((id, index) => id === desiredIds[index]);
    if (correct) return true;

    /* The existing view-mode script can recreate demonstration cards. Remove them completely. */
    current.forEach(card => card.remove());
    panel.querySelectorAll('.mission').forEach(card => card.remove());

    const sectionTitle = panel.querySelector('.section-title');
    if (sectionTitle) sectionTitle.textContent = 'Assigned missions';
    const anchor = sectionTitle || panel.lastElementChild;

    if (!library.length) {
      const empty = document.createElement('div');
      empty.className = 'mission mission-empty';
      empty.dataset.authoritativeEmpty = '1';
      empty.innerHTML = '<div class="tag">MISSION LIBRARY</div><strong>No missions assigned</strong><p>Your Administrator has not assigned a mission under Agri Build / Sales person yet.</p><div class="reward">NO MOCK MISSIONS · CONTROLLED BY MISSION LIBRARY</div>';
      anchor?.insertAdjacentElement('afterend', empty);
      return true;
    }

    library.forEach(mission => {
      const card = document.createElement('div');
      card.className = 'mission';
      card.dataset.adminMissionId = String(mission.id || '');
      card.dataset.action = String(mission.type || 'custom').toLowerCase();
      const type = String(mission.type || 'CUSTOM').trim().toUpperCase();
      const priority = String(mission.priority || 'Normal').trim().toUpperCase();
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
    let rendering = false;
    const refresh = () => {
      if (rendering) return;
      const signature = localStorage.getItem(KEY) || '';
      const panel = document.querySelector('.missions');
      if (!panel) return;
      const hasForeignCards = [...panel.querySelectorAll('.mission')].some(card => !card.dataset.adminMissionId && !card.dataset.authoritativeEmpty);
      if (signature !== lastSignature || hasForeignCards) {
        lastSignature = signature;
        rendering = true;
        render();
        rendering = false;
      }
    };

    const observe = () => {
      const panel = document.querySelector('.missions');
      if (!panel) return;
      const observer = new MutationObserver(() => {
        const foreign = [...panel.querySelectorAll('.mission')].some(card => !card.dataset.adminMissionId && !card.dataset.authoritativeEmpty);
        if (foreign) { rendering = true; render(); rendering = false; }
      });
      observer.observe(panel, { childList:true, subtree:true });
    };

    refresh();
    observe();
    window.addEventListener('storage', event => { if (event.key === KEY) { lastSignature = ''; refresh(); } });
    window.addEventListener('gamechanger:missions-changed', () => { lastSignature = ''; refresh(); });
    setInterval(refresh, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
})();
