/* AG WORLD — MY MISSIONS / MISSION CARD V2
   Production rebuild.
   The surrounding Player Capability, Skill Profile and Advisory Hub remain the
   canonical surfaces. The legacy Mission Card is deliberately isolated and
   hidden; a new, namespaced card owns its DOM, sizing and visual rhythm.
*/
(()=>{
'use strict';

const STYLE_ID='agworld-my-missions-v2-style';
const HEADER_ID='agMyMissionsHeader';
const STACK_ID='agMyMissionsStack';
const CARD_ID='agMissionCardV2';
const LEGACY_CARD_ID='agLandingMissionCard';
const GAP=8, HEADER_H=30, PLAYER_MIN=70, PLAYER_MAX=96, SKILL_MIN=108, SKILL_MAX=156;
let raf=0, resizeObserver=null, mutationObserver=null;

const css=String.raw`
html body.ag-profile-mode .missions,
html body.ag-game-mode .missions,
html body.ag-premium-mode .missions,
body .missions{
  position:relative!important;
  box-sizing:border-box!important;
  overflow:hidden!important;
  isolation:isolate!important;
}

#${HEADER_ID}{
  position:absolute!important;top:0!important;left:10px!important;right:10px!important;
  height:var(--ag-mm-header-h,30px)!important;
  display:flex!important;align-items:center!important;gap:8px!important;
  margin:0!important;padding:0!important;box-sizing:border-box!important;
  border-bottom:1px solid rgba(16,43,54,.12)!important;color:#102b36!important;
  z-index:5!important;pointer-events:none!important;
}
#${HEADER_ID} .p{font-size:10px!important;line-height:1!important;font-weight:900!important;letter-spacing:1.1px!important;white-space:nowrap!important}
#${HEADER_ID} .d{width:1px!important;height:13px!important;background:rgba(16,43,54,.18)!important}
#${HEADER_ID} .s{font-size:9px!important;line-height:1!important;font-weight:800!important;letter-spacing:.9px!important;white-space:nowrap!important;color:#5c776f!important}

.missions>.eyebrow,.missions>h1,.missions>.level,.missions>.xpbar,.missions>.xptext,.missions>.section-title{display:none!important}

.missions>#${STACK_ID}{
  position:absolute!important;left:10px!important;right:10px!important;
  top:var(--ag-mm-stack-top)!important;height:var(--ag-mm-stack-height)!important;
  margin:0!important;padding:0!important;
  display:grid!important;grid-template-columns:minmax(0,1fr)!important;
  grid-template-rows:var(--ag-mm-player-h) var(--ag-mm-skill-h) minmax(0,1fr)!important;
  row-gap:var(--ag-mm-gap)!important;align-content:start!important;
  box-sizing:border-box!important;overflow:hidden!important;isolation:isolate!important;z-index:1!important;
}

.missions>#${STACK_ID}>#agPlayerMissionProfile,
.missions>#${STACK_ID}>#agMissionSkillProfile,
.missions>#${STACK_ID}>.ag-mission-skill-profile{
  position:relative!important;inset:auto!important;width:100%!important;
  min-width:0!important;height:100%!important;min-height:0!important;max-height:none!important;
  margin:0!important;box-sizing:border-box!important;transform:none!important;
  z-index:1!important;overflow:hidden!important;align-self:stretch!important;justify-self:stretch!important;
}
.missions>#${STACK_ID}>#agPlayerMissionProfile{grid-row:1!important}
.missions>#${STACK_ID}>#agMissionSkillProfile,
.missions>#${STACK_ID}>.ag-mission-skill-profile{grid-row:2!important}

/* Legacy card is intentionally not allowed to participate in V2 layout. */
#agLandingMissionCard{display:none!important}

.missions>#${STACK_ID}>#${CARD_ID}{
  grid-row:3!important;grid-column:1!important;
  width:100%!important;max-width:none!important;
  height:auto!important;min-height:0!important;
  margin:0!important;box-sizing:border-box!important;
  align-self:center!important;justify-self:stretch!important;
  display:flex!important;flex-direction:column!important;
  padding:10px 12px!important;gap:6px!important;
  overflow:hidden!important;
  border-radius:10px!important;
  border:1px solid rgba(114,184,74,.52)!important;
  background:linear-gradient(145deg,#173c45,#102b36 66%,#0a2029)!important;
  color:#eef7f2!important;
  box-shadow:0 10px 22px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.07)!important;
}

#${CARD_ID} .ag-mission-v2-kicker{
  display:flex!important;align-items:center!important;justify-content:space-between!important;
  min-height:14px!important;font-size:8px!important;line-height:1!important;
  font-weight:900!important;letter-spacing:.95px!important;color:#c2e95d!important;
}
#${CARD_ID} .ag-mission-v2-kicker i{
  width:5px!important;height:5px!important;border-radius:50%!important;
  background:#72b84a!important;box-shadow:0 0 8px rgba(114,184,74,.75)!important;
}
#${CARD_ID} .ag-mission-v2-title{
  margin:0!important;color:#fff!important;font-size:12px!important;
  line-height:1.18!important;font-weight:900!important;letter-spacing:.1px!important;
}
#${CARD_ID} .ag-mission-v2-copy{
  margin:0!important;color:#b8cbc4!important;font-size:9px!important;
  line-height:1.32!important;font-weight:600!important;
}
#${CARD_ID} .ag-mission-v2-meta{
  display:flex!important;align-items:center!important;justify-content:space-between!important;
  gap:8px!important;margin-top:1px!important;min-height:18px!important;
}
#${CARD_ID} .ag-mission-v2-reward{
  display:inline-flex!important;align-items:center!important;min-height:18px!important;
  padding:0 7px!important;border-radius:999px!important;
  border:1px solid rgba(194,233,93,.22)!important;background:rgba(194,233,93,.08)!important;
  color:#efffd2!important;font-size:8px!important;font-weight:900!important;letter-spacing:.45px!important;
}
#${CARD_ID} .ag-mission-v2-button{
  width:100%!important;min-height:27px!important;height:27px!important;
  margin:0!important;padding:0 10px!important;border-radius:7px!important;
  border:1px solid rgba(194,233,93,.55)!important;
  background:linear-gradient(180deg,#a7d850,#72b84a)!important;
  color:#102b36!important;font-size:9px!important;font-weight:900!important;letter-spacing:.7px!important;
  cursor:pointer!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.32)!important;
}
#${CARD_ID} .ag-mission-v2-button:hover{filter:brightness(1.06)!important}
#${CARD_ID} .ag-mission-v2-button:active{transform:translateY(1px)!important}

.missions>#agAdvisorBay{
  position:absolute!important;left:10px!important;right:10px!important;
  top:var(--ag-advisor-top)!important;height:var(--ag-advisor-height)!important;
  min-height:var(--ag-advisor-height)!important;max-height:var(--ag-advisor-height)!important;
  width:auto!important;margin:0!important;box-sizing:border-box!important;
  transform:none!important;overflow:hidden!important;z-index:2!important;
}
`;

function injectStyle(){
  let el=document.getElementById(STYLE_ID);
  if(!el){el=document.createElement('style');el.id=STYLE_ID;document.head.appendChild(el);}
  el.textContent=css;
}

function getParts(){
  const missions=document.querySelector('.missions');
  if(!missions)return null;
  const player=missions.querySelector('#agPlayerMissionProfile');
  const skill=missions.querySelector('#agMissionSkillProfile,.ag-mission-skill-profile');
  const advisor=missions.querySelector('#agAdvisorBay')||document.getElementById('agAdvisorBay');
  const legacy=missions.querySelector('#agLandingMissionCard')||document.querySelector('#agLandingMissionCard');
  const command=document.getElementById('entityInformationSection');
  return {missions,player,skill,advisor,legacy,command};
}

function ensureHeader(missions){
  let h=document.getElementById(HEADER_ID);
  if(!h){
    h=document.createElement('div');
    h.id=HEADER_ID;
    h.innerHTML='<span class="p">MY MISSIONS</span><span class="d" aria-hidden="true"></span><span class="s">MISSION CONTROL</span>';
  }
  if(h.parentElement!==missions)missions.prepend(h);
  return h;
}

function ensureStack(missions,header){
  let stack=missions.querySelector(':scope > #'+STACK_ID);
  if(!stack){
    stack=document.createElement('div');
    stack.id=STACK_ID;
    header.insertAdjacentElement('afterend',stack);
  }
  return stack;
}

function textFrom(root,selector,fallback){
  const el=root?.querySelector(selector);
  return String(el?.textContent||fallback).replace(/\s+/g,' ').trim();
}

function removeDuplicateMissionCards(missions,stack){
  // Production invariant: exactly one visible Mission Card exists.
  document.querySelectorAll('#'+LEGACY_CARD_ID).forEach(el=>{
    el.setAttribute('aria-hidden','true');
    el.style.setProperty('display','none','important');
    el.style.setProperty('visibility','hidden','important');
  });
  const cards=[...document.querySelectorAll('#'+CARD_ID)];
  const canonical=stack.querySelector(':scope > #'+CARD_ID)||cards[0]||null;
  cards.forEach(el=>{if(el!==canonical)el.remove();});
  return canonical;
}

function ensureCard(stack,legacy){
  let card=removeDuplicateMissionCards(document.querySelector('.missions'),stack);
  if(!card){
    card=document.createElement('article');
    card.id=CARD_ID;
    card.className='ag-mission-card-v2';
    card.setAttribute('aria-label','Active mission');
    card.innerHTML=
      '<div class="ag-mission-v2-kicker"><span>ACTIVE MISSION</span><i aria-hidden="true"></i></div>'+
      '<h2 class="ag-mission-v2-title">Complete Mandatory Safety Training</h2>'+
      '<p class="ag-mission-v2-copy">Complete the required training to unlock your next operational tier.</p>'+
      '<div class="ag-mission-v2-meta"><span class="ag-mission-v2-reward">REWARD · 250 XP</span></div>'+
      '<button type="button" class="ag-mission-v2-button">START MISSION</button>';
    stack.appendChild(card);
  }
  syncCard(card,legacy);
  return card;
}

function syncCard(card,legacy){
  if(!card)return;
  const tag=card.querySelector('.ag-mission-v2-kicker span');
  const title=card.querySelector('.ag-mission-v2-title');
  const copy=card.querySelector('.ag-mission-v2-copy');
  const reward=card.querySelector('.ag-mission-v2-reward');
  const button=card.querySelector('.ag-mission-v2-button');

  if(legacy){
    const legacyTitle=textFrom(legacy,'strong',title.textContent);
    const legacyCopy=textFrom(legacy,'p',copy.textContent);
    const legacyReward=textFrom(legacy,'.reward',reward.textContent);
    const legacyTag=textFrom(legacy,'.tag','ACTIVE MISSION');
    const legacyButton=textFrom(legacy,'button',button.textContent);
    if(legacyTitle)title.textContent=legacyTitle;
    if(legacyCopy)copy.textContent=legacyCopy;
    if(legacyReward)reward.textContent=legacyReward.toUpperCase();
    if(legacyTag)tag.textContent=legacyTag.toUpperCase();
    if(legacyButton)button.textContent=legacyButton.toUpperCase();
  }

  if(!button.dataset.bound){
    button.dataset.bound='true';
    button.addEventListener('click',()=>{
      const liveLegacy=document.querySelector('#agLandingMissionCard button');
      if(liveLegacy)liveLegacy.click();
      else window.dispatchEvent(new CustomEvent('agworld:mission-start',{detail:{source:'agMissionCardV2'}}));
    });
  }
}

const px=v=>Math.max(0,Math.round(Number(v)||0));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function naturalHeight(el){
  if(!el)return 0;
  const old=['position','height','min-height','max-height','overflow'].map(k=>[k,el.style.getPropertyValue(k),el.style.getPropertyPriority(k)]);
  try{
    el.style.setProperty('position','absolute','important');
    el.style.setProperty('height','auto','important');
    el.style.setProperty('min-height','0','important');
    el.style.setProperty('max-height','none','important');
    el.style.setProperty('overflow','visible','important');
    return px(Math.max(el.scrollHeight||0,el.getBoundingClientRect().height||0));
  }finally{
    old.forEach(([k,v,p])=>v?el.style.setProperty(k,v,p):el.style.removeProperty(k));
  }
}

function layout(){
  const p=getParts();
  if(!p?.missions||!p.player||!p.skill)return;

  const header=ensureHeader(p.missions);
  const stack=ensureStack(p.missions,header);

  if(p.player.parentElement!==stack)stack.appendChild(p.player);
  if(p.skill.parentElement!==stack)stack.appendChild(p.skill);

  // Enforce the single-card invariant before every layout pass.
  // The legacy component remains only as a hidden event/data bridge.
  document.querySelectorAll('#'+LEGACY_CARD_ID).forEach(el=>{
    el.setAttribute('aria-hidden','true');
    el.style.setProperty('display','none','important');
    el.style.setProperty('visibility','hidden','important');
  });

  const card=ensureCard(stack,p.legacy);
  if(card.parentElement!==stack)stack.appendChild(card);
  if(p.advisor&&p.advisor.parentElement!==p.missions)p.missions.appendChild(p.advisor);

  const mr=p.missions.getBoundingClientRect();
  if(mr.width<=0||mr.height<=0)return;

  // The V2 card must render even while downstream Advisory/Command layers are
  // still mounting. Once they become available a later layout pass refines the
  // bay boundary without ever withholding the card from the screen.
  const commandRect=p.command?.getBoundingClientRect();
  const advisorRect=p.advisor?.getBoundingClientRect();
  const anchorTop=commandRect?.height>0?commandRect.top:advisorRect?.height>0?advisorRect.top:mr.bottom;
  const anchorHeight=commandRect?.height>0?commandRect.height:advisorRect?.height>0?advisorRect.height:0;
  const advisorTop=px(clamp(anchorTop-mr.top,0,mr.height));
  const advisorHeight=px(clamp(anchorHeight,0,Math.max(0,mr.height-advisorTop)));
  const stackTop=HEADER_H+GAP;
  const stackBottom=advisorTop-GAP;
  const stackHeight=Math.max(0,stackBottom-stackTop);

  let playerHeight=clamp(naturalHeight(p.player)||84,PLAYER_MIN,PLAYER_MAX);
  let skillHeight=clamp(naturalHeight(p.skill)||126,SKILL_MIN,SKILL_MAX);
  const minimumMissionBay=64;
  let required=playerHeight+skillHeight+GAP*2+minimumMissionBay;

  if(required>stackHeight&&skillHeight>SKILL_MIN){
    const cut=Math.min(required-stackHeight,skillHeight-SKILL_MIN);
    skillHeight-=cut;required-=cut;
  }
  if(required>stackHeight&&playerHeight>PLAYER_MIN){
    const cut=Math.min(required-stackHeight,playerHeight-PLAYER_MIN);
    playerHeight-=cut;required-=cut;
  }

  const vars=[
    ['--ag-mm-gap',GAP],['--ag-mm-header-h',HEADER_H],
    ['--ag-mm-player-h',playerHeight],['--ag-mm-skill-h',skillHeight],
    ['--ag-mm-stack-top',stackTop],['--ag-mm-stack-height',stackHeight],
    ['--ag-advisor-top',advisorTop],['--ag-advisor-height',advisorHeight]
  ];
  vars.forEach(([k,v])=>p.missions.style.setProperty(k,px(v)+'px'));

  // The V2 card has no height variable at all. Grid row 3 is simply the bay,
  // and CSS align-self:center centres the intrinsic card within it.
  card.style.removeProperty('height');
  card.style.removeProperty('max-height');
  card.style.removeProperty('min-height');

  // Fail-safe visibility lock: later legacy styles are not allowed to hide V2.
  card.style.setProperty('display','flex','important');
  card.style.setProperty('visibility','visible','important');
  card.style.setProperty('opacity','1','important');
  p.missions.dataset.agMissionLayer='mission-card-v2';
  p.missions.dataset.agMissionLayout='canonical';
}

function schedule(){
  if(raf)cancelAnimationFrame(raf);
  raf=requestAnimationFrame(()=>{raf=0;layout();});
}

function start(){
  injectStyle();
  schedule();
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('load',schedule,{once:true});
  ['agworld:player-ready','agworld:player-profile','agworld:mission-completed','agworld:advisor-selected','agworld:landing-layout-ready','agworld:game-mode-changed'].forEach(e=>window.addEventListener(e,schedule));

  if('ResizeObserver' in window){
    resizeObserver?.disconnect();
    const p=getParts();
    resizeObserver=new ResizeObserver(schedule);
    [p?.missions,p?.command,p?.player,p?.skill,p?.advisor].filter(Boolean).forEach(el=>resizeObserver.observe(el));
  }

  mutationObserver?.disconnect();
  mutationObserver=new MutationObserver(records=>{
    if(records.some(r=>r.type==='childList'||r.type==='characterData'))schedule();
  });
  mutationObserver.observe(document.body,{childList:true,subtree:true,characterData:true});

  [0,80,180,360,700,1200,2000,3500,5000].forEach(ms=>setTimeout(schedule,ms));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();
