// AG World Player Progression & Chapter Engine v41 - shared Supabase player state
(()=> {
const U='https://vcnkspaljmsjvonftfcw.supabase.co',K='sb_publishable_azAO3PoKko79ccwSJFjkhQ_L67ZM85o';
const CHAPTERS=[
  {
    "id": 1,
    "title": "WELCOME & PLAYER READINESS",
    "subtitle": "Learn AgWorld, then prepare for the field with Compliance.",
    "targetLevel": 5,
    "missions": [
      {
        "id": "c1-welcome",
        "title": "Welcome to AgWorld",
        "owner": "system-administrator",
        "xp": 120,
        "objective": "Discover your menus, missions and map with your System Administrator.",
        "kind": "orientation",
        "type": "ORIENTATION",
        "skill": "Operations"
      },
      {
        "id": "c1-hr",
        "title": "Check Your Player Information",
        "owner": "compliance",
        "xp": 180,
        "objective": "Save your name, role, contact number and working region.",
        "kind": "profile",
        "type": "PROFILE",
        "skill": "Compliance"
      },
      {
        "id": "c1-documents",
        "title": "Submit Required Documents",
        "owner": "compliance",
        "xp": 160,
        "objective": "Upload your required Company documents privately for submission.",
        "kind": "documents",
        "type": "DOCUMENTS",
        "skill": "Compliance"
      },
      {
        "id": "c1-safety",
        "title": "Complete Mandatory Safety Training",
        "owner": "compliance",
        "xp": 200,
        "objective": "Complete the Company safety and responsible field conduct assessment.",
        "kind": "safety",
        "type": "SAFETY",
        "skill": "Compliance"
      },
      {
        "id": "c2-profile",
        "title": "Create Your Profile Photograph",
        "owner": "compliance",
        "xp": 250,
        "objective": "Take a webcam photograph or upload a profile picture.",
        "kind": "photo",
        "type": "PHOTO",
        "skill": "Compliance"
      }
    ]
  },
  {
    "id": 2,
    "title": "KNOW YOUR PRODUCTS",
    "subtitle": "Build a sourced product pitch with the Product Commander.",
    "targetLevel": 10,
    "missions": [
      {
        "id": "c1-company-training",
        "title": "Meet Your Product Range",
        "owner": "product",
        "xp": 220,
        "objective": "Study an approved model presentation and explain its application.",
        "kind": "product-intro",
        "type": "PRODUCT INTRO",
        "skill": "Product Knowledge"
      },
      {
        "id": "c2-assets",
        "title": "Match the Product to the Farm",
        "owner": "product",
        "xp": 300,
        "objective": "Use model specifications to explain a benefit and a limitation for a client.",
        "kind": "product-application",
        "type": "PRODUCT APPLICATION",
        "skill": "Product Knowledge"
      },
      {
        "id": "c2-product-compare",
        "title": "Build a Confident Product Pitch",
        "owner": "product",
        "xp": 250,
        "objective": "Compare two models using approved sources and ask your Product Commander a question.",
        "kind": "product-compare",
        "type": "PRODUCT COMPARE",
        "skill": "Product Knowledge"
      }
    ]
  },
  {
    "id": 3,
    "title": "SCOUT, CONNECT & GROW",
    "subtitle": "Build real relationships and expand Company territory with Sales.",
    "targetLevel": null,
    "missions": [
      {
        "id": "c1-briefing",
        "title": "Your Sales Territory Briefing",
        "owner": "sales",
        "xp": 120,
        "objective": "Choose an existing prospect or begin scouting your area.",
        "kind": "sales-brief",
        "type": "SALES BRIEF",
        "skill": "Sales"
      },
      {
        "id": "c2-explore",
        "title": "Scout Your Working Area",
        "owner": "sales",
        "xp": 300,
        "objective": "Select a province or municipality and inspect its recorded market.",
        "kind": "scout-area",
        "type": "SCOUT AREA",
        "skill": "Sales"
      },
      {
        "id": "c2-survey",
        "title": "Inspect a Farm Prospect",
        "owner": "sales",
        "xp": 350,
        "objective": "Select a real farm on the map and review its business information.",
        "kind": "inspect-farm",
        "type": "INSPECT FARM",
        "skill": "Sales"
      },
      {
        "id": "c2-create",
        "title": "Record Your Farm Intelligence",
        "owner": "sales",
        "xp": 400,
        "objective": "Create a farm if it is missing, or save updated intelligence on an existing farm.",
        "kind": "save-farm",
        "type": "SAVE FARM",
        "skill": "Sales"
      },
      {
        "id": "c2-intelligence",
        "title": "Classify Your Prospect",
        "owner": "sales",
        "xp": 350,
        "objective": "Record whether the selected farm is neutral, competitor-aligned or a Company client.",
        "kind": "classify",
        "type": "CLASSIFY",
        "skill": "Sales"
      },
      {
        "id": "c3-contractors",
        "title": "Scout a Contractor",
        "owner": "sales",
        "xp": 300,
        "objective": "Create or update a real contractor record through Map Menu Actions.",
        "kind": "save-contractor",
        "type": "SAVE CONTRACTOR",
        "skill": "Sales"
      },
      {
        "id": "c3-competitors",
        "title": "Scout a Competitor",
        "owner": "sales",
        "xp": 300,
        "objective": "Create or update a real competitor record through Map Menu Actions.",
        "kind": "save-competitor",
        "type": "SAVE COMPETITOR",
        "skill": "Sales"
      },
      {
        "id": "c3-meeting",
        "title": "Plan a Drone Meeting",
        "owner": "sales",
        "xp": 400,
        "objective": "Choose a neutral or competitor prospect and record a real meeting plan.",
        "kind": "meeting",
        "type": "MEETING",
        "skill": "Sales"
      },
      {
        "id": "c3-follow-up",
        "title": "Record the Client Outcome",
        "owner": "sales",
        "xp": 450,
        "objective": "Record what happened at the meeting and the agreed next step.",
        "kind": "follow-up",
        "type": "FOLLOW UP",
        "skill": "Sales"
      }
    ]
  }
];
let db,user,ready=false,loading=false,state={level:1,xp:0,currentChapter:1,completed:{},skills:{},playerName:''};
const chapter=id=>CHAPTERS.find(x=>x.id===id);
const xpForLevel=l=>l<=10?(l-1)*250:2250+(l-10)*400;
const nextLevelXp=l=>xpForLevel(l+1);
function recalc(){let l=1;while(state.xp>=nextLevelXp(l))l++;state.level=l;state.currentChapter=CHAPTERS.find(c=>c.missions.some(m=>!state.completed[m.id]))?.id||3;}
function progress(c){return{completed:c.missions.filter(m=>state.completed[m.id]).length,total:c.missions.length}}
function active(){const c=chapter(state.currentChapter);return c?.missions.find(m=>!state.completed[m.id])||null}
function esc(v){return String(v??'').replace(/[&<>"]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]))}
function panel(){return document.getElementById('playerProgressionPanel')}
function createPanel(){const side=document.querySelector('.missions');if(!side||panel())return;const p=document.createElement('div');p.id='playerProgressionPanel';const l=side.querySelector('.level');l?l.insertAdjacentElement('afterend',p):side.prepend(p)}
function syncHud(){const next=nextLevelXp(state.level),floor=xpForLevel(state.level),pct=Math.min(100,Math.round((state.xp-floor)/Math.max(1,next-floor)*100));
const sideProfile=document.querySelector('.sidebar .profile');const sideStrong=sideProfile?.querySelector('strong');const initial=(state.playerName||'?').trim().charAt(0).toUpperCase();
if(sideProfile){
  const playerName=(state.playerName||'PLAYER').toUpperCase();
  const playerDetails='SALES REPRESENTATIVE\\A LEVEL '+state.level+' · '+state.xp.toLocaleString()+' XP';
  sideProfile.dataset.playerInitial=initial;
  sideProfile.dataset.playerName=playerName;
  sideProfile.dataset.playerDetails=playerDetails;
  sideProfile.innerHTML='<strong class="ag-live-player-name">'+esc(state.playerName||'PLAYER')+'</strong>SALES REPRESENTATIVE<br>Level '+state.level+' · '+state.xp.toLocaleString()+' XP<br><span style="color:#7e969f">Connected</span>';
  const profileName=sideProfile.querySelector('strong');
  if(profileName){
    profileName.dataset.playerName=playerName;
    profileName.dataset.playerDetails=playerDetails;
  }
}
document.querySelectorAll('.menu-user-name').forEach(e=>e.textContent=state.playerName.toUpperCase());document.querySelectorAll('.user-identity strong').forEach(e=>e.textContent=state.playerName.toUpperCase());document.querySelectorAll('.menu-user-avatar span,.user-avatar').forEach(e=>e.textContent=(state.playerName||'?').trim().charAt(0).toUpperCase());document.querySelectorAll('.menu-user-level').forEach(e=>e.textContent='LEVEL '+state.level);document.querySelectorAll('.level').forEach(e=>e.textContent='Level '+state.level+' · '+state.xp.toLocaleString()+' / '+next.toLocaleString()+' XP');document.querySelectorAll('.menu-user-xptext span').forEach(e=>e.textContent=state.xp.toLocaleString()+' / '+next.toLocaleString()+' XP');document.querySelectorAll('.menu-user-xptext b,.xptext span:last-child').forEach(e=>e.textContent=pct+'%');document.querySelectorAll('.user-level strong').forEach(e=>e.textContent='LEVEL '+state.level);document.querySelectorAll('.menu-user-xp > span,.xpbar > span,.profile-xpbar > span').forEach(e=>e.style.width=pct+'%');document.querySelectorAll('.profile-xptext span').forEach((e,i)=>e.textContent=i===0?state.xp.toLocaleString()+' / '+next.toLocaleString()+' XP':pct+'%')
window.dispatchEvent(new CustomEvent('agworld:player-state',{detail:{name:state.playerName,level:state.level,xp:state.xp,currentChapter:state.currentChapter,completed:state.completed}}));}
function renderMissions(){
  const side=document.querySelector('.missions');
  if(!side) return;
  const c=chapter(state.currentChapter)||chapter(1);
  const missions=c?.missions||[];
  // Update only this renderer's mission source. Replacing the entire workspace
  // destroyed the selected menu panel and rebuilt the Dashboard after hydration.
  let source=side.querySelector('#agLegacyMissionSource');
  if(!source){
    source=document.createElement('div');source.id='agLegacyMissionSource';
    source.style.setProperty('display','none','important');source.setAttribute('aria-hidden','true');source.inert=true;
    side.appendChild(source);
  }
  source.innerHTML=missions.map((m,i)=>{
    const done=!!state.completed[m.id];
    const unlocked=i===0||!!state.completed[missions[i-1]?.id];
    return '<div class="mission '+(done?'done':'')+' '+(!unlocked?'locked':'')+'" data-chapter-mission="'+esc(m.id)+'">'+
      '<div class="tag">CHAPTER '+c.id+' · '+esc(m.type)+'</div>'+
      '<strong>'+esc(m.title)+'</strong>'+
      '<p>'+esc(m.objective)+'</p>'+
      '<div class="reward">+'+Number(m.xp||0).toLocaleString()+' XP</div>'+
      '<button '+(done||!unlocked?'disabled':'')+' data-progression-complete="'+esc(m.id)+'">'+(done?'COMPLETED':!unlocked?'LOCKED':'START MISSION')+'</button>'+
    '</div>';
  }).join('')||'<div class="mission"><strong>Mission briefing loading…</strong></div>';
}
function render(){
  syncHud();
  renderMissions();
}
let completing=false;
async function load(){
 if(loading)return;if(!window.supabase){setTimeout(load,500);return;}loading=true;
 try{
  db=window.supabase.createClient(U,K);const r=await db.auth.getUser();if(r.error)throw r.error;user=r.data.user;
  if(!user){ready=false;state={level:1,xp:0,currentChapter:1,completed:{},missionState:{},skills:{},playerName:''};render();return;}
  const name=user.user_metadata?.display_name||user.email;
  const a=await db.from('ag_players').select('*').eq('id',user.id).maybeSingle();if(a.error)throw a.error;
  let player=a.data;
  if(!player||Array.isArray(player)){const created=await db.from('ag_players').upsert({id:user.id,display_name:name,company_facility_id:user.user_metadata?.company_facility_id},{onConflict:'id'});if(created.error)throw created.error;player={display_name:name};}
  const missions=await db.from('ag_mission_progress').select('*').eq('player_id',user.id);if(missions.error)throw missions.error;
  state={userId:user.id,level:Number(player.level)||1,xp:Number(player.xp)||0,currentChapter:1,completed:{},missionState:{},skills:{},playerName:player.display_name||name};
  (missions.data||[]).forEach(row=>{if(row.status==='completed')state.completed[row.mission_id]=row.completed_at||true;state.missionState[row.mission_id]=row.mission_state||{};});
  recalc();ready=true;window.AGWorldCompany?.setCurrentPlayer?.(state.playerName);render();
  window.dispatchEvent(new CustomEvent('agworld:player-ready',{detail:{player:{...state},user}}));
 }catch(error){ready=false;console.warn('Player progress could not load:',error.message);throw error;}finally{loading=false;}
}
async function saveMissionState(id,patch){
 if(!ready||!user)throw Error('Sign in to save your mission.');
 const c=CHAPTERS.find(c=>c.missions.some(m=>m.id===id));if(!c)throw Error('Unknown mission.');
 const value={...(state.missionState?.[id]||{}),...patch};
 const result=await db.from('ag_mission_progress').upsert({player_id:user.id,mission_id:id,chapter:c.id,status:state.completed[id]?'completed':'in_progress',mission_state:value,completed_at:state.completed[id]||null,updated_at:new Date().toISOString()},{onConflict:'player_id,mission_id'});
 if(result.error)throw result.error;
 state.missionState??={};state.missionState[id]=value;
 window.dispatchEvent(new CustomEvent('agworld:mission-state',{detail:{id}}));return value;
}
async function completeMission(id){
 if(completing)throw Error('A mission is already saving.');
 if(!ready||!user)throw Error('Sign in to save your mission.');
 if(state.completed[id])return true;
 const c=chapter(state.currentChapter),m=active();if(!m||m.id!==id)throw Error('Complete your current mission first.');
 completing=true;
 try{
  const result=await db.rpc('ag_complete_mission_v2',{p_mission_id:id});if(result.error)throw result.error;
  if(!result.data?.completed)throw Error('Mission completion could not be confirmed. Please retry.');
  await load();window.dispatchEvent(new CustomEvent('agworld:mission-completed',{detail:{mission:m,player:{...state}}}));
  if(typeof toast==='function')toast('MISSION COMPLETE · '+m.title+' · +'+m.xp+' XP');return true;
 }finally{completing=false;}
}
async function reset(){if(!user||!db)return;await db.from('ag_mission_progress').delete().eq('player_id',user.id);await db.from('ag_career_events').delete().eq('player_id',user.id);await db.from('ag_contributions').delete().eq('player_id',user.id);await db.from('ag_players').update({level:1,xp:0,current_chapter:1,career:{firsts:{},events:[]},updated_at:new Date().toISOString()}).eq('id',user.id);await load()}

const missionStyle=document.createElement('style');missionStyle.textContent='.missions .mission button{margin-top:7px;width:100%;border:1px solid rgba(101,216,117,.45);background:rgba(101,216,117,.08);color:#277c59;border-radius:5px;padding:6px;font:900 7px Arial,sans-serif;cursor:pointer}.missions .mission.done{opacity:.62}.missions .mission.done .reward{color:#5b7c69!important}.missions .mission.locked{opacity:.45}.missions .mission button:disabled{cursor:default}.missions .mission p{max-height:none!important}';document.head.appendChild(missionStyle);
render();setInterval(()=>{if(!ready&&sessionStorage.getItem('gamechanger.authenticated')==='1')load().catch(console.error)},700);window.addEventListener('gamechanger:authenticated',()=>load().catch(console.error));window.addEventListener('agworld:supabase-authenticated',()=>load().catch(console.error));window.addEventListener('agworld:ui-shell-ready',()=>{syncHud();renderMissions();});window.AGWorldProgression={getState:()=>JSON.parse(JSON.stringify(state)),getChapters:()=>JSON.parse(JSON.stringify(CHAPTERS)),getActiveMission:()=>active(),saveMissionState,reload:load,completeMission,reset};load().catch(console.error);
})();
