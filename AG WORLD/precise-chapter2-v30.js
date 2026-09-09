// AG World Precise Chapter 2 Mission Engine v30
(() => {
  window.AGWorldChapter2Precise = true;
  const STORE='agworld-c2-precise-v1';
  const S=(()=>{try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch(_){return {}}})();
  const save=()=>localStorage.setItem(STORE,JSON.stringify(S));
  const missions={
    'c2-profile':{title:'Update Your Player Profile',req:['profileSaved'],steps:['Open your Player Profile','Edit your player information','Save the updated profile']},
    'c2-explore':{title:'Explore Your Territory',req:['mapOpened','zoomedProvince','zoomedMunicipality','territorySelected'],steps:['Open the live map','Zoom to province level','Zoom to municipality level','Select a real GIS territory']},
    'c2-survey':{title:'Survey Your First Farm',req:['farmSelected','farmDetailRead','farmAssetsRead'],steps:['Select one specific farm','Open and inspect its farm record','Inspect that farm’s mapped assets']},
    'c2-create':{title:'Create Your First Farm',req:['farmCreated'],steps:['Create and save a brand-new farm record']},
    'c2-assets':{title:'Understand Farm Assets',req:['assetFarmSelected','assetClassificationRead'],steps:['Select a farm containing an asset','Identify whether it has Our Drone or Competitor Drone','Confirm the control classification']},
    'c2-intelligence':{title:'Review Territory Intelligence',req:['territorySelected','controlRead','farmBreakdownRead'],steps:['Select a real GIS territory','Inspect its Company Control percentage','Inspect Company, Competitor and Neutral farm totals']}
  };
  let active=null;
  const mark=(k,v=true)=>{if(!active)return;S[active]=S[active]||{};S[active][k]=v;save();renderProgress();};
  const done=id=>{const m=missions[id];return m.req.every(k=>S[id]?.[k]);};

  function modal(){let x=document.getElementById('agPreciseC2Modal');if(!x){x=document.createElement('div');x.id='agPreciseC2Modal';x.innerHTML='<div class="ag-pc2-box"><button class="ag-pc2-close">×</button><div class="ag-pc2-content"></div></div>';document.body.appendChild(x);x.querySelector('.ag-pc2-close').onclick=close}return x}
  function open(id){active=id;S[id]=S[id]||{};save();const x=modal(),m=missions[id];x.querySelector('.ag-pc2-content').innerHTML='<div class="ag-pc2-eyebrow">CHAPTER 2 · LIVE SYSTEM TRAINING</div><h2>'+m.title+'</h2><p>This mission is verified against actions you perform in the actual AG World system.</p><ol>'+m.steps.map((s,i)=>'<li data-i="'+i+'"><b>○</b>'+s+'</li>').join('')+'</ol><div class="ag-pc2-actions"><button data-go>OPEN REQUIRED SYSTEM</button><button data-finish disabled>COMPLETE MISSION</button></div>';x.querySelector('[data-go]').onclick=()=>go(id);x.querySelector('[data-finish]').onclick=()=>finish(id);x.classList.add('show');renderProgress()}
  function close(){modal().classList.remove('show')}
  function renderProgress(){if(!active)return;const x=document.getElementById('agPreciseC2Modal');if(!x?.classList.contains('show'))return;const m=missions[active], keys=m.req;x.querySelectorAll('li').forEach((li,i)=>{const key=keys[Math.min(i,keys.length-1)];if(S[active]?.[key]){li.classList.add('done');li.querySelector('b').textContent='✓'}});x.querySelector('[data-finish]').disabled=!done(active)}
  function finish(id){if(!done(id))return;close();window.AGWorldProgression?.completeMission(id)}
  function go(id){
    close();
    if(id==='c2-profile'){document.querySelector('.sidebar .profile strong')?.click();setTimeout(installProfileEditor,100)}
    else if(id==='c2-create'){window.openCreateFarm?.();document.getElementById('farmCreateModal')?.classList.add('show')}
    else {document.querySelector('#map, .map, .map-wrap, .map-container')?.scrollIntoView({behavior:'smooth',block:'center'})}
  }

  // Precise interception.
  document.addEventListener('click',e=>{const b=e.target.closest('[data-progression-complete]');if(!b||!missions[b.dataset.progressionComplete])return;e.preventDefault();e.stopImmediatePropagation();open(b.dataset.progressionComplete)},true);

  // Map verification based on actual Google Maps zoom and exact selection functions.
  function hookMap(){
    const m=window.map;
    if(!m||m.__c2Hook)return;
    m.__c2Hook=true;
    m.addListener?.('zoom_changed',()=>{if(!active)return;mark('mapOpened');const z=m.getZoom();if(z>=6&&z<8)mark('zoomedProvince');if(z>=8&&z<12)mark('zoomedMunicipality')});
    m.addListener?.('click',()=>mark('mapOpened'));
  }
  setInterval(hookMap,500);

  function wrap(name,handler){
    const f=window[name];if(typeof f!=='function'||f.__c2Wrapped)return false;
    const w=function(...args){const r=f.apply(this,args);try{handler(...args)}catch(_){}return r};w.__c2Wrapped=true;window[name]=w;return true;
  }
  setInterval(()=>{
    wrap('selectTerritory',(t)=>{if(!t)return;mark('territorySelected',t.id);});
    wrap('selectFarm',(farm)=>{
      if(!farm)return;
      mark('farmSelected',farm.id);
      const assets=[...(farm.assets||[]),...(farm.objects||[])];
      if(assets.length)mark('farmAssetsRead',farm.id);
      const types=assets.map(a=>String(a.type||a.name||'').toLowerCase());
      if(types.some(t=>t.includes('drone')||t.includes('competitor')))mark('assetFarmSelected',farm.id);
    });
    wrap('saveFarm',()=>{
      const before=new Set((window.__AG_WORLD_FARMS||[]).map(f=>f.id));
      setTimeout(()=>{const after=window.__AG_WORLD_FARMS||[];const created=after.find(f=>!before.has(f.id)&&!f.demo);if(created)mark('farmCreated',created.id)},150);
    });
  },400);

  // saveFarm may not expose newly added farm to the published list immediately; observe authoritative local dataset too.
  window.addEventListener('storage',e=>{if(e.key==='agworld-farms-v2'&&active==='c2-create'){try{const a=JSON.parse(e.newValue||'[]');const f=a.find(x=>!x.demo&&String(x.id||'').startsWith('farm-user-'));if(f)mark('farmCreated',f.id)}catch(_){}}});

  // Territory Intelligence requires the actual panel and real metrics.
  const obs=new MutationObserver(()=>{
    if(!active)return;
    const p=document.getElementById('territoryInfoPanel');
    if(p?.classList.contains('show')){
      const text=p.innerText||'';
      if(/%/.test(text)&&/CONTROL/i.test(text))mark('controlRead');
      if(/Total Farms/i.test(text)&&/Our Drone/i.test(text)&&/Competitor/i.test(text)&&/Neutral/i.test(text))mark('farmBreakdownRead');
    }
    const fc=document.getElementById('farmCard');
    if(fc?.classList.contains('show')){
      const text=fc.innerText||'';
      if(/Mapped objects|Farm selected|Farm/i.test(text))mark('farmDetailRead');
      if(/Our Drone|Competitor Drone|Mapped objects/i.test(text))mark('farmAssetsRead');
    }
  });
  obs.observe(document.documentElement,{childList:true,subtree:true,characterData:true});

  // Make the existing profile an actual editable player record for this mission.
  function installProfileEditor(){
    const modal=document.getElementById('agUserProfileModal');if(!modal)return;
    const body=modal.querySelector('.ag-user-profile-body');if(!body||body.querySelector('.ag-c2-profile-edit'))return;
    const d=document.createElement('div');d.className='ag-user-profile-card ag-c2-profile-edit';d.style.marginTop='12px';
    const p=JSON.parse(localStorage.getItem('agworld-player-profile-v1')||'{}');
    d.innerHTML='<h3>Player Information</h3><div class="ag-c2-grid"><label>Display name<input id="c2Name" value="'+(p.name||'')+'"></label><label>Base region<input id="c2Region" value="'+(p.region||'')+'"></label><label>Role<input id="c2Role" value="'+(p.role||'Sales Representative')+'"></label></div><button id="c2SaveProfile">SAVE PLAYER PROFILE</button>';
    body.appendChild(d);
    d.querySelector('#c2SaveProfile').onclick=()=>{
      const profile={name:d.querySelector('#c2Name').value.trim(),region:d.querySelector('#c2Region').value.trim(),role:d.querySelector('#c2Role').value.trim()};
      if(!profile.name||!profile.region||!profile.role)return;
      localStorage.setItem('agworld-player-profile-v1',JSON.stringify(profile));mark('profileSaved',true);
      d.querySelector('#c2SaveProfile').textContent='PROFILE SAVED ✓';
    };
  }
  document.addEventListener('click',e=>{if(e.target.closest('.sidebar .profile strong'))setTimeout(installProfileEditor,100)},true);

  const style=document.createElement('style');style.textContent='#agPreciseC2Modal{position:fixed;inset:0;z-index:11000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.72);padding:24px}#agPreciseC2Modal.show{display:flex}.ag-pc2-box{position:relative;width:min(580px,100%);padding:28px;border-radius:18px;background:#10191c;color:#eef4ef;border:1px solid rgba(101,216,117,.4)}.ag-pc2-close{position:absolute;right:15px;top:10px;border:0;background:none;color:white;font-size:27px}.ag-pc2-eyebrow{font-size:10px;letter-spacing:1.3px;color:#65d875;font-weight:900}.ag-pc2-box h2{margin:8px 0}.ag-pc2-box p{color:#b5c1b8;line-height:1.5}.ag-pc2-box ol{list-style:none;padding:0}.ag-pc2-box li{display:flex;gap:10px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.08);color:#9eaba2}.ag-pc2-box li b{color:#657168}.ag-pc2-box li.done{color:#e5f2e7}.ag-pc2-box li.done b{color:#65d875}.ag-pc2-actions{display:flex;justify-content:space-between;margin-top:20px}.ag-pc2-actions button,.ag-c2-profile-edit button{padding:10px 12px;border-radius:7px;border:1px solid rgba(101,216,117,.45);background:rgba(101,216,117,.1);color:#e6f5e9;font-weight:900;font-size:10px}.ag-pc2-actions button:disabled{opacity:.35}.ag-c2-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.ag-c2-grid label{font-size:10px;font-weight:800}.ag-c2-grid input{width:100%;box-sizing:border-box;margin-top:5px;padding:8px;border:1px solid #ccd6da;border-radius:5px}.ag-c2-profile-edit button{margin-top:12px;background:#39769b;color:#fff;border-color:#39769b}';
  document.head.appendChild(style);
})();