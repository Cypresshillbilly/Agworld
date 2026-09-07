(function(global){
'use strict';

const PREFIX='agworld.world-event.';
const MAX_EVENTS=250;
const MAX_CONSEQUENCES=1000;

const TYPES={
  drought:{label:'Drought',severity:'high',description:'Reduced water availability and agricultural stress.'},
  weather:{label:'Severe Weather',severity:'high',description:'A significant weather event affecting mapped entities.'},
  contractor_failure:{label:'Contractor Equipment Failure',severity:'medium',description:'A contractor service disruption.'},
  competitor_expansion:{label:'Competitor Expansion',severity:'medium',description:'A competitor expands operations.'},
  facility_shutdown:{label:'Facility Shutdown',severity:'high',description:'A company facility becomes unavailable.'},
  market_opportunity:{label:'Market Opportunity',severity:'positive',description:'A new commercial opportunity becomes available.'},
  contract_award:{label:'Contract Award',severity:'positive',description:'A new contract changes commercial relationships.'},
  custom:{label:'Custom Event',severity:'medium',description:'A manually created AG World event.'}
};

const state=global.__AGWORLD_WORLD_EVENT_STATE__||{events:[],consequences:[]};
global.__AGWORLD_WORLD_EVENT_STATE__=state;

function id(prefix){return prefix+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,8)}
function save(){try{localStorage.setItem(PREFIX+'events',JSON.stringify(state.events.slice(0,MAX_EVENTS)));localStorage.setItem(PREFIX+'consequences',JSON.stringify(state.consequences.slice(0,MAX_CONSEQUENCES)))}catch(e){console.warn('[AG World] World event persistence failed',e)}}
function restore(){try{const e=JSON.parse(localStorage.getItem(PREFIX+'events')||'[]');const c=JSON.parse(localStorage.getItem(PREFIX+'consequences')||'[]');state.events=Array.isArray(e)?e:[];state.consequences=Array.isArray(c)?c:[]}catch(e){}}
restore();

function normType(t){const k=String(t||'farm').toLowerCase().replace(/[\s_-]+/g,'');return k==='companyfacility'?'company_facility':k}
function point(entity){return{lat:Number(entity?.lat??entity?.center?.lat),lng:Number(entity?.lng??entity?.center?.lng)}}
function distance(a,b){const p=point(a),q=point(b);if(![p.lat,p.lng,q.lat,q.lng].every(Number.isFinite))return Infinity;const R=6371,dLat=(q.lat-p.lat)*Math.PI/180,dLng=(q.lng-p.lng)*Math.PI/180,h=Math.sin(dLat/2)**2+Math.cos(p.lat*Math.PI/180)*Math.cos(q.lat*Math.PI/180)*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
function allEntities(){
 const w=global.AG_WORLD_WORLD||{};
 const farms=global.__AG_WORLD_FARMS||w.farms||w.getFarms?.()||[];
 const contractors=w.getContractors?.()||global.__AG_WORLD_CONTRACTORS||[];
 const competitors=w.getCompetitors?.()||global.__AG_WORLD_COMPETITORS||[];
 const facilities=w.getCompanyFacilities?.()||global.__AG_WORLD_COMPANY_FACILITIES||[];
 return [
  ...(Array.isArray(farms)?farms:[]).map(e=>({...e,type:'farm'})),
  ...(Array.isArray(contractors)?contractors:[]).map(e=>({...e,type:'contractor'})),
  ...(Array.isArray(competitors)?competitors:[]).map(e=>({...e,type:'competitor'})),
  ...(Array.isArray(facilities)?facilities:[]).map(e=>({...e,type:'company_facility'}))
 ].filter(e=>e?.id);
}
function entityTerritory(e){return e?.territoryId||e?.details?.territoryId||e?.geographicRelationships?.context?.territoryId||e?.details?.geographicRelationships?.context?.territoryId||null}
function relatedIds(seed){
 const rows=seed?.relationships||[];
 return new Set((Array.isArray(rows)?rows:[]).flatMap(r=>[r.sourceEntityId||r.source_entity_id,r.targetEntityId||r.target_entity_id]).filter(Boolean).map(String));
}
function targetEntities(event){
 const entities=allEntities(), target=event.target||{}, radius=Number(target.radiusKm??50);
 const explicitIds=new Set((target.entityIds||[]).map(String));
 const territoryId=target.territoryId?String(target.territoryId):null;
 const centre=target.entity||target.location||null;
 return entities.filter(e=>{
   if(explicitIds.has(String(e.id)))return true;
   if(territoryId&&String(entityTerritory(e))===territoryId)return true;
   if(centre&&Number.isFinite(radius)&&distance(e,centre)<=radius)return true;
   return false;
 });
}
function impactFor(event,entity){
 const type=event.type, own=normType(entity.type), sev=event.severity||TYPES[type]?.severity||'medium';
 if(type==='drought')return own==='farm'?{dimension:'operations',effect:'negative',magnitude:'high',text:'Drought conditions are affecting agricultural operations.'}:{dimension:'market',effect:'negative',magnitude:'medium',text:'Drought conditions are affecting the surrounding agricultural economy.'};
 if(type==='weather')return{dimension:'operations',effect:'negative',magnitude:sev==='critical'?'critical':'high',text:'Severe weather is disrupting operations in the affected area.'};
 if(type==='contractor_failure')return own==='contractor'?{dimension:'service',effect:'negative',magnitude:'high',text:'Contractor service capacity is disrupted.'}:{dimension:'relationships',effect:'negative',magnitude:'medium',text:'A connected contractor disruption may affect planned services.'};
 if(type==='competitor_expansion')return own==='competitor'?{dimension:'market',effect:'positive',magnitude:'medium',text:'Expansion strengthens competitive presence.'}:{dimension:'market',effect:'negative',magnitude:'medium',text:'Competitor expansion increases local competitive pressure.'};
 if(type==='facility_shutdown')return own==='company_facility'?{dimension:'operations',effect:'negative',magnitude:'critical',text:'Facility operations are unavailable.'}:{dimension:'relationships',effect:'negative',magnitude:'high',text:'A facility shutdown may disrupt connected services.'};
 if(type==='market_opportunity')return{dimension:'market',effect:'positive',magnitude:'medium',text:'A market opportunity is available to affected entities.'};
 if(type==='contract_award')return{dimension:'commercial',effect:'positive',magnitude:'high',text:'A contract award creates a commercial opportunity or workload.'};
 return{dimension:'general',effect:'mixed',magnitude:'medium',text:event.description||'A world event may affect this entity.'};
}
function writeEntityActivity(entity,consequence){
 if(global.AGWorldV2?.EntityInteractionEngine?.appendActivity){
   global.AGWorldV2.EntityInteractionEngine.appendActivity(entity,{text:consequence.text,kind:'world-event',severity:consequence.severity,entityId:entity.id,relationshipId:null,createdAt:consequence.createdAt});
 }
}
function applyState(entity,consequence){
 entity.details=entity.details||{};
 entity.details.worldState=entity.details.worldState||{};
 const bucket=entity.details.worldState[consequence.dimension]||{};
 bucket.lastEffect=consequence.effect;bucket.lastMagnitude=consequence.magnitude;bucket.lastEventId=consequence.eventId;bucket.updatedAt=consequence.createdAt;
 entity.details.worldState[consequence.dimension]=bucket;
}
function connectedExpansion(event,targets){
 const seedIds=new Set(targets.map(e=>String(e.id))), additions=[];
 const all=allEntities();
 targets.forEach(source=>{
   if(!global.AGWorldV2?.EntityInteractionEngine?.relationshipsFor)return;
 });
 // Explicit relationship expansion is handled asynchronously by runEvent.
 return additions;
}
async function expandConnected(event,targets){
 if(!global.AGWorldV2?.EntityInteractionEngine?.relationshipsFor)return targets;
 const map=new Map(targets.map(e=>[String(e.id),e]));
 for(const source of targets.slice()){
   try{
     const rows=await global.AGWorldV2.EntityInteractionEngine.relationshipsFor(source);
     rows.forEach(r=>{
       const a=String(r.sourceEntityId||r.source_entity_id||''),b=String(r.targetEntityId||r.target_entity_id||'');
       const other=a===String(source.id)?b:a;
       const entity=allEntities().find(e=>String(e.id)===other);
       if(entity)map.set(String(entity.id),entity);
     });
   }catch(e){console.warn('[AG World] consequence relationship expansion failed',e)}
 }
 return [...map.values()];
}
async function runEvent(event){
 let targets=targetEntities(event);
 targets=await expandConnected(event,targets);
 const createdAt=new Date().toISOString();
 const consequences=targets.map(entity=>{
   const impact=impactFor(event,entity);
   return {id:id('consequence'),eventId:event.id,entityId:String(entity.id),entityType:normType(entity.type),entityName:entity.name||String(entity.id),severity:event.severity||TYPES[event.type]?.severity||'medium',createdAt,...impact,text:(event.title||TYPES[event.type]?.label||'World Event')+': '+impact.text};
 });
 consequences.forEach(c=>{
   const entity=targets.find(e=>String(e.id)===c.entityId);
   if(entity){applyState(entity,c);writeEntityActivity(entity,c)}
 });
 state.consequences.unshift(...consequences);state.consequences=state.consequences.slice(0,MAX_CONSEQUENCES);
 event.status='active';event.executedAt=createdAt;event.affectedEntityCount=consequences.length;event.consequenceIds=consequences.map(c=>c.id);
 save();
 global.dispatchEvent(new CustomEvent('agworld:world-event-executed',{detail:{event,consequences}}));
 consequences.forEach(c=>global.dispatchEvent(new CustomEvent('agworld:entity-consequence-applied',{detail:c})));
 return {event,consequences};
}
async function create(input){
 const type=input?.type&&TYPES[input.type]?input.type:'custom';
 const event={id:id('event'),type,title:input?.title||TYPES[type].label,description:input?.description||TYPES[type].description,severity:input?.severity||TYPES[type].severity,status:'pending',createdAt:new Date().toISOString(),target:input?.target||{}};
 state.events.unshift(event);state.events=state.events.slice(0,MAX_EVENTS);save();
 global.dispatchEvent(new CustomEvent('agworld:world-event-created',{detail:event}));
 return runEvent(event);
}
function list(){return state.events.slice()}
function consequencesFor(entity){const idv=String(entity?.id||entity);return state.consequences.filter(c=>c.entityId===idv)}
function resolve(eventId){const e=state.events.find(x=>x.id===String(eventId));if(!e)return null;e.status='resolved';e.resolvedAt=new Date().toISOString();save();global.dispatchEvent(new CustomEvent('agworld:world-event-resolved',{detail:e}));return e}

global.AGWorldV2=global.AGWorldV2||{};
global.AGWorldV2.WorldEventEngine={types:TYPES,create,runEvent,list,resolve,consequencesFor,allEntities};
global.__AGWORLD_WORLD_EVENT_ENGINE_READY__=true;
})(window);