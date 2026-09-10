/* AG WORLD — MY MISSIONS CANONICAL LAYOUT
   Single source of truth: Header → gap → Player → gap → Skill → gap → Mission → gap → Advisory Bay.
   Player, Skill and Mission are siblings in one grid. The Mission Card is never independently positioned.
*/
(()=>{
'use strict';
const ID='agworld-my-missions-canonical-v6',HID='agMyMissionsHeader',SID='agMyMissionsStack',G=8,HH=30,PMIN=70,PMAX=96,SMIN=108,SMAX=156;
let raf=0,ro,mo,settling=false;
const css=String.raw`
html body.ag-profile-mode .missions,html body.ag-game-mode .missions,html body.ag-premium-mode .missions,body .missions{position:relative!important;box-sizing:border-box!important;overflow:hidden!important;isolation:isolate!important}
#${HID}{position:absolute!important;top:0!important;left:10px!important;right:10px!important;height:var(--ag-mm-header-h,30px)!important;min-height:var(--ag-mm-header-h,30px)!important;max-height:var(--ag-mm-header-h,30px)!important;display:flex!important;align-items:center!important;gap:8px!important;margin:0!important;padding:0!important;box-sizing:border-box!important;border-bottom:1px solid rgba(16,43,54,.12)!important;color:#102b36!important;z-index:5!important;pointer-events:none!important}
#${HID} .p{font-size:10px!important;line-height:1!important;font-weight:900!important;letter-spacing:1.1px!important;white-space:nowrap!important;color:#102b36!important}
#${HID} .d{width:1px!important;height:13px!important;flex:0 0 1px!important;background:rgba(16,43,54,.18)!important}
#${HID} .s{font-size:9px!important;line-height:1!important;font-weight:800!important;letter-spacing:.9px!important;white-space:nowrap!important;color:#5c776f!important}
.missions>.eyebrow,.missions>h1,.missions>.level,.missions>.xpbar,.missions>.xptext,.missions>.section-title{display:none!important}
.missions>#${SID}{position:absolute!important;left:10px!important;right:10px!important;top:var(--ag-mm-stack-top)!important;height:var(--ag-mm-stack-height)!important;margin:0!important;padding:0!important;display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:var(--ag-mm-player-h) var(--ag-mm-skill-h) var(--ag-mm-mission-h)!important;row-gap:var(--ag-mm-gap)!important;align-content:start!important;box-sizing:border-box!important;overflow:hidden!important;isolation:isolate!important;z-index:1!important}
.missions>#${SID}>#agPlayerMissionProfile,.missions>#${SID}>#agMissionSkillProfile,.missions>#${SID}>.ag-mission-skill-profile{position:relative!important;inset:auto!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:100%!important;min-width:0!important;height:100%!important;min-height:0!important;max-height:none!important;margin:0!important;box-sizing:border-box!important;transform:none!important;z-index:1!important;overflow:hidden!important;align-self:stretch!important;justify-self:stretch!important}
.missions>#${SID}>#agPlayerMissionProfile{grid-row:1!important}
.missions>#${SID}>#agMissionSkillProfile,.missions>#${SID}>.ag-mission-skill-profile{grid-row:2!important}
html body.ag-profile-mode .missions>#${SID}>#agLandingMissionCard,html body.ag-game-mode .missions>#${SID}>#agLandingMissionCard,html body.ag-premium-mode .missions>#${SID}>#agLandingMissionCard,html body .missions>#${SID}>#agLandingMissionCard{display:flex!important;visibility:visible!important;opacity:1!important;grid-row:3!important;position:relative!important;inset:auto!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:100%!important;height:auto!important;min-height:0!important;max-height:none!important;margin:0!important;padding:9px 12px 9px!important;box-sizing:border-box!important;transform:none!important;z-index:1!important;overflow:hidden!important;flex-direction:column!important;justify-content:flex-start!important;gap:3px!important;align-self:center!important;justify-self:stretch!important;flex:0 0 auto!important}
.missions>#${SID}>#agLandingMissionCard .tag{display:block!important;margin:0!important;font-size:8px!important;line-height:1.1!important;letter-spacing:.8px!important;flex:0 0 auto!important}
.missions>#${SID}>#agLandingMissionCard strong{display:block!important;margin:0!important;line-height:1.18!important;white-space:normal!important;overflow:visible!important;flex:0 0 auto!important}
.missions>#${SID}>#agLandingMissionCard p{display:block!important;margin:0!important;line-height:1.22!important;overflow:visible!important;flex:0 0 auto!important;min-height:0!important}
.missions>#${SID}>#agLandingMissionCard .reward{display:inline-flex!important;align-self:flex-start!important;margin:0!important;flex:0 0 auto!important}
.missions>#${SID}>#agLandingMissionCard button{display:block!important;width:100%!important;margin:2px 0 0!important;box-sizing:border-box!important;flex:0 0 auto!important}
.missions>#agAdvisorBay{position:absolute!important;left:10px!important;right:10px!important;top:var(--ag-advisor-top)!important;height:var(--ag-advisor-height)!important;min-height:var(--ag-advisor-height)!important;max-height:var(--ag-advisor-height)!important;width:auto!important;margin:0!important;box-sizing:border-box!important;transform:none!important;overflow:hidden!important;z-index:2!important}
`;
function style(){let s=document.getElementById(ID);if(!s){s=document.createElement('style');s.id=ID;document.head.appendChild(s)}s.textContent=css}
function parts(){
 const m=document.querySelector('.missions');if(!m)return null;
 const player=m.querySelector('#agPlayerMissionProfile'),skill=m.querySelector('#agMissionSkillProfile,.ag-mission-skill-profile'),bay=m.querySelector('#agAdvisorBay');
 let mission=m.querySelector('#agLandingMissionCard')||[...document.querySelectorAll('#agLandingMissionCard')].find(x=>!x.closest('#entityInformationSection'));
 return {m,player,skill,mission,bay,command:document.getElementById('entityInformationSection')};
}
function head(m){let h=document.getElementById(HID);if(!h){h=document.createElement('div');h.id=HID;h.innerHTML='<span class="p">MY MISSIONS</span><span class="d" aria-hidden="true"></span><span class="s">MISSION CONTROL</span>'}if(h.parentElement!==m)m.prepend(h);return h}
function normalize(p){
 if(!p?.m||!p.player||!p.skill||!p.mission||!p.bay)return false;
 const h=head(p.m);let s=p.m.querySelector(':scope > #'+SID);if(!s){s=document.createElement('div');s.id=SID;h.insertAdjacentElement('afterend',s)}
 if(p.player.parentElement!==s)s.appendChild(p.player);if(p.skill.parentElement!==s)s.appendChild(p.skill);if(p.mission.parentElement!==s)s.appendChild(p.mission);if(p.bay.parentElement!==p.m)p.m.appendChild(p.bay);
 return true;
}
const px=v=>Math.max(0,Math.round(Number(v)||0)),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function missionContentHeight(el){
 // Measure intrinsic content rather than the current grid allocation. A
 // flex-growing paragraph inside a tall grid row previously expanded to the
 // row, and that expanded height was then fed back as the card's natural size.
 const nodes=[...el.querySelectorAll('.tag,strong,p,.reward,button')].filter(n=>{
   const s=getComputedStyle(n);return s.display!=='none'&&s.visibility!=='hidden';
 });
 if(!nodes.length)return 0;
 const names=['height','min-height','max-height','align-self','flex','overflow'];
 const old=names.map(n=>[n,el.style.getPropertyValue(n),el.style.getPropertyPriority(n)]);
 const childOld=nodes.map(n=>['flex','height','min-height','max-height','overflow'].map(k=>[k,n.style.getPropertyValue(k),n.style.getPropertyPriority(k)]));
 try{
   el.style.setProperty('height','auto','important');el.style.setProperty('min-height','0','important');el.style.setProperty('max-height','none','important');el.style.setProperty('align-self','start','important');el.style.setProperty('flex','0 0 auto','important');el.style.setProperty('overflow','visible','important');
   nodes.forEach(n=>{n.style.setProperty('flex','0 0 auto','important');n.style.setProperty('height','auto','important');n.style.setProperty('min-height','0','important');n.style.setProperty('max-height','none','important');n.style.setProperty('overflow','visible','important')});
   return px(Math.max(56,el.scrollHeight||0));
 }finally{
   old.forEach(([n,v,p])=>v?el.style.setProperty(n,v,p):el.style.removeProperty(n));
   nodes.forEach((n,i)=>childOld[i].forEach(([k,v,p])=>v?n.style.setProperty(k,v,p):n.style.removeProperty(k)));
 }
}
function natural(el){
 const names=['position','height','min-height','max-height','overflow','grid-row'],old=names.map(n=>[n,el.style.getPropertyValue(n),el.style.getPropertyPriority(n)]);
 try{el.style.setProperty('position','absolute','important');el.style.setProperty('height','auto','important');el.style.setProperty('min-height','0','important');el.style.setProperty('max-height','none','important');el.style.setProperty('overflow','visible','important');el.style.setProperty('grid-row','auto','important');return px(Math.max(el.scrollHeight||0,el.offsetHeight||0,el.getBoundingClientRect().height||0))}
 finally{old.forEach(([n,v,p])=>v?el.style.setProperty(n,v,p):el.style.removeProperty(n))}
}
function hardLock(p,bayTop,bayH){
 const set=(e,n,v)=>e.style.setProperty(n,v,'important');
 [p.player,p.skill,p.mission].forEach(e=>{set(e,'position','relative');set(e,'inset','auto');set(e,'left','auto');set(e,'right','auto');set(e,'top','auto');set(e,'bottom','auto');set(e,'width','100%');set(e,'height','100%');set(e,'min-height','0');set(e,'max-height','none');set(e,'margin','0');set(e,'transform','none');set(e,'z-index','1')});
 set(p.mission,'display','flex');set(p.mission,'visibility','visible');set(p.mission,'opacity','1');set(p.mission,'height','auto');set(p.mission,'min-height','0');set(p.mission,'max-height','none');set(p.mission,'flex','0 0 auto');set(p.mission,'align-self','center');
 set(p.bay,'position','absolute');set(p.bay,'left','10px');set(p.bay,'right','10px');set(p.bay,'top',bayTop+'px');set(p.bay,'height',bayH+'px');set(p.bay,'min-height',bayH+'px');set(p.bay,'max-height',bayH+'px');set(p.bay,'margin','0');set(p.bay,'transform','none');
}
function layout(){
 const p=parts();if(!normalize(p)||!p.command)return;
 const mr=p.m.getBoundingClientRect(),cr=p.command.getBoundingClientRect();if(mr.width<=0||mr.height<=0||cr.height<=0)return;
 const bayTop=px(clamp(cr.top-mr.top,0,mr.height)),bayH=px(clamp(cr.height,0,Math.max(0,mr.height-bayTop)));if(bayTop<=HH)return;
 const gap=G,stackTop=HH+gap,stackBottom=bayTop-gap,stackH=Math.max(0,stackBottom-stackTop);
 const missionNatural=Math.max(0,missionContentHeight(p.mission)||0);let ph=clamp(natural(p.player)||84,PMIN,PMAX),sh=clamp(natural(p.skill)||126,SMIN,SMAX),need=Math.max(56,missionNatural),mh=stackH-ph-sh-gap*2;
 if(mh<need&&sh>SMIN){const t=Math.min(need-mh,sh-SMIN);sh-=t;mh+=t}if(mh<need&&ph>PMIN){const t=Math.min(need-mh,ph-PMIN);ph-=t;mh+=t}mh=Math.max(0,mh);
 // The grid reserves the available bay between Skill and Advisory, while the
 // visible Mission Card is content-sized and vertically centered inside that bay.
 // This removes the dead green area beneath START MISSION without moving the
 // Skill Profile or Advisory Bay.
 const missionCardH=Math.min(mh,Math.max(56,missionNatural));
 [['--ag-mm-gap',gap],['--ag-mm-header-h',HH],['--ag-mm-player-h',ph],['--ag-mm-skill-h',sh],['--ag-mm-mission-h',mh],['--ag-mm-mission-card-h',missionCardH],['--ag-mm-stack-top',stackTop],['--ag-mm-stack-height',stackH],['--ag-advisor-top',bayTop],['--ag-advisor-height',bayH]].forEach(([n,v])=>p.m.style.setProperty(n,px(v)+'px'));
 hardLock(p,bayTop,bayH);p.m.dataset.agMissionLayer='single-grid-layer';p.m.dataset.agMissionMeasuredHeight=String(px(mh));p.m.dataset.agMissionCardHeight=String(px(missionCardH));p.m.dataset.agLayoutChecked='true';
 requestAnimationFrame(verify);
}
function verify(){
 const p=parts();if(!p?.m||!p.command||!p.player||!p.skill||!p.mission||!p.bay)return;
 const mr=p.m.getBoundingClientRect(),cr=p.command.getBoundingClientRect(),a=p.player.getBoundingClientRect(),b=p.skill.getBoundingClientRect(),c=p.mission.getBoundingClientRect(),d=p.bay.getBoundingClientRect(),tol=2;
 const same=p.player.parentElement===p.skill.parentElement&&p.skill.parentElement===p.mission.parentElement&&p.player.parentElement?.id===SID;
 const missionRow=p.m.querySelector(':scope > #'+SID)?.getBoundingClientRect();
 const topGap=a.top-mr.top-HH,playerSkillGap=b.top-a.bottom,cardFits=!!missionRow&&c.top>=missionRow.top-tol&&c.bottom<=missionRow.bottom+tol;
 const centered=!!missionRow&&Math.abs((c.top+c.bottom)/2-(missionRow.top+missionRow.bottom)/2)<=tol;
 const ok=same&&a.bottom<=b.top+tol&&b.bottom<=c.top+tol&&cardFits&&Math.abs(topGap-playerSkillGap)<=tol&&centered&&Math.abs(d.top-cr.top)<=tol;
 p.m.dataset.agLayoutStatus=ok?'pass':'adjusting';if(!ok&&!settling){settling=true;requestAnimationFrame(()=>{settling=false;schedule()})}
}
function schedule(){if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{raf=0;layout()})}
function start(){
 style();schedule();window.addEventListener('resize',schedule,{passive:true});window.addEventListener('load',schedule,{once:true});
 ['agworld:player-ready','agworld:player-profile','agworld:mission-completed','agworld:advisor-selected','agworld:landing-layout-ready','agworld:game-mode-changed'].forEach(e=>window.addEventListener(e,schedule));
 if('ResizeObserver'in window){ro?.disconnect();ro=new ResizeObserver(schedule);const p=parts();[p?.m,p?.command].filter(Boolean).forEach(x=>ro.observe(x))}
 mo?.disconnect();mo=new MutationObserver(rs=>{if(rs.some(r=>r.type==='childList'))schedule()});mo.observe(document.body,{childList:true,subtree:true});
 [0,80,180,360,700,1200,2000].forEach(t=>setTimeout(schedule,t));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();