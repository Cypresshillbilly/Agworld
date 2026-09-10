/* AG WORLD — Command Center + Territory Stats FINAL v3
   Loaded after every runtime UI script. Uses explicit final-brand surfaces and
   re-applies them to dynamically recreated nodes so legacy dark layers cannot return. */
(()=>{
  const STYLE_ID='agworld-command-territory-final-v3';
  const css=`
:root{
  --ag-final-teal:#2F6B70;
  --ag-final-teal-mid:#245C62;
  --ag-final-teal-deep:#1B4D53;
  --ag-final-green:#0D6A38;
  --ag-final-lime:#B8E620;
  --ag-final-silver:#D9DAD5;
  --ag-final-white:#F4F3ED;
}

/* TERRITORY STATS — same lighter teal intelligence family */
#territoryInfoPanel{
  background:radial-gradient(circle at 88% 8%,rgba(184,230,32,.18),transparent 30%),linear-gradient(145deg,#34777A 0%,var(--ag-final-teal) 42%,var(--ag-final-teal-mid) 100%)!important;
  border:1px solid rgba(184,230,32,.52)!important;
  box-shadow:0 16px 34px rgba(11,44,32,.22),inset 0 1px 0 rgba(244,243,237,.16)!important;
}
#territoryInfoPanel .territory-info-grid div,
#territoryInfoPanel .territory-info-empty,
#territoryInfoPanel .territory-info-control,
#territoryInfoPanel .territory-info-footer{
  background:rgba(244,243,237,.07)!important;
  border-color:rgba(244,243,237,.20)!important;
}
#territoryInfoPanel .territory-info-progress{background:rgba(11,44,32,.20)!important}
#territoryInfoPanel .territory-info-progress span{background:linear-gradient(90deg,var(--ag-final-green),var(--ag-final-lime))!important}
#territoryStatsToggle{
  background:linear-gradient(145deg,#34777A,var(--ag-final-teal-mid))!important;
  border-color:rgba(184,230,32,.48)!important;
  box-shadow:0 10px 24px rgba(11,44,32,.18),inset 0 1px 0 rgba(244,243,237,.16)!important;
}
#territoryStatsToggle .ag-territory-toggle-label{color:var(--ag-final-white)!important}
#territoryStatsToggle .ag-territory-toggle-arrow{color:var(--ag-final-lime)!important}

/* COMMAND CENTER — white outer field + visibly lighter teal floating surface */
#entityInformationSection{
  background:var(--ag-final-white)!important;
  border-top:1px solid var(--ag-final-silver)!important;
}
#entityCommandCentreHeading{
  background:var(--ag-final-white)!important;
  color:var(--ag-final-teal-deep)!important;
  border-bottom-color:var(--ag-final-silver)!important;
}
#entityCommandCentreHeading .agworld-command-center-label{color:var(--ag-final-teal-deep)!important}
#entityInformationSection #farmCard,
#entityInformationSection .farm-card,
#entityInformationSection .agworld-company-entity-card,
#entityInformationSection .agworld-entity-command-interface{
  background:radial-gradient(circle at 88% 8%,rgba(184,230,32,.15),transparent 30%),linear-gradient(145deg,#34777A 0%,var(--ag-final-teal) 45%,var(--ag-final-teal-mid) 100%)!important;
  border-color:rgba(184,230,32,.44)!important;
  color:var(--ag-final-white)!important;
  box-shadow:0 14px 30px rgba(11,44,32,.18),inset 0 1px 0 rgba(244,243,237,.16)!important;
}

/* Every old black sub-surface is pulled into the same teal family */
#entityInformationSection #farmCard .stats,
#entityInformationSection #farmCard .stat,
#entityInformationSection #farmCard .farm-extra,
#entityInformationSection #farmCard .farm-extra>div,
#entityInformationSection #agworldV2FarmDetailHost,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content,
#entityInformationSection #farmActions,
#entityInformationSection .company-command-skills-pane,
#entityInformationSection .company-command-stats-pane,
#entityInformationSection .company-command-kpis>div,
#entityInformationSection .company-skill-chart,
#entityInformationSection .company-skill-chart-expanded{
  background:rgba(47,107,112,.42)!important;
  border-color:rgba(244,243,237,.20)!important;
  box-shadow:inset 0 1px 0 rgba(244,243,237,.08)!important;
}
#entityInformationSection .stat{background:rgba(244,243,237,.07)!important}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button,
#entityInformationSection #farmActions button{
  background:rgba(244,243,237,.08)!important;
  color:var(--ag-final-white)!important;
  border-color:rgba(244,243,237,.22)!important;
}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button.is-active,
#entityInformationSection #farmActions .save-farm,
#entityInformationSection #farmActions button:first-child{
  background:linear-gradient(135deg,var(--ag-final-green),#16804A)!important;
  color:var(--ag-final-white)!important;
  border-color:var(--ag-final-lime)!important;
}
#entityInformationSection h1,#entityInformationSection h2,#entityInformationSection h3,
#entityInformationSection strong,#entityInformationSection #farmName{color:var(--ag-final-white)!important}
#entityInformationSection .stat b,#entityInformationSection .company-command-kpis b{color:var(--ag-final-lime)!important}
#entityInformationSection span,#entityInformationSection small,#entityInformationSection p{border-color:rgba(244,243,237,.18)!important}
#entityInformationSection .company-skill-chart{background:radial-gradient(circle at 50% 48%,rgba(184,230,32,.13),transparent 42%),rgba(47,107,112,.42)!important}
#entityInformationSection .company-skill-chart .ag-radar-grid polygon{stroke:rgba(184,230,32,.46)!important}
#entityInformationSection .company-skill-chart .ag-radar-axes line{stroke:rgba(244,243,237,.28)!important}

/* HARD FINAL OVERRIDE — main-game-layout v35/v39 uses more specific dark selectors.
   These selectors intentionally match/exceed those exact runtime rules. */
#territoryInfoPanel.agworld-territory-command-panel{
  background:radial-gradient(circle at 88% 8%,rgba(184,230,32,.18),transparent 30%),linear-gradient(145deg,#34777A 0%,#2F6B70 46%,#245C62 100%)!important;
  border-color:rgba(184,230,32,.52)!important;
  box-shadow:0 16px 34px rgba(11,44,32,.22),inset 0 1px 0 rgba(244,243,237,.16)!important;
}
#territoryInfoPanel.agworld-territory-command-panel .agworld-territory-stats-heading{
  background:linear-gradient(145deg,#34777A,#2F6B70 58%,#245C62)!important;
  border-bottom-color:rgba(244,243,237,.18)!important;
  box-shadow:0 8px 18px rgba(11,44,32,.18),inset 0 1px 0 rgba(244,243,237,.14)!important;
}
#territoryInfoPanel.agworld-territory-command-panel .territory-national-left,
#territoryInfoPanel.agworld-territory-command-panel .territory-national-right{
  background:transparent!important;
}
#territoryInfoPanel.agworld-territory-command-panel .territory-national-left{
  border-right-color:rgba(244,243,237,.18)!important;
}
#territoryInfoPanel.agworld-territory-command-panel .territory-info-grid>div,
#territoryInfoPanel.agworld-territory-command-panel .territory-national-scope{
  background:rgba(244,243,237,.07)!important;
  border-color:rgba(244,243,237,.20)!important;
}
#territoryInfoPanel.agworld-territory-command-panel .territory-info-progress{
  background:rgba(11,44,32,.24)!important;
}

/* Command Center: override the exact v35/v39 black surfaces, including split panes. */
#entityInformationSection{
  background:#F4F3ED!important;
  border-color:#D9DAD5!important;
}
#entityInformationSection>#entityCommandCentreHeading.agworld-command-center-heading-exact,
#entityCommandCentreHeading{
  background:linear-gradient(145deg,#34777A,#2F6B70 58%,#245C62)!important;
  border-bottom-color:rgba(244,243,237,.18)!important;
  color:#F4F3ED!important;
  box-shadow:0 8px 18px rgba(11,44,32,.18),inset 0 1px 0 rgba(244,243,237,.14)!important;
}
#entityCommandCentreHeading .agworld-command-center-label-exact,
#entityCommandCentreHeading .agworld-command-center-label{color:#F4F3ED!important}
#entityCommandCentreHeading .agworld-command-center-live-exact,
#entityCommandCentreHeading .agworld-command-center-live{
  background:rgba(184,230,32,.12)!important;color:#B8E620!important;border-color:rgba(184,230,32,.42)!important;
}
#entityInformationSection #farmCard.farm-card.agworld-company-entity-card,
#entityInformationSection #farmCard.farm-card.agworld-company-entity-card>.company-command-split{
  background:radial-gradient(circle at 88% 8%,rgba(184,230,32,.15),transparent 30%),linear-gradient(145deg,#34777A 0%,#2F6B70 45%,#245C62 100%)!important;
}
#entityInformationSection .agworld-company-entity-card .company-command-stats-pane,
#entityInformationSection .agworld-company-entity-card .company-command-right-pane,
#entityInformationSection .agworld-company-entity-card .company-command-facility-side,
#entityInformationSection .agworld-company-entity-card .company-command-skills-pane,
#entityInformationSection .agworld-company-entity-card .company-skill-chart-expanded,
#entityInformationSection .agworld-company-entity-card .company-skill-chart-main,
#entityInformationSection .agworld-company-entity-card .company-skill-visual,
#entityInformationSection .agworld-company-entity-card .company-command-kpis>div,
#entityInformationSection .agworld-company-entity-card .company-stats-summary>div,
#entityInformationSection .agworld-company-entity-card .company-facility-row{
  background:rgba(11,44,32,.16)!important;
  border-color:rgba(244,243,237,.20)!important;
  box-shadow:inset 0 1px 0 rgba(244,243,237,.08)!important;
}
#entityInformationSection .agworld-company-entity-card .company-command-kpis>div:hover,
#entityInformationSection .agworld-company-entity-card .company-facility-row:hover{background:rgba(244,243,237,.12)!important}
#entityInformationSection .agworld-company-entity-card .company-command-pane-title span,
#entityInformationSection .agworld-company-entity-card .company-facility-name span,
#entityInformationSection .agworld-company-entity-card .company-facility-staff span{color:#D9DAD5!important}
#entityInformationSection .agworld-company-entity-card .company-command-pane-title b,
#entityInformationSection .agworld-company-entity-card .company-command-kpis b,
#entityInformationSection .agworld-company-entity-card .company-stats-summary b,
#entityInformationSection .agworld-company-entity-card .company-facility-staff b{color:#B8E620!important}

`;
  function installStyle(){
    document.getElementById(STYLE_ID)?.remove();
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=css;document.head.appendChild(s);
  }
  const set=(el,p,v)=>el&&el.style.setProperty(p,v,'important');
  function paint(){
    const territory=document.getElementById('territoryInfoPanel');
    if(territory){set(territory,'background','radial-gradient(circle at 88% 8%,rgba(184,230,32,.18),transparent 30%),linear-gradient(145deg,#34777A 0%,#2F6B70 46%,#245C62 100%)'); territory.querySelectorAll('.agworld-territory-stats-heading,.territory-national-left,.territory-national-right').forEach(el=>set(el,'background',el.classList.contains('agworld-territory-stats-heading')?'linear-gradient(145deg,#34777A,#2F6B70 58%,#245C62)':'transparent'));}
    const toggle=document.getElementById('territoryStatsToggle');
    if(toggle)set(toggle,'background','linear-gradient(145deg,#34777A,#245C62)');
    const section=document.getElementById('entityInformationSection');
    if(section)set(section,'background','#F4F3ED');
    const heading=document.getElementById('entityCommandCentreHeading'); if(heading)set(heading,'background','linear-gradient(145deg,#34777A,#2F6B70 58%,#245C62)');
    const card=document.getElementById('farmCard');
    if(card){set(card,'background','radial-gradient(circle at 88% 8%,rgba(184,230,32,.15),transparent 30%),linear-gradient(145deg,#34777A 0%,#2F6B70 45%,#245C62 100%)'); card.querySelectorAll('.company-command-split').forEach(el=>set(el,'background','radial-gradient(circle at 88% 8%,rgba(184,230,32,.15),transparent 30%),linear-gradient(145deg,#34777A 0%,#2F6B70 45%,#245C62 100%)')); card.querySelectorAll('.company-command-stats-pane,.company-command-right-pane,.company-command-facility-side,.company-command-skills-pane,.company-skill-chart-expanded,.company-skill-chart-main,.company-skill-visual,.company-command-kpis>div,.company-stats-summary>div,.company-facility-row').forEach(el=>set(el,'background','rgba(11,44,32,.16)'));}
    document.querySelectorAll('#entityInformationSection .agworld-company-entity-card,#entityInformationSection .agworld-entity-command-interface').forEach(el=>set(el,'background','radial-gradient(circle at 88% 8%,rgba(184,230,32,.15),transparent 30%),linear-gradient(145deg,#34777A 0%,#2F6B70 45%,#245C62 100%)'));
  }
  installStyle();paint();
  [100,350,900,1800,3500,7000].forEach(ms=>setTimeout(paint,ms));
  new MutationObserver(()=>paint()).observe(document.documentElement,{childList:true,subtree:true});
})();