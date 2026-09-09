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
        action: 'COMPLETE CAPTURE'
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
        action: 'COMPLETE EXPANSION'
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
      action: 'COMPLETE DEFENCE'
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
      <div class="ag-mission-bottom"><span>+${mission.xp} XP</span><button data-mission-action="${mission.id}">${done ? 'COMPLETED' : mission.action}</button></div>
    </div>`;
  }

  function farmCollection() {
    return typeof farms !== 'undefined' && Array.isArray(farms) ? farms : [];
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function hasCompetitor(value) {
    return /competitor\s*drone/i.test(String(typeof value === 'object' ? (value?.name || value?.label || value?.asset || value?.type || '') : value));
  }

  function isOurDrone(value) {
    return /our\s*drone/i.test(String(typeof value === 'object' ? (value?.name || value?.label || value?.asset || value?.type || '') : value));
  }

  function convertAssetList(list) {
    const source = Array.isArray(list) ? list : [];
    const firstObject = source.find(item => item && typeof item === 'object');
    const filtered = source.filter(item => !hasCompetitor(item));
    if (!filtered.some(isOurDrone)) {
      filtered.push(firstObject ? { ...clone(firstObject), name: 'Our Drone', label: 'Our Drone', asset: 'Our Drone', type: 'Our Drone' } : 'Our Drone');
    }
    return filtered;
  }

  function applyCompanyControl(farm) {
    if (!farm) return false;
    const arrayKeys = ['assets', 'assetList', 'farmAssets', 'equipment', 'drones'];
    let updatedAny = false;

    arrayKeys.forEach(key => {
      if (Array.isArray(farm[key])) {
        farm[key] = convertAssetList(farm[key]);
        updatedAny = true;
      }
    });

    // Always expose a canonical asset list so downstream game systems can
    // determine Company control even when an imported record had no list.
    if (!updatedAny) farm.assets = ['Our Drone'];
    else if (!Array.isArray(farm.assets)) farm.assets = ['Our Drone'];

    farm.control = 'company';
    farm.controlledBy = 'company';
    farm.owner = 'The Company';
    farm.companyControlled = true;
    farm.competitorControlled = false;
    return true;
  }

  function assetStateKey() { return 'agworld-farm-control-overrides-v1'; }

  function saveFarmOverride(farm) {
    try {
      const saved = JSON.parse(localStorage.getItem(assetStateKey()) || '{}');
      saved[String(farm.id)] = {
        assets: clone(farm.assets),
        assetList: clone(farm.assetList),
        farmAssets: clone(farm.farmAssets),
        equipment: clone(farm.equipment),
        drones: clone(farm.drones),
        control: farm.control,
        controlledBy: farm.controlledBy,
        owner: farm.owner,
        companyControlled: farm.companyControlled,
        competitorControlled: farm.competitorControlled
      };
      localStorage.setItem(assetStateKey(), JSON.stringify(saved));
    } catch (_) {}
  }

  function restoreFarmOverrides() {
    try {
      const saved = JSON.parse(localStorage.getItem(assetStateKey()) || '{}');
      farmCollection().forEach(farm => {
        const override = saved[String(farm.id)];
        if (!override) return;
        Object.entries(override).forEach(([key, value]) => {
          if (value !== undefined) farm[key] = clone(value);
        });
      });
    } catch (_) {}
  }

  function markMissionCompleted(mission) {
    const states = savedStates();
    states[mission.id] = { completed: true, completedAt: new Date().toISOString() };
    try { localStorage.setItem(missionStoreKey, JSON.stringify(states)); } catch (_) {}
  }

  function refreshTerritoryControl() {
    if (typeof initialiseGameTerritories === 'function') initialiseGameTerritories();

    const pools = [
      typeof countryTerritories !== 'undefined' ? countryTerritories : null,
      typeof provinces !== 'undefined' ? provinces : null,
      typeof municipalities !== 'undefined' ? municipalities : null,
      typeof towns !== 'undefined' ? towns : null,
      typeof territories !== 'undefined' ? territories : null
    ];

    pools.forEach(pool => {
      const list = Array.isArray(pool) ? pool : (pool ? [pool] : []);
      list.forEach(territory => {
        if (territory?._polygon && typeof applyTerritoryControlStyle === 'function') {
          applyTerritoryControlStyle(territory);
        }
      });
    });

    if (activeTerritory) {
      if (typeof territoryGameSummary === 'function' && typeof renderTerritoryInformationPanel === 'function') {
        renderTerritoryInformationPanel(activeTerritory, territoryGameSummary(activeTerritory));
      }
      activeMissions = buildTerritoryMissions(activeTerritory);
      window.__AG_WORLD_ACTIVE_MISSIONS = activeMissions;
      renderMissionSidebar();
      renderPanelMissions();

      // Keep the selected territory visibly highlighted after its normal
      // control colour is recalculated.
      if (activeTerritory?._polygon) {
        activeTerritory._polygon.setOptions({
          strokeColor: '#ffffff',
          strokeOpacity: 1,
          strokeWeight: 4
        });
      }

      const status = document.getElementById('mapStatus');
      if (status && typeof territoryGameSummary === 'function') {
        const summary = territoryGameSummary(activeTerritory);
        status.textContent = `${(typeof MASTER_PLAYER !== 'undefined' && MASTER_PLAYER?.name) || 'The Company'} control updated · ${String(activeTerritory.name)} · ${summary.control}% control · ${summary.company}/${summary.total} farms`;
      }
    }
  }

  async function completeMission(mission) {
    if (!mission || isCompleted(mission)) return;
    const farm = farmCollection().find(f => String(f.id) === String(mission.farmId));
    if (!farm) {
      if (typeof toast === 'function') toast('Mission farm could not be found.');
      return;
    }

    // Apply immediately for a responsive game, then write the same change to
    // the shared Company world with the authenticated employee as the actor.
    applyCompanyControl(farm);
    saveFarmOverride(farm);
    markMissionCompleted(mission);
    refreshTerritoryControl();

    try {
      const shared = window.AGWorldSharedFarms;
      if (!shared || !window.AGWorldBackend?.getUser?.()) throw new Error('Shared player session is not ready.');
      await shared.removeCompetitor(farm);
      await shared.addOurDrone(farm);

      const u = window.AGWorldBackend.getUser();
      const db = window.supabase?.createClient?.('https://vcnkspaljmsjvonftfcw.supabase.co','sb_publishable_azAO3PoKko79ccwSJFjkhQ_L67ZM85o');
      if (db && u) {
        await db.from('ag_mission_progress').upsert({
          player_id:u.id, mission_id:mission.id, chapter:3, status:'completed',
          mission_state:{farm_id:String(farm.id), territory_id:activeTerritory?.id||null},
          completed_at:new Date().toISOString(), updated_at:new Date().toISOString()
        },{onConflict:'player_id,mission_id'});
        await db.from('ag_career_events').insert({
          player_id:u.id,event_type:'territory_mission_completed',
          payload:{mission_id:mission.id,title:mission.title,farm_id:String(farm.id),territory_id:activeTerritory?.id||null,xp:mission.xp}
        });
        await db.from('ag_contributions').insert({
          player_id:u.id,contribution_type:'farm_conversion',mission_id:mission.id,
          territory_id:activeTerritory?.id||null,farm_id:String(farm.id),title:mission.title,xp:mission.xp,
          payload:{event:'our_drone_added',farm_name:farm.name}
        });
      }
      window.dispatchEvent(new CustomEvent('agworld:territory-mission-completed',{detail:{mission,farm}}));
    } catch (err) {
      console.error('Shared mission write failed',err);
      if (typeof toast === 'function') toast('Mission changed locally, but the shared database could not confirm the contribution.');
      return;
    }

    if (typeof toast === 'function') toast(`MISSION COMPLETE · ${farm.name} is now controlled by The Company · +${mission.xp} XP`);
  }

  function bindMissionActions(root) {
    if (!root) return;
    root.querySelectorAll('[data-mission-action]').forEach(button => {
      button.onclick = event => {
        event.stopPropagation();
        const mission = activeMissions.find(m => m.id === button.dataset.missionAction);
        if (!mission) return;
        completeMission(mission);
      };
    });
  }

  function renderMissionSidebar() {
    const side = document.querySelector('.missions');
    if (!side) return;

    // Chapters 1 and 2 are player progression chapters. The main My Missions
    // area belongs to the Chapter Engine until the player reaches Chapter 3.
    const progression = window.AGWorldProgression;
    const progressionState = progression?.getState?.();
    if (progressionState && Number(progressionState.currentChapter) < 3) {
      const oldList = document.getElementById('territoryMissionList');
      if (oldList) oldList.remove();
      return;
    }

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

  restoreFarmOverrides();
  renderMissionSidebar();
})();