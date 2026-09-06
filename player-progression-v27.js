// AG World Player Progression & Chapter Engine v27
(() => {
  const KEY = 'agworld-player-progression-v1';

  const CHAPTERS = [
    {
      id: 1,
      title: 'WELCOME TO THE COMPANY',
      subtitle: 'Your journey begins as a new employee of The Company.',
      minLevel: 1,
      targetLevel: 5,
      missions: [
        { id:'c1-welcome', title:'Welcome to The Company', type:'INTRODUCTION', xp:120, skill:'Company Knowledge', objective:'Read your welcome briefing and acknowledge your role in the Company.' },
        { id:'c1-hr', title:'Complete HR Onboarding', type:'ONBOARDING', xp:180, skill:'Professional Readiness', objective:'Complete your required employee onboarding information.' },
        { id:'c1-documents', title:'Submit Required Documents', type:'COMPLIANCE', xp:160, skill:'Compliance', objective:'Confirm that your required employment and qualification documents have been submitted.' },
        { id:'c1-safety', title:'Complete Mandatory Safety Training', type:'TRAINING', xp:200, skill:'Safety', objective:'Complete the Company mandatory safety and field conduct training.' },
        { id:'c1-company-training', title:'Complete Company Foundations', type:'TRAINING', xp:220, skill:'Company Knowledge', objective:'Learn how farms, assets, territories and Company control connect in AG World.' },
        { id:'c1-briefing', title:'Accept Your First Assignment', type:'INTRODUCTION', xp:120, skill:'Professional Readiness', objective:'Review your responsibilities and accept your progression into field operations.' }
      ]
    },
    {
      id: 2,
      title: 'LEARNING THE FIELD',
      subtitle: 'Learn the AG World systems by using them.',
      minLevel: 5,
      targetLevel: 10,
      missions: [
        { id:'c2-profile', title:'Update Your Player Profile', type:'TUTORIAL', xp:250, objective:'Complete the information required for your player profile.' },
        { id:'c2-explore', title:'Explore Your Territory', type:'TUTORIAL', xp:300, objective:'Navigate the Country, Province, Municipality and Town territory hierarchy.' },
        { id:'c2-survey', title:'Survey Your First Farm', type:'FIELD TRAINING', xp:350, objective:'Open and review a farm and its assets.' },
        { id:'c2-create', title:'Create Your First Farm', type:'FIELD TRAINING', xp:400, objective:'Create a new farm record inside the game world.' },
        { id:'c2-assets', title:'Understand Farm Assets', type:'TUTORIAL', xp:300, objective:'Identify how Our Drone and Competitor Drone affect Company control.' },
        { id:'c2-intelligence', title:'Review Territory Intelligence', type:'TUTORIAL', xp:350, objective:'Open a territory and review its Company Control information.' }
      ]
    },
    {
      id: 3,
      title: 'TERRITORY EXPANSION',
      subtitle: 'Turn real-world activity into Company growth.',
      minLevel: 10,
      targetLevel: null,
      missions: []
    }
  ];

  const state = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
      return {
        level: Math.max(1, saved.level || 1),
        xp: Math.max(0, saved.xp || 0),
        completed: saved.completed || {},
        skills: saved.skills || {},
        currentChapter: saved.currentChapter || 1,
        joined: saved.joined || new Date().toISOString()
      };
    } catch (_) {
      return { level:1, xp:0, completed:{}, skills:{}, currentChapter:1, joined:new Date().toISOString() };
    }
  })();

  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }

  function xpForLevel(level) {
    // 250 XP per level in the guided onboarding chapters.
    return level <= 10 ? (level - 1) * 250 : 2250 + (level - 10) * 400;
  }

  function nextLevelXp(level) {
    return xpForLevel(level + 1);
  }

  function recalculateLevel() {
    let level = 1;
    while (state.xp >= nextLevelXp(level)) level++;
    state.level = level;
  }

  function currentChapter() {
    if (state.level >= 10) return 3;
    if (state.level >= 5) return 2;
    return 1;
  }

  function missionStatus(mission) {
    return state.completed[mission.id] ? 'completed' : 'available';
  }

  function chapter(id) { return CHAPTERS.find(c => c.id === id); }

  function activeMission() {
    const c = chapter(currentChapter());
    return c?.missions.find(m => !state.completed[m.id]) || null;
  }

  function chapterProgress(c) {
    if (!c.missions.length) return { completed:0, total:0 };
    return { completed:c.missions.filter(m => state.completed[m.id]).length, total:c.missions.length };
  }

  function completeMission(id) {
    const c = chapter(currentChapter());
    const mission = c?.missions.find(m => m.id === id);
    if (!mission || state.completed[id]) return;

    state.completed[id] = new Date().toISOString();
    state.xp += mission.xp;
    if (mission.skill) state.skills[mission.skill] = (state.skills[mission.skill] || 0) + 1;

    // Chapter gates: completing Chapter 1 guarantees Level 5 and Chapter 2 guarantees Level 10.
    const progress = chapterProgress(c);
    if (progress.completed === progress.total) {
      const target = c.targetLevel;
      if (target) state.xp = Math.max(state.xp, xpForLevel(target));
    }

    recalculateLevel();
    state.currentChapter = currentChapter();
    save();
    syncHud();
    renderProgression();
    if (typeof toast === 'function') toast(`MISSION COMPLETE · ${mission.title} · +${mission.xp} XP`);
  }

  function renderProgression() {
    const panel = document.getElementById('playerProgressionPanel');
    if (!panel) return;
    const c = chapter(currentChapter());
    const progress = chapterProgress(c);
    const mission = activeMission();
    const currentFloor = xpForLevel(state.level);
    const next = nextLevelXp(state.level);
    const percent = Math.min(100, Math.round(((state.xp - currentFloor) / Math.max(1, next - currentFloor)) * 100));

    panel.innerHTML = `
      <div class="ag-progression-header">
        <div><span>PLAYER JOURNEY</span><strong>CHAPTER ${c.id} · ${c.title}</strong></div>
        <div class="ag-progression-level">LEVEL ${state.level}</div>
      </div>
      <div class="ag-progression-story">${c.subtitle}</div>
      <div class="ag-progression-xp"><div><span>XP</span><b>${state.xp} / ${next}</b></div><i><em style="width:${percent}%"></em></i></div>
      <div class="ag-progression-progress"><span>CHAPTER PROGRESS</span><b>${progress.completed} / ${progress.total || '∞'}</b></div>
      ${mission ? `
      <div class="ag-current-mission">
        <div class="ag-current-label">CURRENT MISSION · ${mission.type}</div>
        <strong>${mission.title}</strong>
        <p>${mission.objective}</p>
        <div><span>+${mission.xp} XP</span><button data-progression-complete="${mission.id}">COMPLETE MISSION</button></div>
      </div>
      ` : c.id === 3 ? `
        <div class="ag-current-mission"><div class="ag-current-label">ONGOING CAREER</div><strong>Territory Expansion Unlocked</strong><p>You are now ready for real-world missions that increase The Company's territorial control.</p></div>
      ` : '<div class="ag-current-mission">Chapter complete.</div>'}
      <div class="ag-chapter-mission-list">
        <div class="ag-mission-list-label">CHAPTER undefined MISSIONS</div>
        ${c.missions.map((m,i) => '<div class="ag-mission-list-row ' + (state.completed[m.id] ? 'done' : (mission?.id === m.id ? 'active' : 'locked')) + '"><b>' + (state.completed[m.id] ? '✓' : (i+1)) + '</b><span><strong>' + m.title + '</strong><small>' + m.type + ' · +' + m.xp + ' XP</small></span></div>').join('')}
      </div>
      <button class="ag-reset-player" data-reset-player>RESET PLAYER TO LEVEL 1</button>
    `;

    panel.querySelectorAll('[data-progression-complete]').forEach(button => {
      button.onclick = () => completeMission(button.dataset.progressionComplete);
    });
    panel.querySelector('[data-reset-player]')?.addEventListener('click', () => {
      if (confirm('Reset your player to Level 1 and restart Chapter 1? Your completed missions and progression XP will be cleared.')) reset();
    });
  }

  function syncText(selector, value) {
    document.querySelectorAll(selector).forEach(el => { el.textContent = value; });
  }

  function syncHud() {
    const next = nextLevelXp(state.level);
    const floor = xpForLevel(state.level);
    const pct = Math.min(100, Math.round(((state.xp-floor)/Math.max(1,next-floor))*100));

    syncText('.menu-user-level', 'LEVEL ' + state.level);
    syncText('.profile strong', (document.querySelector('.menu-user-role')?.textContent || 'EMPLOYEE'));
    syncText('.level', 'Level ' + state.level + ' · ' + state.xp.toLocaleString() + ' / ' + next.toLocaleString() + ' XP');
    syncText('.menu-user-xptext span', state.xp.toLocaleString() + ' / ' + next.toLocaleString() + ' XP');
    syncText('.menu-user-xptext b', pct + '%');
    syncText('.xptext span:last-child', pct + '%');
    syncText('.user-level strong', 'LEVEL ' + state.level);
    document.querySelectorAll('.menu-user-xp > span,.xpbar > span,.profile-xpbar > span').forEach(el => el.style.width = pct + '%');
    document.querySelectorAll('.profile-xptext span').forEach((el, i) => {
      el.textContent = i === 0 ? state.xp.toLocaleString() + ' / ' + next.toLocaleString() + ' XP' : pct + '%';
    });
  }

  function reset() {
    localStorage.removeItem(KEY);
    location.reload();
  }

  function createPanel() {
    const side = document.querySelector('.missions');
    if (!side) return;
    const panel = document.createElement('div');
    panel.id = 'playerProgressionPanel';
    const level = side.querySelector('.level');
    if (level) level.insertAdjacentElement('afterend', panel);
    else side.prepend(panel);
  }

  const style = document.createElement('style');
  style.textContent = `
    #playerProgressionPanel{margin:14px 0 18px;padding:13px;border:1px solid rgba(101,216,117,.25);background:rgba(101,216,117,.045);border-radius:12px}
    .ag-progression-header{display:flex;justify-content:space-between;gap:8px}.ag-progression-header span,.ag-current-label,.ag-progression-progress span{display:block;font-size:8px;letter-spacing:1.1px;color:#91a095;font-weight:900}.ag-progression-header strong{display:block;font-size:12px;margin-top:4px;color:#f4f7f1}.ag-progression-level{font-size:11px;font-weight:900;color:#65d875}
    .ag-progression-story{font-size:10px;line-height:1.45;color:#aeb9b0;margin:9px 0 11px}.ag-progression-xp>div,.ag-progression-progress{display:flex;justify-content:space-between;font-size:9px;color:#9eaca2;margin:7px 0}.ag-progression-xp b,.ag-progression-progress b{color:#dbe5dd}
    .ag-progression-xp i{display:block;height:7px;border-radius:99px;background:#263038;overflow:hidden}.ag-progression-xp em{display:block;height:100%;background:#65d875;border-radius:99px}
    .ag-current-mission{margin-top:12px;padding:11px;border-radius:9px;background:rgba(0,0,0,.2);border-left:3px solid #65d875}.ag-current-mission strong{display:block;font-size:13px;margin:5px 0;color:#fff}.ag-current-mission p{font-size:10px;line-height:1.45;color:#b2bdb4;margin:0 0 9px}.ag-current-mission>div:last-child{display:flex;align-items:center;justify-content:space-between;color:#65d875;font-size:9px;font-weight:800}.ag-current-mission button{border:1px solid rgba(101,216,117,.5);background:rgba(101,216,117,.1);color:#dff4e3;border-radius:6px;padding:6px 8px;font-size:8px;font-weight:900;cursor:pointer}
    .ag-chapter-mission-list{margin-top:12px;border-top:1px solid rgba(255,255,255,.07);padding-top:9px}.ag-mission-list-label{font-size:8px;letter-spacing:1.1px;color:#91a095;font-weight:900;margin-bottom:6px}.ag-mission-list-row{display:flex;gap:7px;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);opacity:.62}.ag-mission-list-row.active{opacity:1}.ag-mission-list-row.done{opacity:.85}.ag-mission-list-row b{width:17px;height:17px;border-radius:50%;display:grid;place-items:center;background:#263038;color:#aeb9b0;font-size:8px}.ag-mission-list-row.active b{background:#65d875;color:#0b1610}.ag-mission-list-row.done b{background:rgba(101,216,117,.18);color:#7bea89}.ag-mission-list-row strong,.ag-mission-list-row small{display:block}.ag-mission-list-row strong{font-size:9px;color:#dfe8e1}.ag-mission-list-row small{font-size:7px;color:#7e8b82;margin-top:2px}.ag-reset-player{width:100%;margin-top:12px;padding:7px;border-radius:6px;border:1px solid rgba(255,120,120,.28);background:rgba(255,90,90,.06);color:#ffb0b0;font-size:8px;font-weight:900;cursor:pointer}
  `;
  document.head.appendChild(style);

  createPanel();
  recalculateLevel();
  state.currentChapter = currentChapter();
  save();
  syncHud();
  renderProgression();

  window.AGWorldProgression = {
    getState: () => JSON.parse(JSON.stringify(state)),
    getChapters: () => JSON.parse(JSON.stringify(CHAPTERS)),
    completeMission,
    reset
  };
})();