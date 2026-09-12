/* Map tools and the independent advisor drawer use the existing game actions. */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 let advisorsOpen=false;
 let surfaceMap;
 function setupSurface(tools){
  const section=tools.querySelector('[data-map-section=settings]');if(!section)return;
  let surfaces=$('agMapSurface');
  if(!surfaces){surfaces=document.createElement('fieldset');surfaces.id='agMapSurface';surfaces.innerHTML='<legend>MAP SURFACE</legend><div><button type="button" data-map-surface="satellite">SATELLITE</button><button type="button" data-map-surface="terrain">ELEVATION RELIEF</button><button type="button" data-map-surface="hybrid">SATELLITE + LABELS</button></div><p>Elevation relief shades mountains and valleys using Google’s terrain map. It loads tiles as you explore, with no separate elevation dataset.</p>';section.prepend(surfaces);surfaces.onclick=e=>{const b=e.target.closest('[data-map-surface]');if(!b)return;const map=window.__AGWORLD_GOOGLE_MAP__;if(!map)return;map.setMapTypeId(b.dataset.mapSurface);saveSurface(map);};}
  const map=window.__AGWORLD_GOOGLE_MAP__;
  if(map&&surfaceMap!==map){surfaceMap=map;let saved;try{saved=localStorage.getItem('agworld.map.surface');}catch(_){}if(['satellite','terrain','hybrid'].includes(saved))map.setMapTypeId(saved);map.addListener('maptypeid_changed',()=>saveSurface(map));}
  surfaces.querySelectorAll('[data-map-surface]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapSurface===(map?.getMapTypeId()||'satellite'))));
 }
 function saveSurface(map){const type=map.getMapTypeId();if(!['satellite','terrain','hybrid'].includes(type))return;try{localStorage.setItem('agworld.map.surface',type);}catch(_){}document.querySelectorAll('[data-map-surface]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapSurface===type)));}
 const layerGroups=[['Territories',[['countries','Country boundaries'],['country-icons','Country symbols'],['provinces','Province boundaries'],['province-icons','Province symbols'],['municipalities','Municipalities'],['towns','Towns'],['control','Market influence colours']]],['Businesses',[['territory','Farm boundaries'],['farms','Farm icons'],['contractors','Contractors'],['competitors','Competitors'],['facilities','Company facilities'],['relationships','Business connections']]],['Farm detail',[['company-drones','Company drones'],['competitor-drones','Competitor drones'],['crops','Crops'],['livestock','Livestock'],['machinery','Machinery'],['water','Water'],['infrastructure','Infrastructure']]]];
 function setupMapMenu(){
  const header=document.querySelector('.map-header'),tools=header?.querySelector('.map-tools');if(!tools)return;
  header.classList.add('ag-exploration-menu');
  const title=header.querySelector('.map-title');if(title)title.textContent='MAP CONTROL';
  if(!$('agMapLayers')){
   const tabs=document.createElement('nav');tabs.className='ag-map-tabs';tabs.setAttribute('aria-label','Map menu sections');
   tabs.innerHTML=[['layers','Layers'],['actions','Actions'],['settings','Settings & info']].map(([id,label])=>'<button type="button" data-map-tab="'+id+'" aria-pressed="'+(id==='layers')+'">'+label+'</button>').join('');
   tools.append(tabs);
   const state=window.agWorldGetLayerState?.()||{};
   const layers=document.createElement('section');layers.id='agMapLayers';layers.dataset.mapSection='layers';
   layers.innerHTML='<div class="ag-map-layer-groups">'+layerGroups.map(([title,items])=>'<fieldset><legend>'+title+'</legend>'+items.map(([id,label])=>'<label><input type="checkbox" data-map-layer="'+id+'" '+(state[id]!==false?'checked':'')+'><span>'+label+'</span></label>').join('')+'</fieldset>').join('')+'</div><p>Layers appear at their map scale: countries → provinces → municipalities → towns → farms. Your choices remain active as you explore.</p>';
   layers.addEventListener('change',e=>{if(e.target.dataset.mapLayer)window.agWorldSetLayerVisibility(e.target.dataset.mapLayer,e.target.checked);});tools.append(layers);
   for(const [key,title] of [['actions','CREATE & MANAGE'],['settings','EXPLORE & CONFIGURE']]){const section=document.createElement('section');section.dataset.mapSection=key;section.hidden=true;section.innerHTML='<h3>'+title+'</h3><div class="ag-map-action-grid"></div>';tools.append(section);}
   tabs.onclick=e=>{const b=e.target.closest('[data-map-tab]');if(!b)return;tools.querySelectorAll('[data-map-tab]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));tools.querySelectorAll('[data-map-section]').forEach(s=>s.hidden=s.dataset.mapSection!==b.dataset.mapTab);window.AGWorldDrawers?.layout();syncAdvisors();};
   const info=document.createElement('div');info.className='ag-map-info';info.innerHTML='<strong>LIVE TERRITORY BOARD</strong><p>Control is calculated from recorded farms, contractors, drone quantities and business relationships. It represents your recorded market, not a national census.</p><p>Country and province sculptures are AgWorld artistic symbols, not official emblems.</p>';tools.querySelector('[data-map-section=settings]').append(info);
  }
  const dev=window.AGWorldSidebar?.ensureDeveloperButton?.();
  const actionIds=['createFarmBtn','createContractorBtn','createCompetitorBtn','createCompanyFacilityBtn','importBtn','exportBtn'];
  const settingIds=['sadcBtn','africaBtn','nationalBtn','resetBtn','developerModeBtn','agAuth'];
  for(const [ids,key]of [[actionIds,'actions'],[settingIds,'settings']])for(const id of ids){const b=$(id);const target=tools.querySelector('[data-map-section='+key+'] .ag-map-action-grid');if(b&&target&&!target.contains(b)){target.append(b);b.style.removeProperty('display');b.removeAttribute('aria-hidden');b.removeAttribute('tabindex');}}
  const credits=$('agBoundaryCredits');if(credits&&!tools.querySelector('.ag-map-info').contains(credits))tools.querySelector('.ag-map-info').append(credits);
  const satellite=$('satelliteBtn');if(satellite){satellite.hidden=true;satellite.style.setProperty('display','none','important');satellite.setAttribute('aria-hidden','true');satellite.tabIndex=-1;}
  setupSurface(tools);
 }
 function syncAdvisors(){
  const playerOpen=window.AGWorldDrawers?.getState().player,button=$('agMapAdvisorsToggle'),panel=$('agMapAdvisors');if(!button||!panel)return;
  if(playerOpen)advisorsOpen=false;
  button.hidden=!!playerOpen;panel.hidden=!advisorsOpen||!!playerOpen;panel.inert=panel.hidden;
  button.setAttribute('aria-expanded',String(!panel.hidden));
  // The launcher owns the upper-right corner; the bay grows leftward.
  button.style.top='18px';button.style.bottom='auto';
  panel.style.top='18px';panel.style.bottom='auto';
  panel.style.maxHeight=Math.max(160,window.innerHeight-44)+'px';
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
 function start(){setupMapMenu();setupAdvisors();dashboardNavigation();if(!headerObserver&&'ResizeObserver'in window){headerObserver=new ResizeObserver(()=>{setupMapMenu();syncAdvisors();});const header=document.querySelector('.map-header');if(header)headerObserver.observe(header);}}
 window.AGWorldMapAdvisors={isOpen:()=>advisorsOpen,open:()=>{advisorsOpen=true;syncAdvisors();}};
 addEventListener('agworld:drawers-changed',syncAdvisors);addEventListener('resize',syncAdvisors,{passive:true});
 for(const e of ['agworld:advisor-selected','agworld:advisor-deselected'])addEventListener(e,syncAdvisors);
 addEventListener('agworld:player-ready',start);addEventListener('agworld:player-visible',start);addEventListener('agworld:territory-selected',setupMapMenu);
 addEventListener('agworld:map-filters-changed',()=>{const state=window.agWorldGetLayerState();document.querySelectorAll('[data-map-layer]').forEach(i=>i.checked=state[i.dataset.mapLayer]!==false);});
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();
