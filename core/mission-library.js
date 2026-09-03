/* GAME CHANGER Mission Library — administrator folder view for created missions. */
(function(){
  'use strict';
  if (!/\/admin\.html$/i.test(window.location.pathname)) return;

  const KEY = 'gamechanger.missions';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const read = () => {
    try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; }
    catch (_) { return []; }
  };
  const buildFolder = build => {
    const value = String(build || 'Agriculture').trim();
    return /^agriculture$/i.test(value) ? 'Agri missions' : value + ' missions';
  };
  const roleLabel = role => {
    if (!role || role === '*') return 'ALL ROLES';
    const registry = window.GAME_CHANGER_ROLES || {};
    return registry[role]?.label || role;
  };

  function inject(){
    if (document.getElementById('missionLibraryPanel')) return true;
    const territory = document.querySelector('.territory');
    const grid = document.querySelector('.admin-main .grid');
    if (!territory || !grid) return false;

    const panel = document.createElement('section');
    panel.id = 'missionLibraryPanel';
    panel.className = 'gc-mission-library';
    panel.innerHTML = `
      <div class="gc-ml-head">
        <div><div class="gc-ml-kicker">MISSION MANAGEMENT</div><h2>MISSION LIBRARY</h2><p>Created missions are organised by build and mission folder.</p></div>
        <div class="gc-ml-count" id="gcMissionCount">0 MISSIONS</div>
      </div>
      <div class="gc-ml-tree" id="gcMissionTree"></div>`;
    territory.insertAdjacentElement('afterend', panel);

    const style = document.createElement('style');
    style.id = 'gc-mission-library-style';
    style.textContent = `
      .gc-mission-library{margin:0 0 16px;padding:20px;border:1px solid #dfe4df;border-radius:13px;background:#fff;box-shadow:0 4px 18px rgba(30,45,35,.06)}
      .gc-ml-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding-bottom:14px;border-bottom:1px solid #e8ece8}
      .gc-ml-kicker{font-size:8px;letter-spacing:1.5px;color:#77931e;font-weight:900}.gc-ml-head h2{margin:5px 0 0;font-size:15px;letter-spacing:1px;color:#26302a}.gc-ml-head p{margin:6px 0 0;color:#7b857e;font-size:9px}.gc-ml-count{font-size:8px;letter-spacing:1px;color:#6f7b73;font-weight:900;white-space:nowrap;padding-top:3px}
      .gc-ml-tree{padding-top:13px}.gc-folder{border:1px solid #e3e8e3;border-radius:9px;margin-bottom:8px;overflow:hidden;background:#fbfcfb}.gc-folder-root{background:#f7f9f7}.gc-folder-head{display:flex;align-items:center;gap:9px;padding:11px 12px;font-size:10px;font-weight:900;color:#303a34}.gc-folder-head .folder-icon{font-size:14px}.gc-folder-path{margin-left:auto;font-size:7px;color:#909991;font-weight:700;letter-spacing:.7px}.gc-folder-children{padding:2px 12px 10px 34px}.gc-mission-file{display:flex;align-items:center;gap:9px;padding:9px 8px;border-top:1px solid #edf0ed;cursor:pointer}.gc-mission-file:hover{background:#f4f7f2}.gc-file-icon{font-size:12px;color:#91b322}.gc-file-name{font-size:9px;font-weight:800;color:#26302a}.gc-file-meta{margin-left:auto;font-size:7px;color:#8b958e;max-width:42%;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gc-empty{padding:17px 8px;color:#87918a;font-size:9px}.gc-ml-hint{margin-top:10px;font-size:8px;color:#8a948d}.gc-ml-selected{outline:2px solid rgba(168,213,31,.45);outline-offset:-2px}
      @media(max-width:700px){.gc-ml-head{flex-direction:column}.gc-folder-path,.gc-file-meta{display:none}}
    `;
    document.head.appendChild(style);
    return true;
  }

  function render(){
    if (!inject()) return false;
    const tree = document.getElementById('gcMissionTree');
    const count = document.getElementById('gcMissionCount');
    if (!tree) return false;
    const missions = read();
    if (count) count.textContent = `${missions.length} ${missions.length === 1 ? 'MISSION' : 'MISSIONS'}`;

    const groups = {};
    missions.forEach(mission => {
      const build = mission.build || 'Agriculture';
      const folder = mission.folder || buildFolder(build);
      groups[build] ||= {};
      groups[build][folder] ||= [];
      groups[build][folder].push(mission);
    });

    if (!missions.length) {
      tree.innerHTML = `<div class="gc-folder gc-folder-root"><div class="gc-folder-head"><span class="folder-icon">▣</span><span>Missions</span><span class="gc-folder-path">/</span></div><div class="gc-folder-children"><div class="gc-empty">No missions created yet. Use <b>MISSION ENGINE</b> to create the first mission.</div></div></div>`;
      return true;
    }

    let html = '';
    Object.keys(groups).sort().forEach(build => {
      html += `<div class="gc-folder gc-folder-root"><div class="gc-folder-head"><span class="folder-icon">▣</span><span>Missions</span><span class="gc-folder-path">/ ${esc(build)}</span></div><div class="gc-folder-children">`;
      Object.keys(groups[build]).sort().forEach(folder => {
        html += `<div class="gc-folder"><div class="gc-folder-head"><span class="folder-icon">📁</span><span>${esc(folder)}</span><span class="gc-folder-path">/Missions/${esc(folder)}</span></div><div class="gc-folder-children">`;
        groups[build][folder].forEach(mission => {
          html += `<div class="gc-mission-file" data-mission-id="${esc(mission.id)}" title="Open mission in Mission Engine"><span class="gc-file-icon">⚡</span><span class="gc-file-name">${esc(mission.name)}</span><span class="gc-file-meta">${esc(roleLabel(mission.role))}</span></div>`;
        });
        html += `</div></div>`;
      });
      html += `</div></div>`;
    });
    tree.innerHTML = html;

    tree.querySelectorAll('.gc-mission-file').forEach(file => file.addEventListener('click', () => {
      const mission = read().find(item => String(item.id) === String(file.dataset.missionId));
      if (!mission) return;
      document.getElementById('missionNav')?.click();
      setTimeout(() => {
        const name = document.getElementById('missionName');
        if (name) name.value = mission.name || '';
      }, 0);
    }));
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
