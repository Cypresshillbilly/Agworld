(function(global){
'use strict';
const SEED_KEY='agworld:demo-world-seed-v1';
const facilities=[
 {name:'Ballito Company Facility',town:'Ballito',province:'KwaZulu-Natal',lat:-29.5389,lng:31.2144,type:'Head Office & Sales'},
 {name:'Bothaville Company Facility',town:'Bothaville',province:'Free State',lat:-27.3886,lng:26.6170,type:'Sales & Service Hub'},
 {name:'Upington Company Facility',town:'Upington',province:'Northern Cape',lat:-28.4478,lng:21.2561,type:'Regional Sales Hub'},
 {name:'Lichtenburg Company Facility',town:'Lichtenburg',province:'North West',lat:-26.1520,lng:26.1597,type:'Sales & Support Hub'},
 {name:'Brits Company Facility',town:'Brits',province:'North West',lat:-25.6347,lng:27.7802,type:'Service & Demonstration Centre'}
];
const bases=[
 [-29.54,31.21],[-28.45,21.26],[-27.39,26.62],[-26.15,26.16],[-25.63,27.78],
 [-29.86,31.03],[-28.77,24.76],[-26.20,28.04],[-25.47,30.97],[-28.45,26.85]
];
const names=['AgriSky','FieldForce','Precision Crop','Rural Air','HarvestTech','GreenWing','FarmFlight','AgriReach','CropScan','LandLift'];
const surnames=['Mokoena','Botha','Jacobs','Naidoo','van Wyk','Mahlangu','Smit','Dlamini','Fourie','Nkosi'];
const services=['Spraying','Mapping & Survey','Crop Scouting','Variable Rate Application','Drone Training','Orchard Services'];
function jitter(v,i,span){return v+Math.sin(i*12.9898)*span}
function dist(a,b){const R=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180,h=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
function farms(){const w=global.AG_WORLD_WORLD||{};const fs=global.__AG_WORLD_FARMS||w.getFarms?.()||[];return fs.map(f=>{const p=f.position||f.center||f;return {...f,lat:Number(p.lat),lng:Number(p.lng)}}).filter(f=>Number.isFinite(f.lat)&&Number.isFinite(f.lng))}
async function seed(){
 // Do not run 55 entity writes + relationship discovery on the interactive map load path.
 // Seeding is now explicit and can be run from the console or a future admin action.
 if(!global.AG_WORLD_RUN_DEMO_SEED) return;
 if(global.localStorage.getItem(SEED_KEY)) return;
 if(!global.AGWorldV2?.EntityService||!global.AGWorldV2?.EntityRepository||!global.AGWorldV2?.RelationshipService){setTimeout(seed,1000);return}
 const er=new global.AGWorldV2.EntityRepository(), es=new global.AGWorldV2.EntityService(er);
 const rr=new global.AGWorldV2.RelationshipRepository(), rs=new global.AGWorldV2.RelationshipService(rr);
 const existing=await er.list({});
 const createdFacilities=[];
 for(const f of facilities){
   let e=existing.find(x=>x.type==='company_facility'&&x.name===f.name);
   if(!e)e=await es.create({type:'company_facility',name:f.name,description:'Company '+f.type+' located at the centre of '+f.town+'.',status:'active',geometry:{type:'Point',coordinates:[f.lng,f.lat]},metadata:{town:f.town,province:f.province,facilityType:f.type,address:f.town+', '+f.province,seeded:true}});
   createdFacilities.push(e);
 }
 const createdContractors=[];
 for(let i=0;i<50;i++){
   const b=bases[i%bases.length],lat=jitter(b[0],i,1.35),lng=jitter(b[1],i+50,1.55);
   const name=names[i%names.length]+' '+['Aerial Services','Drone Solutions','Agri Operations','Precision Aviation','Crop Services'][i%5]+' '+(i+1);
   let e=existing.find(x=>x.type==='contractor'&&x.name===name);
   if(!e)e=await es.create({type:'contractor',name,description:'Fictional agricultural drone contractor serving regional farms.',status:i%7===0?'prospect':'active',geometry:{type:'Point',coordinates:[lng,lat]},metadata:{contactPerson:['Thabo','Pieter','Lerato','Johan','Nomsa'][i%5]+' '+surnames[i%surnames.length],services:[services[i%services.length],services[(i+2)%services.length]],equipment:{drones:1+i%4,primaryPlatform:i%3===0?'Competitor Agricultural Drone':'Company Agricultural Drone'},employees:3+i%18,operatingCapacity:(80+i*7)+' hectares/day',control:i%3===0?'competitor':i%5===0?'neutral':'company',seeded:true}});
   createdContractors.push(e);
 }
 const fs=farms();
 const rels=await rr.list();
 for(let i=0;i<createdContractors.length;i++){
   const c=createdContractors[i],coords=c.geometry?.coordinates||[],cp={lat:coords[1],lng:coords[0]};
   const nearby=fs.map(f=>({f,d:dist(cp,f)})).filter(x=>x.d<=300).sort((a,b)=>a.d-b.d).slice(0,Math.max(1,Math.min(4,fs.length)));
   for(const {f,d} of nearby){
     const exists=rels.some(r=>String(r.sourceEntityId)===String(c.id)&&String(r.targetEntityId)===String(f.id));
     if(!exists) await rs.connect(c.id,'serves',f.id,{distanceKm:Math.round(d*10)/10,relationshipStatus:'active',seeded:true});
   }
 }
 global.localStorage.setItem(SEED_KEY,new Date().toISOString());
 global.dispatchEvent(new CustomEvent('agworld:demo-world-seeded',{detail:{facilities:createdFacilities.length,contractors:createdContractors.length}}));
 global.dispatchEvent(new CustomEvent('agworld:entity-updated',{detail:{reason:'demo-world-seed'}}));
 if(typeof global.refreshTerritoryControl==='function') global.refreshTerritoryControl();
 console.info('[AG World] Created 5 company facilities and 50 contractors through entity/relationship services.');
}
global.AGWorldDemoWorldSeed={run:seed,facilities};
global.AGWorldDemoWorldSeed={run:seed,facilities};
})(window);