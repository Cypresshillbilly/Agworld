(() => {
  // Test browser only. This file is not shipped with the application.
  const returning=new URLSearchParams(location.search).has('returning-player');
  const user={id:'00000000-0000-4000-8000-000000000001',email:'boot-test@example.test',user_metadata:{display_name:returning?'Returning Player':'Boot Test'}};
  const returningPlayer={id:user.id,display_name:'Returning Player',level:2,xp:460,current_chapter:1};
  const returningMissions=['c1-welcome','c1-hr','c1-documents'].map(mission_id=>({mission_id,status:'completed',completed_at:'2026-09-01T12:00:00Z'}));
  const returningQuery=table=>{let q=new Proxy({}, {get:(_,key)=>key==='then'?resolve=>Promise.resolve(resolve({data:table==='ag_players'?returningPlayer:table==='ag_mission_progress'?returningMissions:[],error:null})):()=>q});return q;};
  const account=window.accountTest={signups:[],resends:[],facilityFailures:0,signupError:null,session:false,delay:0};
  account.player=returning?{...returningPlayer}:{id:user.id,display_name:'Boot Test',level:1,xp:0,current_chapter:1};
  account.missions=returning?returningMissions.map(m=>({...m,mission_state:{}})):[];account.uploads=[];account.awards=[];
  const progressionQuery=table=>{
    let action='select',payload,filter={};
    const q=new Proxy({}, {get:(_,key)=>{
      if(key==='then')return resolve=>{
        if(account.saveError&&action!=='select')return Promise.resolve(resolve({data:null,error:{message:'Synthetic save failure'}}));
        if(table==='ag_players'){
          if(action==='update'||action==='upsert')Object.assign(account.player,payload);
          return Promise.resolve(resolve({data:{...account.player},error:null}));
        }
        if(action==='upsert'){const old=account.missions.find(m=>m.mission_id===payload.mission_id);if(old)Object.assign(old,payload);else account.missions.push({...payload});}
        return Promise.resolve(resolve({data:account.missions.filter(m=>!filter.status||m.status===filter.status).map(m=>({...m})),error:null}));
      };
      return (...args)=>{if(['upsert','update','insert','delete'].includes(key)){action=key;payload=args[0];}if(key==='eq')filter[args[0]]=args[1];return q;};
    }});return q;
  };
  const worldQuery=table=>{let q=new Proxy({}, {get:(_,key)=>key==='then'?resolve=>Promise.resolve(resolve({data:account.worldRows[table],error:null})):()=>q});return q;};
  const facilities=new Proxy({}, {get:(_,key)=>key==='then'?async resolve=>{
    await new Promise(ok=>setTimeout(ok,account.delay));
    resolve(account.facilityFailures-->0?{data:null,error:{message:'Test facility connection failed'}}:{data:[{id:'fixture-facility',name:'Test Company Facility',details:{nearestTown:'Test Town'}}],error:null});
  }:()=>facilities});
  const query=new Proxy({}, {get:(_,key)=>key==='then'?resolve=>Promise.resolve(resolve({data:[],error:null})):()=>query});
  const db={auth:{
    signUp:async args=>{
      account.signups.push(args);
      await new Promise(ok=>setTimeout(ok,account.delay));
      if(account.signupError)return {data:null,error:{message:account.signupError}};
      const created={...user,user_metadata:args.options.data};
      return {data:{user:created,session:account.session?{user:created}:null},error:null};
    },
    resend:async args=>{account.resends.push(args);return {error:null};},
    signInWithPassword:async()=>({data:{user},error:null}),
    getUser:async()=>({data:{user},error:null}),
    getSession:async()=>({data:{session:{user,access_token:'synthetic-test-token'}},error:null}),
    onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
    signOut:async()=>({error:null})
  },storage:{from:bucket=>({upload:async(path,file)=>{if(account.uploadError)return {error:{message:'Synthetic upload failure'}};account.uploads.push({bucket,path,name:file.name,size:file.size,type:file.type});return {data:{path},error:null};},remove:async()=>({error:null}),createSignedUrl:async()=>({data:{signedUrl:'assets/advisors/system-administrator.webp'},error:null})})},from:table=>['ag_players','ag_mission_progress'].includes(table)?progressionQuery(table):account.worldRows?.[table]?worldQuery(table):table==='company_facilities'?facilities:returning?returningQuery(table):query,rpc:async(name,args)=>{
    if(name==='ag_complete_mission_v2'){
      if(account.completionError)return {data:null,error:{message:'Synthetic completion failure'}};
      const row=account.missions.find(m=>m.mission_id===args.p_mission_id);if(row?.status==='completed')return {data:{completed:true},error:null};
      const chapters=await(await fetch('builds/agriculture/missions/mission-catalogue.json')).json(),all=chapters.flatMap(c=>c.missions),next=all.find(m=>!account.missions.some(r=>r.mission_id===m.id&&r.status==='completed'));
      if(next?.id!==args.p_mission_id||!row?.mission_state?.ready)return {data:null,error:{message:'Requirements incomplete'}};
      row.status='completed';row.completed_at=new Date().toISOString();account.player.xp+=next.xp;account.awards.push(next.id);
      return {data:{completed:true},error:null};
    }
    if(!name.startsWith('ag_knowledge_'))return {data:[],error:null};
    const k=account.knowledge||{};(k.calls||=[]).push({name,args});
    await new Promise(ok=>setTimeout(ok,k.delay||0));
    if(k.error)return {data:null,error:{message:'Test connection error'}};
    return {data:name==='ag_knowledge_catalog'?{approved:!!k.approved,documents:12,media:20,models:['GENERAL','T100','T55']}:k.results||[],error:null};
  },channel:()=>({on(){return this},subscribe(){return this}})};
  window.__AGWORLD_SUPABASE_DB__=db;
  Object.defineProperty(window,'supabase',{value:{createClient:()=>db},writable:false});
  const report=data=>fetch('/__test-events',{method:'POST',body:JSON.stringify(data)}).catch(()=>{});
  for(const name of ['agworld:load-checklist','agworld:load-progress','agworld:game-sources-ready','gamechanger:authenticated']) window.addEventListener(name,event=>report({name,detail:event.detail,time:performance.now()}));
  document.addEventListener('agworld:landing-layout-ready',()=>report({name:'ready',time:performance.now()}));
  window.addEventListener('error',e=>report({error:e.message||'resource failed',source:e.filename||e.target?.src}),true);
  window.addEventListener('unhandledrejection',e=>report({error:String(e.reason)}));
  for(const name of ['agworld:boot-failed','agworld:player-visible','agworld:boot-regression-pass','agworld:boot-regression-fail']) window.addEventListener(name,event=>report({name,detail:event.detail,time:performance.now()}));
  setTimeout(()=>report({name:'snapshot',status:document.getElementById('agworld-game-loader-status')?.textContent,booted:window.__AGWORLD_GAME_BOOTED__,diagnostics:window.AGWorldBootDiagnostics?.getReport()}),12000);
})();
