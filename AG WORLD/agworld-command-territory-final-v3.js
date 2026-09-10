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
`;
  function installStyle(){
    document.getElementById(STYLE_ID)?.remove();
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=css;document.head.appendChild(s);
  }
  const set=(el,p,v)=>el&&el.style.setProperty(p,v,'important');
  function paint(){
    const territory=document.getElementById('territoryInfoPanel');
    if(territory){set(territory,'background','radial-gradient(circle at 88% 8%,rgba(184,230,32,.18),transparent 30%),linear-gradient(145deg,#34777A 0%,#2F6B70 42%,#245C62 100%)');}
    const toggle=document.getElementById('territoryStatsToggle');
    if(toggle)set(toggle,'background','linear-gradient(145deg,#34777A,#245C62)');
    const section=document.getElementById('entityInformationSection');
    if(section)set(section,'background','#F4F3ED');
    const card=document.getElementById('farmCard');
    if(card)set(card,'background','radial-gradient(circle at 88% 8%,rgba(184,230,32,.15),transparent 30%),linear-gradient(145deg,#34777A 0%,#2F6B70 45%,#245C62 100%)');
    document.querySelectorAll('#entityInformationSection .agworld-company-entity-card,#entityInformationSection .agworld-entity-command-interface').forEach(el=>set(el,'background','radial-gradient(circle at 88% 8%,rgba(184,230,32,.15),transparent 30%),linear-gradient(145deg,#34777A 0%,#2F6B70 45%,#245C62 100%)'));
  }
  installStyle();paint();
  [100,350,900,1800,3500,7000].forEach(ms=>setTimeout(paint,ms));
  new MutationObserver(()=>paint()).observe(document.documentElement,{childList:true,subtree:true});
})();