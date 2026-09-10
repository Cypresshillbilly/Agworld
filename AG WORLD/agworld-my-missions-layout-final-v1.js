/* AG WORLD — MY MISSIONS CANONICAL STACK
   Production layout lock:
   Player Profile → approved Skill Profile → single Mission Card → Advisor Bay.
   The Advisor Bay is the fixed lower boundary and aligns to the Command Center.
*/
(()=>{
  'use strict';

  const STYLE_ID = 'agworld-my-missions-canonical-stack-v3-style';
  const GAP = 8;
  const NOMINAL_MISSION_HEIGHT = 96;
  const MIN_MISSION_HEIGHT = 84;
  const MIN_SKILL_HEIGHT = 96;
  let resizeObserver = null;
  let raf = 0;

  const css = String.raw`
:root{
  --ag-mm-gap: 8px;
  --ag-mm-mission-h: 96px;
  --ag-mm-skill-h: 120px;
  --ag-advisor-top: 0px;
  --ag-advisor-height: 180px;
}

/* The My Missions column is a bounded vertical stage. */
html body.ag-profile-mode .missions,
html body.ag-game-mode .missions,
html body.ag-premium-mode .missions{
  position:relative !important;
  overflow:hidden !important;
  box-sizing:border-box !important;
}

/* Approved Player Profile remains visually untouched. */
html body.ag-profile-mode .missions #agPlayerMissionProfile,
html body.ag-game-mode .missions #agPlayerMissionProfile,
html body.ag-premium-mode .missions #agPlayerMissionProfile{
  position:relative !important;
  z-index:40 !important;
  box-sizing:border-box !important;
  margin:0 10px !important;
}

/* Approved Skill Profile: preserve its existing internal design and content.
   This file controls only the outer allocation of space. */
html body.ag-profile-mode .missions #agMissionSkillProfile,
html body.ag-profile-mode .missions .ag-mission-skill-profile,
html body.ag-game-mode .missions #agMissionSkillProfile,
html body.ag-game-mode .missions .ag-mission-skill-profile,
html body.ag-premium-mode .missions #agMissionSkillProfile,
html body.ag-premium-mode .missions .ag-mission-skill-profile{
  position:relative !important;
  z-index:35 !important;
  height:var(--ag-mm-skill-h) !important;
  min-height:0 !important;
  max-height:none !important;
  margin:var(--ag-mm-gap) 10px 0 !important;
  box-sizing:border-box !important;
  overflow:hidden !important;
}

/* Keep the original Skill Profile visual system intact. */
html body.ag-profile-mode .missions #agMissionSkillProfile *,
html body.ag-profile-mode .missions .ag-mission-skill-profile *,
html body.ag-game-mode .missions #agMissionSkillProfile *,
html body.ag-game-mode .missions .ag-mission-skill-profile *,
html body.ag-premium-mode .missions #agMissionSkillProfile *,
html body.ag-premium-mode .missions .ag-mission-skill-profile *{
  max-width:100% !important;
  box-sizing:border-box !important;
}

/* One readable current/next mission only, at the original compact card scale. */
html body.ag-profile-mode .missions #agLandingMissionCard,
html body.ag-game-mode .missions #agLandingMissionCard,
html body.ag-premium-mode .missions #agLandingMissionCard{
  display:block !important;
  visibility:visible !important;
  opacity:1 !important;
  position:relative !important;
  z-index:30 !important;
  height:var(--ag-mm-mission-h) !important;
  min-height:var(--ag-mm-mission-h) !important;
  max-height:var(--ag-mm-mission-h) !important;
  margin:var(--ag-mm-gap) 10px 0 !important;
  padding:10px 12px 9px 14px !important;
  box-sizing:border-box !important;
  overflow:hidden !important;
}

html body.ag-profile-mode .missions #agLandingMissionCard .tag,
html body.ag-game-mode .missions #agLandingMissionCard .tag,
html body.ag-premium-mode .missions #agLandingMissionCard .tag{
  display:block !important;
  margin-bottom:3px !important;
  font-size:9px !important;
  line-height:1.2 !important;
}

html body.ag-profile-mode .missions #agLandingMissionCard strong,
html body.ag-game-mode .missions #agLandingMissionCard strong,
html body.ag-premium-mode .missions #agLandingMissionCard strong{
  display:block !important;
  margin:0 0 3px !important;
  line-height:1.2 !important;
  overflow:hidden !important;
  text-overflow:ellipsis !important;
  white-space:nowrap !important;
}

html body.ag-profile-mode .missions #agLandingMissionCard p,
html body.ag-game-mode .missions #agLandingMissionCard p,
html body.ag-premium-mode .missions #agLandingMissionCard p{
  margin:0 !important;
  line-height:1.35 !important;
  overflow:hidden !important;
  display:-webkit-box !important;
  -webkit-box-orient:vertical !important;
  -webkit-line-clamp:2 !important;
}

html body.ag-profile-mode .missions #agLandingMissionCard .reward,
html body.ag-game-mode .missions #agLandingMissionCard .reward,
html body.ag-premium-mode .missions #agLandingMissionCard .reward{
  display:inline-flex !important;
  margin-top:4px !important;
}

/* Advisor Bay is the fixed lower boundary. It never overlaps the mission stack. */
html body.ag-profile-mode .missions #agAdvisorBay,
html body.ag-game-mode .missions #agAdvisorBay,
html body.ag-premium-mode .missions #agAdvisorBay{
  position:absolute !important;
  left:10px !important;
  right:10px !important;
  top:var(--ag-advisor-top) !important;
  height:var(--ag-advisor-height) !important;
  min-height:0 !important;
  max-height:none !important;
  margin:0 !important;
  box-sizing:border-box !important;
  overflow:hidden !important;
  z-index:20 !important;
}

/* Do not allow accidental transforms or negative margins to cross the Advisor boundary. */
html body.ag-profile-mode .missions #agLandingMissionCard,
html body.ag-game-mode .missions #agLandingMissionCard,
html body.ag-premium-mode .missions #agLandingMissionCard{
  transform:none !important;
}
`;

  function installStyle(){
    let style=document.getElementById(STYLE_ID);
    if(!style){
      style=document.createElement('style');
      style.id=STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent=css;
  }

  function getParts(){
    const missions=document.querySelector('.missions');
    if(!missions) return null;
    return {
      missions,
      command:document.getElementById('entityInformationSection'),
      player:missions.querySelector('#agPlayerMissionProfile'),
      skill:missions.querySelector('#agMissionSkillProfile,.ag-mission-skill-profile'),
      mission:missions.querySelector('#agLandingMissionCard'),
      bay:missions.querySelector('#agAdvisorBay')
    };
  }

  function normaliseOrder(parts){
    const {missions,player,skill,mission,bay}=parts;
    if(!missions||!player||!skill||!mission||!bay) return false;

    /* Move only these four canonical cards and only when their order is wrong. */
    const children=[...missions.children];
    const positions=[children.indexOf(player),children.indexOf(skill),children.indexOf(mission),children.indexOf(bay)];
    const ordered=positions.every((v,i)=>i===0||v>positions[i-1]);
    if(!ordered || player.parentElement!==missions || skill.parentElement!==missions || mission.parentElement!==missions || bay.parentElement!==missions){
      player.parentElement!==missions && missions.prepend(player);
      skill.parentElement!==missions && missions.appendChild(skill);
      mission.parentElement!==missions && missions.appendChild(mission);
      bay.parentElement!==missions && missions.appendChild(bay);
      player.insertAdjacentElement('afterend',skill);
      skill.insertAdjacentElement('afterend',mission);
      mission.insertAdjacentElement('afterend',bay);
    }
    return true;
  }

  function px(value){
    return Math.max(0,Math.round(value));
  }

  function layout(){
    const p=getParts();
    if(!p || !normaliseOrder(p)) return;

    const {missions,command,player,skill,mission,bay}=p;
    if(!command) return;

    const mr=missions.getBoundingClientRect();
    const cr=command.getBoundingClientRect();
    if(mr.width<=0 || mr.height<=0 || cr.height<=0) return;

    /* The Advisor Bay starts exactly where the Command Center starts. */
    const bayTop=px(Math.max(0,cr.top-mr.top));
    const bayHeight=px(Math.min(cr.height,Math.max(0,mr.bottom-cr.top)));
    if(bayTop<=0 || bayHeight<=0) return;

    missions.style.setProperty('--ag-advisor-top',bayTop+'px');
    missions.style.setProperty('--ag-advisor-height',bayHeight+'px');

    /* Measure the actual approved Player Profile rather than imposing a new design. */
    const pr=player.getBoundingClientRect();
    const playerBottom=px(pr.bottom-mr.top);

    const stackBottom=bayTop-GAP;
    const availableAfterPlayer=stackBottom-playerBottom-GAP;

    /* Keep the mission at the original compact size whenever physically possible.
       The Skill Profile receives all remaining space above it. */
    let missionHeight=NOMINAL_MISSION_HEIGHT;
    let skillHeight=availableAfterPlayer-missionHeight-GAP;

    if(skillHeight<MIN_SKILL_HEIGHT){
      const shortfall=MIN_SKILL_HEIGHT-skillHeight;
      missionHeight=Math.max(MIN_MISSION_HEIGHT,missionHeight-shortfall);
      skillHeight=availableAfterPlayer-missionHeight-GAP;
    }

    /* Final hard boundary: the mission may never cross into the Advisor Bay. */
    if(skillHeight<0){
      skillHeight=0;
      missionHeight=Math.max(MIN_MISSION_HEIGHT,availableAfterPlayer-GAP);
    }

    missions.style.setProperty('--ag-mm-mission-h',px(missionHeight)+'px');
    missions.style.setProperty('--ag-mm-skill-h',px(skillHeight)+'px');

    /* Verify actual geometry after the browser applies the new values. */
    requestAnimationFrame(()=>{
      const q=getParts();
      if(!q) return;
      const qmr=q.missions.getBoundingClientRect();
      const qcr=q.command?.getBoundingClientRect();
      if(!qcr || qmr.height<=0) return;

      const allowedTop=px(qcr.top-qmr.top)-GAP;
      const missionRect=q.mission.getBoundingClientRect();
      const skillRect=q.skill.getBoundingClientRect();
      const overflow=px(missionRect.bottom-qmr.top)-allowedTop;

      if(overflow>0){
        const nextSkill=Math.max(0,px(skillRect.height)-overflow);
        q.missions.style.setProperty('--ag-mm-skill-h',nextSkill+'px');
      }
    });
  }

  function schedule(){
    if(raf) cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{
      raf=0;
      layout();
    });
  }

  function start(){
    installStyle();
    schedule();

    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('load',schedule,{once:true});

    [
      'agworld:player-ready',
      'agworld:player-profile',
      'agworld:mission-completed',
      'agworld:advisor-selected',
      'agworld:landing-layout-ready'
    ].forEach(eventName=>window.addEventListener(eventName,schedule));

    if('ResizeObserver' in window){
      resizeObserver?.disconnect();
      resizeObserver=new ResizeObserver(schedule);
      const p=getParts();
      [p?.missions,p?.command,p?.player,p?.skill,p?.mission,p?.bay].filter(Boolean).forEach(el=>resizeObserver.observe(el));
    }

    [0,80,250,600,1200].forEach(delay=>setTimeout(schedule,delay));
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',start,{once:true});
  }else{
    start();
  }
})();