// AG World Territory Missions v26
// Turns territory control data into actionable missions for the player.
(() => {
  const missionStoreKey = 'agworld-territory-missions-v1';
  let activeTerritory = null;
  let activeMissions = [];

  function controlType(farm) {
    return typeof farmAssetControl === 'function' ? farmAssetControl(farm) : 'neutral';
  }

  function missionForFarm(farm, territory, type, index) {
    const score = Number(farm.opportunityScore ?? (type === 'competitor' ? 90 : 70));
    if (type === 'competitor') {
      return {
        id: `capture-${territory.id}-${farm.id}`,
        type: 'CAPTURE',
        priority: 'HIGH',
        title: `Win ${farm.name}`,
        objective: 'Replace the competitor relationship with an Our Drone opportunity.',
        xp: 500 + Math.min(250, score * 2),
        farmId: farm.id,
        action: 'CAPTURE ACCOUNT'
      };
    }
    if (type === 'neutral') {
      return {
        id: `convert-${territory.id}-${farm.id}`,
        type: 'EXPAND',
        priority: score >= 70 ? 'HIGH' : 'MEDIUM',
        title: `Convert ${farm.name}`,
        objective: 'Qualify this neutral farm and place an Our Drone in its asset list.',
        xp: 350 + Math.min(200, score * 2),
        farmId: farm.id,
        action: 'OPEN FARM'
      };
    }
    return {
      id: `defend-${territory.id}-${farm.id}`,
      type: 'DEFEND',
      priority: 'LOW',
      title: `Protect ${farm.name}`,
      objective: 'Maintain the Company relationship and defend the existing account.',
      xp: 150,
      farmId: farm.id,
      action: 'OPEN FARM'
    };
  }

  function buildTerritoryMissions(territory) {
    if (!territory || typeof territoryGameSummary !== 'function') return [];
    const summary = territoryGameSummary(territory);
    const farmsInTerritory = summary.farms || [];
    const enemy = farmsInTerritory.filter(f => controlType(f) === 'competitor')
      .sort((a,b) => (b.opportunityScore || 0) - (a.opportunityScore || 0));
    const neutral = farmsInTerritory.filter(f => controlType(f) === 'neutral')
      .sort((a,b) => (b.opportunityScore || 0) - (a.opportunityScore || 0));
    const ours = farmsInTerritory.filter(f => controlType(f) === 'company');

    const missions = [
      ...enemy.slice(0, 3).map((farm, i) => missionForFarm(farm, territory, 'competitor', i)),
      ...neutral.slice(0, 3).map((farm, i) => missionForFarm(farm, territory, 'neutral', i))
    ];

    if (missions.length < 3 && ours.length) {
      missions.push(...ours.slice(0, 3 - missions.length).map((farm, i) => missionForFarm(farm, territory, 'company', i)));
    }
    return missions.slice(0, 6);
  }

  function savedStates() {
    try { return JSON.parse(localStorage.getItem(missionStoreKey) || '{}'); } catch (_) { return {}; }
  }

  function isCompleted(mission) {
    const states = savedStates();
    return !!states[mission.id]?.completed;
  }

  function missionHtml(mission, compact = false) {
    const done = isCompleted(mission);
    return `<div class="ag-mission-card ${mission.priority.toLowerCase()} ${done ? 'done' : ''}" data-mission-id="${mission.id}">
      <div class="ag-mission-top"><span class="ag-mission-type">${mission.type}</span><span class="ag-mission-priority">${done ? 'COMPLETED' : mission.priority}</span></div>
      <strong>${mission.title}</strong>
      ${compact ? '' : `<p>${mission.objective}</p>`}
      <div class="ag-mission-bottom"><span>+${mission.xp} XP</span><button data-mission-action="${mission.id}">${done ? 'REVIEW' : mission.action}</button></div>
    </div>`;
  }

  function bindMissionActions(root) {
    if (!root) return;
    root.querySelectorAll('[data-mission-action]').forEach(button => {
      button.onclick = event => {
        event.stopPropagation();
        const mission = activeMissions.find(m => m.id === button.dataset.missionAction);
        if (!mission) return;
        const farm = (typeof farms !== 'undefined' ? farms : []).find(f => f.id === mission.farmId);
        if (farm && typeof selectFarm === 'function') {
          selectFarm(farm, true);
          if (typeof toast === 'function') toast(`${mission.type} mission selected · ${mission.title}`);
        }
      };
    });
  }

  function renderMissionSidebar() {
    const side = document.querySelector('.missions');
    if (!side) return;
    let box = document.getElementById('territoryMissionList');
    if (!box) {
      box = document.createElement('div');
      box.id = 'territoryMissionList';
      const title = Array.from(side.querySelectorAll('.section-title')).find(el => /assigned missions/i.test(el.textContent || ''));
      if (title) title.insertAdjacentElement('afterend', box);
      else side.appendChild(box);
    }
    if (!activeTerritory) {
      box.innerHTML = '<div class="ag-mission-empty">Select a territory to generate missions.</div>';
      return;
    }
    box.innerHTML = activeMissions.length
      ? activeMissions.map(m => missionHtml(m, true)).join('')
      : '<div class="ag-mission-empty">No farms are available for missions in this territory yet.</div>';
    bindMissionActions(box);
  }

  function renderPanelMissions() {
    const panel = document.getElementById('territoryInfoPanel');
    if (!panel) return;
    let section = panel.querySelector('#territoryMissionPanel');
    if (!section) {
      section = document.createElement('div');
      section.id = 'territoryMissionPanel';
      const footer = panel.querySelector('.territory-info-footer');
      if (footer) footer.insertAdjacentElement('beforebegin', section);
      else panel.appendChild(section);
    }
    section.innerHTML = `<div class="ag-mission-heading"><span>ACTIVE MISSIONS</span><b>${activeMissions.length}</b></div>` +
      (activeMissions.length
        ? activeMissions.slice(0, 3).map(m => missionHtml(m, false)).join('')
        : '<div class="ag-mission-empty">No missions generated for this territory.</div>');
    bindMissionActions(section);
  }

  function setTerritoryMissions(territory) {
    activeTerritory = territory;
    activeMissions = buildTerritoryMissions(territory);
    window.__AG_WORLD_ACTIVE_MISSIONS = activeMissions;
    renderMissionSidebar();
    renderPanelMissions();
  }

  // Territory panel content is rendered by the GIS module, so inject missions
  // immediately after every territory selection and again after DOM updates.
  const previousSelectTerritory = window.selectTerritory;
  window.selectTerritory = function(territory, zoom) {
    const result = previousSelectTerritory ? previousSelectTerritory.call(this, territory, zoom) : undefined;
    setTimeout(() => setTerritoryMissions(territory), 0);
    return result;
  };



  const style = document.createElement('style');
  style.textContent = `
    #territoryMissionPanel{border-top:1px solid rgba(255,255,255,.1);margin-top:14px;padding-top:12px}
    .ag-mission-heading{display:flex;justify-content:space-between;align-items:center;font-size:10px;font-weight:900;letter-spacing:1px;color:#9db0a0;margin-bottom:8px}
    .ag-mission-heading b{background:rgba(101,216,117,.14);color:#65d875;border-radius:999px;padding:3px 7px}
    .ag-mission-card{border:1px solid rgba(255,255,255,.09);border-left:3px solid #768089;border-radius:9px;padding:9px;margin:7px 0;background:rgba(255,255,255,.035)}
    .ag-mission-card.high{border-left-color:#ff6f61}.ag-mission-card.medium{border-left-color:#e2c84e}.ag-mission-card.low{border-left-color:#57c9d4}.ag-mission-card.done{opacity:.6;border-left-color:#65d875}
    .ag-mission-top{display:flex;justify-content:space-between;font-size:8px;font-weight:900;letter-spacing:.8px;color:#9eaca2;margin-bottom:4px}
    .ag-mission-card strong{font-size:12px;display:block;color:#fff}
    .ag-mission-card p{font-size:10px;line-height:1.35;color:#b7c0b9;margin:5px 0 7px}
    .ag-mission-bottom{display:flex;justify-content:space-between;align-items:center;font-size:9px;color:#65d875;font-weight:800}
    .ag-mission-bottom button{border:1px solid rgba(101,216,117,.45);background:rgba(101,216,117,.09);color:#cfeeda;border-radius:6px;padding:5px 7px;font-size:8px;font-weight:900;cursor:pointer}
    #territoryMissionList{padding:10px 0}.missions .ag-mission-card{margin:8px 0}.missions .ag-mission-card strong{font-size:11px}.missions .ag-mission-bottom button{font-size:7px}
    .ag-mission-empty{font-size:10px;line-height:1.45;color:#819098;padding:12px 2px}
  `;
  document.head.appendChild(style);

  renderMissionSidebar();
})();