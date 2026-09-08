/* AG WORLD — unified player and Company skill intelligence.
   The same five canonical skills are used for the player profile, My Missions
   sidebar and the Company Command Center. */
(()=>{
  const SKILLS=[
    {key:'technical',name:'TECHNICAL',short:'TECH',icon:'⚙'},
    {key:'operational',name:'OPERATIONAL',short:'OPS',icon:'◈'},
    {key:'product',name:'PRODUCT',short:'PRODUCT',icon:'✦'},
    {key:'management',name:'MANAGEMENT',short:'MGMT',icon:'◆'},
    {key:'people',name:'PEOPLE',short:'PEOPLE',icon:'●'}
  ];
  const MAX=25;
  const REWARDS={
    'c1-welcome':{management:1,people:1},
    'c1-hr':{people:2,management:1},
    'c1-documents':{management:1,operational:1},
    'c1-safety':{technical:2,operational:1},
    'c1-company-training':{product:2,management:1},
    'c1-briefing':{people:1,operational:1},
    'c2-profile':{management:1,people:1},
    'c2-explore':{operational:2,product:1},
    'c2-survey':{technical:2,operational:1},
    'c2-create':{operational:2,technical:1},
    'c2-assets':{product:2,technical:1},
    'c2-intelligence':{product:2,management:1}
  };
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const zero=()=>Object.fromEntries(SKILLS.map(s=>[s.key,0]));
  const clamp=(n,max=MAX)=>Math.max(0,Math.min(max,Number(n)||0));
  const totalsFromCompleted=completed=>{
    const out=zero();
    Object.keys(completed||{}).forEach(id=>{
      const reward=REWARDS[id];
      if(!reward)return;
      Object.entries(reward).forEach(([key,value])=>out[key]+=Number(value)||0);
    });
    return out;
  };
  function currentTotals(){
    const state=window.AGWorldProgression?.getState?.()||{};
    const derived=totalsFromCompleted(state.completed||{});
    const existing=window.AG_WORLD_SKILL_TOTALS||{};
    const out=zero();
    // Keep externally awarded skill stars, but never let an older cached value
    // hide newly completed mission rewards.
    SKILLS.forEach(s=>out[s.key]=clamp(Math.max(Number(derived[s.key])||0,Number(existing[s.key])||0)));
    window.AG_WORLD_SKILL_TOTALS={...out};
    return out;
  }
  function polar(cx,cy,r,i){const a=-Math.PI/2+i*2*Math.PI/SKILLS.length;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r];}
  function points(cx,cy,r,vals,max){return vals.map((v,i)=>polar(cx,cy,r*(Number(v)||0)/Math.max(1,max),i).map(n=>n.toFixed(1)).join(',')).join(' ');}
  function radarSvg(totals,{id='agSkillRadar',compact=false,company=false}={}){
    const vals=SKILLS.map(s=>Number(totals[s.key])||0);
    const dynamicMax=company?Math.max(5,...vals.map(v=>Math.ceil(v/5)*5)):MAX;
    const w=compact?280:360,h=compact?220:300,cx=compact?140:160,cy=compact?108:145,r=compact?76:104;
    let grid='';
    for(let level=1;level<=5;level++){const rr=r*level/5;grid+='<polygon points="'+SKILLS.map((_,i)=>polar(cx,cy,rr,i).map(n=>n.toFixed(1)).join(',')).join(' ')+'"/>';}
    const axes=SKILLS.map((_,i)=>{const p=polar(cx,cy,r,i);return '<line x1="'+cx+'" y1="'+cy+'" x2="'+p[0].toFixed(1)+'" y2="'+p[1].toFixed(1)+'"/>';}).join('');
    const labels=SKILLS.map((s,i)=>{const p=polar(cx,cy,r+(compact?18:22),i),anchor=Math.abs(p[0]-cx)<8?'middle':p[0]<cx?'end':'start';return '<text x="'+p[0].toFixed(1)+'" y="'+p[1].toFixed(1)+'" text-anchor="'+anchor+'">'+esc(s.short)+'</text>';}).join('');
    return '<svg class="ag-skill-radar-svg '+(company?'company-skill-radar-svg':'')+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+(company?'Company combined skill profile':'Player skill profile')+'"><g class="ag-radar-grid">'+grid+'</g><g class="ag-radar-axes">'+axes+'</g><polygon class="ag-radar-fill" points="'+points(cx,cy,r,vals,dynamicMax)+'"></polygon><polyline class="ag-radar-outline" points="'+points(cx,cy,r,vals,dynamicMax)+'"></polyline><g class="ag-radar-points">'+vals.map((v,i)=>{const p=polar(cx,cy,r*v/Math.max(1,dynamicMax),i);return '<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="'+(compact?2.8:3.5)+'"></circle>';}).join('')+'</g><circle class="ag-radar-center" cx="'+cx+'" cy="'+cy+'" r="4"></circle><g class="ag-radar-labels">'+labels+'</g></svg>';
  }
  function profileMarkup(){
    const totals=currentTotals(), vals=SKILLS.map(s=>totals[s.key]), total=vals.reduce((a,b)=>a+b,0);
    return '<section class="ag-skill-tree"><div class="ag-skill-tree-head"><div><span>PLAYER DEVELOPMENT</span><h3>SKILL PROFILE</h3></div><div class="ag-skill-total"><b>'+total+' ★</b><small>TOTAL SKILL STARS</small></div></div><div class="ag-radar-wrap"><div class="ag-radar-chart">'+radarSvg(totals,{id:'profile'})+'</div><div class="ag-radar-stats">'+SKILLS.map(s=>'<div class="ag-radar-stat"><span class="ag-radar-icon">'+s.icon+'</span><div><b>'+s.name+'</b><strong>'+totals[s.key]+' <em>★</em></strong><small>LEVEL '+totals[s.key]+' / '+MAX+'</small></div></div>').join('')+'</div></div><div class="ag-skill-tree-note">Your profile uses the same five skill categories that feed the Company capability profile.</div></section>';
  }
  function missionMarkup(){
    const totals=currentTotals(), total=Object.values(totals).reduce((a,b)=>a+b,0);
    return '<section id="agMissionSkillProfile" class="ag-mission-skill-profile"><div class="ag-mission-skill-head"><div><span>PLAYER CAPABILITY</span><b>SKILL PROFILE</b></div><strong>'+total+' ★</strong></div><div class="ag-mission-skill-body"><div class="ag-mission-skill-chart">'+radarSvg(totals,{id:'missions',compact:true})+'</div><div class="ag-mission-skill-list">'+SKILLS.map(s=>'<div><span>'+s.icon+' '+s.name+'</span><b>'+totals[s.key]+'</b></div>').join('')+'</div></div></section>';
  }
  function renderProfile(){
    const body=document.querySelector('.ag-user-profile-body');if(!body)return false;
    body.querySelector('.ag-skill-tree')?.remove();body.insertAdjacentHTML('beforeend',profileMarkup());return true;
  }
  function renderMissions(){
    const side=document.querySelector('.missions');if(!side)return false;
    let host=side.querySelector('#agMissionSkillProfile');
    if(host)host.outerHTML=missionMarkup();
    else {
      const level=side.querySelector('.level');
      if(level)level.insertAdjacentHTML('afterend',missionMarkup());
      else side.insertAdjacentHTML('afterbegin',missionMarkup());
    }
    return true;
  }
  let companyCache={at:0,promise:null,value:null};
  async function companyTotals(force=false){
    if(!force&&companyCache.value&&Date.now()-companyCache.at<10000)return companyCache.value;
    if(companyCache.promise)return companyCache.promise;
    companyCache.promise=(async()=>{
      const db=window.supabase?.createClient?.('https://vcnkspaljmsjvonftfcw.supabase.co','sb_publishable_azAO3PoKko79ccwSJFjkhQ_L67ZM85o');
      if(!db){
        const fallback=currentTotals();companyCache.value={totals:fallback,users:1,source:'current-player'};companyCache.at=Date.now();return companyCache.value;
      }
      const res=await db.from('ag_mission_progress').select('player_id,mission_id,status').eq('status','completed');
      const rows=res.data||[];
      const aggregate=zero(), users=new Set();
      rows.forEach(row=>{const reward=REWARDS[row.mission_id];if(!reward)return;users.add(row.player_id);Object.entries(reward).forEach(([key,value])=>aggregate[key]+=Number(value)||0);});
      if(!rows.length){
        const fallback=currentTotals();Object.assign(aggregate,fallback);
      }
      companyCache.value={totals:aggregate,users:users.size||1,source:'shared-company'};
      companyCache.at=Date.now();return companyCache.value;
    })().finally(()=>companyCache.promise=null);
    return companyCache.promise;
  }
  function companyMarkup(data){
    const totals=data.totals||zero(), strongest=SKILLS.reduce((best,s)=>totals[s.key]>totals[best.key]?s:best,SKILLS[0]);
    const total=SKILLS.reduce((sum,s)=>sum+(Number(totals[s.key])||0),0);
    return '<div class="company-skill-chart"><div class="company-skill-chart-head"><div><span>COMPANY CAPABILITY</span><b>COMBINED USER SKILLS</b></div></div><div class="company-skill-chart-main"><div class="company-skill-visual">'+radarSvg(totals,{id:'company',compact:true,company:true})+'</div></div></div>';
  }
  async function renderCompany(target){
    const host=target||document.getElementById('companySkillChartHost');if(!host)return false;
    host.innerHTML='<div class="company-skill-loading">CALCULATING COMBINED COMPANY SKILLS…</div>';
    try{host.innerHTML=companyMarkup(await companyTotals());}catch(err){console.warn('Company skill aggregation failed',err);host.innerHTML=companyMarkup({totals:currentTotals(),users:1});}
    return true;
  }
  function css(){
    if(document.getElementById('ag-unified-skill-style'))return;
    const s=document.createElement('style');s.id='ag-unified-skill-style';s.textContent=
'.ag-skill-tree{margin-top:16px;border:1px solid #40545c;border-radius:10px;background:#17262d;overflow:hidden;color:#fff;box-shadow:0 8px 24px rgba(18,38,47,.22)}'+
'.ag-skill-tree-head,.ag-mission-skill-head,.company-skill-chart-head{display:flex;justify-content:space-between;align-items:center;padding:14px 17px;background:linear-gradient(180deg,#263c46,#182a32);border-bottom:1px solid #42545b}.ag-skill-tree-head span,.ag-mission-skill-head span,.company-skill-chart-head span{font:900 8px Arial,sans-serif;letter-spacing:1px;color:#9baeb4}.ag-skill-tree-head h3{margin:3px 0 0;font:900 17px Arial,sans-serif}.ag-skill-total b{display:block;font:900 22px Arial,sans-serif;color:#e5b34a}.ag-skill-total small{font:900 7px Arial,sans-serif;color:#9baeb4;letter-spacing:.5px}.ag-radar-wrap{display:flex;align-items:center;gap:8px;min-height:310px;padding:4px 12px 2px;background:radial-gradient(circle at 32% 48%,rgba(93,130,140,.15),transparent 38%),linear-gradient(120deg,#0e1a20,#1b2c34 52%,#111e24)}.ag-radar-chart{flex:1;min-width:0}.ag-skill-radar-svg{display:block;width:100%;height:300px;overflow:visible}.ag-radar-grid polygon{fill:none;stroke:#50636b;stroke-width:1;opacity:.62}.ag-radar-axes line{stroke:#4b5d64;stroke-width:1;opacity:.7}.ag-radar-fill{fill:rgba(184,115,42,.42);stroke:none}.ag-radar-outline{fill:none;stroke:#d5a444;stroke-width:2}.ag-radar-points circle{fill:#d8a642;stroke:#f4d58b;stroke-width:1.5}.ag-radar-center{fill:#a95028;stroke:#d1a05a;stroke-width:1}.ag-radar-labels text{fill:#8fa1a7;font:900 8px Arial,sans-serif;letter-spacing:.5px}.ag-radar-stats{width:42%;max-width:190px;min-width:155px;border-left:1px solid #40535b;padding:5px 0 5px 13px;box-sizing:border-box}.ag-radar-stat{display:grid;grid-template-columns:24px 1fr;align-items:center;gap:6px;padding:7px 5px;border-bottom:1px solid rgba(91,110,117,.34)}.ag-radar-stat:last-child{border-bottom:0}.ag-radar-icon{width:22px;height:22px;display:flex;align-items:center;justify-content:center;border:1px solid #7b6231;background:#263940;color:#e4b34c;font:900 11px Arial,sans-serif}.ag-radar-stat b{display:block;color:#d9e2e4;font:900 8px Arial,sans-serif}.ag-radar-stat strong{display:inline-block;color:#e6b64e;font:900 13px Arial,sans-serif;margin-top:2px}.ag-radar-stat small{display:block;color:#73868d;font:800 6px Arial,sans-serif;margin-top:1px}.ag-skill-tree-note{padding:8px 14px 10px;border-top:1px solid #40525a;background:#15242b;color:#a7b6ba;font:700 8px/1.35 Arial,sans-serif}'+
'.ag-mission-skill-profile{margin:10px 0 12px;border:1px solid rgba(64,84,92,.45);border-radius:8px;overflow:hidden;background:linear-gradient(145deg,#17262d,#101c22)}.ag-mission-skill-head{padding:9px 11px}.ag-mission-skill-head b{display:block;margin-top:2px;font:900 11px Arial,sans-serif;color:#e8f2f3;letter-spacing:.5px}.ag-mission-skill-head strong{color:#e5b34a;font:900 14px Arial,sans-serif}.ag-mission-skill-body{display:grid;grid-template-columns:1.05fr .95fr;min-height:178px}.ag-mission-skill-chart{min-width:0;padding:2px 0}.ag-mission-skill-chart .ag-skill-radar-svg{height:176px}.ag-mission-skill-list{display:flex;flex-direction:column;justify-content:center;padding:7px 10px 7px 0;gap:4px}.ag-mission-skill-list div{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid rgba(91,110,117,.25);font:800 7px Arial,sans-serif;color:#a9b9bd}.ag-mission-skill-list div:last-child{border-bottom:0}.ag-mission-skill-list b{color:#e6b64e;font-size:11px}'+
'#companySkillChartHost{display:block;width:100%;height:100%;min-height:0}.company-command-skills-pane{display:flex!important;min-width:0!important;min-height:0!important;padding:8px!important;box-sizing:border-box!important;overflow:hidden!important}.company-skill-chart{display:flex;flex-direction:column;height:100%;min-height:0;background:radial-gradient(circle at 28% 38%,rgba(72,199,106,.08),transparent 42%),linear-gradient(145deg,#0d1b20,#071217);border:1px solid rgba(91,197,119,.18);border-radius:8px;overflow:hidden}.company-skill-chart-head{padding:10px 12px;background:linear-gradient(180deg,#12242a,#0c171c)}.company-skill-chart-head b{display:block;margin-top:3px;color:#e7f4ea;font:900 11px Arial,sans-serif;letter-spacing:.65px}.company-skill-total{text-align:right}.company-skill-total strong{display:block;color:#a8f0b2;font:900 14px Arial,sans-serif}.company-skill-total small{display:block;margin-top:3px;color:#799184;font:800 6px Arial,sans-serif;letter-spacing:.7px}.company-skill-chart-main{display:grid;grid-template-columns:1.05fr .95fr;min-height:0;flex:1}.company-skill-visual{min-width:0;padding:4px}.company-skill-visual .ag-skill-radar-svg{height:170px}.company-skill-breakdown{display:flex;flex-direction:column;justify-content:center;padding:8px 11px 8px 0;gap:3px}.company-skill-breakdown div{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid rgba(91,197,119,.13);font:800 7px Arial,sans-serif;color:#8fa49a}.company-skill-breakdown div:last-child{border-bottom:0}.company-skill-breakdown div.is-strongest span{color:#bdf5c5}.company-skill-breakdown b{color:#e7f5ea;font-size:12px}.company-skill-breakdown .is-strongest b{color:#8cf09c}.company-skill-insight{display:flex;justify-content:space-between;align-items:center;padding:7px 11px;border-top:1px solid rgba(91,197,119,.16);background:rgba(88,200,115,.06)}.company-skill-insight span{font:900 6px Arial,sans-serif;letter-spacing:.8px;color:#718b7b}.company-skill-insight b{font:900 8px Arial,sans-serif;letter-spacing:.9px;color:#a8f0b2}.company-skill-loading{display:flex;align-items:center;justify-content:center;height:100%;min-height:160px;color:#86a493;font:900 8px Arial,sans-serif;letter-spacing:.9px;background:#0a1519;border:1px solid rgba(91,197,119,.15);border-radius:8px}'+
'.ag-mission-skill-profile{background:#fff!important;border:1px solid #d9e0e2!important;box-shadow:0 3px 10px rgba(18,38,47,.08)!important;color:#24333a!important}.ag-mission-skill-head{background:#fff!important;border-bottom:1px solid #e1e7e8!important;padding:10px 11px!important}.ag-mission-skill-head span{color:#7b8b91!important}.ag-mission-skill-head b{color:#263840!important}.ag-mission-skill-head strong{color:#b7791f!important}.ag-mission-skill-body{display:flex!important;flex-direction:column!important;min-height:0!important;background:#fff!important}.ag-mission-skill-chart{width:100%!important;min-width:0!important;padding:4px 8px 0!important;box-sizing:border-box!important}.ag-mission-skill-chart .ag-skill-radar-svg{display:block!important;width:100%!important;height:220px!important;max-height:220px!important}.ag-mission-skill-chart .ag-radar-grid polygon{stroke:#b9c5c8!important}.ag-mission-skill-chart .ag-radar-axes line{stroke:#c3ced1!important}.ag-mission-skill-chart .ag-radar-labels text{fill:#51636a!important;font-size:8px!important}.ag-mission-skill-list{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:4px!important;padding:6px 8px 9px!important;background:#f7f9f9!important;border-top:1px solid #e5eaeb!important}.ag-mission-skill-list div{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;min-width:0!important;padding:5px 2px!important;border:0!important;border-right:1px solid #e2e8e9!important;color:#5f7077!important;text-align:center!important}.ag-mission-skill-list div:last-child{border-right:0!important}.ag-mission-skill-list span{font-size:6px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;max-width:100%!important}.ag-mission-skill-list b{color:#b7791f!important;font-size:11px!important}.company-skill-chart{width:100%!important;height:100%!important;min-height:0!important;background:transparent!important;border:0!important;border-radius:0!important;overflow:hidden!important}.company-skill-chart-head{min-height:0!important;padding:4px 6px!important;background:transparent!important;border-bottom:0!important}.company-skill-chart-head span{font-size:6px!important;color:#6f9380!important}.company-skill-chart-head b{margin-top:1px!important;font-size:8px!important;color:#dceee1!important}.company-skill-total,.company-skill-breakdown,.company-skill-insight{display:none!important}.company-skill-chart-main{display:block!important;min-height:0!important;flex:1!important}.company-skill-visual{width:100%!important;height:100%!important;padding:0!important;box-sizing:border-box!important}.company-skill-visual .ag-skill-radar-svg{display:block!important;width:100%!important;height:118px!important;max-height:118px!important}.company-skill-visual .ag-radar-labels text{font-size:6px!important}'+
'.ag-mission-skill-profile{display:block!important;flex:0 0 auto!important;min-height:0!important;height:auto!important}.ag-mission-skill-body{display:flex!important;flex:0 0 auto!important;flex-shrink:0!important;height:auto!important;min-height:0!important;overflow:visible!important}.ag-mission-skill-chart{display:block!important;flex:0 0 168px!important;height:168px!important;min-height:168px!important;max-height:168px!important;overflow:visible!important}.ag-mission-skill-chart .ag-skill-radar-svg{display:block!important;position:relative!important;visibility:visible!important;opacity:1!important;width:100%!important;height:168px!important;min-height:168px!important;max-height:none!important;overflow:visible!important}.ag-mission-skill-list{display:grid!important;flex:0 0 auto!important;flex-shrink:0!important}'+
'@media(max-width:650px){.ag-radar-wrap{display:block;padding:4px 8px 8px}.ag-skill-radar-svg{height:275px}.ag-radar-stats{width:100%;max-width:none;display:grid;grid-template-columns:1fr 1fr;border-left:0;border-top:1px solid #40535b;padding:5px 0}.ag-mission-skill-body,.company-skill-chart-main{grid-template-columns:1fr}.ag-mission-skill-list,.company-skill-breakdown{padding:5px 10px 10px}}';
    document.head.appendChild(s);
  }
  function renderAll(){css();renderProfile();renderMissions();const company=document.getElementById('companySkillChartHost');if(company)renderCompany(company);}
  function start(){renderAll();[250,900,1800,3500].forEach(ms=>setTimeout(renderAll,ms));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  window.addEventListener('agworld:player-ready',()=>setTimeout(renderAll,60));
  window.addEventListener('agworld:mission-completed',()=>{companyCache.value=null;setTimeout(renderAll,120);});
  window.AG_WORLD_SKILLS={definitions:SKILLS,rewards:REWARDS,getCurrentTotals:currentTotals,getCompanyTotals:companyTotals,renderProfile,renderMissions,renderCompany,renderAll,radarSvg};

  // Profile windows and mission content are created dynamically. Only fill a
  // missing skill graph so our own rendering never creates a mutation loop.
  let queued=false;
  const ensureDynamic=()=>{
    queued=false;
    const body=document.querySelector('.ag-user-profile-body');
    if(body&&!body.querySelector('.ag-skill-tree'))renderProfile();
    const side=document.querySelector('.missions');
    if(side&&!side.querySelector('#agMissionSkillProfile'))renderMissions();
    const company=document.getElementById('companySkillChartHost');
    if(company&&!company.querySelector('.company-skill-chart')&&!company.querySelector('.company-skill-loading'))renderCompany(company);
  };
  new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    setTimeout(ensureDynamic,40);
  }).observe(document.body,{childList:true,subtree:true});
})();