(function(global){
'use strict';
const SEED_KEY='agworld:demo-world-seed-v2';
const facilities=[
 {name:'Ballito Company Facility',town:'Ballito',province:'KwaZulu-Natal',lat:-29.5389,lng:31.2144,type:'Head Office & Sales'},
 {name:'Bothaville Company Facility',town:'Bothaville',province:'Free State',lat:-27.3886,lng:26.6170,type:'Sales & Service Hub'},
 {name:'Upington Company Facility',town:'Upington',province:'Northern Cape',lat:-28.4478,lng:21.2561,type:'Regional Sales Hub'},
 {name:'Lichtenburg Company Facility',town:'Lichtenburg',province:'North West',lat:-26.1520,lng:26.1597,type:'Sales & Support Hub'},
 {name:'Brits Company Facility',town:'Brits',province:'North West',lat:-25.6347,lng:27.7802,type:'Service & Demonstration Centre'}
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
 if(global.localStorage.getItem(SEED_KEY)) return {facilities:5,contractors:50,alreadyComplete:true};
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
   details:{country:'South Africa',province:f.province,nearestTown:f.town,municipality:'',website:'',notes:'Company '+f.type+' located at the centre of '+f.town+'.',capabilities:[f.type.includes('Head Office')?'Head Office':'Regional Office','Operations Base']}
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
  const nearby=fs.map(f=>({f,d:dist(cp,f)})).filter(x=>x.d<=300).sort((a,b)=>a.d-b.d).slice(0,4);
  if(!nearby.length) throw new Error('Generated contractor '+c.name+' has no farm within 300 km; population stopped before creating invalid relationships.');
  for(const {f,d} of nearby){
   await global.AGWorldDynamicEntityAPI.createRelationship({
    sourceEntityId:c.id,sourceEntityType:'contractor',targetEntityId:f.id,targetEntityType:'farm',
    relationshipType:'serves',status:'active',
    metadata:{distanceKm:Math.round(d*10)/10,relationshipStatus:'active',seeded:true}
   });
   relationshipCount++;
  }
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