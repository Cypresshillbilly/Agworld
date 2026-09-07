(function(){'use strict';
const DB='https://vcnkspaljmsjvonftfcw.supabase.co',KEY='sb_publishable_azAO3PoKko79ccwSJFjkhQ_L67ZM85o';
let overlays=[],timer=null,latest=null;
const type=t=>String(t||'farm').toLowerCase().replace(/[\s_-]+/g,'').replace('companyfacility','company_facility');
const clear=()=>{overlays.forEach(o=>{try{o.setMap(null)}catch(_){}});overlays=[]};
function pos(t,id,selected){const key=String(id); if(selected&&key===String(selected.id)&&Number.isFinite(+selected.lat)&&Number.isFinite(+selected.lng))return{lat:+selected.lat,lng:+selected.lng};
const w=window.AG_WORLD_WORLD; if(type(t)==='farm'){const f=w?.farms?.find(x=>String(x.id)===key);const p=f?.center;return p?{lat:+p.lat,lng:+p.lng}:null}
const arr=type(t)==='contractor'?w?.getContractors?.():type(t)==='competitor'?w?.getCompetitors?.():w?.getCompanyFacilities?.(); const e=arr?.find(x=>String(x.id)===key); const p=e?._marker?.getPosition?.(); return p?{lat:p.lat(),lng:p.lng()}:e&&Number.isFinite(+e.lat)&&Number.isFinite(+e.lng)?{lat:+e.lat,lng:+e.lng}:null}
async function render(s){latest=s; const map=s.entity?._marker?.getMap?.()||window.AG_WORLD_WORLD?.farms?.find(f=>String(f.id)===String(s.id))?._marker?.getMap?.():null;if(!map)return;
const db=window.supabase?.createClient?.(DB,KEY);if(!db)return;const {data,error}=await db.from('entity_relationships').select('*').eq('status','active');if(error||latest!==s)return;clear();
(data||[]).forEach(r=>{const a=r.source_entity_id??r.sourceEntityId,b=r.target_entity_id??r.targetEntityId;if(String(a)!==String(s.id)&&String(b)!==String(s.id))return;const st=r.source_entity_type??r.sourceEntityType,tt=r.target_entity_type??r.targetEntityType,p1=pos(st,a,s),p2=pos(tt,b,s);if(!p1||!p2)return;const color='#39b7c9',path=[p1,p2];[['#39b7c9',10,.5],['#fff',4,.98]].forEach(([c,w,o])=>overlays.push(new google.maps.Polyline({path,geodesic:true,strokeColor:c,strokeWeight:w,strokeOpacity:o,zIndex:9999,map})))})}
function schedule(s){latest=s;clearTimeout(timer);timer=setTimeout(()=>render(s).catch(console.warn),900)}
window.addEventListener('agworld:farm-selected',e=>e.detail?.farm&&schedule({id:e.detail.farm.id,type:'farm',lat:e.detail.farm.center?.lat,lng:e.detail.farm.center?.lng,entity:e.detail.farm}));
window.addEventListener('agworld:dynamic-entity-selected',e=>{const x=e.detail?.entity;if(x)schedule({id:x.id,type:x.type,lat:x.lat,lng:x.lng,entity:x})});
})();