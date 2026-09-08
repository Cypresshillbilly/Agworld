(function(global){
'use strict';
const SEED_KEY='agworld:demo-world-seed-v2';
const facilities=[
 {name:'Ballito Company Facility',town:'Ballito',province:'KwaZulu-Natal',lat:-29.5389,lng:31.2144,type:'Company Facility',address:'6 Adam Park, Garlick Drive, Ballito, 4420'},
 {name:'Lichtenburg Company Facility',town:'Lichtenburg',province:'North West',lat:-26.1520,lng:26.1597,type:'Head Office',address:'40 Daniel Straat, Lichtenburg, 2740'},
 {name:'Bothaville Company Facility',town:'Bothaville',province:'Free State',lat:-27.3886,lng:26.6170,type:'Company Facility',address:'Corner of 7de Ave and Nywerheids Ave, Bothaville'}
];
const names=['AgriSky','FieldForce','Precision Crop','Rural Air','HarvestTech','GreenWing','FarmFlight','AgriReach','CropScan','LandLift'];
const surnames=['Mokoena','Botha','Jacobs','Naidoo','van Wyk','Mahlangu','Smit','Dlamini','Fourie','Nkosi'];
const services=['Drone Services','Aerial Spraying','Mapping & Surveying','Training','Maintenance','Other Agricultural Services'];

function jitter(v,i,span){return v+Math.sin((i+1)*12.9898)*span}
function dist(a,b){const R=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180,h=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
function farmPoint(f){
 const p=f?.center || f?.position;
 if(p&&Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng))) return {lat:Number(p.lat),lng:Number(p.lng)};
 const b=f?.boundary;
 if(Array.isArray(b)&&b.length){
  const pts=b.filter(p=>Number.isFinite(Number(p.lat))&&Number.isFinite(Number(p.lng)));
  if(pts.length)return {lat:pts.reduce((s,p)=>s+Number(p.lat),0)/pts.length,lng:pts.reduce((s,p)=>s+Number(p.lng),0)/pts.length};
 }
 return null;
}
function farms(){
 const w=global.AG_WORLD_WORLD||{};
 const fs=global.__AG_WORLD_FARMS||w.getFarms?.()||[];
 return fs.map(f=>{const p=farmPoint(f);return p?{...f,lat:p.lat,lng:p.lng}:null}).filter(Boolean);
}
function progress(stage,current,total,message){global.dispatchEvent(new CustomEvent('agworld:demo-world-seed-progress',{detail:{stage,current,total,message}}));}

async function seed(){
 if(global.localStorage.getItem(SEED_KEY)) return {facilities:3,contractors:50,alreadyComplete:true};
 if(!global.AGWorldDynamicEntityAPI?.create||!global.AGWorldDynamicEntityAPI?.createRelationship) throw new Error('The canonical Contractor / Company Facility creation workflow is not ready.');

 const fs=farms();
 if(!fs.length) throw new Error('No mapped farms are available. Contractors cannot be populated because each must be geographically linked to farms within 300 km.');

 progress('preparing',0,1,'Verifying the live map, creation workflow and farms…');

 const createdFacilities=[];
 for(let i=0;i<facilities.length;i++){
  const f=facilities[i];
  progress('facilities',i,facilities.length,'Creating or verifying '+f.name+'…');
  createdFacilities.push(await global.AGWorldDynamicEntityAPI.create('companyFacility',{
   id:'seed-company-facility-'+f.town.toLowerCase().replace(/[^a-z]+/g,'-'),
   name:f.name,lat:f.lat,lng:f.lng,status:'Active',
   details:{country:'South Africa',province:f.province,nearestTown:f.town,municipality:'',website:'',notes:'Company '+f.type+' located at '+f.address+'.',address:f.address,capabilities:[f.type.includes('Head Office')?'Head Office':'Regional Office','Operations Base']}
  }));
 }

 const createdContractors=[];
 for(let i=0;i<50;i++){
  progress('contractors',i,50,'Creating contractor '+(i+1)+' of 50…');
  const base=fs[i%fs.length];
  // ~0.55 degrees max offset keeps the generated contractor geographically close
  // to an existing farm and therefore safely inside the 300 km relationship rule.
  const lat=jitter(base.lat,i,0.55),lng=jitter(base.lng,i+100,0.55);
  const company=names[i%names.length]+' '+['Aerial Services','Drone Solutions','Agri Operations','Precision Aviation','Crop Services'][i%5]+' '+(i+1);
  const contact=['Thabo','Pieter','Lerato','Johan','Nomsa'][i%5]+' '+surnames[i%surnames.length];
  createdContractors.push(await global.AGWorldDynamicEntityAPI.create('contractor',{
   id:'seed-contractor-'+String(i+1).padStart(2,'0'),name:company,lat,lng,status:i%7===0?'Prospect':'Active',
   contactName:contact,contactCell:'+27 82 '+String(1000000+i).slice(-7),contactEmail:company.toLowerCase().replace(/[^a-z0-9]+/g,'.')+'.example@agworld.demo',
   details:{country:'South Africa',province:base.province||'',municipality:base.municipality||'',nearestTown:base.nearestTown||base.details?.nearestTown||'',website:'',notes:'Fictional agricultural drone contractor generated for the AG World simulation.',capabilities:[services[i%services.length],services[(i+2)%services.length]],employees:3+i%18,operatingCapacity:(80+i*7)+' hectares/day',control:i%3===0?'competitor':i%5===0?'neutral':'company',primaryPlatform:i%3===0?'Competitor Agricultural Drone':'Company Agricultural Drone',seeded:true}
  }));
 }

 let relationshipCount=0;
 for(let i=0;i<createdContractors.length;i++){
  progress('relationships',i,createdContractors.length,'Linking contractor '+(i+1)+' of '+createdContractors.length+' to farms within 300 km…');
  const c=createdContractors[i],cp={lat:Number(c.lat),lng:Number(c.lng)};
  // Prefer the Contractor's anchor Farm, then the nearest Farms. Every Farm
  // may have only one active Contractor, so conflicts are skipped rather than
  // creating a shared assignment.
  const anchor=fs[i%fs.length];
  const nearby=fs.map(f=>({f,d:dist(cp,f)}))
    .filter(x=>x.d<=300)
    .sort((a,b)=>a.d-b.d);
  const ordered=[];
  const anchorDistance=dist(cp,anchor);
  if(anchorDistance<=300) ordered.push({f:anchor,d:anchorDistance});
  nearby.forEach(item=>{if(!ordered.some(x=>String(x.f.id)===String(item.f.id))) ordered.push(item);});

  if(!ordered.length) throw new Error('Generated contractor '+c.name+' has no farm within 300 km; population stopped before creating invalid relationships.');

  let linked=false;
  for(const {f,d} of ordered){
   try{
    await global.AGWorldDynamicEntityAPI.createRelationship({
      sourceEntityId:c.id,sourceEntityType:'contractor',targetEntityId:f.id,targetEntityType:'farm',
      relationshipType:'serves',status:'active',
      metadata:{distanceKm:Math.round(d*10)/10,relationshipStatus:'active',seeded:true}
    });
    relationshipCount++;
    linked=true;
    // One unique Farm assignment per generated Contractor is sufficient for
    // initial population and guarantees that no Farm is shared.
    break;
   }catch(err){
    if(!/already linked to another Contractor/i.test(String(err?.message||err))) throw err;
   }
  }
  if(!linked) throw new Error('No unassigned Farm within 300 km is available for '+c.name+'. A Farm may only be linked to one Contractor.');
 }
 progress('relationships',50,50,'Relationships complete. Refreshing GIS control…');
 global.localStorage.setItem(SEED_KEY,new Date().toISOString());
 global.dispatchEvent(new CustomEvent('agworld:demo-world-seeded',{detail:{facilities:createdFacilities.length,contractors:createdContractors.length,relationships:relationshipCount}}));
 global.dispatchEvent(new CustomEvent('agworld:entity-updated',{detail:{reason:'controlled-demo-world-seed'}}));
 if(typeof global.refreshTerritoryControl==='function') global.refreshTerritoryControl();
 return {facilities:createdFacilities.length,contractors:createdContractors.length,relationships:relationshipCount};
}
global.AGWorldDemoWorldSeed={run:seed,facilities};
})(window);

/* COMPANY FACILITY COMMAND POLISH v1 */
(function(global){
'use strict';

const CANONICAL=[
  {key:'ballito',name:'Ballito',town:'Ballito',role:'COMPANY FACILITY',address:'6 Adam Park, Garlick Drive, Ballito, 4420'},
  {key:'lichtenburg',name:'Lichtenburg (Head Office)',town:'Lichtenburg',role:'HEAD OFFICE',address:'40 Daniel Straat, Lichtenburg, 2740'},
  {key:'bothaville',name:'Bothaville',town:'Bothaville',role:'COMPANY FACILITY',address:'Corner of 7de Ave and Nywerheids Ave, Bothaville'}
];

const normalise=value=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');
const metaFor=value=>{
  const n=normalise(value);
  return CANONICAL.find(meta=>n.includes(normalise(meta.town))||normalise(meta.town).includes(n))||null;
};
const facilityList=()=>{
  const world=global.AG_WORLD_WORLD||{};
  const list=world.getCompanyFacilities?.()||global.__AG_WORLD_COMPANY_FACILITIES__||[];
  return Array.isArray(list)?list:[];
};
const coordinatesFor=facility=>{
  if(!facility) return null;
  const d=facility.details||{};
  const lat=Number(facility.lat??facility.latitude??d.lat??d.latitude);
  const lng=Number(facility.lng??facility.lon??facility.longitude??d.lng??d.lon??d.longitude);
  return Number.isFinite(lat)&&Number.isFinite(lng)?{lat,lng}:null;
};
const findFacility=(id,meta)=>{
  const list=facilityList();
  return list.find(f=>String(f?.id)===String(id)) ||
    list.find(f=>metaFor(f?.name||f?.details?.nearestTown)?.key===meta.key) ||
    list.find(f=>normalise(f?.name).includes(normalise(meta.town))) || null;
};

function focusFacility(facility,meta){
  const coords=coordinatesFor(facility);
  const marker=facility?._marker;
  const map=marker?.getMap?.() || global.AG_WORLD_MAP || global.__AG_WORLD_MAP__ || global.AGWorldMapInstance || null;
  let focused=false;

  if(map && coords){
    try{ map.panTo({lat:coords.lat,lng:coords.lng}); focused=true; }catch(_){}
    try{ map.setZoom(Math.max(Number(map.getZoom?.()||0),14)); focused=true; }catch(_){}
    try{ map.setCenter({lat:coords.lat,lng:coords.lng}); focused=true; }catch(_){}
  }

  // Trigger the exact live marker selection pipeline whenever the marker exists.
  if(marker && global.google?.maps?.event?.trigger){
    try{ global.google.maps.event.trigger(marker,'click'); focused=true; }catch(_){}
  }

  const payload={entity:facility,facility,coordinates:coords,source:'company-facility-command-polish',facilityKey:meta.key};
  if(!focused){
    const hooks=[
      global.focusEntityOnMap,global.focusMapEntity,global.flyToEntity,
      global.focusCompanyFacility,global.flyToCompanyFacility,
      global.AGWorldGIS?.focusEntity,global.AGWorldGIS?.focusCompanyFacility,
      global.AGWorldMap?.focusEntity,global.AGWorldMap?.focusCompanyFacility,
      global.AG_WORLD_WORLD?.focusEntity,global.AG_WORLD_WORLD?.focusCompanyFacility
    ];
    for(const hook of hooks){
      if(typeof hook!=='function') continue;
      try{ hook(facility,payload); focused=true; break; }catch(_){}
    }
  }

  global.dispatchEvent(new CustomEvent('agworld:focus-entity',{detail:payload}));
  global.dispatchEvent(new CustomEvent('agworld:company-facility-open-request',{detail:payload}));
  global.dispatchEvent(new CustomEvent('agworld:dynamic-entity-selected',{detail:{entity:facility}}));

  global.__AGWORLD_COMPANY_FACILITY_COMMAND_HEALTH__=global.__AGWORLD_COMPANY_FACILITY_COMMAND_HEALTH__||{};
  global.__AGWORLD_COMPANY_FACILITY_COMMAND_HEALTH__[meta.key]={
    name:meta.name,
    id:String(facility?.id||''),
    coordinates:coords,
    markerReady:!!marker,
    mapReady:!!map,
    lastFocusedAt:Date.now(),
    focused
  };
  return focused;
}

function healthCheck(){
  const list=facilityList();
  const result={checkedAt:Date.now(),facilities:{}};
  CANONICAL.forEach(meta=>{
    const facility=findFacility('',meta);
    const coords=coordinatesFor(facility);
    result.facilities[meta.key]={
      expectedName:meta.name,
      found:!!facility,
      id:String(facility?.id||''),
      coordinates:coords,
      coordinatesReady:!!coords,
      markerReady:!!facility?._marker,
      mapReady:!!facility?._marker?.getMap?.()
    };
  });
  result.healthy=CANONICAL.every(meta=>{
    const item=result.facilities[meta.key];
    return item.found&&item.coordinatesReady;
  });
  global.__AGWORLD_COMPANY_FACILITY_COMMAND_HEALTH__={...(global.__AGWORLD_COMPANY_FACILITY_COMMAND_HEALTH__||{}),...result};
  return result;
}

function renderRow(row,facility,meta){
  if(!row || !facility || !meta) return;
  row.dataset.agworldFacilityCommandPolished='1';
  row.dataset.agworldFacilityCommandKey=meta.key;
  row.dataset.mapReady=facility?._marker?.getMap?.()?'true':'pending';
  row.classList.add('agworld-company-facility-command');
  row.setAttribute('aria-label','Open '+meta.name+' on map');
  row.title='Open '+meta.name+' on the map';

  const staff=Number(facility?.details?.employees??facility?.details?.employeeCount??facility?.employees??facility?.employeeCount??0)||0;
  row.innerHTML=
    '<div class="company-facility-marker"><i></i></div>'+
    '<div class="company-facility-command-copy">'+
      '<b>'+meta.name+'</b>'+
      '<span class="company-facility-command-role">'+meta.role+'</span>'+
      '<span class="company-facility-command-address">'+meta.address+'</span>'+
    '</div>'+
    (staff?'<div class="company-facility-staff"><b>'+staff+'</b><span>STAFF</span></div>':'')+
    '<div class="company-facility-command-open"><span>OPEN MAP</span><b>→</b></div>';

  if(row.dataset.agworldFacilityCommandBound==='1') return;
  row.dataset.agworldFacilityCommandBound='1';
  const activate=event=>{
    event?.preventDefault?.();
    event?.stopImmediatePropagation?.();
    document.querySelectorAll('#farmCard .company-facility-row').forEach(node=>node.classList.remove('is-selected'));
    row.classList.add('is-selected');
    const live=findFacility(row.dataset.companyFacilityId,meta)||facility;
    focusFacility(live,meta);
  };
  row.addEventListener('click',activate,true);
  row.addEventListener('keydown',event=>{
    if(event.key==='Enter'||event.key===' '){ activate(event); }
  },true);
}

function polish(){
  const card=document.getElementById('farmCard');
  if(!card?.classList.contains('agworld-company-entity-card')) return false;
  const rows=[...card.querySelectorAll('.company-facility-row[data-company-facility-id]')];
  if(!rows.length) return false;
  let canonicalCount=0;
  rows.forEach(row=>{
    const facility=facilityList().find(f=>String(f?.id)===String(row.dataset.companyFacilityId));
    const meta=metaFor(facility?.name||row.textContent);
    if(!meta){
      row.hidden=true;
      row.style.display='none';
      return;
    }
    row.hidden=false;
    row.style.removeProperty('display');
    canonicalCount++;
    renderRow(row,facility,meta);
  });
  card.dataset.agworldCompanyFacilityCommandPolished=String(canonicalCount);
  healthCheck();
  return canonicalCount===CANONICAL.length;
}

const style=document.createElement('style');
style.id='agworldCompanyFacilityCommandPolishV1';
style.textContent=
'#entityInformationSection .agworld-company-entity-card .company-facility-row.agworld-company-facility-command{display:grid!important;grid-template-columns:22px minmax(0,1fr) auto auto!important;align-items:center!important;gap:12px!important;min-height:68px!important;padding:11px 13px!important;margin:0 0 8px!important;border:1px solid rgba(126,167,148,.24)!important;border-radius:8px!important;cursor:pointer!important;transition:transform .14s ease,border-color .14s ease,box-shadow .14s ease,background .14s ease!important;outline:none!important}'+
'#entityInformationSection .agworld-company-entity-card .company-facility-row.agworld-company-facility-command:hover,#entityInformationSection .agworld-company-entity-card .company-facility-row.agworld-company-facility-command:focus-visible,#entityInformationSection .agworld-company-entity-card .company-facility-row.agworld-company-facility-command.is-selected{transform:translateY(-1px)!important;background:linear-gradient(135deg,#102228 0%,#0b171c 100%)!important;border-color:rgba(117,224,132,.62)!important;box-shadow:0 0 0 1px rgba(117,224,132,.08),0 10px 22px rgba(0,0,0,.22)!important}'+
'#entityInformationSection .agworld-company-entity-card .company-facility-command-copy{min-width:0!important;display:flex!important;flex-direction:column!important;gap:2px!important}'+
'#entityInformationSection .agworld-company-entity-card .company-facility-command-copy>b{font-size:13px!important;letter-spacing:.02em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}'+
'#entityInformationSection .agworld-company-entity-card .company-facility-command-role{font-size:9px!important;letter-spacing:.12em!important;font-weight:800!important;color:#8ee99d!important}'+
'#entityInformationSection .agworld-company-entity-card .company-facility-command-address{font-size:10px!important;line-height:1.3!important;color:#9fb2a7!important;white-space:normal!important}'+
'#entityInformationSection .agworld-company-entity-card .company-facility-command-open{display:flex!important;align-items:center!important;gap:7px!important;padding-left:9px!important;border-left:1px solid rgba(126,167,148,.16)!important;color:#8ee99d!important;white-space:nowrap!important}'+
'#entityInformationSection .agworld-company-entity-card .company-facility-command-open span{font-size:8px!important;letter-spacing:.12em!important;font-weight:800!important;color:#8ee99d!important}'+
'#entityInformationSection .agworld-company-entity-card .company-facility-command-open b{font-size:18px!important;line-height:1!important;color:#dfffe5!important}'+
'#entityInformationSection .agworld-company-entity-card .company-facility-row[data-map-ready="pending"] .company-facility-command-open span::after{content:" · READYING";opacity:.65}';
document.head.appendChild(style);

let queued=false;
const queue=()=>{
  if(queued) return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;polish();});
};
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true});
global.addEventListener('load',()=>{queue();setTimeout(queue,400);setTimeout(queue,1200);setTimeout(queue,3000);});
global.addEventListener('agworld:dynamic-layers-loaded',()=>{queue();setTimeout(queue,120);});
global.addEventListener('agworld:entity-updated',queue);
global.AGWorldCompanyFacilityCommand={
  canonical:CANONICAL.map(item=>({...item})),
  polish,
  health:healthCheck,
  open(key){
    const meta=CANONICAL.find(item=>item.key===key);
    const facility=meta&&findFacility('',meta);
    return meta&&facility?focusFacility(facility,meta):false;
  }
};
queue();
})(window);
