/* AG WORLD strategic map-layer engine. The visible controls live in game-hud.js. */
(() => {
  const state={territory:true,farms:true,opportunities:true,'company-drones':true,'competitor-drones':false,crops:false,livestock:false,machinery:false,water:false,infrastructure:false,provinces:true};
  let map=null, overlays=[];
  const territoryColor=f=>Number(f.drones||0)>0?'#55c96a':'#e35b5b';
  const getFarms=()=>Array.isArray(window.__AG_WORLD_FARMS)?window.__AG_WORLD_FARMS:[];
  function normalise(f){return {...f,center:f.center||{lat:Number(f.latitude),lng:Number(f.longitude)},boundary:f.boundary||[],objects:f.objects||[]};}
  async function loadData(){
    let farms=[];
    try{const r=await fetch('https://ag-world-api.onrender.com/api/farms');if(r.ok){const j=await r.json();farms=(j.farms||[]).map(normalise);}}catch(_){ }
    if(!farms.length){try{const r=await fetch('data/farms.json');if(r.ok){const j=await r.json();farms=(j.farms||[]).map(normalise);}}catch(_){}}
    try{const stored=JSON.parse(localStorage.getItem('agworld-farms-v2')||'[]');const byId=new Map(farms.map(f=>[f.id,f]));stored.forEach(f=>byId.set(f.id,normalise(f)));farms=[...byId.values()];}catch(_){ }
    window.__AG_WORLD_FARMS=farms;
    buildOverlays();
  }
  function clear(){overlays.forEach(o=>o.setMap(null));overlays=[];}
  function addMarker(f){
    if(!map||!f.center)return;
    const m=new google.maps.Marker({position:f.center,map:null,title:f.name||'Farm',label:{text:'AG',color:'#fff',fontSize:'8px',fontWeight:'700'}});
    m.addListener('click',()=>window.showToast&&window.showToast((f.name||'Farm')+' selected'));
    m.__agLayer='farms';overlays.push(m);f.__layerMarker=m;
  }
  function addTerritory(f){
    if(!map||!f.boundary||f.boundary.length<3)return;
    const color=territoryColor(f);
    const p=new google.maps.Polygon({paths:f.boundary,map:null,strokeColor:color,strokeOpacity:.9,strokeWeight:2,fillColor:color,fillOpacity:.18,clickable:true});
    p.addListener('click',()=>{document.getElementById('ag-selected-name')&&(document.getElementById('ag-selected-name').textContent=f.name||'FARM');document.getElementById('ag-selected-state')&&(document.getElementById('ag-selected-state').textContent=Number(f.drones||0)>0?'DRONE CONTROLLED':'UNCOVERED OPPORTUNITY');});
    p.__agLayer='territory';overlays.push(p);f.__layerPolygon=p;
  }
  function addObjects(f){
    (f.objects||[]).forEach(o=>{if(!o.position)return;const marker=new google.maps.Marker({position:o.position,map:null,title:o.name||o.type||'Asset',label:{text:o.type==='drone'?'✦':o.type==='competitor-drone'?'◇':o.type==='tractor'?'▣':o.type==='crop-field'?'🌾':o.type==='dam'?'◉':o.type==='building'?'⌂':o.type==='irrigation'?'≈':'•',color:'#fff',fontSize:'12px'}});marker.__agLayer=o.type==='drone'?'company-drones':o.type==='competitor-drone'?'competitor-drones':o.type==='tractor'?'machinery':o.type==='crop-field'?'crops':o.type==='livestock-area'?'livestock':(o.type==='dam'||o.type==='irrigation')?'water':o.type==='building'?'infrastructure':null;overlays.push(marker);o.__layerMarker=marker;});
  }
  function buildOverlays(){clear();getFarms().forEach(f=>{addMarker(f);addTerritory(f);addObjects(f)});apply();}
  function apply(){
    if(!map)return;
    getFarms().forEach(f=>{
      if(f.__layerMarker)f.__layerMarker.setMap(state.farms?map:null);
      if(f.__layerPolygon){const visible=state.territory;f.__layerPolygon.setMap(visible?map:null);if(visible){const c=territoryColor(f);f.__layerPolygon.setOptions({strokeColor:c,fillColor:c});}}
      (f.objects||[]).forEach(o=>{if(o.__layerMarker)o.__layerMarker.setMap(o.__layerMarker.__agLayer&&state[o.__layerMarker.__agLayer]?map:null);});
    });
    const province=window.__AG_WORLD_PROVINCE_LAYER;if(province)province.setMap(state.provinces&&map.getZoom()<12?map:null);
    window.dispatchEvent(new CustomEvent('agworld:map-filters-changed',{detail:{...state}}));
  }
  function captureMap(){
    if(!window.agWorldMapReady||window.__AG_WORLD_LAYER_WRAPPED)return;
    const original=window.agWorldMapReady;window.__AG_WORLD_LAYER_WRAPPED=true;
    window.agWorldMapReady=()=>{
      const ctor=window.google?.maps?.Map;
      if(ctor){google.maps.Map=function(...args){const instance=Reflect.construct(ctor,args,ctor);map=instance;window.map=instance;return instance};google.maps.Map.prototype=ctor.prototype;}
      try{original()}finally{if(ctor)google.maps.Map=ctor;}
      map=map||window.map;window.map=map;
      if(map){map.addListener('zoom_changed',apply);setTimeout(loadData,250);}
    };
  }
  window.agWorldSetLayerVisibility=(layer,visible)=>{state[layer]=!!visible;apply()};
  window.agWorldGetLayerState=()=>({...state});
  captureMap();setTimeout(captureMap,100);setTimeout(captureMap,500);setTimeout(captureMap,1200);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',captureMap);else captureMap();
})();
