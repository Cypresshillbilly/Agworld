/* Four independent drawers over one persistent game world. */
(()=>{
 'use strict';
 const state={player:false,map:false,territory:false,command:false};
 const names={player:'Player Hub',map:'Map Menu',territory:'Territory Stats',command:'Command Center'};
 let geo=null,queued=false;
 const $=id=>document.getElementById(id);
 const set=(el,k,v)=>{if(el&&el.style.getPropertyValue(k)!==String(v))el.style.setProperty(k,String(v),'important');};
 const frame=(el,x,y,w,h)=>{set(el,'position','absolute');set(el,'left',x+'px');set(el,'top',y+'px');set(el,'width',w+'px');set(el,'height',h+'px');set(el,'right','auto');set(el,'bottom','auto');set(el,'box-sizing','border-box');};
 function access(el,open){if(!el)return;el.inert=!open;el.setAttribute('aria-hidden',String(!open));el.classList.toggle('ag-drawer-closed',!open);}
 function button(id,key,controls,label){
   let el=$(id);if(el)return el;
   el=document.createElement('button');el.id=id;el.type='button';el.className='ag-drawer-handle ag-drawer-handle-'+key;
   el.setAttribute('aria-label','Toggle '+names[key]);el.setAttribute('aria-controls',controls);
   el.innerHTML='<span>'+label+'</span><b aria-hidden="true"></b>';
   el.addEventListener('click',()=>change(key,!state[key]));
   document.querySelector('.app-shell')?.appendChild(el);return el;
 }
 function ensure(){
   const shell=document.querySelector('.app-shell'),header=document.querySelector('.map-header');if(!shell||!header)return false;
   document.documentElement.dataset.agDrawers='v1';
   document.body.classList.remove('ag-full-game-mode');
   $('agEnterWorldBtn')?.remove();$('agGameModeControl')?.remove();
   if(!header.id)header.id='agMapMenuDrawer';
   button('agPlayerDrawerToggle','player','agPrimarySidebar agPlayerWorkspace','PLAYER HUB');
   button('agMapDrawerToggle','map',header.id,'MAP MENU');
   button('agCommandDrawerToggle','command','entityInformationSection','COMMAND CENTER');
   const auth=$('agAuth'),tools=header.querySelector('.map-tools');
   if(auth&&tools&&auth.parentElement!==tools)tools.appendChild(auth);
   return true;
 }
 function layout(){
   if(!ensure())return;
   const shell=document.querySelector('.app-shell'),sidebar=document.querySelector('.sidebar'),missions=document.querySelector('.missions'),map=document.querySelector('.map-area'),header=document.querySelector('.map-header'),command=$('entityInformationSection'),stats=$('territoryStatsDrawer');
   if(!sidebar||!missions||!map||!command||!stats)return;
   const w=shell.clientWidth,h=shell.clientHeight,s=w/1280,side=Math.round(180*s),workspace=Math.round(350*s),span=side+workspace,left=state.player?span:0,mapW=w-left;
   const bayH=Math.max(Math.round(160*s),Math.round(h*.19)),bottom=Math.max(18,Math.round(h*.024)),commandH=bayH+28,commandW=Math.min(Math.round(mapW*.93),Math.round(900*s)),commandTop=h-commandH-bottom,commandLeft=left+Math.round((mapW-commandW)/2);
   geo={shellW:w,shellH:h,sidebarW:side,missionsW:workspace,leftStage:left,mapW,commandTop,commandHeight:commandH,advisorTop:h-bayH-bottom,advisorHeight:bayH};
   frame(sidebar,0,0,side,h);frame(missions,side,0,workspace,h);
   [sidebar,missions].forEach(el=>{el.style.removeProperty('display');set(el,'transform',state.player?'translateX(0)':'translateX(-'+span+'px)');access(el,state.player);});
   frame(map,left,0,mapW,h);set(map,'z-index','1');set(map,'overflow','hidden');set(map,'transform','none');
   set(header,'position','absolute');set(header,'left','14px');set(header,'right','14px');set(header,'top','12px');set(header,'width','auto');set(header,'height','auto');set(header,'bottom','auto');
   const headerH=Math.max(64,header.offsetHeight);
   set(header,'transform',state.map?'translateY(0)':'translateY(-'+(headerH+14)+'px)');access(header,state.map);
   frame(command,commandLeft,commandTop,commandW,commandH);set(command,'z-index','1800');set(command,'padding','0');set(command,'overflow','hidden');set(command,'transform',state.command?'translateY(0)':'translateY('+(commandH+bottom+2)+'px)');access(command,state.command);
   ['background','border','box-shadow'].forEach(k=>command.style.removeProperty(k));
   frame($('entityCommandCentreHeading'),14,14,commandW-28,34);set($('entityCommandCentreHeading'),'z-index','3');
   frame($('farmCard'),14,48,commandW-28,commandH-62);set($('farmCard'),'min-height','0');set($('farmCard'),'max-height','none');set($('farmCard'),'max-width','none');set($('farmCard'),'margin','0');set($('farmCard'),'z-index','2');
   const statsTop=state.map?headerH+36:72,statsH=Math.max(220,Math.min(450,h-statsTop-(state.command?commandH+bottom+14:28))),statsW=300;
   frame(stats,mapW-statsW,statsTop,statsW,statsH);set(stats,'max-height',statsH+'px');set(stats,'max-width','none');set(stats,'z-index','2300');set(stats,'transform',state.territory?'translateX(0)':'translateX('+(statsW-28)+'px)');
   stats.classList.toggle('collapsed',!state.territory);access($('territoryStatsDrawerContent'),state.territory);
   const handles={player:$('agPlayerDrawerToggle'),map:$('agMapDrawerToggle'),command:$('agCommandDrawerToggle'),territory:$('territoryStatsToggle')};
   set(handles.player,'left',left+'px');set(handles.player,'top',Math.max(90,Math.round(h*.45))+'px');
   set(handles.map,'left',Math.round(left+mapW/2)+'px');set(handles.map,'top',state.map?(headerH+24)+'px':'0px');
   set(handles.command,'left',Math.round(left+mapW/2)+'px');set(handles.command,'bottom',state.command?(commandH+bottom)+'px':'0px');
   for(const [key,el]of Object.entries(handles)){if(!el)continue;el.setAttribute('aria-expanded',String(state[key]));el.title=(state[key]?'Close ':'Open ')+names[key];const arrow=el.querySelector('b,.ag-territory-toggle-arrow');if(arrow)arrow.textContent=key==='player'?(state[key]?'‹':'›'):key==='territory'?(state[key]?'›':'‹'):key==='map'?(state[key]?'▴':'▾'):(state[key]?'▾':'▴');}
   document.body.dataset.agImmersive=String(!Object.values(state).some(Boolean));
   set(document.querySelector('.bottom.user-profile-section'),'display','none');
   window.__AGWORLD_MAIN_LAYOUT_GEOMETRY__={...geo,mode:'drawers',owner:'agworld-drawers-v1',map:'persistent-live-map',drawers:{...state}};
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;layout();});}
 function change(key,open){
   if(!(key in state)||state[key]===!!open)return;
   state[key]=!!open;
   if(key==='player'&&!open)window.AG_WORLD_GUIDE?.hide?.();
   layout();window.dispatchEvent(new Event('resize'));
   window.dispatchEvent(new CustomEvent('agworld:drawers-changed',{detail:{...state}}));
   window.dispatchEvent(new CustomEvent('agworld:game-mode-changed',{detail:{mode:Object.values(state).some(Boolean)?'panels':'game'}}));
   if(key==='player')setTimeout(()=>{for(const m of [window.map,window.agMap,window.AGWorldMap,window.leafletMap])try{m?.invalidateSize?.({animate:false});}catch(_){}window.dispatchEvent(new Event('resize'));},300);
 }
 window.AGWorldDrawers={layout,getState:()=>({...state}),geometry:()=>geo,set:change,toggle:key=>change(key,!state[key])};
 window.AGWorldGameLayer={enter:()=>Object.keys(state).forEach(k=>change(k,false)),exit:()=>change('player',true),toggle:()=>change('player',!state.player)};
 window.agWorldEnterPremium=window.AGWorldGameLayer.enter;window.agWorldExitPremium=window.AGWorldGameLayer.exit;
 const style=document.createElement('style');style.id='agworld-drawers-boot-style';style.textContent='.ag-drawer-closed{visibility:hidden!important;pointer-events:none!important}.ag-drawer-handle{position:absolute;z-index:8000}';document.head.appendChild(style);
 const start=()=>{layout();const shell=document.querySelector('.app-shell');if(shell&&'ResizeObserver'in window)new ResizeObserver(schedule).observe(shell);const header=document.querySelector('.map-header');if(header&&'ResizeObserver'in window)new ResizeObserver(schedule).observe(header);};
 addEventListener('resize',schedule,{passive:true});
 addEventListener('agworld:landing-layout-ready',schedule);addEventListener('agworld:player-ready',schedule);
 for(const e of ['agworld:dynamic-entity-selected','agworld:farm-selected'])addEventListener(e,()=>{if(window.AGWorldBootDiagnostics?.regression?.pass)change('command',true);});
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',start,{once:true}):start();
})();

/* FINAL MAP PLAYER OVERLAY KILL SWITCH
   The map must never render a second player identity. The canonical identity is
   the Player Profile in the Missions column only. This runs after every late
   map mutation and removes the smallest compact map overlay containing the
   player's name, including overlays injected inside the map header or Leaflet. */
(()=>{
  'use strict';

  const normalise=v=>String(v||'').replace(/\s+/g,' ').trim().toUpperCase();

  function canonicalNames(){
    const p=window.AGWorldPlayer||{};
    return [...new Set([
      normalise(p.display_name),
      normalise(sessionStorage.getItem('gamechanger.username')),
      'NICO VAN ROOYEN'
    ].filter(Boolean))];
  }

  function isProtected(el){
    return !!(
      !el ||
      el.closest?.('#agPlayerMissionProfile,.missions,.sidebar,#entityInformationSection,#territoryStatsDrawer') ||
      el.id==='agEnterWorldBtn' ||
      el.id==='developerModeBtn' ||
      el.closest?.('.map-tools')
    );
  }

  function compact(el,mapRect){
    const r=el.getBoundingClientRect?.();
    if(!r) return false;
    const nearMap=r.right>=mapRect.left && r.left<=mapRect.right && r.bottom>=mapRect.top && r.top<=mapRect.bottom;
    return nearMap && r.width>0 && r.height>0 && r.width<=520 && r.height<=260;
  }

  function removeOverlayCandidate(seed,mapArea,mapRect){
    if(!seed||isProtected(seed)) return;

    let target=seed;
    let n=seed;
    for(let depth=0; n && n!==mapArea && depth<8; depth++, n=n.parentElement){
      const parent=n.parentElement;
      if(!parent || parent===mapArea || parent.id==='map' || parent.classList?.contains('map-header')) break;

      const idcls=normalise((parent.id||'')+' '+(typeof parent.className==='string'?parent.className:''));
      const positioned=['ABSOLUTE','FIXED','STICKY'].includes(getComputedStyle(parent).position.toUpperCase());
      const looksLikeOverlay=/PLAYER|PROFILE|USER|AVATAR|HUD|OVERLAY|CONTROL|CHIP|LEAFLET/.test(idcls);

      if(compact(parent,mapRect) && (positioned || looksLikeOverlay)) target=parent;
      else if(normalise(parent.textContent).includes(normalise(seed.textContent)) && compact(parent,mapRect)) target=parent;
    }

    if(target===mapArea || target.id==='map' || target.classList?.contains('map-header') || isProtected(target)) return;
    target.setAttribute('data-agworld-duplicate-player-overlay','true');
    target.style.setProperty('display','none','important');
    target.style.setProperty('visibility','hidden','important');
    target.style.setProperty('pointer-events','none','important');
    target.remove();
  }

  function purge(){
    const mapArea=document.querySelector('.map-area');
    if(!mapArea) return;
    const mapRect=mapArea.getBoundingClientRect?.();
    if(!mapRect) return;

    const names=canonicalNames();

    // Remove exact player-name overlays first, always from the smallest matching
    // node so a shared map header/container is never deleted.
    [...mapArea.querySelectorAll('*')].forEach(el=>{
      if(isProtected(el)) return;
      const text=normalise(el.textContent);
      if(!text) return;
      if(!names.some(name=>name && text.includes(name))) return;

      const childAlsoMatches=[...el.children].some(child=>{
        const childText=normalise(child.textContent);
        return names.some(name=>name && childText.includes(name));
      });
      if(childAlsoMatches) return;

      removeOverlayCandidate(el,mapArea,mapRect);
    });

    // Remove the compact top-right N avatar/chip if it is the duplicate shell
    // rendered without the full name.
    [...mapArea.querySelectorAll('button,[role="button"],div,span')].forEach(el=>{
      if(isProtected(el)) return;
      const text=normalise(el.textContent);
      if(text!=='N') return;
      const r=el.getBoundingClientRect?.();
      if(!r || r.width<12 || r.height<12 || r.width>100 || r.height>100) return;
      const nearTop=(r.top-mapRect.top)<140;
      const nearRight=(mapRect.right-r.right)<180;
      if(nearTop && nearRight) removeOverlayCandidate(el,mapArea,mapRect);
    });
  }

  function start(){
    purge();
    const mapArea=document.querySelector('.map-area');
    if(!mapArea) return;
    const observer=new MutationObserver(()=>requestAnimationFrame(purge));
    observer.observe(mapArea,{childList:true,subtree:true});
    [50,150,400,900,1800,3500,7000,12000].forEach(ms=>setTimeout(purge,ms));
    setInterval(purge,2000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
