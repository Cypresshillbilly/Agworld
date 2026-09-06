// AG World Interactive Chapter 2 Field Learning v29
(() => {
  const data = {
    'c2-profile': { eyebrow:'CHAPTER 2 · PLAYER PROFILE', title:'Update Your Player Profile', objective:'Open your profile and complete your player information.', steps:['Open your Player Profile','Update your profile information','Save or confirm your profile'], watch:{text:/profile|player/i} },
    'c2-explore': { eyebrow:'CHAPTER 2 · MAP TRAINING', title:'Explore Your Territory', objective:'Use the live map to explore the territory hierarchy.', steps:['Open the live AG World map','Zoom through the territory hierarchy','Select a GIS territory'], watch:{map:true,territory:true} },
    'c2-survey': { eyebrow:'CHAPTER 2 · FARM TRAINING', title:'Survey Your First Farm', objective:'Select a farm and inspect its farm intelligence and assets.', steps:['Select a farm on the map','Open its farm information','Review the farm assets'], watch:{farm:true} },
    'c2-create': { eyebrow:'CHAPTER 2 · FARM CREATION', title:'Create Your First Farm', objective:'Create a farm record inside the AG World database.', steps:['Open the farm creation workflow','Enter the required farm information','Save the new farm'], watch:{create:true} },
    'c2-assets': { eyebrow:'CHAPTER 2 · ASSET INTELLIGENCE', title:'Understand Farm Assets', objective:'Learn how drone assets change who controls a farm and its territory.', steps:['Open a farm with assets','Identify Our Drone or Competitor Drone','Review the territory control effect'], watch:{asset:true} },
    'c2-intelligence': { eyebrow:'CHAPTER 2 · TERRITORY INTELLIGENCE', title:'Review Territory Intelligence', objective:'Select a GIS territory and study its Company Control information.', steps:['Select a GIS territory','Review Company Control %','Review Company, competitor and neutral farm opportunities'], watch:{territory:true,intelligence:true} }
  };

  let activeId=null, checks={};
  function modal(){
    let el=document.getElementById('agFieldLearningModal');
    if(!el){el=document.createElement('div');el.id='agFieldLearningModal';el.innerHTML='<div class="ag-field-window"><button class="ag-field-close">×</button><div id="agFieldContent"></div></div>';document.body.appendChild(el);el.querySelector('.ag-field-close').onclick=close;}
    return el;
  }
  function close(){document.getElementById('agFieldLearningModal')?.classList.remove('show');activeId=null;}
  function open(id){
    const m=data[id]; if(!m)return;
    activeId=id; checks={};
    const el=modal(), c=el.querySelector('#agFieldContent');
    c.innerHTML='<div class="ag-field-eyebrow">'+m.eyebrow+'</div><h2>'+m.title+'</h2><p>'+m.objective+'</p><div class="ag-field-note">This mission is completed by using the real AG World interface. Follow the guided steps below.</div><ol id="agFieldSteps">'+m.steps.map((s,i)=>'<li data-step="'+i+'"><span>○</span>'+s+'</li>').join('')+'</ol><div class="ag-field-actions"><button id="agFieldContinue">OPEN GAME AREA</button><button id="agFieldFinish" disabled>COMPLETE MISSION</button></div>';
    c.querySelector('#agFieldContinue').onclick=()=>{close();navigateFor(id);};
    c.querySelector('#agFieldFinish').onclick=()=>finish(id);
    el.classList.add('show');
  }
  function navigateFor(id){
    const terms=id==='c2-profile'?/profile/i:id==='c2-create'?/add farm|create farm|new farm/i:/map|world|territory/i;
    const candidates=[...document.querySelectorAll('button,a,[role="button"],.nav-item')];
    const target=candidates.find(x=>terms.test((x.textContent||'').trim()));
    target?.click();
    if(id==='c2-explore') checks.map=true;
    update();
  }
  function mark(key){
    if(!activeId)return;
    checks[key]=true; update();
  }
  function update(){
    if(!activeId)return;
    const m=data[activeId]; if(!m)return;
    const req=activeId==='c2-profile'?['profile']:
      activeId==='c2-explore'?['map','territory']:
      activeId==='c2-survey'?['farm']:
      activeId==='c2-create'?['create']:
      activeId==='c2-assets'?['asset']:
      ['territory','intelligence'];
    const done=req.every(k=>checks[k]);
    const modalEl=document.getElementById('agFieldLearningModal');
    if(modalEl?.classList.contains('show')){
      modalEl.querySelectorAll('#agFieldSteps li').forEach((li,i)=>{const key=req[Math.min(i,req.length-1)];if(checks[key]){li.classList.add('done');li.querySelector('span').textContent='✓';}});
      modalEl.querySelector('#agFieldFinish').disabled=!done;
    }
  }
  function finish(id){
    if(!data[id])return;
    close(); window.AGWorldProgression?.completeMission(id);
  }

  // Mission interception before progression engine direct completion.
  document.addEventListener('click',e=>{
    if (window.AGWorldChapter2Precise) return;
    const b=e.target.closest('[data-progression-complete]'); if(!b||!data[b.dataset.progressionComplete])return;
    e.preventDefault();e.stopImmediatePropagation();open(b.dataset.progressionComplete);
  },true);

  // Real UI interaction detection.
  document.addEventListener('click',e=>{
    const t=e.target, txt=(t.closest('button,a,[role="button"],label')?.textContent||t.textContent||'').trim();
    if(/profile|save profile|update profile/i.test(txt)) mark('profile');
    if(/create farm|new farm|add farm|save farm/i.test(txt)) mark('create');
    if(/asset|our drone|competitor drone/i.test(txt)) mark('asset');
    if(/company control|territory intelligence|company farms|competitor farms|neutral farms/i.test(txt)) mark('intelligence');
    // Map canvas/polygon/marker clicks.
    if(t.closest('#map,.gm-style,[class*="map"],canvas')) mark('map');
    if(/municipality|province|town|territory|country/i.test(txt)) mark('territory');
    if(/farm/i.test(txt)) mark('farm');
  },true);

  // Detect existing panels created by the game itself.
  const observer=new MutationObserver(()=>{
    if(!activeId)return;
    const text=document.body.innerText||'';
    if(/Company Control/i.test(text)) { mark('territory'); mark('intelligence'); }
    if(/Our Drone|Competitor Drone/i.test(text)) mark('asset');
    if(/Farm Information|Farm Details|Farm Assets/i.test(text)) mark('farm');
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});

  const style=document.createElement('style');
  style.textContent=`
  #agFieldLearningModal{position:fixed;inset:0;z-index:10000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.72);backdrop-filter:blur(8px)}#agFieldLearningModal.show{display:flex}.ag-field-window{position:relative;width:min(610px,100%);border:1px solid rgba(101,216,117,.4);border-radius:18px;background:#10191c;color:#eef4ef;padding:28px;box-shadow:0 30px 90px rgba(0,0,0,.6)}.ag-field-close{position:absolute;right:16px;top:10px;border:0;background:none;color:#fff;font-size:28px;cursor:pointer}.ag-field-eyebrow{font-size:10px;letter-spacing:1.4px;font-weight:900;color:#65d875}.ag-field-window h2{margin:8px 35px 8px 0;font-size:27px}.ag-field-window p{color:#b7c3ba;line-height:1.55}.ag-field-note{margin:16px 0;padding:12px;border-left:3px solid #65d875;background:rgba(101,216,117,.07);font-size:11px;color:#c9d5cc}#agFieldSteps{list-style:none;padding:0;margin:18px 0}#agFieldSteps li{display:flex;gap:10px;padding:10px;border-bottom:1px solid rgba(255,255,255,.07);font-size:12px;color:#aeb9b1}#agFieldSteps li span{color:#68746c;font-weight:900}#agFieldSteps li.done{color:#dcefe0}#agFieldSteps li.done span{color:#65d875}.ag-field-actions{display:flex;justify-content:space-between;gap:10px}.ag-field-actions button{border:1px solid rgba(101,216,117,.45);background:rgba(101,216,117,.1);color:#e0f4e4;padding:10px 13px;border-radius:7px;font-weight:900;font-size:10px;cursor:pointer}.ag-field-actions button:disabled{opacity:.35;cursor:not-allowed}
  `;document.head.appendChild(style);
})();