/* AG World tactical map filter HUD.
   All filter states are data-driven from the same farm records used by the map.
*/
(() => {
  const FILTERS = [
    { id:'territory', label:'TERRITORY CONTROL', group:'TERRITORY', description:'Green = company drone recorded · Red = no company drone' },
    { id:'farms', label:'FARMS', group:'TERRITORY', description:'Show individual farm locations' },
    { id:'opportunities', label:'SALES OPPORTUNITIES', group:'COMMERCIAL', description:'Farms with no company drone recorded' },
    { id:'company-drones', label:'COMPANY DRONES', group:'ASSETS', description:'Recorded company drone assets' },
    { id:'competitor-drones', label:'COMPETITOR DRONES', group:'ASSETS', description:'Recorded competitor drone indicators' },
    { id:'crops', label:'CROPS / FIELDS', group:'AGRICULTURE', description:'Crop and field records' },
    { id:'livestock', label:'LIVESTOCK', group:'AGRICULTURE', description:'Livestock records' },
    { id:'machinery', label:'MACHINERY', group:'ASSETS', description:'Tractors and machinery' },
    { id:'water', label:'WATER / IRRIGATION', group:'INFRASTRUCTURE', description:'Dams and irrigation' },
    { id:'buildings', label:'BUILDINGS / INFRASTRUCTURE', group:'INFRASTRUCTURE', description:'Buildings and infrastructure' },
    { id:'provinces', label:'PROVINCES', group:'TERRITORY', description:'South African provincial boundaries' }
  ];
  const state = Object.fromEntries(FILTERS.map(f => [f.id, false]));
  state.farms = true;
  state.provinces = true;

  const css = `
    .map-filter-control{position:absolute;right:30px;bottom:28px;z-index:35;pointer-events:auto;font-family:Arial,Helvetica,sans-serif}
    .map-filter-button{width:74px;height:74px;border-radius:50%;border:1px solid #c5d94c;background:radial-gradient(circle at 32% 27%,#6f7f78 0,#263238 30%,#0a1114 70%,#020608 100%);box-shadow:0 0 0 4px rgba(197,217,76,.08),0 12px 34px rgba(0,0,0,.7),inset -10px -12px 18px rgba(0,0,0,.55);cursor:pointer;position:relative}
    .map-filter-button:before{content:'';position:absolute;width:22px;height:22px;border:4px solid #d8e85d;border-radius:50%;left:20px;top:17px;box-sizing:border-box;box-shadow:0 0 12px rgba(197,217,76,.22)}
    .map-filter-button:after{content:'';position:absolute;width:17px;height:4px;background:#d8e85d;transform:rotate(45deg);left:39px;top:40px;border-radius:3px;box-shadow:0 0 7px rgba(197,217,76,.25)}
    .map-filter-label{position:absolute;right:82px;bottom:15px;white-space:nowrap;padding:9px 16px;border:1px solid rgba(185,206,62,.55);border-right:0;border-radius:22px 0 0 22px;background:rgba(8,13,16,.9);color:#c5d94c;font-size:10px;font-weight:800;letter-spacing:1.4px}
    .map-filter-panel{display:none;position:absolute;right:0;bottom:88px;width:340px;max-height:min(72vh,620px);overflow:auto;padding:16px;background:rgba(7,12,15,.97);border:1px solid rgba(197,217,76,.55);border-radius:12px;box-shadow:0 18px 55px rgba(0,0,0,.72);backdrop-filter:blur(12px)}
    .map-filter-control.open .map-filter-panel{display:block}
    .map-filter-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:11px;border-bottom:1px solid rgba(255,255,255,.1)}
    .map-filter-head strong{font-size:12px;letter-spacing:1.6px;color:#fff}.map-filter-head span{font-size:9px;color:#8f9c9d;letter-spacing:1px}
    .map-filter-group{margin-top:13px}.map-filter-group-title{font-size:8px;letter-spacing:1.6px;color:#7f9295;margin-bottom:6px}
    .map-filter-row{display:flex;align-items:center;gap:9px;padding:8px 7px;border-radius:6px;cursor:pointer}.map-filter-row:hover{background:rgba(197,217,76,.06)}
    .map-filter-row input{appearance:none;width:16px;height:16px;margin:0;border:1px solid #687879;border-radius:3px;background:#0d171a;position:relative;flex:0 0 auto}.map-filter-row input:checked{border-color:#c5d94c;background:#c5d94c}.map-filter-row input:checked:after{content:'✓';position:absolute;color:#101619;font-size:12px;font-weight:900;left:2px;top:-1px}
    .map-filter-row label{font-size:10px;color:#e0e5e2;letter-spacing:.4px;cursor:pointer;flex:1}.map-filter-row small{display:block;font-size:8px;color:#718083;margin-top:2px;line-height:1.25}
    .territory-legend{display:none;margin:7px 7px 0;padding:8px 9px;border:1px solid rgba(255,255,255,.08);border-radius:6px;background:rgba(255,255,255,.025);font-size:8px;color:#9ca8a8;line-height:1.5}.territory-legend.show{display:block}.legend-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px}.legend-green{background:#55c96a}.legend-red{background:#e35b5b}.legend-yellow{background:#c5d94c}
    @media(max-width:900px){.map-filter-control{right:14px;bottom:14px;transform:scale(.86);transform-origin:bottom right}.map-filter-panel{width:310px;max-height:70vh}}
  `;
  const style=document.createElement('style'); style.id='ag-world-map-filter-style'; style.textContent=css; document.head.appendChild(style);

  function farms(){ return Array.isArray(window.__AG_WORLD_FARMS) ? window.__AG_WORLD_FARMS : []; }
  function setPolygonStyle(poly, active, color){
    poly.setOptions({strokeColor:color,strokeOpacity:active?.strokeOpacity ?? .9,strokeWeight:active?.strokeWeight ?? 2,fillColor:color,fillOpacity:active?.fillOpacity ?? .18});
  }
  function territoryColor(farm){ return Number(farm.drones || 0) > 0 ? '#55c96a' : '#e35b5b'; }
  function apply(){
    const map=window.map;
    if(!map) return;
    farms().forEach(farm=>{
      const normal=farm._polygon;
      if(state.territory && normal){ setPolygonStyle(normal,true,territoryColor(farm)); normal.setMap(map); }
      else if(normal){ normal.setOptions({strokeColor:'#b9ce3e',strokeOpacity:.9,strokeWeight:2,fillColor:'#b9ce3e',fillOpacity:.16}); normal.setMap(map); }
      if(farm._marker) farm._marker.setMap(state.farms ? map : null);
      (farm.objects || []).forEach(o=>{
        const m=o._marker; if(!m) return;
        const visible = (o.type==='drone'&&state['company-drones']) || (o.type==='competitor-drone'&&state['competitor-drones']) || (o.type==='tractor'&&state.machinery) || (o.type==='crop-field'&&state.crops) || (o.type==='livestock-area'&&state.livestock) || (o.type==='dam'&&state.water) || (o.type==='irrigation'&&state.water) || (o.type==='building'&&state.buildings);
        m.setMap(visible ? map : null);
      });
    });
    if(window.agWorldSyncProvinceLayer) window.agWorldSyncProvinceLayer();
    const layer=window.__AG_WORLD_PROVINCE_LAYER;
    if(layer && map) layer.setMap(state.provinces && map.getZoom() < 12 ? map : null);
    window.dispatchEvent(new CustomEvent('agworld:map-filters-changed',{detail:{...state}}));
  }
  function install(){
    if(document.querySelector('.map-filter-control')) return;
    const root=document.createElement('section'); root.className='map-filter-control'; root.innerHTML=`
      <button class="map-filter-button" type="button" aria-label="Open map data filters" title="Map data filters"></button>
      <div class="map-filter-label">MAP DATA</div>
      <div class="map-filter-panel"><div class="map-filter-head"><strong>MAP DATA FILTERS</strong><span>TOGGLE LAYERS</span></div><div class="map-filter-list"></div></div>`;
    document.body.appendChild(root);
    const list=root.querySelector('.map-filter-list');
    const groups=[...new Set(FILTERS.map(f=>f.group))];
    groups.forEach(group=>{
      const section=document.createElement('div'); section.className='map-filter-group'; section.innerHTML=`<div class="map-filter-group-title">${group}</div>`;
      FILTERS.filter(f=>f.group===group).forEach(f=>{
        const row=document.createElement('div'); row.className='map-filter-row';
        row.innerHTML=`<input id="filter-${f.id}" type="checkbox" ${state[f.id]?'checked':''}><label for="filter-${f.id}">${f.label}<small>${f.description}</small></label>`;
        row.querySelector('input').addEventListener('change',e=>{state[f.id]=e.target.checked;apply();}); section.appendChild(row);
        if(f.id==='territory'){const legend=document.createElement('div');legend.className='territory-legend';legend.innerHTML='<span class="legend-dot legend-green"></span>COMPANY DRONE RECORDED&nbsp;&nbsp; <span class="legend-dot legend-red"></span>NO COMPANY DRONE';section.appendChild(legend);row.querySelector('input').addEventListener('change',e=>legend.classList.toggle('show',e.target.checked));if(state.territory)legend.classList.add('show');}
      }); list.appendChild(section);
    });
    root.querySelector('.map-filter-button').addEventListener('click',()=>root.classList.toggle('open'));
    document.addEventListener('click',e=>{if(!root.contains(e.target))root.classList.remove('open');});
    window.agWorldApplyMapFilters=apply;
    setTimeout(apply,1000); setTimeout(apply,3000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install); else install();
})();
