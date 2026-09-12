/* AG World — sidebar-owned player workspace. Dashboard preserves the original
   mounted Mission Control cards; other screens share its boundary, not its DOM. */
(()=>{
  'use strict';
  if(window.AGWorldPlayerMenu)return;
  const TITLES={dashboard:'Dashboard',profile:'Player Profile',pipeline:'Sales Funnel',clients:'Client List',products:'Sales Products','after-sales':'After Sales','mission-history':'Missions','ai-assistant':'AI Assistant','territory-campaigns':'Territory Campaigns','territory-graphics':'Territory Graphics',settings:'Settings'};
  const BADGES=[
    {id:'c1-welcome',name:'Company Recruit',icon:'✦',goal:'Complete Welcome to The Company.'},
    {id:'c1-hr',name:'Ready for Duty',icon:'◈',goal:'Complete HR Onboarding.'},
    {id:'c1-safety',name:'Safety Trained',icon:'⛨',goal:'Complete Mandatory Safety Training.'},
    {id:'c1-company-training',name:'Company Foundations',icon:'⌂',goal:'Complete Company Foundations.'},
    {id:'c2-explore',name:'Territory Explorer',icon:'⌖',goal:'Explore Your Territory.'},
    {id:'c2-survey',name:'Field Scout',icon:'◉',goal:'Survey Your First Farm.'}
  ];
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=value=>Number.isFinite(Number(value))?Math.max(0,Number(value)):0;
  const fmt=value=>number(value).toLocaleString();
  const levelFloor=level=>level<=10?(level-1)*250:2250+(level-10)*400;
  const array=value=>Array.isArray(value)?value:[];
  let current='dashboard',panel,missions,sidebar,queued=false,signature='',clientFilter='all',clientSearch='';
  const scrollPositions=new Map(),dashboardAccess=new Map();

  function profileModel(){
    const player=window.AGWorldPlayer||{},state=window.AGWorldProgression?.getState?.()||{};
    const chapters=array(window.AGWorldProgression?.getChapters?.());
    const catalogue=chapters.flatMap(ch=>array(ch.missions).map(m=>({...m,chapterId:ch.id})));
    const complete=state.completed||{},hasProgression=!!state.playerName;
    const name=(hasProgression?state.playerName:player.display_name)||sessionStorage.getItem('gamechanger.username')||'Player';
    const level=Math.max(1,number(hasProgression?state.level:player.level)||1);
    const xp=number(hasProgression?state.xp:player.xp),floor=levelFloor(level),next=levelFloor(level+1);
    const chapterId=number(hasProgression?state.currentChapter:player.chapter)||1;
    const chapter=chapters.find(ch=>Number(ch.id)===chapterId);
    const user=window.AGWorldBackend?.getUser?.();
    const facility=array(window.AG_WORLD_WORLD?.getCompanyFacilities?.()).find(f=>String(f.id)===String(player.company_facility_id||user?.user_metadata?.company_facility_id));
    const completed=catalogue.filter(m=>!!complete[m.id]);
    const skills=[...new Set(catalogue.map(m=>m.skill).filter(Boolean))].map(name=>{
      const rows=catalogue.filter(m=>m.skill===name),earned=rows.filter(m=>complete[m.id]).length;
      return {name,earned,total:rows.length,percent:Math.round(earned/rows.length*100)};
    });
    return {name,initial:String(name).trim().charAt(0).toUpperCase()||'P',level,xp,next,
      percent:Math.max(0,Math.min(100,Math.round((xp-floor)/(next-floor)*100))),remaining:Math.max(0,next-xp),
      role:String(sessionStorage.getItem('gamechanger.role')||'AgWorld Player').replace(/[_-]/g,' '),
      facility:facility?.name||user?.user_metadata?.company_facility_name||'Facility not assigned',
      chapterId,chapter,catalogue,completed,skills,complete,
      badges:BADGES.map(b=>({...b,earned:!!complete[b.id]}))};
  }

  const css=`
    html body .missions[data-ag-screen]:not([data-ag-screen="dashboard"])::before{visibility:hidden!important}
    html body .missions[data-ag-screen]:not([data-ag-screen="dashboard"])>:not(#agMenuPanel){visibility:hidden!important;pointer-events:none!important}
    html body .missions #agMenuPanel{position:absolute!important;inset:0!important;z-index:200!important;width:100%!important;height:100%!important;box-sizing:border-box!important;padding:0!important;margin:0!important;background:#eef2f0!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;color:#17313b!important;font:13px/1.5 Arial,Helvetica,sans-serif!important;visibility:visible!important;pointer-events:auto!important;isolation:isolate}
    html body .missions #agMenuPanel[hidden]{display:none!important}
    #agMenuPanel *{box-sizing:border-box}#agMenuPanel .agmp-head{flex:none;padding:16px 14px 12px;background:#fff;border-top:3px solid #449d91;border-bottom:1px solid #cfddd6}
    #agMenuPanel .agmp-eyebrow{font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#47756e}
    #agMenuPanel h1{font:850 21px/1.15 Arial,sans-serif!important;margin:4px 0 0!important;color:#15353e!important;letter-spacing:-.5px!important}
    #agMenuPanel .agmp-content{overflow-y:auto;overflow-x:hidden;flex:1;min-height:0;padding:10px;scrollbar-width:thin;scrollbar-color:#75988c #e5eeea}
    #agMenuPanel h2{margin:0!important;font:800 13px/1.3 Arial,sans-serif!important;color:inherit!important;letter-spacing:.1px!important}
    #agMenuPanel h3{margin:0 0 5px;font:800 12px/1.4 Arial,sans-serif}
    #agMenuPanel p{margin:7px 0!important;font:12px/1.5 Arial,sans-serif!important;color:inherit!important;overflow-wrap:anywhere}
    #agMenuPanel .agmp-card{display:block!important;height:auto!important;min-height:0!important;flex:0 0 auto!important;padding:14px;margin-bottom:10px;border:1px solid #cadaD1;border-radius:12px;background:#fff;box-shadow:0 3px 10px #17372d07;overflow:hidden}
    #agMenuPanel .agmp-dark{color:#e6f1eb;background:radial-gradient(ellipse at 100% 0,#365f4a 0,transparent 65%),linear-gradient(140deg,#193c43,#0c222d);border-color:#416558}
    #agMenuPanel .agmp-hero{text-align:center;padding:19px 12px 15px;position:relative}
    #agMenuPanel .agmp-avatar{display:grid;place-items:center;width:76px;height:82px;margin:8px auto 12px;background:linear-gradient(145deg,#c5e76a,#589f89 45%,#244850);clip-path:polygon(50% 0,94% 22%,94% 75%,50% 100%,6% 75%,6% 22%);padding:4px}
    #agMenuPanel .agmp-avatar span{display:grid;place-items:center;background:radial-gradient(circle at 30% 20%,#3e6065,#0d2631);width:100%;height:100%;clip-path:inherit;font:900 35px/1 Arial,sans-serif;color:#f1f7e1}
    #agMenuPanel .agmp-hero h2{font-size:21px!important;line-height:1.15!important;overflow-wrap:anywhere}
    #agMenuPanel .agmp-hero .agmp-role{text-transform:capitalize;font-size:10px!important;color:#aac5bd!important}
    #agMenuPanel .agmp-chip{display:inline-flex;padding:4px 8px;border-radius:5px;font:800 9px/1.2 Arial,sans-serif;letter-spacing:.8px;background:#c5e76a;color:#193b31}
    #agMenuPanel .agmp-row{display:flex;gap:8px;align-items:center;justify-content:space-between;margin:8px 0;font-size:11px}
    #agMenuPanel .agmp-muted{color:#60786d;font-size:11px}#agMenuPanel .agmp-dark .agmp-muted{color:#a4c0b5}
    #agMenuPanel .agmp-track{height:7px;background:#dce7df;border-radius:8px;overflow:hidden;margin:8px 0}#agMenuPanel .agmp-track i{display:block;height:100%;background:linear-gradient(90deg,#4ea68c,#c5e76a)}
    #agMenuPanel .agmp-dark .agmp-track{background:#061b24}
    #agMenuPanel .agmp-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-top:14px}
    #agMenuPanel .agmp-stat{padding:9px 3px;background:#ffffff08;border:1px solid #b4dac02b;border-radius:7px;text-align:center}
    #agMenuPanel .agmp-stat b{display:block;font-size:19px;line-height:1.2;color:#d2ed8e}#agMenuPanel .agmp-stat span{font-size:8px;text-transform:uppercase;letter-spacing:.5px}
    #agMenuPanel .agmp-badges{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}
    #agMenuPanel .agmp-badge{display:block!important;height:auto!important;min-height:0!important;text-align:center;border:1px solid #dce4df;border-radius:9px;padding:11px 6px 8px;background:#f3f6f3}
    #agMenuPanel .agmp-badge.earned{border-color:#aac979;background:linear-gradient(145deg,#f7ffe5,#e5efd7)}
    #agMenuPanel .agmp-medal{width:45px;height:49px;display:grid;place-items:center;clip-path:polygon(50% 0,93% 20%,87% 79%,50% 100%,13% 79%,7% 20%);background:#d7dfdb;color:#8b9e94;font-size:24px;margin:0 auto 8px}
    #agMenuPanel .earned .agmp-medal{background:linear-gradient(135deg,#e6f899,#8cac44);color:#234a37}
    #agMenuPanel .agmp-badge strong{display:block;font-size:10px;line-height:1.3;min-height:26px}
    #agMenuPanel .agmp-badge small{display:block;font-size:8px;letter-spacing:.8px;margin-top:5px;color:#647b6d;text-transform:uppercase}
    #agMenuPanel .agmp-badge p{font-size:9px!important;color:#647b6d!important;margin-bottom:0!important}
    #agMenuPanel .agmp-skill{padding:8px 0;border-bottom:1px solid #e3ebe5}#agMenuPanel .agmp-skill:last-child{border:0}
    #agMenuPanel .agmp-entry{display:block!important;height:auto!important;padding:11px 0;border-bottom:1px solid #dce7e0}#agMenuPanel .agmp-entry:last-child{border:0}
    #agMenuPanel .agmp-status{display:inline-block;font-size:8px;letter-spacing:.7px;font-weight:800;text-transform:uppercase;color:#487963;background:#e8f0e9;padding:3px 6px;border-radius:4px;margin-bottom:7px}
    #agMenuPanel button.agmp-button{position:static!important;box-sizing:border-box!important;width:100%!important;height:auto!important;min-height:35px!important;padding:9px!important;margin:9px 0 0!important;border:1px solid #bad77b!important;border-radius:7px!important;background:#c5e76a!important;color:#173d32!important;font:800 10px/1.3 Arial,sans-serif!important;letter-spacing:.4px!important;cursor:pointer!important;white-space:normal!important}
    #agMenuPanel button.agmp-secondary{background:#f0f5ef!important;border-color:#c6d8ca!important;color:#376050!important}
    #agMenuPanel button:focus-visible,#agMenuPanel input:focus-visible,#agMenuPanel summary:focus-visible{outline:3px solid #559e85!important;outline-offset:2px}
    #agMenuPanel .agmp-empty{padding:12px 0;text-align:center;color:#637e70}
    #agMenuPanel .agmp-tabs{display:flex;gap:4px;margin:8px 0}#agMenuPanel .agmp-tabs button{width:auto!important;flex:1;margin:0!important;min-width:0}
    #agMenuPanel .agmp-tabs button[aria-pressed=true]{background:#264b43!important;color:#ecf3e1!important;border-color:#264b43!important}
    #agMenuPanel input[type=search]{width:100%;padding:10px;border:1px solid #bdcfc3;border-radius:7px;background:#fff;color:#153b30;font:12px Arial,sans-serif}
    #agMenuPanel details{margin-top:10px}#agMenuPanel summary{cursor:pointer;font-weight:700;font-size:11px}
    #agMenuPanel .agmp-advisor-img{display:block;width:62px;height:62px;object-fit:cover;border-radius:50%;border:2px solid #779778;margin:0 auto 8px}
    html body .sidebar .nav button[data-ag-screen="dashboard"]{border-left:3px solid #92bc55!important}
    html body .sidebar .nav button[aria-current="page"]{background:#3d5858!important;color:#fff!important;box-shadow:inset 3px 0 #c5e76a!important}
    html body.agmp-reduced-motion #agMenuPanel *,html body.agmp-reduced-motion .sidebar .nav button{animation:none!important;transition:none!important}
    @media(prefers-reduced-motion:reduce){#agMenuPanel *{animation:none!important;transition:none!important}}
  `;
  const card=(title,body,dark=false)=>'<section class="agmp-card'+(dark?' agmp-dark':'')+'"><h2>'+esc(title)+'</h2>'+body+'</section>';
  const button=(label,action,value='',secondary=false)=>'<button type="button" class="agmp-button'+(secondary?' agmp-secondary':'')+'" data-panel-action="'+action+'" data-value="'+esc(value)+'">'+esc(label)+'</button>';
  const empty=text=>'<p class="agmp-empty">'+esc(text)+'</p>';
  const track=(value,label)=>'<div class="agmp-track" role="progressbar" aria-label="'+esc(label)+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+value+'"><i style="width:'+value+'%"></i></div>';

  function renderProfile(d){
    const earned=d.badges.filter(b=>b.earned).length;
    return '<section class="agmp-card agmp-dark agmp-hero"><span class="agmp-chip">LEVEL '+d.level+' · CHAPTER '+d.chapterId+'</span><div class="agmp-avatar" aria-hidden="true"><span>'+esc(d.initial)+'</span></div><h2>'+esc(d.name)+'</h2><p class="agmp-role">'+esc(d.role)+'</p><p class="agmp-muted">'+esc(d.facility)+'</p><div class="agmp-stats"><div class="agmp-stat"><b>'+fmt(d.xp)+'</b><span>Total XP</span></div><div class="agmp-stat"><b>'+d.completed.length+'</b><span>Missions</span></div><div class="agmp-stat"><b>'+earned+'</b><span>Badges</span></div></div></section>'+
      card('Your next level','<div class="agmp-row"><b>Level '+d.level+' → '+(d.level+1)+'</b><span>'+d.percent+'%</span></div>'+track(d.percent,'Progress to next level')+'<div class="agmp-row"><span>'+fmt(d.remaining)+' XP to go</span><span class="agmp-muted">'+fmt(d.next)+' XP target</span></div>',true)+
      '<section class="agmp-card agmp-player-skills" id="agCanonicalSkillProfile">'+(window.AGWorldPlayerCards?.skillMarkup?.()||'<h2>Skill profile</h2>')+'</section>'+
      card('Badge collection','<p class="agmp-muted">'+earned+' of '+d.badges.length+' milestones earned. Every badge comes from a completed mission.</p><div class="agmp-badges">'+d.badges.map(b=>'<article class="agmp-badge'+(b.earned?' earned':'')+'" data-badge="'+b.id+'"><div class="agmp-medal" aria-hidden="true">'+b.icon+'</div><strong>'+esc(b.name)+'</strong><small>'+(b.earned?'Earned':'Locked')+'</small><p>'+esc(b.goal)+'</p></article>').join('')+'</div>')+
      card('Mission mastery',d.skills.length?d.skills.map(s=>'<div class="agmp-skill"><div class="agmp-row"><b>'+esc(s.name)+'</b><span>'+s.percent+'%</span></div>'+track(s.percent,s.name)+'<span class="agmp-muted">'+s.earned+' / '+s.total+' training missions completed</span></div>').join(''):empty('Your skills will appear when your mission record is ready.'))+
      card('Your journey','<span class="agmp-status">Current chapter · '+d.chapterId+'</span><h3>'+esc(d.chapter?.title||'Your next assignment')+'</h3><p>'+esc(d.chapter?.subtitle||'Build your capability through Company missions.')+'</p>'+button('View your missions','screen','mission-history'))+
      card('Completed milestones',d.completed.length?d.completed.slice(-5).reverse().map(m=>'<div class="agmp-entry"><span class="agmp-status">Completed</span><h3>'+esc(m.title)+'</h3><span class="agmp-muted">Chapter '+esc(m.chapterId)+' · '+fmt(m.xp)+' XP mission reward</span></div>').join(''):empty('Your first completed mission will start your record here.'));
  }
  function entities(){
    const world=window.AG_WORLD_WORLD||{};
    return [...array(world.farms||window.__AG_WORLD_FARMS).map(e=>({...e,panelType:'farm'})),...array(world.getContractors?.()).map(e=>({...e,panelType:'contractor'}))];
  }
  const control=e=>window.AGWorldTerritoryControl?.control?.(e)||'neutral';
  function entityRows(rows,afterSales=false){
    if(!rows.length)return empty(afterSales?'No Company clients are recorded yet.':'No contacts match this view.');
    return rows.slice(0,60).map(e=>'<article class="agmp-entry"><span class="agmp-status">'+esc(e.panelType)+' · '+esc(control(e)==='company'?'Company client':control(e)==='competitor'?'Competitor client':'Prospect')+'</span><h3>'+esc(e.name||'Unnamed contact')+'</h3><span class="agmp-muted">'+esc(e.details?.nearestTown||e.nearestTown||'Location in map record')+'</span>'+button(afterSales?'View fleet & history':'View on map',afterSales?'fleet':'entity',e.panelType+':'+e.id,true)+'</article>').join('')+(rows.length>60?'<p class="agmp-muted">Showing 60 of '+rows.length+' contacts. Use search to narrow the list.</p>':'');
  }
  function renderMissions(d){
    return card('Mission record','<div class="agmp-row"><b>'+d.completed.length+' completed</b><span>'+d.catalogue.length+' missions</span></div>'+button('Back to active mission','screen','dashboard'))+
      (window.AGWorldProgression?.getChapters?.()||[]).map(ch=>card('Chapter '+ch.id+' · '+ch.title,array(ch.missions).length?ch.missions.map(m=>'<article class="agmp-entry"><span class="agmp-status">'+(d.complete[m.id]?'Completed':Number(ch.id)===d.chapterId?'Current chapter':'Upcoming chapter')+'</span><h3>'+esc(m.title)+'</h3><p>'+esc(m.objective)+'</p><span class="agmp-muted">'+fmt(m.xp)+' XP'+(m.skill?' · '+esc(m.skill):'')+'</span></article>').join(''):empty('Campaign missions are generated from your territory activity.'))).join('');
  }
  function renderScreen(){
    const d=profileModel(),rows=entities();
    switch(current){
      case 'profile':return renderProfile(d);
      case 'mission-history':return renderMissions(d);
      case 'pipeline':return window.AGWorldSalesDashboard?.workspaceMarkup?.()||empty('Connecting your sales activity…');
      case 'clients':{
        const filtered=rows.filter(e=>(clientFilter==='all'||control(e)===clientFilter)&&String(e.name||'').toLowerCase().includes(clientSearch.toLowerCase()));
        return card('Company contact directory','<label><span class="agmp-muted">Search farms and contractors</span><input type="search" data-contact-search aria-label="Search contacts" value="'+esc(clientSearch)+'" placeholder="Search by name"></label><div class="agmp-tabs">'+[['all','All'],['company','Clients'],['neutral','Prospects']].map(([value,label])=>'<button type="button" class="agmp-button agmp-secondary" data-panel-action="filter" data-value="'+value+'" aria-pressed="'+(value===clientFilter)+'">'+label+'</button>').join('')+'</div><p class="agmp-muted" data-contact-count>'+filtered.length+' contacts</p><div data-contact-results>'+entityRows(filtered)+'</div>');
      }
      case 'products':{
        const equipment=new Map();
        for(const e of rows)for(const a of [...array(e.assets),...array(e.objects)]){
          const label=String(a.name||a.label||a.type||'').trim();if(label)equipment.set(label,(equipment.get(label)||0)+1);
        }
        return card('Equipment in the field','<p>Equipment recorded on the shared farms and contractor sites.</p>',true)+card('Recorded equipment',equipment.size?[...equipment].map(([name,count])=>'<div class="agmp-entry"><h3>'+esc(name)+'</h3><span class="agmp-muted">'+count+' recorded entries</span></div>').join(''):empty('No equipment is recorded on the loaded sites yet.'))+card('Review a fleet','<p>Open a client record to review equipment or use the existing sales and fleet tools.</p>'+button('Open Client List','screen','clients'));
      }
      case 'after-sales':return card('Client fleet & support','<p>Review the fleet and history for Company clients.</p>',true)+card('Company clients',entityRows(rows.filter(e=>control(e)==='company'),true));
      case 'ai-assistant':return card('Your advisory team','<p>Select a discipline to activate its advisor. The selected advisor is shared with your Dashboard.</p>',true)+['compliance','sales','product','operations','technical'].map(id=>{
        const source=document.querySelector('#agAdvisorBay [data-advisor="'+id+'"]');
        const label=source?.querySelector('.ag-advisor-label')?.textContent||id;
        const active=window.AGWorldAdvisorState?.id===id;
        return card(label,'<img class="agmp-advisor-img" src="assets/advisors/agworld_'+id+'_commander_round(1).png" alt="'+esc(label)+' advisor"><span class="agmp-status">'+(active?'Selected advisor':'Available discipline')+'</span>'+button(active?'Deselect advisor':'Select advisor','advisor',id));
      }).join('');
      case 'territory-campaigns':{
        const campaign=window.AGWorldCampaign?.getState?.()||{},items=Object.values(campaign.missions||{});
        return card('Territory operations','<p>Review the campaign missions generated by your territory activity.</p><div class="agmp-row"><b>'+Object.keys(campaign.campaigns||{}).length+' campaigns</b><span>'+items.length+' missions</span></div>',true)+card('Campaign missions',items.length?items.map(m=>'<article class="agmp-entry"><span class="agmp-status">'+esc(m.status||'Available')+'</span><h3>'+esc(m.title)+'</h3><p>'+esc(m.objective)+'</p><span class="agmp-muted">'+esc(m.territoryName||'')+' · '+fmt(m.xp)+' XP</span></article>').join(''):empty('No campaign missions are recorded yet. Continue your current chapter and explore the territory.'))+button('View current chapter','screen','mission-history');
      }
      case 'territory-graphics':{
        const total=rows.length;
        return card('Territory footprint','<p>Live ownership across the loaded farm and contractor records.</p>',true)+card('Company presence',[['company','Company'],['competitor','Competitor'],['neutral','Neutral']].map(([key,label])=>{const count=rows.filter(e=>control(e)===key).length,pct=total?Math.round(count/total*100):0;return '<div class="agmp-skill"><div class="agmp-row"><b>'+label+'</b><span>'+count+' / '+total+'</span></div>'+track(pct,label+' territory share')+'</div>';}).join('')+(total?'':empty('Ownership graphics will fill as territory records become available.')))+card('Map controls',button('National overview','map','national')+button('Toggle satellite view','map','satellite',true));
      }
      case 'settings':return card('Player session','<h3>'+esc(d.name)+'</h3><p>'+esc(d.facility)+'</p>'+button('View player profile','screen','profile'))+card('Display','<label class="agmp-row"><span>Reduce panel motion</span><input type="checkbox" data-panel-motion '+(document.body.classList.contains('agmp-reduced-motion')?'checked':'')+'></label><p class="agmp-muted">Applies to the player menu on this browser.</p>')+card('Your landing screen','<p>The game opens on the SADC region with its drawers closed. Open the menu and choose Dashboard to see your active mission and advisors.</p>'+button('Return to Dashboard','screen','dashboard'));
      default:return '';
    }
  }

  function render(force=false){
    if(!panel||current==='dashboard')return;
    const html=renderScreen();
    if(!force&&signature===html)return;
    signature=html;
    const body=panel.querySelector('.agmp-content'),top=body.scrollTop;
    body.innerHTML=html;body.scrollTop=top;
  }
  function syncSelection(){
    sidebar?.querySelectorAll('.nav [data-ag-screen]').forEach(b=>{
      const active=b.dataset.agScreen===current&&(!window.AGWorldDrawers||window.AGWorldDrawers.getState().workspace);
      b.classList.toggle('active',active);
      if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
      b.setAttribute('aria-controls','agPlayerWorkspace');
    });
  }
  function syncDashboardAccessibility(){
    for(const child of missions.children){
      if(child===panel)continue;
      if(current!=='dashboard'){
        if(!dashboardAccess.has(child))dashboardAccess.set(child,{hidden:child.getAttribute('aria-hidden'),inert:child.inert});
        child.setAttribute('aria-hidden','true');child.inert=true;
      }else if(dashboardAccess.has(child)){
        const old=dashboardAccess.get(child);child.inert=old.inert;
        if(old.hidden===null)child.removeAttribute('aria-hidden');else child.setAttribute('aria-hidden',old.hidden);
        dashboardAccess.delete(child);
      }
    }
  }
  function select(key){
    if(!Object.hasOwn(TITLES,key)||!panel)return;
    window.AGWorldDrawers?.set('workspace',true);
    if(current===key){syncSelection();return;}
    const content=panel.querySelector('.agmp-content');
    scrollPositions.set(current,content.scrollTop);
    current=key;missions.dataset.agScreen=key;missions.classList.remove('ag-missions-collapsed');
    panel.hidden=key==='dashboard';syncDashboardAccessibility();syncSelection();
    panel.querySelector('h1').textContent=TITLES[key];
    render(true);content.scrollTop=scrollPositions.get(key)||0;
    window.dispatchEvent(new CustomEvent('agworld:panel-changed',{detail:{screen:key}}));
  }
  function bind(){
    if(!missions?.isConnected||!sidebar?.isConnected)return;
    syncSelection();syncDashboardAccessibility();
  }
  function schedule(){
    if(queued)return;queued=true;
    requestAnimationFrame(()=>{queued=false;bind();render();});
  }
  function act(event){
    const b=event.target.closest('[data-panel-action]');if(!b||!panel.contains(b))return;
    const action=b.dataset.panelAction,value=b.dataset.value;
    if(action==='screen'){select(value);if(!panel.hidden)panel.querySelector('h1').focus({preventScroll:true});}
    if(action==='contacts'){clientFilter=value;select('clients');}
    if(action==='filter'){clientFilter=value;render(true);}
    if(action==='map')document.getElementById(value==='national'?'nationalBtn':'satelliteBtn')?.click();
    if(action==='advisor'){document.querySelector('#agAdvisorBay [data-advisor="'+value+'"]')?.click();render(true);}
    if(action==='entity'||action==='fleet'){
      const [kind,...idParts]=value.split(':'),id=idParts.join(':');
      const e=entities().find(e=>e.panelType===kind&&String(e.id)===id);if(!e)return;
      if(action==='fleet')window.AGWorldFleetUI?.openManagement?.(kind,e.id);
      else if(kind==='farm')window.AG_WORLD_WORLD?.selectFarm?.(e);
      else window.dispatchEvent(new CustomEvent('agworld:dynamic-entity-selected',{detail:{entity:{...e,type:'contractor'}}}));
    }
  }
  function start(){
    missions=document.querySelector('.missions');sidebar=document.querySelector('.sidebar');
    if(!missions||!sidebar)return;
    missions.id='agPlayerWorkspace';missions.dataset.agScreen='dashboard';
    const style=document.createElement('style');style.id='ag-player-menu-panels-style';style.textContent=css;document.head.appendChild(style);
    panel=document.createElement('section');panel.id='agMenuPanel';panel.hidden=true;
    panel.setAttribute('aria-labelledby','agMenuPanelTitle');
    panel.innerHTML='<header class="agmp-head"><span class="agmp-eyebrow">AgWorld · Player hub</span><h1 id="agMenuPanelTitle" tabindex="-1">Player Profile</h1></header><div class="agmp-content"></div>';
    missions.appendChild(panel);panel.addEventListener('click',act);
    panel.addEventListener('input',event=>{
      if(!event.target.matches('[data-contact-search]'))return;
      clientSearch=event.target.value;
      const rows=entities().filter(e=>(clientFilter==='all'||control(e)===clientFilter)&&String(e.name||'').toLowerCase().includes(clientSearch.toLowerCase()));
      panel.querySelector('[data-contact-results]').innerHTML=entityRows(rows);
      panel.querySelector('[data-contact-count]').textContent=rows.length+' contacts';
      signature=renderScreen();
    });
    panel.addEventListener('change',event=>{
      if(!event.target.matches('[data-panel-motion]'))return;
      document.body.classList.toggle('agmp-reduced-motion',event.target.checked);
      try{localStorage.setItem('agworld.menu.reduceMotion',String(event.target.checked));}catch(_){}
    });
    try{document.body.classList.toggle('agmp-reduced-motion',localStorage.getItem('agworld.menu.reduceMotion')==='true');}catch(_){}
    // The sidebar owns navigation before legacy button/map/modal handlers run.
    // Logout deliberately remains the existing authenticated sign-out action.
    sidebar.addEventListener('click',event=>{
      const b=event.target.closest('.nav [data-ag-screen]');
      if(!b||!Object.hasOwn(TITLES,b.dataset.agScreen))return;
      event.preventDefault();event.stopImmediatePropagation();
      if(current===b.dataset.agScreen&&window.AGWorldDrawers?.getState().workspace)window.AGWorldDrawers.set('workspace',false);
      else select(b.dataset.agScreen);
    },true);
    window.addEventListener('agworld:drawers-changed',syncSelection);
    new MutationObserver(schedule).observe(sidebar,{childList:true,subtree:true});
    new MutationObserver(()=>{if(current!=='dashboard')syncDashboardAccessibility();}).observe(missions,{childList:true});
    for(const name of ['agworld:sales-data','agworld:player-profile','agworld:player-ready','agworld:player-state','agworld:mission-completed','agworld:territory-control-updated','agworld:dynamic-layers-loaded','agworld:advisor-selected','agworld:advisor-deselected'])window.addEventListener(name,schedule);
    document.addEventListener('agworld:landing-layout-ready',bind);
    bind();
  }
  window.AGWorldPlayerMenu={select,getScreen:()=>current,profileModel};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
