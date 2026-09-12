(() => {
  // Test browser only. This file is not shipped with the application.
  const user={id:'00000000-0000-4000-8000-000000000001',email:'boot-test@example.test',user_metadata:{display_name:'Boot Test'}};
  const query=new Proxy({}, {get:(_,key)=>key==='then'?resolve=>Promise.resolve(resolve({data:[],error:null})):()=>query});
  const db={auth:{
    signInWithPassword:async()=>({data:{user},error:null}),
    getUser:async()=>({data:{user},error:null}),
    getSession:async()=>({data:{session:{user}},error:null}),
    onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),
    signOut:async()=>({error:null})
  },from:()=>query,rpc:async()=>({data:[],error:null}),channel:()=>({on(){return this},subscribe(){return this}})};
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
