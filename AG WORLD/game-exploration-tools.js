/* Map tools and the independent advisor drawer use the existing game actions. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 let advisorsOpen=false;
 const layers=[['countries','Country borders & flags'],['provinces','Provinces / regions'],['municipalities','Municipalities'],['towns','Towns'],['territory','Farm boundaries'],['farms','Farm icons'],['contractors','Contractors'],['competitors','Competitors'],['facilities','Company facilities'],['company-drones','Company drones'],['competitor-drones','Competitor drones'],['crops','Crops'],['livestock','Livestock'],['machinery','Machinery'],['water','Water'],['infrastructure','Infrastructure']];
 function setupMapMenu(){
  const header=document.querySelector('.map-header'),tools=header?.querySelector('.map-tools');if(!tools)return;
  header.classList.add('ag-exploration-menu');
  const title=header.querySelector('.map-title');if(title)title.textContent='AGWORLD · MAP CONTROL';
  const dev=window.AGWorldSidebar?.ensureDeveloperButton?.();if(dev&&dev.parentElement!==tools)tools.append(dev);
  for(const id of ['createFarmBtn','createContractorBtn','createCompetitorBtn','createCompanyFacilityBtn']){const b=$(id);if(b){b.style.removeProperty('display');b.removeAttribute('aria-hidden');b.removeAttribute('tabindex');}}
  if(!$('agMapLayers')){
   const details=document.createElement('details');details.id='agMapLayers';
   const state=window.agWorldGetLayerState?.()||{};
   details.innerHTML='<summary>MAP LAYERS</summary><div class="ag-layer-grid">'+layers.map(([id,label])=>'<label><input type="checkbox" data-map-layer="'+id+'" '+(state[id]!==false?'checked':'')+'><span>'+label+'</span></label>').join('')+'</div><p>Farm icons, contractors and assets appear at farm zoom.</p>';
   details.addEventListener('change',e=>{if(e.target.dataset.mapLayer)window.agWorldSetLayerVisibility(e.target.dataset.mapLayer,e.target.checked);});
   details.addEventListener('toggle',()=>{window.AGWorldDrawers?.layout();syncAdvisors();});header.append(details);
  }
 }
 function syncAdvisors(){
  const playerOpen=window.AGWorldDrawers?.getState().player,button=$('agMapAdvisorsToggle'),panel=$('agMapAdvisors');if(!button||!panel)return;
  if(playerOpen)advisorsOpen=false;
  button.hidden=!!playerOpen;panel.hidden=!advisorsOpen||!!playerOpen;panel.inert=panel.hidden;
  button.setAttribute('aria-expanded',String(!panel.hidden));
  // Leave the native map attribution strip clear and open the advisor bay upward.
  const header=document.querySelector('.map-header');
  const safeTop=window.AGWorldDrawers?.getState().map?(header?header.offsetTop+header.offsetHeight:0)+14:18;
  const iconHeight=button.offsetHeight||88;
  const bottom=48,panelBottom=bottom+iconHeight+10;
  button.style.top='auto';button.style.bottom=bottom+'px';panel.style.top='auto';panel.style.bottom=panelBottom+'px';
  panel.style.maxHeight=Math.max(160,window.innerHeight-panelBottom-safeTop)+'px';
  panel.querySelectorAll('[data-map-advisor]').forEach(b=>b.setAttribute('aria-pressed',String(window.AGWorldAdvisorState?.id===b.dataset.mapAdvisor)));
 }
 function setupAdvisors(){
  if($('agMapAdvisorsToggle'))return;
  const shell=document.querySelector('.app-shell');if(!shell)return;
  const button=document.createElement('button');button.id='agMapAdvisorsToggle';button.type='button';button.setAttribute('aria-label','Toggle AgWorld advisors');button.setAttribute('aria-controls','agMapAdvisors');button.innerHTML='<img src="brand/logos/PNG_Transparent/AgWorld_AW_Icon.png" alt="AgWorld">';
  const panel=document.createElement('aside');panel.id='agMapAdvisors';panel.setAttribute('aria-label','Map advisory bay');panel.hidden=true;
  const advisors=[['system-administrator','System Administrator'],['compliance','Compliance'],['sales','Sales'],['product','Product'],['operations','Operations'],['technical','Technical']];
  panel.innerHTML='<header><strong>ADVISORY BAY</strong><button type="button" aria-label="Close map advisors">×</button></header><p>Your guide + five specialists</p><div>'+advisors.map(([id,name])=>'<button type="button" data-map-advisor="'+id+'" aria-pressed="false"><img alt="" src="'+(id==='system-administrator'?'assets/advisors/system-administrator.webp':'assets/advisors/agworld_'+id+'_commander_round(1).png')+'"><span>'+name+'</span></button>').join('')+'</div>';
  const close=()=>{advisorsOpen=false;window.AG_WORLD_GUIDE?.hide?.();syncAdvisors();button.focus();};
  button.onclick=()=>{advisorsOpen=!advisorsOpen;if(!advisorsOpen)window.AG_WORLD_GUIDE?.hide?.();syncAdvisors();};
  panel.querySelector('header button').onclick=close;
  panel.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  panel.addEventListener('click',e=>{const b=e.target.closest('[data-map-advisor]');if(!b)return;document.querySelector('#agAdvisorBay [data-advisor="'+b.dataset.mapAdvisor+'"]')?.click();syncAdvisors();});
  shell.append(button,panel);syncAdvisors();
 }
 function dashboardNavigation(){
  const missions=document.querySelector('.missions');if(!missions||missions.dataset.agCardNavigation)return;
  missions.dataset.agCardNavigation='true';
  const routes={agPlayerMissionProfile:'profile',agPlayerSalesFunnel:'pipeline',agCanonicalMissionCard:'mission-history'};
  const decorate=()=>Object.entries(routes).forEach(([id,key])=>{const card=$(id);if(!card)return;card.dataset.openScreen=key;card.tabIndex=0;card.setAttribute('aria-label','Open '+({profile:'player profile',pipeline:'sales funnel','mission-history':'missions'})[key]);});
  const activate=e=>{if(missions.dataset.agScreen!=='dashboard')return;const card=e.target.closest('[data-open-screen]');if(!card)return;if(e.target!==card&&e.target.closest('button,a,input,select,textarea'))return;if(e.type==='keydown'&&!['Enter',' '].includes(e.key))return;e.preventDefault();e.stopImmediatePropagation();window.AGWorldPlayerMenu?.select(card.dataset.openScreen);};
  missions.addEventListener('click',activate,true);missions.addEventListener('keydown',activate,true);decorate();new MutationObserver(decorate).observe(missions,{childList:true,subtree:false});
 }
 let headerObserver;
 function start(){setupMapMenu();setupAdvisors();dashboardNavigation();if(!headerObserver&&'ResizeObserver'in window){headerObserver=new ResizeObserver(syncAdvisors);const header=document.querySelector('.map-header');if(header)headerObserver.observe(header);}}
 window.AGWorldMapAdvisors={isOpen:()=>advisorsOpen};
 addEventListener('agworld:drawers-changed',syncAdvisors);addEventListener('resize',syncAdvisors,{passive:true});
 for(const e of ['agworld:advisor-selected','agworld:advisor-deselected'])addEventListener(e,syncAdvisors);
 addEventListener('agworld:player-ready',start);
 addEventListener('agworld:map-filters-changed',()=>{const state=window.agWorldGetLayerState();document.querySelectorAll('[data-map-layer]').forEach(i=>i.checked=state[i.dataset.mapLayer]!==false);});
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
