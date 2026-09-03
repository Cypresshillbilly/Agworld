/* GAME CHANGER Mission Library — Explorer-style administrator mission tree. */
(function(){
  'use strict';
  if (!/\/admin\.html$/i.test(window.location.pathname)) return;

  const KEY = 'gamechanger.missions';
  const OPEN_KEY = 'gamechanger.missionLibrary.openFolders';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const read = () => {
    try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; }
    catch (_) { return []; }
  };
  const write = missions => localStorage.setItem(KEY, JSON.stringify(missions));
  const readOpen = () => {
    try { const value = JSON.parse(localStorage.getItem(OPEN_KEY) || '{}'); return value && typeof value === 'object' ? value : {}; }
    catch (_) { return {}; }
  };
  const saveOpen = value => localStorage.setItem(OPEN_KEY, JSON.stringify(value));

  function buildFolder(build){
    const value = String(build || 'Agriculture').trim();
    if (/^agriculture$/i.test(value)) return 'Agri Build';
    return value || 'Other Build';
  }

  function roleFolder(role, build){
    if (!role || role === '*') return /^agriculture$/i.test(String(build || '')) ? 'All Sales People' : 'All Users';
    if (String(role).toLowerCase() === 'agriculture_sales') return 'Sales person';
    const registry = window.GAME_CHANGER_ROLES || {};
    const label = registry[role]?.label || role;
    return String(label).replace(/\s+Representative$/i,'').trim() || 'Sales person';
  }

  function folderId(parts){ return parts.map(p => String(p).toLowerCase().replace(/[^a-z0-9]+/g,'_')).join('__'); }

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
        <div><div class="gc-ml-kicker">MISSION MANAGEMENT</div><h2>MISSION LIBRARY</h2><p>Browse missions by build and salesperson, just like Windows Explorer.</p></div>
        <div class="gc-ml-count" id="gcMissionCount">0 MISSIONS</div>
      </div>
      <div class="gc-ml-toolbar">
        <button type="button" id="gcExpandAll">EXPAND ALL</button>
        <button type="button" id="gcCollapseAll">COLLAPSE ALL</button>
      </div>
      <div class="gc-ml-tree" id="gcMissionTree"></div>`;
    territory.insertAdjacentElement('afterend', panel);

    const style = document.createElement('style');
    style.id = 'gc-mission-library-style';
    style.textContent = `
      .gc-mission-library{margin:0 0 16px;padding:20px;border:1px solid #dfe4df;border-radius:13px;background:#fff;box-shadow:0 4px 18px rgba(30,45,35,.06)}
      .gc-ml-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding-bottom:13px;border-bottom:1px solid #e8ece8}
      .gc-ml-kicker{font-size:8px;letter-spacing:1.5px;color:#77931e;font-weight:900}.gc-ml-head h2{margin:5px 0 0;font-size:15px;letter-spacing:1px;color:#26302a}.gc-ml-head p{margin:6px 0 0;color:#7b857e;font-size:9px}.gc-ml-count{font-size:8px;letter-spacing:1px;color:#6f7b73;font-weight:900;white-space:nowrap;padding-top:3px}
      .gc-ml-toolbar{display:flex;justify-content:flex-end;gap:6px;padding:10px 0 2px}.gc-ml-toolbar button{border:1px solid #dfe5df;background:#fff;color:#68736b;border-radius:5px;padding:6px 8px;font-size:7px;font-weight:900;letter-spacing:.7px;cursor:pointer}.gc-ml-toolbar button:hover{background:#f4f7f2;border-color:#cbd6c8;color:#3e4b42}
      .gc-ml-tree{padding-top:8px}.gc-tree-folder{margin:2px 0}.gc-tree-row{display:flex;align-items:center;min-height:34px;border-radius:6px;cursor:pointer;color:#303a34}.gc-tree-row:hover{background:#f3f6f2}.gc-tree-row.is-selected{background:#edf5df}.gc-tree-toggle{width:22px;height:22px;display:grid;place-items:center;border:0;background:transparent;color:#6f7b73;font-size:11px;cursor:pointer;flex:0 0 22px}.gc-tree-icon{width:20px;text-align:center;font-size:13px;flex:0 0 20px}.gc-tree-name{font-size:9px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gc-tree-path{margin-left:auto;padding-right:9px;color:#9aa39c;font-size:7px;letter-spacing:.4px;white-space:nowrap}.gc-tree-children{margin-left:22px;border-left:1px solid #e5eae5;padding-left:5px}.gc-tree-mission{display:flex;align-items:center;gap:5px;min-height:32px;padding:0 4px 0 1px;border-radius:6px}.gc-tree-mission:hover{background:#f3f6f2}.gc-mission-open{display:flex;align-items:center;gap:7px;min-width:0;flex:1;border:0;background:transparent;text-align:left;cursor:pointer;padding:7px 2px;color:#26302a}.gc-file-icon{font-size:11px;color:#91b322}.gc-file-name{font-size:9px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.gc-file-meta{margin-left:auto;font-size:7px;color:#8b958e;max-width:24%;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gc-delete-mission{border:1px solid #e2caca;background:#fff7f7;color:#a33b3b;border-radius:5px;padding:5px 7px;font-size:7px;font-weight:900;letter-spacing:.6px;cursor:pointer}.gc-delete-mission:hover{background:#fbeaea}.gc-empty{padding:17px 8px;color:#87918a;font-size:9px}
      @media(max-width:700px){.gc-ml-head{flex-direction:column}.gc-tree-path,.gc-file-meta{display:none}.gc-tree-children{margin-left:15px}.gc-delete-mission{padding:5px}}
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
      const build = buildFolder(mission.build);
      const role = roleFolder(mission.role, mission.build);
      groups[build] ||= {};
      groups[build][role] ||= [];
      groups[build][role].push(mission);
    });

    if (!missions.length) {
      tree.innerHTML = `<div class="gc-tree-folder"><div class="gc-tree-row"><span class="gc-tree-toggle">▸</span><span class="gc-tree-icon">📁</span><span class="gc-tree-name">Missions</span></div><div class="gc-tree-children"><div class="gc-empty">No missions created yet. Use <b>MISSION ENGINE</b> to create the first mission.</div></div></div>`;
      return true;
    }

    const open = readOpen();
    const rootId = folderId(['Missions']);
    if (open[rootId] === undefined) open[rootId] = true;

    let html = `<div class="gc-tree-folder" data-folder-id="${rootId}"><div class="gc-tree-row gc-folder-toggle" data-folder-id="${rootId}"><button type="button" class="gc-tree-toggle" tabindex="-1">${open[rootId] ? '▾' : '▸'}</button><span class="gc-tree-icon">📁</span><span class="gc-tree-name">Missions</span><span class="gc-tree-path">/</span></div>`;
    html += `<div class="gc-tree-children" data-children-for="${rootId}" style="display:${open[rootId] ? 'block' : 'none'}">`;

    Object.keys(groups).sort().forEach(build => {
      const buildId = folderId(['Missions', build]);
      if (open[buildId] === undefined) open[buildId] = true;
      html += `<div class="gc-tree-folder" data-folder-id="${buildId}"><div class="gc-tree-row gc-folder-toggle" data-folder-id="${buildId}"><button type="button" class="gc-tree-toggle" tabindex="-1">${open[buildId] ? '▾' : '▸'}</button><span class="gc-tree-icon">📁</span><span class="gc-tree-name">${esc(build)}</span><span class="gc-tree-path">/Missions/${esc(build)}</span></div>`;
      html += `<div class="gc-tree-children" data-children-for="${buildId}" style="display:${open[buildId] ? 'block' : 'none'}">`;

      Object.keys(groups[build]).sort().forEach(role => {
        const roleId = folderId(['Missions', build, role]);
        if (open[roleId] === undefined) open[roleId] = true;
        html += `<div class="gc-tree-folder" data-folder-id="${roleId}"><div class="gc-tree-row gc-folder-toggle" data-folder-id="${roleId}"><button type="button" class="gc-tree-toggle" tabindex="-1">${open[roleId] ? '▾' : '▸'}</button><span class="gc-tree-icon">📁</span><span class="gc-tree-name">${esc(role)}</span><span class="gc-tree-path">/Missions/${esc(build)}/${esc(role)}</span></div>`;
        html += `<div class="gc-tree-children" data-children-for="${roleId}" style="display:${open[roleId] ? 'block' : 'none'}">`;
        groups[build][role].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''))).forEach(mission => {
          html += `<div class="gc-tree-mission" data-mission-id="${esc(mission.id)}"><button type="button" class="gc-mission-open" title="Open mission in Mission Engine"><span class="gc-file-icon">⚡</span><span class="gc-file-name">${esc(mission.name)}</span><span class="gc-file-meta">${esc(mission.role === '*' ? 'ALL ROLES' : mission.role || '')}</span></button><button type="button" class="gc-delete-mission" data-delete-id="${esc(mission.id)}" title="Delete mission">DELETE</button></div>`;
        });
        html += `</div></div>`;
      });
      html += `</div></div>`;
    });
    html += `</div></div>`;
    tree.innerHTML = html;
    saveOpen(open);

    tree.querySelectorAll('.gc-folder-toggle').forEach(row => row.addEventListener('click', () => {
      const id = row.dataset.folderId;
      const state = readOpen();
      state[id] = state[id] === false;
      saveOpen(state);
      const children = tree.querySelector(`[data-children-for="${CSS.escape(id)}"]`);
      const toggle = row.querySelector('.gc-tree-toggle');
      if (children) children.style.display = state[id] ? 'block' : 'none';
      if (toggle) toggle.textContent = state[id] ? '▾' : '▸';
    }));

    tree.querySelectorAll('.gc-delete-mission').forEach(button => button.addEventListener('click', event => {
      event.stopPropagation();
      const id = String(button.dataset.deleteId || '');
      const mission = read().find(item => String(item.id) === id);
      if (!mission) return;
      if (!window.confirm(`Delete mission "${mission.name || 'Unnamed mission'}"?\n\nThis will remove it from the Mission Library.`)) return;
      write(read().filter(item => String(item.id) !== id));
      render();
    }));

    tree.querySelectorAll('.gc-mission-open').forEach(button => button.addEventListener('click', event => {
      event.stopPropagation();
      const row = button.closest('.gc-tree-mission');
      const mission = read().find(item => String(item.id) === String(row?.dataset.missionId));
      if (!mission) return;
      document.getElementById('missionNav')?.click();
      setTimeout(() => {
        const name = document.getElementById('missionName');
        if (name) name.value = mission.name || '';
      }, 0);
    }));
    return true;
  }

  function setAll(value){
    const state = {};
    const rows = document.querySelectorAll('#gcMissionTree .gc-folder-toggle');
    rows.forEach(row => { state[row.dataset.folderId] = value; });
    saveOpen(state);
    render();
  }

  function start(){
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (render() || tries > 80) clearInterval(timer);
    }, 100);
    document.addEventListener('click', event => {
      if (event.target.closest('#gcExpandAll')) setAll(true);
      if (event.target.closest('#gcCollapseAll')) setAll(false);
    });
    window.addEventListener('storage', event => { if (event.key === KEY) render(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
