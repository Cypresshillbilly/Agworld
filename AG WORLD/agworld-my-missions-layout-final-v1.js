/* AG WORLD — MY MISSIONS CANONICAL FOUR-PART STACK
   Final production layout:
   compact heading → equal gap → Active Player Profile → equal gap
   → approved Player Skill Capability Profile → equal gap
   → Current / Next Mission Card → equal gap → protected Advisory Bay.

   This module controls geometry only. It deliberately does not redesign the
   approved Player Profile, Skill Profile, Mission Card, or Advisor Bay internals.
*/
(()=>{
  'use strict';

  const STYLE_ID='agworld-my-missions-canonical-stack-v4-style';
  const HEADER_ID='agMyMissionsHeader';
  const GAP=8;
  const HEADER_H=34;
  const MIN_PLAYER_H=70;
  const MAX_PLAYER_H=96;
  const MIN_SKILL_H=96;
  const MIN_MISSION_H=56;
  const FALLBACK_MISSION_H=72;

  let resizeObserver=null;
  let mutationObserver=null;
  let raf=0;
  let settling=false;

  const css=String.raw`
:root{
  --ag-mm-gap:8px;
  --ag-mm-header-h:34px;
  --ag-mm-player-h:84px;
  --ag-mm-skill-h:112px;
  --ag-mm-mission-h:72px;
  --ag-mm-player-top:42px;
  --ag-mm-skill-top:134px;
  --ag-mm-mission-top:254px;
  --ag-advisor-top:0px;
  --ag-advisor-height:180px;
}

/* The white My Missions strip is a bounded stage. Nothing may bleed into the
   protected Advisory Bay below. */
html body.ag-profile-mode .missions,
html body.ag-game-mode .missions,
html body.ag-premium-mode .missions,
body .missions{
  position:relative!important;
  overflow:hidden!important;
  isolation:isolate!important;
  box-sizing:border-box!important;
}

/* Canonical compact heading: the two labels sit beside one another and consume
   only the space required by the heading itself. */
#agMyMissionsHeader{
  position:absolute!important;
  left:10px!important;
  right:10px!important;
  top:0!important;
  height:var(--ag-mm-header-h)!important;
  min-height:var(--ag-mm-header-h)!important;
  max-height:var(--ag-mm-header-h)!important;
  display:flex!important;
  align-items:center!important;
  gap:8px!important;
  box-sizing:border-box!important;
  z-index:80!important;
  color:#102b36!important;
  border-bottom:1px solid rgba(16,43,54,.12)!important;
  pointer-events:none!important;
}
#agMyMissionsHeader .ag-mm-primary{
  font-size:10px!important;
  line-height:1!important;
  font-weight:900!important;
  letter-spacing:1.2px!important;
  color:#102b36!important;
  white-space:nowrap!important;
}
#agMyMissionsHeader .ag-mm-divider{
  width:1px!important;
  height:13px!important;
  background:rgba(16,43,54,.18)!important;
  flex:0 0 1px!important;
}
#agMyMissionsHeader .ag-mm-secondary{
  font-size:9px!important;
  line-height:1!important;
  font-weight:800!important;
  letter-spacing:.95px!important;
  color:#5c776f!important;
  white-space:nowrap!important;
}

/* Hide only the superseded legacy heading rows. The canonical header above is
   the single visible heading and leaves the approved cards untouched. */
.missions>.eyebrow,
.missions>h1,
.missions>.level,
.missions>.xpbar,
.missions>.xptext,
.missions>.section-title{
  display:none!important;
}

/* Approved Player Profile: geometry only. */
.missions #agPlayerMissionProfile{
  position:absolute!important;
  left:10px!important;
  right:10px!important;
  top:var(--ag-mm-player-top)!important;
  height:var(--ag-mm-player-h)!important;
  min-height:var(--ag-mm-player-h)!important;
  max-height:var(--ag-mm-player-h)!important;
  width:auto!important;
  margin:0!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
  z-index:60!important;
}

/* Approved Player Skill Capability Profile: preserve the existing internal
   radar, stat descriptions and capability information. */
.missions #agMissionSkillProfile,
.missions .ag-mission-skill-profile{
  position:absolute!important;
  left:10px!important;
  right:10px!important;
  top:var(--ag-mm-skill-top)!important;
  height:var(--ag-mm-skill-h)!important;
  min-height:var(--ag-mm-skill-h)!important;
  max-height:var(--ag-mm-skill-h)!important;
  width:auto!important;
  margin:0!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
  z-index:55!important;
}
.missions #agMissionSkillProfile *,
.missions .ag-mission-skill-profile *{
  box-sizing:border-box!important;
  max-width:100%!important;
}

/* The single Current / Next Mission Card remains a real card, at the approved
   branded material. Only its outer allocation changes. */
.missions #agLandingMissionCard{
  display:block!important;
  visibility:visible!important;
  opacity:1!important;
  position:absolute!important;
  left:10px!important;
  right:10px!important;
  top:var(--ag-mm-mission-top)!important;
  height:var(--ag-mm-mission-h)!important;
  min-height:var(--ag-mm-mission-h)!important;
  max-height:var(--ag-mm-mission-h)!important;
  width:auto!important;
  margin:0!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
  z-index:50!important;
  transform:none!important;
}

/* Keep mission information legible inside its proportional card allocation. */
.missions #agLandingMissionCard .tag{
  display:block!important;
  margin:0 0 4px!important;
  font-size:9px!important;
  line-height:1.2!important;
  letter-spacing:.7px!important;
}
.missions #agLandingMissionCard strong{
  display:block!important;
  margin:0 0 4px!important;
  line-height:1.2!important;
  white-space:normal!important;
  overflow:hidden!important;
}
.missions #agLandingMissionCard p{
  margin:0!important;
  line-height:1.35!important;
  overflow:hidden!important;
  display:-webkit-box!important;
  -webkit-box-orient:vertical!important;
  -webkit-line-clamp:2!important;
}
.missions #agLandingMissionCard .reward{
  display:inline-flex!important;
  margin-top:5px!important;
}

/* Advisory Bay is a protected lower boundary. It is aligned to the live
   Command Center geometry and is never part of the resizable three-card pool. */
.missions #agAdvisorBay{
  position:absolute!important;
  left:10px!important;
  right:10px!important;
  top:var(--ag-advisor-top)!important;
  height:var(--ag-advisor-height)!important;
  min-height:var(--ag-advisor-height)!important;
  max-height:var(--ag-advisor-height)!important;
  width:auto!important;
  margin:0!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
  z-index:40!important;
}

/* The four intentional gaps are generated geometrically. Cards may never add
   their own vertical margins and silently destroy the shared rhythm. */
.missions #agPlayerMissionProfile,
.missions #agMissionSkillProfile,
.missions .ag-mission-skill-profile,
.missions #agLandingMissionCard,
.missions #agAdvisorBay{
  transform:none!important;
}

/* Narrow screens retain the same logical stack, while allowing the browser to
   keep text readable rather than forcing microscopic type. */
@media(max-height:760px){
  :root{--ag-mm-gap:6px;}
  #agMyMissionsHeader .ag-mm-primary{font-size:9px!important;}
  #agMyMissionsHeader .ag-mm-secondary{font-size:8px!important;}
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

  function ensureHeader(missions){
    let header=document.getElementById(HEADER_ID);
    if(!header){
      header=document.createElement('div');
      header.id=HEADER_ID;
      header.setAttribute('aria-label','My Missions Mission Control');
      header.innerHTML='<span class="ag-mm-primary">MY MISSIONS</span><span class="ag-mm-divider" aria-hidden="true"></span><span class="ag-mm-secondary">MISSION CONTROL</span>';
      missions.prepend(header);
    }else if(header.parentElement!==missions){
      missions.prepend(header);
    }
    return header;
  }

  function normaliseOrder(parts){
    const {missions,player,skill,mission,bay}=parts;
    if(!missions||!player||!skill||!mission||!bay) return false;

    /* Keep the exact requested canonical order without touching the approved
       internal DOM of any card. */
    if(player.parentElement!==missions) missions.appendChild(player);
    if(skill.parentElement!==missions) missions.appendChild(skill);
    if(mission.parentElement!==missions) missions.appendChild(mission);
    if(bay.parentElement!==missions) missions.appendChild(bay);

    const header=ensureHeader(missions);
    header.insertAdjacentElement('afterend',player);
    player.insertAdjacentElement('afterend',skill);
    skill.insertAdjacentElement('afterend',mission);
    mission.insertAdjacentElement('afterend',bay);
    return true;
  }

  function clamp(v,min,max){
    return Math.max(min,Math.min(max,v));
  }

  function px(v){
    return Math.max(0,Math.round(Number(v)||0));
  }

  function naturalHeight(el){
    if(!el) return 0;
    /* The element may already be absolutely positioned by this module. Its
       scrollHeight remains the most stable representation of its approved
       internal content requirement. */
    const h=Math.max(el.scrollHeight||0,el.getBoundingClientRect().height||0);
    return px(h);
  }

  /* Measure the mission card at its true content height before assigning the
     stack geometry. This is the critical distinction between a compact card
     and a fixed-height box with unused space below START MISSION. The temporary
     overrides are restored immediately and never alter the card's approved
     visual design or internal markup. */
  function missionContentHeight(el){
    if(!el) return 0;

    /* Measure the mission card in its true intrinsic state. The previous
       implementation measured child positions while an inherited fixed height
       was still active, so the old oversized box could survive as empty space
       below START MISSION. Temporarily removing every outer height constraint
       lets the browser calculate the exact content box, including normal
       padding and borders. */
    const props=['height','min-height','max-height','overflow'];
    const previous=props.map(name=>({
      name,
      value:el.style.getPropertyValue(name),
      priority:el.style.getPropertyPriority(name)
    }));

    try{
      el.style.setProperty('height','auto','important');
      el.style.setProperty('min-height','0','important');
      el.style.setProperty('max-height','none','important');
      el.style.setProperty('overflow','visible','important');

      const rect=el.getBoundingClientRect();
      const computed=getComputedStyle(el);
      const measured=Math.ceil(Math.max(
        rect.height||0,
        (el.offsetHeight||0)
      ));

      /* A visible button is the final meaningful child. If a late stylesheet
         gives the card a pathological intrinsic size, calculate directly from
         the bottom edge of visible children as a second, content-first guard. */
      let contentBottom=rect.top;
      Array.from(el.children).forEach(child=>{
        const cs=getComputedStyle(child);
        if(cs.display==='none'||cs.visibility==='hidden') return;
        const r=child.getBoundingClientRect();
        if(r.width>0&&r.height>0) contentBottom=Math.max(contentBottom,r.bottom);
      });

      const childBased=contentBottom>rect.top
        ? Math.ceil(
            (contentBottom-rect.top)
            +(parseFloat(computed.paddingBottom)||0)
            +(parseFloat(computed.borderBottomWidth)||0)
          )
        : 0;

      return px(Math.max(measured,childBased));
    }finally{
      previous.forEach(({name,value,priority})=>{
        if(value) el.style.setProperty(name,value,priority);
        else el.style.removeProperty(name);
      });
    }
  }

  function setGeometry(missions,geometry){
    missions.style.setProperty('--ag-mm-gap',geometry.gap+'px');
    missions.style.setProperty('--ag-mm-header-h',geometry.headerH+'px');
    missions.style.setProperty('--ag-mm-player-h',geometry.playerH+'px');
    missions.style.setProperty('--ag-mm-skill-h',geometry.skillH+'px');
    missions.style.setProperty('--ag-mm-mission-h',geometry.missionH+'px');
    missions.style.setProperty('--ag-mm-player-top',geometry.playerTop+'px');
    missions.style.setProperty('--ag-mm-skill-top',geometry.skillTop+'px');
    missions.style.setProperty('--ag-mm-mission-top',geometry.missionTop+'px');
    missions.style.setProperty('--ag-advisor-top',geometry.bayTop+'px');
    missions.style.setProperty('--ag-advisor-height',geometry.bayH+'px');
  }

  function layout(){
    const p=getParts();
    if(!p || !normaliseOrder(p)) return;

    const {missions,command,player,skill,mission,bay}=p;
    if(!command) return;

    const mr=missions.getBoundingClientRect();
    const cr=command.getBoundingClientRect();
    if(mr.width<=0 || mr.height<=0 || cr.height<=0) return;

    /* Advisory Bay is anchored exactly to the Command Center's top edge. */
    const bayTop=px(clamp(cr.top-mr.top,0,mr.height));
    const bayH=px(clamp(Math.min(cr.height,mr.bottom-cr.top),0,mr.height-bayTop));
    if(bayTop<=HEADER_H || bayH<=0) return;

    const gap=parseFloat(getComputedStyle(missions).getPropertyValue('--ag-mm-gap'))||GAP;
    const headerH=HEADER_H;

    /* The usable content region is fixed by the compact header, four identical
       gaps, and the protected Advisor Bay boundary. */
    const contentBudget=bayTop-headerH-(gap*4);

    /* Player stays compact and proportional to its approved content. */
    const playerNatural=naturalHeight(player);
    let playerH=clamp(playerNatural||84,MIN_PLAYER_H,MAX_PLAYER_H);

    /* Mission height ends immediately after START MISSION plus the card's real
       bottom padding. This removes the empty lower block without changing any
       other card's approved visual design. */
    const missionNatural=missionContentHeight(mission);
    /* Never impose an arbitrary maximum height on the mission card. Its height
       is the measured content height, so the card ends immediately after the
       final START MISSION control plus its real bottom padding. */
    let missionH=Math.max(MIN_MISSION_H,missionNatural||FALLBACK_MISSION_H);

    /* Skill Profile receives the remaining proportional space and therefore
       remains the largest information-rich card. */
    let skillH=contentBudget-playerH-missionH;

    /* Resolve tight spaces without changing card order or crossing the Advisor
       boundary. First reduce mission toward its readable minimum, then player
       toward its compact minimum; the Skill Profile is never replaced or
       redesigned. */
    if(skillH<MIN_SKILL_H){
      const need=MIN_SKILL_H-skillH;
      const reducibleMission=Math.max(0,missionH-MIN_MISSION_H);
      const missionReduction=Math.min(need,reducibleMission);
      missionH-=missionReduction;
      skillH+=missionReduction;
    }

    if(skillH<MIN_SKILL_H){
      const need=MIN_SKILL_H-skillH;
      const reduciblePlayer=Math.max(0,playerH-MIN_PLAYER_H);
      const playerReduction=Math.min(need,reduciblePlayer);
      playerH-=playerReduction;
      skillH+=playerReduction;
    }

    /* Hard geometric boundary. The mission bottom plus the fourth equal gap is
       mathematically locked to the Advisory Bay top. */
    skillH=Math.max(0,skillH);

    const playerTop=headerH+gap;
    const skillTop=playerTop+playerH+gap;
    const missionTop=skillTop+skillH+gap;

    /* Last safety calculation preserves the protected Bay even if late CSS
       changes alter a card's intrinsic box sizing. */
    const missionMax=Math.max(0,bayTop-gap-missionTop);
    missionH=Math.min(missionH,missionMax);

    setGeometry(missions,{
      gap:px(gap),
      headerH,
      playerH:px(playerH),
      skillH:px(skillH),
      missionH:px(missionH),
      playerTop:px(playerTop),
      skillTop:px(skillTop),
      missionTop:px(missionTop),
      bayTop,
      bayH
    });

    /* Persist the measured card height as a runtime checkpoint. This makes the
       live source of truth inspectable and prevents late CSS from silently
       restoring a larger empty mission box. */
    mission.dataset.agMissionMeasuredHeight=String(px(missionH));
    mission.style.setProperty('height',px(missionH)+'px','important');
    mission.style.setProperty('min-height',px(missionH)+'px','important');
    mission.style.setProperty('max-height',px(missionH)+'px','important');

    requestAnimationFrame(()=>verify());
  }

  function verify(){
    const p=getParts();
    if(!p?.missions||!p?.command||!p?.player||!p?.skill||!p?.mission||!p?.bay) return;

    const mr=p.missions.getBoundingClientRect();
    const cr=p.command.getBoundingClientRect();
    const pr=p.player.getBoundingClientRect();
    const sr=p.skill.getBoundingClientRect();
    const nr=p.mission.getBoundingClientRect();
    const br=p.bay.getBoundingClientRect();

    const tolerance=2;
    const expectedBayTop=cr.top-mr.top;
    const equalGaps=[
      pr.top-mr.top-HEADER_H,
      sr.top-pr.bottom,
      nr.top-sr.bottom,
      br.top-nr.bottom
    ];

    const bayAligned=Math.abs((br.top-mr.top)-expectedBayTop)<=tolerance;
    const gapsAligned=equalGaps.every(g=>Math.abs(g-equalGaps[0])<=tolerance);
    const noOverlap=nr.bottom<=br.top+tolerance;

    p.missions.dataset.agLayoutChecked='true';
    p.missions.dataset.agLayoutStatus=(bayAligned&&gapsAligned&&noOverlap)?'pass':'adjusting';

    /* If another late stylesheet briefly changes dimensions, schedule one clean
       recalculation instead of allowing drift or overlap to persist. */
    if(!(bayAligned&&gapsAligned&&noOverlap) && !settling){
      settling=true;
      requestAnimationFrame(()=>{
        settling=false;
        schedule();
      });
    }
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
      'agworld:landing-layout-ready',
      'agworld:game-mode-changed'
    ].forEach(name=>window.addEventListener(name,schedule));

    if('ResizeObserver' in window){
      resizeObserver?.disconnect();
      resizeObserver=new ResizeObserver(schedule);
      const p=getParts();
      [p?.missions,p?.command,p?.player,p?.skill,p?.mission,p?.bay].filter(Boolean).forEach(el=>resizeObserver.observe(el));
    }

    mutationObserver?.disconnect();
    mutationObserver=new MutationObserver(()=>{
      const p=getParts();
      if(p?.missions&&p.player&&p.skill&&p.mission&&p.bay) schedule();
    });
    mutationObserver.observe(document.body,{childList:true,subtree:true});

    [0,80,180,350,700,1200,2000].forEach(ms=>setTimeout(schedule,ms));
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();