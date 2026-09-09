// AG World Chapter 3 Real-World Mission Completion & Verification v34
(() => {
 const KEY='agworld-mission-verification-v1';
 const V=(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return {}}})();const save=()=>localStorage.setItem(KEY,JSON.stringify(V));
 const esc=v=>String(v??'').replace(/[&<>"]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]));
 const farms=()=>window.__AG_WORLD_FARMS||[];
 const getCampaign=()=>window.AGWorldCampaign?.getState?.();
 const getMission=id=>getCampaign()?.missions?.[id];
 const findFarm=id=>farms().find(f=>String(f.id)===String(id));
 function verify(id){
  const m=getMission(id);if(!m)return;
  const v=V[id]||{id,type:m.type,status:'draft',createdAt:new Date().toISOString()};V[id]=v;
  let body='';
  if(m.type==='convert') body='<p>To complete this operation, record the real-world outcome. The target farm must have <b>Our Drone</b> in its actual asset list before final verification.</p><label>Outcome notes</label><textarea data-notes placeholder="Describe the client interaction, outcome and next action"></textarea><label>Evidence reference (photo/document/link reference)</label><input data-evidence placeholder="Evidence reference"><button data-verify>VERIFY FARM CONVERSION</button>';
  else if(m.type==='competitor') body='<p>Record what you found in the field. Verification requires identifying competitor evidence or confirming the competitor asset on the target farm.</p><label>Investigation notes</label><textarea data-notes placeholder="What competitor equipment or activity was identified?"></textarea><label>Evidence reference</label><input data-evidence placeholder="Photo/document/reference"><button data-verify>VERIFY INVESTIGATION</button>';
  else if(m.type==='survey') body='<p>Complete a real farm survey. Verification requires a recorded survey outcome.</p><label>Survey outcome</label><textarea data-notes placeholder="Farm visited, location confirmed, findings recorded"></textarea><label>Evidence reference</label><input data-evidence placeholder="Survey evidence/reference"><button data-verify>VERIFY SURVEY</button>';
  else body='<p>Campaign missions are verified from their child operations and actual territory control changes.</p><label>Campaign notes</label><textarea data-notes placeholder="Summarise campaign progress"></textarea><button data-verify>VERIFY CAMPAIGN PROGRESS</button>';
  open(m,'REAL-WORLD MISSION VERIFICATION',body);
  const box=document.querySelector('#agVerifyPanel .ag-v-box');box.querySelector('[data-verify]').onclick=()=>{
   v.notes=box.querySelector('[data-notes]')?.value.trim()||'';v.evidence=box.querySelector('[data-evidence]')?.value.trim()||'';v.attemptedAt=new Date().toISOString();
   const r=validate(m,v);
   v.result=r;v.status=r.ok?'verified':'needs-action';save();
   if(r.ok){window.AGWorldCampaign.complete(id);notify('MISSION VERIFIED',r.message)}else notify('VERIFICATION REQUIRED',r.message);
  };
 }
 function validate(m,v){
  const f=findFarm(m.targetFarmId);
  if(m.type==='convert'){
   if(!v.notes)return {ok:false,message:'Record the real-world conversion outcome before verification.'};
   if(!f)return {ok:false,message:'The target farm cannot be found. Reopen the mission and select the farm.'};
   const a=[...(f.assets||[]),...(f.objects||[])].map(x=>String(x.type||x.name||'').toLowerCase());
   if(!a.some(x=>x.includes('our drone')||x.includes('company drone')))return {ok:false,message:'The mission is not complete yet. Add Our Drone to the actual farm asset list; that database change is the proof of conversion.'};
   return {ok:true,message:'Verified. The farm is now controlled by The Company. Territory control will update from the farm database.'};
  }
  if(m.type==='competitor'){
   if(!v.notes)return {ok:false,message:'Record your investigation findings before verification.'};
   if(!f)return {ok:false,message:'Target farm not found.'};
   const a=[...(f.assets||[]),...(f.objects||[])].map(x=>String(x.type||x.name||'').toLowerCase());
   if(!a.some(x=>x.includes('competitor')))return {ok:false,message:'Verification needs a competitor asset recorded on the actual target farm.'};
   return {ok:true,message:'Competitor presence verified and recorded.'};
  }
  if(m.type==='survey')return v.notes.length>=15?{ok:true,message:'Survey outcome recorded and verified.'}:{ok:false,message:'Please record a meaningful survey outcome before verification.'};
  return {ok:true,message:'Campaign progress recorded. Continue completing operations to change territory control.'};
 }
 function open(m,title,body){let e=document.getElementById('agVerifyPanel');if(!e){e=document.createElement('div');e.id='agVerifyPanel';document.body.appendChild(e)}e.innerHTML='<div class="ag-v-box"><button data-x>×</button><div class="ag-v-eye">'+title+'</div><h2>'+esc(m.title)+'</h2><div class="ag-v-target">'+esc(m.territoryName||'')+(m.targetFarmId?' · Target farm ID: '+esc(m.targetFarmId):'')+'</div>'+body+'</div>';e.classList.add('show');e.querySelector('[data-x]').onclick=()=>e.classList.remove('show')}
 function notify(title,msg){const e=document.getElementById('agVerifyPanel');if(!e)return;e.querySelector('.ag-v-box').innerHTML='<div class="ag-v-eye">'+title+'</div><h2>'+esc(msg)+'</h2><button data-close>RETURN TO CAMPAIGNS</button>';e.querySelector('[data-close]').onclick=()=>{e.classList.remove('show');window.AGWorldCampaign?.open()}}
 // Intercept campaign completion: clicking COMPLETE now opens verification.
 setInterval(()=>{const p=window.AGWorldCampaign;if(!p||p.__verification)return;const old=p.complete;p.complete=function(id){const m=getMission(id);if(!m)return;if(m.status==='completed')return;verify(id)};p.__verification=true},300);
 // Mutation helper for the farm database: used by the existing farm asset workflow.
 function assetChanged(farm){
  if(!farm)return;
  const a=[...(farm.assets||[]),...(farm.objects||[])].map(x=>String(x.type||x.name||'').toLowerCase());
  const company=a.some(x=>x.includes('our drone')||x.includes('company drone'));
  if(company){Object.values(V).filter(v=>v.type==='convert'&&v.status==='needs-action').forEach(v=>{const m=getMission(v.id);if(String(m?.targetFarmId)===String(farm.id)){v.readyForVerification=true;save();}})}
 }
 ['updateFarm','saveFarm','selectFarm'].forEach(n=>{const o=window[n];if(typeof o==='function'&&!o.__verifyHook){const w=function(...a){const r=o.apply(this,a);try{assetChanged(a[0])}catch(_){}return r};w.__verifyHook=true;window[n]=w}});
 const st=document.createElement('style');st.textContent='#agVerifyPanel{position:fixed;inset:0;z-index:14000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.76)}#agVerifyPanel.show{display:flex}.ag-v-box{position:relative;width:min(580px,100%);background:#10191c;color:#edf5ef;border:1px solid rgba(101,216,117,.45);border-radius:18px;padding:28px}.ag-v-box [data-x]{position:absolute;right:14px;top:9px;border:0;background:none;color:#fff;font-size:27px}.ag-v-eye{font-size:9px;font-weight:900;letter-spacing:1.4px;color:#65d875}.ag-v-target{font-size:10px;color:#aab5ad;margin:8px 0 16px}.ag-v-box label{display:block;font-size:10px;color:#aab5ad;margin:10px 0 4px}.ag-v-box textarea,.ag-v-box input{width:100%;box-sizing:border-box;padding:10px;border-radius:7px;border:1px solid #435048;background:#091013;color:#fff;margin-bottom:6px}.ag-v-box textarea{min-height:90px}.ag-v-box button:not([data-x]){padding:10px 13px;border:1px solid rgba(101,216,117,.45);border-radius:7px;background:rgba(101,216,117,.1);color:#e8f6eb;font-size:10px;font-weight:900;margin-top:8px}';document.head.appendChild(st);
 window.AGWorldMissionVerification={verify,getState:()=>JSON.parse(JSON.stringify(V)),validate};
})();