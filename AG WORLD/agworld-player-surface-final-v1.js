/* AG WORLD — Player Surface Final Lock
   Canonical visual source: approved Player Profile / Skill Profile / Mission Cards.
   This file loads last and intentionally overrides older Command Center and Territory skins. */
(()=>{
  const id='agworld-player-surface-final-v1';
  document.getElementById(id)?.remove();
  const style=document.createElement('style');
  style.id=id;
  style.textContent=`
:root{
  --ag-surface-top:#173c45;
  --ag-surface-mid:#102b36;
  --ag-surface-deep:#0b2028;
  --ag-surface-player:#183945;
  --ag-line-soft:rgba(100,178,113,.46);
  --ag-line-inner:rgba(176,210,198,.16);
  --ag-lime:#c2e95d;
  --ag-green:#72b84a;
  --ag-teal:#1d7d82;
  --ag-text:#ffffff;
  --ag-muted:#a9cbc1;
}

/* The parent must be a stage, never a rectangular dashboard slab. */
#entityInformationSection{
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
  padding:8px 10px 10px!important;
}

/* COMMAND CENTER HEADER — same floating surface family as approved panels. */
#entityCommandCentreHeading,
#entityInformationSection>#entityCommandCentreHeading{
  min-height:34px!important;
  height:34px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:space-between!important;
  box-sizing:border-box!important;
  margin:0 0 8px!important;
  padding:0 14px!important;
  color:var(--ag-text)!important;
  background:linear-gradient(145deg,var(--ag-surface-top),var(--ag-surface-mid) 64%,var(--ag-surface-deep))!important;
  border:1px solid var(--ag-line-soft)!important;
  border-radius:14px!important;
  box-shadow:0 12px 28px rgba(14,42,49,.18),inset 0 1px 0 rgba(255,255,255,.09)!important;
}
#entityCommandCentreHeading::before,
#entityCommandCentreHeading::after{border-radius:14px!important}
#entityCommandCentreHeading .agworld-command-center-label,
#entityCommandCentreHeading .agworld-command-center-label-exact{
  color:var(--ag-text)!important;
  font-weight:900!important;
  letter-spacing:1.15px!important;
}
#entityCommandCentreHeading .agworld-command-center-live,
#entityCommandCentreHeading .agworld-command-center-live-exact{
  color:var(--ag-lime)!important;
  background:rgba(194,233,93,.10)!important;
  border:1px solid rgba(194,233,93,.28)!important;
  border-radius:999px!important;
  padding:3px 7px!important;
}
#entityCommandCentreHeading .agworld-command-center-live i{
  background:var(--ag-green)!important;
  box-shadow:0 0 7px rgba(114,184,74,.7)!important;
}

/* COMMAND CENTER MAIN CARD — exact dark teal family, fully rounded. */
#entityInformationSection #farmCard,
#entityInformationSection .farm-card,
#entityInformationSection .agworld-company-entity-card,
#entityInformationSection .agworld-entity-command-interface{
  background:linear-gradient(145deg,var(--ag-surface-top),var(--ag-surface-mid) 64%,var(--ag-surface-deep))!important;
  color:#eef7f2!important;
  border:1px solid var(--ag-line-soft)!important;
  border-radius:14px!important;
  box-shadow:0 12px 28px rgba(14,42,49,.18),inset 0 1px 0 rgba(255,255,255,.09)!important;
  overflow:hidden!important;
}
#entityInformationSection #farmCard *,
#entityInformationSection .agworld-company-entity-card *{
  border-color:var(--ag-line-inner)!important;
}
#entityInformationSection #farmCard h1,
#entityInformationSection #farmCard h2,
#entityInformationSection #farmCard h3,
#entityInformationSection #farmCard strong,
#entityInformationSection .agworld-company-entity-card h1,
#entityInformationSection .agworld-company-entity-card h2,
#entityInformationSection .agworld-company-entity-card h3,
#entityInformationSection .agworld-company-entity-card strong{color:var(--ag-text)!important}
#entityInformationSection #farmCard .eyebrow,
#entityInformationSection #farmCard .label,
#entityInformationSection #farmCard small,
#entityInformationSection .agworld-company-entity-card .eyebrow,
#entityInformationSection .agworld-company-entity-card .label,
#entityInformationSection .agworld-company-entity-card small{color:var(--ag-muted)!important}

/* Internal command surfaces inherit the same game material rather than green/black dashboard blocks. */
#entityInformationSection #farmCard .company-command-stats-pane,
#entityInformationSection #farmCard .company-command-right-pane,
#entityInformationSection #farmCard .company-command-facility-side,
#entityInformationSection #farmCard .company-command-skills-pane,
#entityInformationSection #farmCard .company-skill-chart-expanded,
#entityInformationSection #farmCard .company-skill-chart-main,
#entityInformationSection #farmCard .company-skill-visual,
#entityInformationSection #farmCard .company-command-kpis>div,
#entityInformationSection #farmCard .company-stats-summary>div,
#entityInformationSection #farmCard .company-facility-row,
#entityInformationSection #farmCard .stats,
#entityInformationSection #farmCard .stat,
#entityInformationSection #farmCard .farm-extra,
#entityInformationSection #farmCard .farm-extra>div,
#entityInformationSection #agworldV2FarmDetailHost,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content{
  background:rgba(255,255,255,.035)!important;
  color:#eef7f2!important;
  border:1px solid rgba(176,210,198,.16)!important;
  border-radius:12px!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.045)!important;
}
#entityInformationSection #farmCard .company-command-split,
#entityInformationSection #farmCard .company-command-left-pane{
  background:transparent!important;
  box-shadow:none!important;
}
#entityInformationSection #farmCard .stat b,
#entityInformationSection #farmCard .company-command-kpis b,
#entityInformationSection #farmCard .company-stats-summary b{color:var(--ag-lime)!important}
#entityInformationSection #farmCard button{
  background:rgba(194,233,93,.10)!important;
  color:#efffd2!important;
  border:1px solid rgba(194,233,93,.30)!important;
  border-radius:9px!important;
}

/* TERRITORY STATS — exact Skill Profile panel family. */
#territoryStatsDrawer,
#territoryStatsDrawerContent{
  background:transparent!important;
  box-shadow:none!important;
  border:0!important;
}
#territoryInfoPanel,
#territoryInfoPanel.agworld-territory-command-panel{
  background:linear-gradient(145deg,var(--ag-surface-top),var(--ag-surface-mid) 64%,var(--ag-surface-deep))!important;
  color:#eef7f2!important;
  border:1px solid var(--ag-line-soft)!important;
  border-radius:14px!important;
  box-shadow:0 16px 38px rgba(14,42,49,.22),inset 0 1px 0 rgba(255,255,255,.08)!important;
  overflow:hidden!important;
}
#territoryInfoPanel .agworld-territory-stats-heading{
  background:linear-gradient(90deg,rgba(194,233,93,.08),rgba(29,125,130,.08),transparent)!important;
  border:0!important;
  border-bottom:1px solid rgba(176,210,198,.16)!important;
  border-radius:14px 14px 0 0!important;
}
#territoryInfoPanel .territory-national-left,
#territoryInfoPanel .territory-national-right{
  background:transparent!important;
}
#territoryInfoPanel .territory-info-grid>div,
#territoryInfoPanel .territory-national-scope,
#territoryInfoPanel .territory-info-empty,
#territoryInfoPanel .territory-info-control,
#territoryInfoPanel .territory-info-footer{
  background:rgba(255,255,255,.035)!important;
  border:1px solid rgba(176,210,198,.16)!important;
  border-radius:12px!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.045)!important;
}
#territoryInfoPanel .territory-info-name,
#territoryInfoPanel .territory-info-grid strong{color:var(--ag-text)!important}
#territoryInfoPanel .territory-info-level,
#territoryInfoPanel .territory-info-footer,
#territoryInfoPanel .territory-info-grid span{color:var(--ag-muted)!important}
#territoryInfoPanel .territory-info-control-value{color:var(--ag-lime)!important}
#territoryInfoPanel .territory-info-progress{
  background:rgba(255,255,255,.08)!important;
  border-radius:999px!important;
}
#territoryInfoPanel .territory-info-progress span{
  background:linear-gradient(90deg,var(--ag-green),var(--ag-lime))!important;
}
#territoryStatsToggle{
  background:linear-gradient(145deg,var(--ag-surface-top),var(--ag-surface-mid) 64%,var(--ag-surface-deep))!important;
  color:var(--ag-text)!important;
  border:1px solid var(--ag-line-soft)!important;
  border-radius:14px!important;
  box-shadow:0 10px 24px rgba(14,42,49,.18),inset 0 1px 0 rgba(255,255,255,.08)!important;
}
#territoryStatsToggle .ag-territory-toggle-label{color:var(--ag-text)!important}
#territoryStatsToggle .ag-territory-toggle-arrow{color:var(--ag-lime)!important}
`;
  document.head.appendChild(style);
})();

/* Runtime lock: the previous territory/command script uses inline !important
   paint operations and a MutationObserver. CSS alone cannot beat those.
   This runs after it and writes the approved Player/Skill/Mission surface
   directly onto the live elements, also after future DOM mutations. */
(()=>{
  const set=(el,p,v)=>{ if(el) el.style.setProperty(p,v,'important'); };
  const panel='linear-gradient(145deg,#1a4650 0%,#123640 62%,#0d2831 100%)';
  const inset='rgba(255,255,255,.055)';
  const line='rgba(81,157,124,.48)';
  const inner='rgba(176,210,198,.16)';
  const shadow='0 10px 22px rgba(13,40,47,.15),inset 0 1px 0 rgba(255,255,255,.08)';

  function paint(el){
    if(!el) return;
    set(el,'background',panel);
    set(el,'border','1px solid '+line);
    set(el,'border-radius','14px');
    set(el,'box-shadow',shadow);
    set(el,'overflow','hidden');
  }
  function paintInset(root,selector){
    root?.querySelectorAll(selector).forEach(el=>{
      set(el,'background',inset);
      set(el,'border','1px solid '+inner);
      set(el,'border-radius','12px');
      set(el,'box-shadow','inset 0 1px 0 rgba(255,255,255,.06)');
    });
  }
  function run(){
    const territory=document.getElementById('territoryInfoPanel');
    paint(territory);
    territory?.querySelectorAll('.agworld-territory-stats-heading,.territory-info-header').forEach(el=>{
      set(el,'background','transparent');
      set(el,'border-radius','0');
      set(el,'border-bottom','1px solid '+inner);
    });
    paintInset(territory,'.territory-info-grid>div,.territory-national-scope,.territory-info-empty,.territory-info-control,.territory-info-footer');
    territory?.querySelectorAll('.territory-national-left,.territory-national-right').forEach(el=>{
      set(el,'background','transparent');
      set(el,'border','0');
    });
    const toggle=document.getElementById('territoryStatsToggle');
    paint(toggle);

    const section=document.getElementById('entityInformationSection');
    if(section){
      set(section,'background','#F4F3ED');
      set(section,'border','0');
      set(section,'box-shadow','none');
      set(section,'padding','8px 10px 10px');
    }
    const heading=document.getElementById('entityCommandCentreHeading');
    paint(heading);
    if(heading) set(heading,'margin','0 0 8px 0');

    const card=document.getElementById('farmCard');
    paint(card);
    if(card){
      card.querySelectorAll('.company-command-split').forEach(el=>{
        set(el,'background','transparent'); set(el,'border','0'); set(el,'box-shadow','none');
      });
      paintInset(card,'.company-command-stats-pane,.company-command-right-pane,.company-command-facility-side,.company-command-skills-pane,.company-skill-chart-expanded,.company-skill-chart-main,.company-skill-visual,.company-command-kpis>div,.company-stats-summary>div,.company-facility-row,.stats,.stat,.farm-extra,.farm-extra>div,#agworldV2FarmDetailHost,.agworld-v2-detail-tabs,.agworld-v2-detail-content,#farmActions');
    }
    document.querySelectorAll('#entityInformationSection .agworld-company-entity-card,#entityInformationSection .agworld-entity-command-interface').forEach(paint);
  }

  run();
  [0,50,150,400,1000,2500,5000,9000].forEach(ms=>setTimeout(run,ms));
  new MutationObserver(()=>queueMicrotask(run)).observe(document.documentElement,{childList:true,subtree:true});
})();
