/* AG WORLD — live Menu navigation. Every sidebar item is an active map command. */
(()=>{
  const REPO_MAP_FALLBACK={lat:-29,lng:24};
  const state={map:null,farmMarkers:[],objectMarkers:[]};

  function captureGoogleMap(){
    if(!window.google?.maps || !window.agWorldMapReady || window.__agMenuWrapped) return;
    window.__agMenuWrapped=true;
    const originalReady=window.agWorldMapReady;
    const OriginalMap=google.maps.Map;
    const OriginalMarker=google.maps.Marker;
    google.maps.Map=function(...args){
      const instance=new OriginalMap(...args);
      state.map=instance;
      window.__agMenuMap=instance;
      return instance;
    };
    google.maps.Marker=function(...args){
      const marker=new OriginalMarker(...args);
      const opts=args[0]||{};
      if(opts.label?.text==='AG') state.farmMarkers.push(marker);
      else state.objectMarkers.push(marker);
      return marker;
    };
    window.agWorldMapReady=function(){
      try{ originalReady(); }
      finally{
        google.maps.Map=OriginalMap;
        google.maps.Marker=OriginalMarker;
        state.map=window.__agMenuMap||state.map;
        window.__AG_WORLD_MENU_READY=true;
      }
    };
  }

  function toast(message){
    const t=document.getElementById('toast');
    if(!t)return;
    t.textContent=message;
    t.classList.add('show');
    clearTimeout(window.__agMenuToastTimer);
    window.__agMenuToastTimer=setTimeout(()=>t.classList.remove('show'),1800);
  }

  function positionOf(marker){
    const p=marker?.getPosition?.();
    return p ? {lat:p.lat(),lng:p.lng()} : null;
  }

  function goTo(position,zoom,label){
    const map=state.map||window.__agMenuMap;
    if(!map||!position){
      toast('Map is still loading — try again in a moment.');
      return;
    }
    map.panTo(position);
    map.setZoom(zoom);
    const stage=document.getElementById('zoomStage');
    if(stage) stage.textContent=`MENU · ${label}`;
    const status=document.getElementById('mapStatus');
    if(status) status.textContent=`Menu navigation · ${label}`;
  }

  function boundsForFarmMarkers(){
    const points=state.farmMarkers.map(positionOf).filter(Boolean);
    if(!points.length)return null;
    let minLat=Infinity,maxLat=-Infinity,minLng=Infinity,maxLng=-Infinity;
    points.forEach(p=>{minLat=Math.min(minLat,p.lat);maxLat=Math.max(maxLat,p.lat);minLng=Math.min(minLng,p.lng);maxLng=Math.max(maxLng,p.lng);});
    return {center:{lat:(minLat+maxLat)/2,lng:(minLng+maxLng)/2},spread:Math.max(maxLat-minLat,maxLng-minLng)};
  }

  function targetFor(key){
    const farms=state.farmMarkers;
    const objects=state.objectMarkers;
    const farm=(index)=>positionOf(farms[index]||farms[0]);
    const drone=objects.find(m=>m.getLabel?.()?.text==='✦');
    const all=boundsForFarmMarkers();
    switch(key){
      case 'dashboard': return {position:REPO_MAP_FALLBACK,zoom:5,label:'NATIONAL OVERVIEW'};
      case 'map': return {position:REPO_MAP_FALLBACK,zoom:5,label:'TERRITORY MAP'};
      case 'missions': return {position:farm(0)||REPO_MAP_FALLBACK,zoom:10,label:'PRIORITY MISSION'};
      case 'opportunities': return {position:farm(1)||farm(0)||REPO_MAP_FALLBACK,zoom:12,label:'OPPORTUNITY FARM'};
      case 'clients': return {position:farm(2)||farm(0)||REPO_MAP_FALLBACK,zoom:12,label:'CLIENT FARM'};
      case 'drones': return {position:positionOf(drone)||farm(0)||REPO_MAP_FALLBACK,zoom:13,label:'DRONE ASSETS'};
      case 'reports': return {position:all?.center||REPO_MAP_FALLBACK,zoom:7,label:'TERRITORY REPORTS'};
      case 'leaderboard': return {position:all?.center||REPO_MAP_FALLBACK,zoom:6,label:'TERRITORY PERFORMANCE'};
      case 'rewards': return {position:farm(3)||farm(0)||REPO_MAP_FALLBACK,zoom:11,label:'REWARD TARGET'};
      case 'resources': return {position:farm(4)||farm(0)||REPO_MAP_FALLBACK,zoom:10,label:'FIELD RESOURCES'};
      case 'settings': return {position:REPO_MAP_FALLBACK,zoom:5,label:'MAP SETTINGS'};
      default: return {position:REPO_MAP_FALLBACK,zoom:5,label:'NATIONAL OVERVIEW'};
    }
  }

  function bindMenu(){
    const nav=document.querySelector('.sidebar .nav');
    if(!nav||nav.dataset.mapNavigationBound==='1')return;
    nav.dataset.mapNavigationBound='1';
    const buttons=[...nav.querySelectorAll('button')];
    const keys=['dashboard','map','missions','opportunities','clients','drones','reports','leaderboard','rewards','resources','settings'];
    buttons.forEach((button,index)=>{
      const key=keys[index];
      if(!key)return;
      button.dataset.menuTarget=key;
      button.setAttribute('type','button');
      button.addEventListener('click',event=>{
        event.preventDefault();
        nav.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
        button.classList.add('active');
        const target=targetFor(key);
        goTo(target.position,target.zoom,target.label);
      });
    });
  }

  function observeSidebar(){
    bindMenu();
    const observer=new MutationObserver(bindMenu);
    observer.observe(document.body,{childList:true,subtree:true});
  }

  function init(){
    captureGoogleMap();
    observeSidebar();
    const retry=setInterval(()=>{
      captureGoogleMap();
      bindMenu();
      if(window.__AG_WORLD_MENU_READY)clearInterval(retry);
    },100);
    setTimeout(()=>clearInterval(retry),15000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
