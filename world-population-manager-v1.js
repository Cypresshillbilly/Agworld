(function(){
'use strict';
if(new URLSearchParams(location.search).get('adminPopulate')!=='1') return;

function make(){
  if(document.getElementById('worldPopulationManager')) return;
  const box=document.createElement('div');
  box.id='worldPopulationManager';
  box.innerHTML=`
    <div class="wpm-head"><span>AG WORLD · ADMIN</span><button type="button" data-close>×</button></div>
    <h3>CONTROLLED WORLD POPULATION</h3>
    <p>Create the 5 approved Company Facilities and 50 fictional Contractors only when you explicitly start the process. Nothing runs automatically during map startup.</p>
    <div class="wpm-status" data-status>Checking the live creation services…</div>
    <div class="wpm-actions"><button type="button" data-run disabled>CREATE 5 FACILITIES + 50 CONTRACTORS</button></div>
    <small data-note>Facilities: Ballito · Bothaville · Upington · Lichtenburg · Brits</small>
  `;
  document.body.appendChild(box);
  const status=box.querySelector('[data-status]'), run=box.querySelector('[data-run]'), note=box.querySelector('[data-note]');
  box.querySelector('[data-close]').onclick=()=>box.remove();

  const ready=()=>window.AGWorldDemoWorldSeed?.run && window.AGWorldV2?.EntityService && window.AGWorldV2?.EntityRepository && window.AGWorldV2?.RelationshipRepository;
  let tries=0;
  const check=()=>{
    if(ready()){
      status.textContent='SYSTEM STABLE · Creation services ready. The map remains idle until you press the button.';
      status.className='wpm-status ready';
      run.disabled=false;
      return;
    }
    if(++tries<40) return setTimeout(check,250);
    status.textContent='Creation services did not initialise. No entities were created.';
    status.className='wpm-status error';
  };
  check();

  window.addEventListener('agworld:demo-world-seed-progress',e=>{
    const d=e.detail||{};
    const pct=d.total?Math.round((d.current/d.total)*100):0;
    status.textContent=(d.message||'Working…')+' '+(d.total?'('+pct+'%)':'');
  });

  run.onclick=async()=>{
    if(!ready()) return;
    if(!confirm('Create the 5 Company Facilities and 50 Contractors now? This is a controlled, one-time data population process and may take a little while.')) return;
    run.disabled=true;
    run.textContent='POPULATING WORLD…';
    note.textContent='The map remains interactive; entities and relationships are being created through the existing Entity and Relationship repositories.';
    try{
      const result=await window.AGWorldDemoWorldSeed.run();
      status.textContent='COMPLETE · '+result.facilities+' facilities and '+result.contractors+' contractors processed.';
      status.className='wpm-status ready';
      run.textContent='WORLD POPULATED';
      note.textContent='Population is recorded as complete and will not run automatically on future map loads.';
    }catch(err){
      console.error('[AG World] Controlled population failed',err);
      status.textContent='FAILED · '+(err?.message||'Unknown error')+'. No automatic retry will run.';
      status.className='wpm-status error';
      run.disabled=false;
      run.textContent='RETRY CONTROLLED POPULATION';
    }
  };
}
const style=document.createElement('style');
style.textContent=`
#worldPopulationManager{position:fixed;right:22px;bottom:22px;width:min(390px,calc(100vw - 32px));z-index:30000;background:rgba(9,17,20,.98);border:1px solid rgba(101,216,117,.48);border-radius:14px;box-shadow:0 20px 70px rgba(0,0,0,.55);padding:16px;color:#eef6ef;font:12px Arial,sans-serif}
#worldPopulationManager .wpm-head{display:flex;justify-content:space-between;align-items:center;color:#9dcc38;font-size:9px;font-weight:900;letter-spacing:1.5px}
#worldPopulationManager .wpm-head button{border:0;background:transparent;color:#cbd7ce;font-size:22px;cursor:pointer}
#worldPopulationManager h3{margin:9px 0 7px;font-size:15px;letter-spacing:.6px}
#worldPopulationManager p{margin:0;color:#afbeb3;line-height:1.45}
#worldPopulationManager .wpm-status{margin:13px 0;padding:10px;border-radius:8px;background:rgba(255,255,255,.05);color:#c8d2ca;line-height:1.4}
#worldPopulationManager .wpm-status.ready{border-left:3px solid #65d875;color:#dff6e3}
#worldPopulationManager .wpm-status.error{border-left:3px solid #ff7670;color:#ffd0ce}
#worldPopulationManager .wpm-actions button{width:100%;border:1px solid rgba(157,204,56,.55);background:#9dcc38;color:#10170e;border-radius:8px;padding:11px;font-weight:900;font-size:10px;letter-spacing:.7px;cursor:pointer}
#worldPopulationManager .wpm-actions button:disabled{opacity:.55;cursor:not-allowed}
#worldPopulationManager small{display:block;margin-top:10px;color:#91a19a;line-height:1.45}
`;
document.head.appendChild(style);
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',make); else make();
})();