// AG World Chapter 3 Mission Generator & Territory Campaign System v33
(() => {
 const KEY='agworld-campaign-v1';
 const s=(()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return {}}})();
 s.campaigns=s.campaigns||{};s.missions=s.missions||{};s.history=s.history||[];
 const save=()=>localStorage.setItem(KEY,JSON.stringify(s));
 const esc=v=>String(v??'').replace(/[&<>"]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]));
 const farms=()=>window.__AG_WORLD_FARMS||[];
 const control=f=>{const a=[...(f?.assets||[]),...(f?.objects||[])].map(x=>String(x.type||x.name||'').toLowerCase());return a.some(x=>x.includes('our drone')||x.includes('company drone'))?'company':a.some(x=>x.includes('competitor'))?'competitor':'neutral'};
 const terrOf=f=>f.municipalityId||f.territoryId||f.municipality||f.region||'unassigned';
 const territoryName=id=>{const all=[...(window.municipalities||[]),...(window.territories||[]),...(window.towns||[])];const t=all.find(x=>String(x.id)===String(id)||String(x.name)===String(id));return t?.name||id};
 function summary(id){const fs=farms().filter(f=>String(terrOf(f))===String(id));const c=fs.filter(f=>control(f)==='company').length,e=fs.filter(f=>control(f)==='competitor').length,n=fs.length-c-e;return {id,name:territoryName(id),farms:fs,total:fs.length,company:c,competitor:e,neutral:n,control:fs.length?Math.round(c/fs.length*100):0,enemy:fs.length?Math.round(e/fs.length*100):0}}
 function candidates(){
  const ids=[...new Set(farms().map(terrOf).filter(Boolean))];return ids.map(summary).filter(x=>x.total).sort((a,b)=>{
   const as=(a.competitor*3+a.neutral*2)-(a.control*.1),bs=(b.competitor*3+b.neutral*2)-(b.control*.1);return bs-as;
  });
 }
 function mission(type,t,extra={}){
  const id='c3-'+type+'-'+t.id+'-'+Date.now();
  const m={id,type,territoryId:t.id,territoryName:t.name,status:'available',createdAt:new Date().toISOString(),xp:extra.xp||150,...extra};
  if(type==='convert')m.title='Convert a Neutral Farm',m.objective='Identify and pursue a neutral farm opportunity in '+t.name+'.',m.targetFarmId=t.farms.find(f=>control(f)==='neutral')?.id;
  if(type==='competitor')m.title='Investigate Competitor Presence',m.objective='Investigate a competitor-controlled farm and identify a conversion opportunity in '+t.name+'.',m.targetFarmId=t.farms.find(f=>control(f)==='competitor')?.id;
  if(type==='survey')m.title='Survey Expansion Territory',m.objective='Survey a new farm opportunity to improve intelligence in '+t.name+'.';
  if(type==='campaign')m.title='Territory Campaign: '+t.name,m.objective='Increase The Company’s control in this municipality from '+t.control+'% by completing campaign operations.';
  s.missions[id]=m;save();return m;
 }
 function generate(){
  const top=candidates().slice(0,5),out=[];
  top.forEach(t=>{
   if(t.neutral)out.push(mission('convert',t,{xp:175}));
   if(t.competitor)out.push(mission('competitor',t,{xp:200}));
   if(!t.neutral&&!t.competitor)out.push(mission('survey',t,{xp:150}));
   if(!s.campaigns[t.id])s.campaigns[t.id]={territoryId:t.id,territoryName:t.name,startedAt:new Date().toISOString(),baseline:t.control,status:'active'};
  });
  out.unshift(...top.slice(0,2).map(t=>mission('campaign',t,{xp:300})));
  render();return out;
 }
 function complete(id){
  const m=s.missions[id];if(!m||m.status==='completed')return;
  m.status='completed';m.completedAt=new Date().toISOString();s.history.push({type:'MISSION_COMPLETED',id,title:m.title,at:m.completedAt});
  window.AGWorldProgression?.addXP?.(m.xp);
  save();render();
 }
 function open(){
  let e=document.getElementById('agCampaignPanel');if(!e){e=document.createElement('div');e.id='agCampaignPanel';document.body.appendChild(e)}render();e.classList.add('show')
 }
 function render(){
  const e=document.getElementById('agCampaignPanel');if(!e)return;
  const list=Object.values(s.missions).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  e.innerHTML='<div class="ag-c3-box"><button data-x>×</button><div class="ag-c3-eye">CHAPTER 3 · TERRITORY CAMPAIGN COMMAND</div><h2>Company Expansion Operations</h2><p>Campaign priorities are generated from the actual distribution of Company, Competitor and Neutral farms.</p><div class="ag-c3-summary">'+candidates().slice(0,4).map(t=>'<div><b>'+esc(t.name)+'</b><span>'+t.control+'% Company · '+t.competitor+' competitor · '+t.neutral+' neutral</span></div>').join('')+'</div><div class="ag-c3-actions"><button data-generate>GENERATE NEW OPERATIONS</button></div><div class="ag-c3-list">'+(list.length?list.map(m=>'<article class="'+m.status+'"><div><small>'+esc(m.type.toUpperCase())+'</small><h3>'+esc(m.title)+'</h3><p>'+esc(m.objective)+'</p><span>'+m.xp+' XP · '+esc(m.territoryName)+'</span></div>'+ (m.status==='available'?'<button data-start="'+esc(m.id)+'">START OPERATION</button>':m.status==='active'?'<button data-complete="'+esc(m.id)+'">COMPLETE</button>':'<b>✓ COMPLETED</b>')+'</article>').join(''):'<p>No operations generated yet.</p>')+'</div></div>';
  e.querySelector('[data-x]').onclick=()=>e.classList.remove('show');e.querySelector('[data-generate]').onclick=generate;
  e.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>{const m=s.missions[b.dataset.start];m.status='active';m.startedAt=new Date().toISOString();save();focus(m);render()});
  e.querySelectorAll('[data-complete]').forEach(b=>b.onclick=()=>complete(b.dataset.complete));
 }
 function focus(m){
  const f=farms().find(x=>String(x.id)===String(m.targetFarmId));if(f&&window.selectFarm){window.selectFarm(f,true)}else{
   const all=[...(window.municipalities||[]),...(window.territories||[])];const t=all.find(x=>String(x.id)===String(m.territoryId));if(t&&window.selectTerritory)window.selectTerritory(t,true);
  }
 }
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-progression-complete]');if(b?.dataset.progressionComplete==='c3-live') {e.preventDefault();e.stopImmediatePropagation();open()}
 },true);
 const btn=document.createElement('button');btn.id='agCampaignCommandButton';btn.textContent='TERRITORY CAMPAIGNS';btn.onclick=open;document.body.appendChild(btn);
 const st=document.createElement('style');st.textContent='#agCampaignCommandButton{position:fixed;right:22px;bottom:22px;z-index:9000;padding:11px 15px;border-radius:8px;border:1px solid rgba(101,216,117,.45);background:#10231a;color:#aaf2b6;font-size:10px;font-weight:900;letter-spacing:.8px}#agCampaignPanel{position:fixed;inset:0;z-index:13000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.74)}#agCampaignPanel.show{display:flex}.ag-c3-box{position:relative;width:min(820px,100%);max-height:90vh;overflow:auto;background:#10191c;color:#edf5ef;border:1px solid rgba(101,216,117,.4);border-radius:18px;padding:27px}.ag-c3-box>button{position:absolute;right:14px;top:9px;background:none;border:0;color:#fff;font-size:27px}.ag-c3-eye,small{font-size:9px;letter-spacing:1.3px;color:#65d875;font-weight:900}.ag-c3-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin:14px 0}.ag-c3-summary div,article{padding:12px;background:#0a1114;border-radius:9px}.ag-c3-summary b,.ag-c3-summary span{display:block}.ag-c3-summary span,article p,article span{font-size:11px;color:#9eaba2}.ag-c3-actions button,article button{padding:8px 10px;border-radius:6px;border:1px solid rgba(101,216,117,.4);background:rgba(101,216,117,.1);color:#e7f7ea;font-size:9px;font-weight:900}.ag-c3-list{display:grid;gap:9px;margin-top:15px}article{display:flex;justify-content:space-between;gap:15px;align-items:center}article h3{margin:4px 0;font-size:15px}article p{margin:4px 0 7px}.completed{opacity:.6}.completed>b{color:#7bea89;font-size:10px}';document.head.appendChild(st);
 window.AGWorldCampaign={generate,open,complete,getState:()=>JSON.parse(JSON.stringify(s)),summary,candidates};
})();