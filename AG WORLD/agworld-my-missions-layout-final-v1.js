/* AG WORLD — MY MISSIONS FIT LOCK v1
   Canonical landing order and geometry:
   Player Profile → Skill Profile → one Current/Next Mission → Advisor Bay.
   The Advisor Bay keeps its fixed Command Center alignment. The mission card
   is the flexible element and may only occupy the vertical space left above it.
*/
(()=>{
  'use strict';

  const STYLE_ID='agworld-my-missions-fit-lock-v1-style';
  const GAP=8;
  const MIN_PLAYER=72;
  const MIN_SKILL=62;
  const MIN_MISSION=64;

  const css=`
:root{
  --ag-mm-gap:8px;
  --ag-mm-player-h:84px;
  --ag-mm-skill-h:76px;
  --ag-mm-mission-h:88px;
}
html body.ag-profile-mode .missions,
html body.ag-game-mode .missions,
html body.ag-premium-mode .missions{
  position:relative!important;
  overflow:hidden!important;
}
html body.ag-profile-mode .missions #agPlayerMissionProfile,
html body.ag-game-mode .missions #agPlayerMissionProfile,
html body.ag-premium-mode .missions #agPlayerMissionProfile{
  height:var(--ag-mm-player-h)!important;
  min-height:var(--ag-mm-player-h)!important;
  max-height:var(--ag-mm-player-h)!important;
  margin:0 6px!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
}
html body.ag-profile-mode .missions #agMissionSkillProfile,
html body.ag-profile-mode .missions .ag-mission-skill-profile,
html body.ag-game-mode .missions #agMissionSkillProfile,
html body.ag-game-mode .missions .ag-mission-skill-profile,
html body.ag-premium-mode .missions #agMissionSkillProfile,
html body.ag-premium-mode .missions .ag-mission-skill-profile{
  height:var(--ag-mm-skill-h)!important;
  min-height:var(--ag-mm-skill-h)!important;
  max-height:var(--ag-mm-skill-h)!important;
  margin:var(--ag-mm-gap) 6px 0!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
}
html body.ag-profile-mode .missions #agLandingMissionCard,
html body.ag-game-mode .missions #agLandingMissionCard,
html body.ag-premium-mode .missions #agLandingMissionCard{
  height:var(--ag-mm-mission-h)!important;
  min-height:var(--ag-mm-mission-h)!important;
  max-height:var(--ag-mm-mission-h)!important;
  margin:var(--ag-mm-gap) 6px 0!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
  position:relative!important;
  z-index:60!important;
  display:grid!important;
  grid-template-columns:minmax(0,1fr) auto!important;
  grid-template-areas:
    "state state"
    "title title"
    "copy copy"
    "reward action"!important;
  column-gap:8px!important;
  row-gap:4px!important;
  align-content:start!important;
}
html body.ag-profile-mode .missions #agLandingMissionCard .ag-mission-state,
html body.ag-game-mode .missions #agLandingMissionCard .ag-mission-state,
html body.ag-premium-mode .missions #agLandingMissionCard .ag-mission-state,
html body.ag-profile-mode .missions #agLandingMissionCard .tag,
html body.ag-game-mode .missions #agLandingMissionCard .tag,
html body.ag-premium-mode .missions #agLandingMissionCard .tag{
  grid-area:state!important;
  margin:0!important;
  min-width:0!important;
}
html body.ag-profile-mode .missions #agLandingMissionCard strong,
html body.ag-game-mode .missions #agLandingMissionCard strong,
html body.ag-premium-mode .missions #agLandingMissionCard strong{
  grid-area:title!important;
  margin:0!important;
  min-width:0!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
  display:-webkit-box!important;
  -webkit-box-orient:vertical!important;
  -webkit-line-clamp:2!important;
}
html body.ag-profile-mode .missions #agLandingMissionCard p,
html body.ag-game-mode .missions #agLandingMissionCard p,
html body.ag-premium-mode .missions #agLandingMissionCard p{
  grid-area:copy!important;
  margin:0!important;
  min-width:0!important;
  overflow:hidden!important;
  display:-webkit-box!important;
  -webkit-box-orient:vertical!important;
  -webkit-line-clamp:2!important;
}
html body.ag-profile-mode .missions #agLandingMissionCard .reward,
html body.ag-game-mode .missions #agLandingMissionCard .reward,
html body.ag-premium-mode .missions #agLandingMissionCard .reward{
  grid-area:reward!important;
  align-self:end!important;
  margin:0!important;
}
html body.ag-profile-mode .missions #agLandingMissionCard button,
html body.ag-game-mode .missions #agLandingMissionCard button,
html body.ag-premium-mode .missions #agLandingMissionCard button{
  grid-area:action!important;
  align-self:end!important;
  justify-self:end!important;
  margin:0!important;
  float:none!important;
  min-height:26px!important;
}
html body.ag-profile-mode .missions #agAdvisorBay,
html body.ag-game-mode .missions #agAdvisorBay,
html body.ag-premium-mode .missions #agAdvisorBay{
  position:absolute!important;
  left:6px!important;
  right:6px!important;
  top:var(--ag-advisor-top)!important;
  height:var(--ag-advisor-height)!important;
  min-height:0!important;
  margin:0!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
  z-index:55!important;
}
html body.ag-profile-mode .missions #agAdvisorBay .ag-advisor-grid,
html body.ag-game-mode .missions #agAdvisorBay .ag-advisor-grid,
html body.ag-premium-mode .missions #agAdvisorBay .ag-advisor-grid{
  min-height:0!important;
}
`;

  function install(){
    let style=document.getElementById(STYLE_ID);
    if(!style){
      style=document.createElement('style');
      style.id=STYLE_ID;
      document.head.appendChild(style);
    }
    if(style.textContent!==css) style.textContent=css;
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

  function enforceOrder(parts){
    const {missions,player,skill,mission,bay}=parts;
    if(!missions||!player||!skill||!mission||!bay) return;
    if(missions.firstElementChild!==player) missions.insertBefore(player,missions.firstElementChild||null);
    if(player.nextElementSibling!==skill) player.insertAdjacentElement('afterend',skill);
    if(skill.nextElementSibling!==mission) skill.insertAdjacentElement('afterend',mission);
    if(bay.parentElement!==missions) missions.appendChild(bay);
  }

  function measureNaturalHeight(el,fallback,min,max){
    if(!el) return fallback;
    const current=el.getBoundingClientRect().height||fallback;
    return Math.max(min,Math.min(max,Math.round(current)));
  }

  function fit(){
    const parts=getParts();
    if(!parts) return;
    const {missions,command,player,skill,mission,bay}=parts;
    if(!player||!skill||!mission||!bay||!command) return;

    enforceOrder(parts);

    const mr=missions.getBoundingClientRect();
    const cr=command.getBoundingClientRect();
    if(!mr.height||!cr.height) return;

    const bayTop=Math.max(0,Math.round(cr.top-mr.top));
    const bayHeight=Math.max(0,Math.min(Math.round(cr.height),Math.round(mr.bottom-cr.top-GAP)));
    if(bayHeight<=0) return;

    missions.style.setProperty('--ag-advisor-top',bayTop+'px');
    missions.style.setProperty('--ag-advisor-height',bayHeight+'px');

    let playerH=measureNaturalHeight(player,84,MIN_PLAYER,96);
    let skillH=measureNaturalHeight(skill,76,MIN_SKILL,88);

    const playerTop=Math.round(player.getBoundingClientRect().top-mr.top);
    let missionH=bayTop-playerTop-playerH-skillH-(GAP*2);

    if(missionH<MIN_MISSION){
      const deficit=MIN_MISSION-missionH;
      const playerReduction=Math.min(deficit,Math.max(0,playerH-MIN_PLAYER));
      playerH-=playerReduction;
      const remaining=deficit-playerReduction;
      const skillReduction=Math.min(remaining,Math.max(0,skillH-MIN_SKILL));
      skillH-=skillReduction;
      missionH=bayTop-playerTop-playerH-skillH-(GAP*2);
    }

    missionH=Math.max(0,Math.floor(missionH));
    if(missionH<MIN_MISSION) missionH=Math.max(48,missionH);

    missions.style.setProperty('--ag-mm-player-h',playerH+'px');
    missions.style.setProperty('--ag-mm-skill-h',skillH+'px');
    missions.style.setProperty('--ag-mm-mission-h',missionH+'px');

    requestAnimationFrame(()=>{
      const fresh=getParts();
      if(!fresh?.missions||!fresh?.mission||!fresh?.bay) return;
      const fr=fresh.mission.getBoundingClientRect();
      const br=fresh.bay.getBoundingClientRect();
      const maxBottom=br.top-GAP;
      if(fr.bottom>maxBottom+0.5){
        const corrected=Math.max(48,Math.floor(fr.height-(fr.bottom-maxBottom)));
        fresh.missions.style.setProperty('--ag-mm-mission-h',corrected+'px');
      }
    });
  }

  let queued=false;
  function queueFit(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      fit();
    });
  }

  function start(){
    install();
    queueFit();
    window.addEventListener('resize',queueFit,{passive:true});
    window.addEventListener('agworld:player-ready',queueFit);
    window.addEventListener('agworld:mission-completed',queueFit);
    window.addEventListener('agworld:advisor-selected',queueFit);
    document.addEventListener('agworld:landing-layout-ready',queueFit);

    const observer=new MutationObserver(queueFit);
    observer.observe(document.documentElement,{childList:true,subtree:true});

    if('ResizeObserver' in window){
      const ro=new ResizeObserver(queueFit);
      const parts=getParts();
      if(parts?.missions) ro.observe(parts.missions);
      if(parts?.command) ro.observe(parts.command);
    }

    [80,220,500,1000,1600].forEach(delay=>setTimeout(queueFit,delay));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();