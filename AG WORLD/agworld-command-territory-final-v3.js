/* AG WORLD — Command Center + Territory Stats FINAL v3
   Palette lock: official AG WORLD brand colours only.
   This layer deliberately uses the same dark Growth Green → Deep Forest
   surface language as the approved Skill Profile and mission cards. */
(()=>{
  const STYLE_ID='agworld-command-territory-final-v3';
  const css=`
:root{
  --ag-lime:#B8E620;
  --ag-growth:#0D6A38;
  --ag-forest:#0B2C20;
  --ag-gold:#D69212;
  --ag-silver:#D9DAD5;
  --ag-warm-white:#F4F3ED;
}

/* Shared floating-panel language: same family as Skill Profile. */
#territoryInfoPanel,
#territoryInfoPanel.agworld-territory-command-panel,
#entityInformationSection #farmCard,
#entityInformationSection #farmCard.farm-card,
#entityInformationSection #farmCard.farm-card.agworld-company-entity-card,
#entityInformationSection .agworld-company-entity-card,
#entityInformationSection .agworld-entity-command-interface{
  background:
    radial-gradient(circle at 84% 8%,rgba(184,230,32,.14),transparent 30%),
    linear-gradient(145deg,#0D6A38 0%,#0B2C20 70%)!important;
  border:1px solid rgba(184,230,32,.46)!important;
  border-radius:18px!important;
  color:#F4F3ED!important;
  box-shadow:0 14px 30px rgba(11,44,32,.30),inset 0 1px 0 rgba(244,243,237,.12)!important;
}

/* TERRITORY STATS */
#territoryInfoPanel{
  overflow:hidden!important;
}
#territoryInfoPanel .agworld-territory-stats-heading{
  background:linear-gradient(90deg,rgba(184,230,32,.12),rgba(13,106,56,.12),transparent)!important;
  border-radius:17px 17px 0 0!important;
  border-bottom:1px solid rgba(217,218,213,.18)!important;
  box-shadow:none!important;
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
  background:rgba(11,44,32,.34)!important;
  border:1px solid rgba(217,218,213,.16)!important;
  border-radius:12px!important;
  box-shadow:inset 0 1px 0 rgba(244,243,237,.06)!important;
}
#territoryInfoPanel .territory-info-progress{
  background:rgba(11,44,32,.46)!important;
}
#territoryInfoPanel .territory-info-progress span{
  background:linear-gradient(90deg,#0D6A38,#B8E620)!important;
}
#territoryStatsToggle{
  background:linear-gradient(145deg,#0D6A38,#0B2C20 76%)!important;
  border:1px solid rgba(184,230,32,.46)!important;
  border-radius:14px!important;
  color:#F4F3ED!important;
  box-shadow:0 10px 24px rgba(11,44,32,.24),inset 0 1px 0 rgba(244,243,237,.10)!important;
}
#territoryStatsToggle .ag-territory-toggle-label{color:#F4F3ED!important}
#territoryStatsToggle .ag-territory-toggle-arrow{color:#B8E620!important}

/* COMMAND CENTER — warm-white field, dark official floating surfaces. */
#entityInformationSection{
  background:#F4F3ED!important;
  border:0!important;
  padding:8px 10px 10px!important;
  box-sizing:border-box!important;
}
#entityInformationSection>#entityCommandCentreHeading,
#entityCommandCentreHeading{
  background:linear-gradient(145deg,#0D6A38,#0B2C20 74%)!important;
  border:1px solid rgba(184,230,32,.46)!important;
  border-radius:14px!important;
  margin:0 0 8px 0!important;
  color:#F4F3ED!important;
  box-shadow:0 10px 22px rgba(11,44,32,.24),inset 0 1px 0 rgba(244,243,237,.10)!important;
}
#entityCommandCentreHeading .agworld-command-center-label,
#entityCommandCentreHeading .agworld-command-center-label-exact{
  color:#F4F3ED!important;
}
#entityCommandCentreHeading .agworld-command-center-live,
#entityCommandCentreHeading .agworld-command-center-live-exact{
  color:#B8E620!important;
  background:rgba(184,230,32,.10)!important;
  border-color:rgba(184,230,32,.40)!important;
}

/* Main card split stays one continuous panel; no pale/teal legacy blocks. */
#entityInformationSection #farmCard .company-command-split,
#entityInformationSection .agworld-company-entity-card .company-command-split{
  background:transparent!important;
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
#entityInformationSection .agworld-company-entity-card .company-facility-row,
#entityInformationSection #farmCard .stats,
#entityInformationSection #farmCard .stat,
#entityInformationSection #farmCard .farm-extra,
#entityInformationSection #farmCard .farm-extra>div,
#entityInformationSection #agworldV2FarmDetailHost,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content,
#entityInformationSection #farmActions{
  background:rgba(11,44,32,.34)!important;
  border-color:rgba(217,218,213,.16)!important;
  border-radius:12px!important;
  box-shadow:inset 0 1px 0 rgba(244,243,237,.06)!important;
}
#entityInformationSection .agworld-company-entity-card .company-command-kpis>div:hover,
#entityInformationSection .agworld-company-entity-card .company-facility-row:hover,
#entityInformationSection #farmActions button:hover{
  background:rgba(184,230,32,.10)!important;
  border-color:rgba(184,230,32,.46)!important;
}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button,
#entityInformationSection #farmActions button{
  background:rgba(11,44,32,.42)!important;
  color:#D9DAD5!important;
  border-color:rgba(217,218,213,.20)!important;
  border-radius:10px!important;
}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button.is-active,
#entityInformationSection #farmActions .save-farm,
#entityInformationSection #farmActions button:first-child{
  background:#0D6A38!important;
  color:#F4F3ED!important;
  border-color:#B8E620!important;
}
#entityInformationSection h1,
#entityInformationSection h2,
#entityInformationSection h3,
#entityInformationSection strong,
#entityInformationSection #farmName{
  color:#F4F3ED!important;
}
#entityInformationSection .stat b,
#entityInformationSection .company-command-kpis b,
#entityInformationSection .company-stats-summary b,
#entityInformationSection .company-command-pane-title b,
#entityInformationSection .company-facility-staff b{
  color:#B8E620!important;
}
#entityInformationSection .company-command-pane-title span,
#entityInformationSection .company-facility-name span,
#entityInformationSection .company-facility-staff span,
#entityInformationSection #farmMeta,
#entityInformationSection .farm-extra span{
  color:#D9DAD5!important;
}
#entityInformationSection .company-skill-chart{
  background:
    radial-gradient(circle at 50% 48%,rgba(184,230,32,.12),transparent 42%),
    rgba(11,44,32,.34)!important;
}
#entityInformationSection .company-skill-chart .ag-radar-grid polygon{
  fill:none!important;
  stroke:rgba(184,230,32,.46)!important;
}
#entityInformationSection .company-skill-chart .ag-radar-axes line{
  stroke:rgba(217,218,213,.30)!important;
}
#entityInformationSection .company-skill-chart .ag-radar-fill{
  fill:rgba(184,230,32,.18)!important;
}
#entityInformationSection .company-skill-chart .ag-radar-outline{
  stroke:#B8E620!important;
}
#entityInformationSection .company-skill-chart .ag-radar-points circle{
  fill:#B8E620!important;
  stroke:#0D6A38!important;
}

/* FINAL COMPONENT-FAMILY LOCK
   Command Center and Territory Stats now use the same rounded floating-panel
   construction as the approved Player Profile / Skill Profile family. */
#territoryStatsDrawer,
#territoryStatsDrawerContent{
  background:transparent!important;
  border:0!important;
  border-radius:20px!important;
  overflow:visible!important;
  box-shadow:none!important;
}
#territoryStatsDrawerContent{padding:0!important}
#territoryInfoPanel,
#territoryInfoPanel.agworld-territory-command-panel{
  background:
    radial-gradient(circle at 82% 8%,rgba(184,230,32,.12),transparent 28%),
    linear-gradient(145deg,#0D6A38 0%,#0B2C20 66%,#0B2C20 100%)!important;
  border:1px solid rgba(184,230,32,.42)!important;
  border-radius:20px!important;
  overflow:hidden!important;
  box-shadow:0 16px 36px rgba(11,44,32,.32),inset 0 1px 0 rgba(244,243,237,.11)!important;
}
#territoryInfoPanel .agworld-territory-stats-heading{
  min-height:42px!important;
  padding:0 14px!important;
  background:linear-gradient(90deg,rgba(184,230,32,.10),rgba(13,106,56,.12),transparent)!important;
  border-bottom:1px solid rgba(217,218,213,.16)!important;
  border-radius:20px 20px 0 0!important;
}
#territoryInfoPanel .territory-info-grid>div,
#territoryInfoPanel .territory-national-scope,
#territoryInfoPanel .territory-info-empty,
#territoryInfoPanel .territory-info-control,
#territoryInfoPanel .territory-info-footer{
  background:rgba(244,243,237,.055)!important;
  border:1px solid rgba(217,218,213,.14)!important;
  border-radius:14px!important;
  box-shadow:inset 0 1px 0 rgba(244,243,237,.06)!important;
}
#territoryInfoPanel .territory-info-grid>div:hover,
#territoryInfoPanel .territory-national-scope:hover{
  background:rgba(184,230,32,.075)!important;
  border-color:rgba(184,230,32,.30)!important;
}
#territoryInfoPanel .territory-info-name,
#territoryInfoPanel .territory-info-grid strong,
#territoryInfoPanel .territory-national-scope strong{color:#F4F3ED!important}
#territoryInfoPanel .territory-info-level,
#territoryInfoPanel .territory-info-footer{color:#D9DAD5!important}
#territoryInfoPanel .territory-info-control-value,
#territoryInfoPanel .territory-info-grid b{color:#B8E620!important}

/* Command Center: warm-white stage with separate rounded floating cards. */
#entityInformationSection{
  background:#F4F3ED!important;
  border:0!important;
  padding:10px!important;
}
#entityCommandCentreHeading,
#entityInformationSection>#entityCommandCentreHeading.agworld-command-center-heading-exact{
  min-height:42px!important;
  height:42px!important;
  padding:0 14px!important;
  background:
    radial-gradient(circle at 86% 0%,rgba(184,230,32,.11),transparent 28%),
    linear-gradient(145deg,#0D6A38 0%,#0B2C20 72%)!important;
  border:1px solid rgba(184,230,32,.42)!important;
  border-radius:16px!important;
  box-shadow:0 10px 24px rgba(11,44,32,.22),inset 0 1px 0 rgba(244,243,237,.10)!important;
}
#entityInformationSection #farmCard,
#entityInformationSection #farmCard.farm-card,
#entityInformationSection #farmCard.farm-card.agworld-company-entity-card,
#entityInformationSection .agworld-company-entity-card,
#entityInformationSection .agworld-entity-command-interface{
  background:
    radial-gradient(circle at 84% 8%,rgba(184,230,32,.12),transparent 30%),
    linear-gradient(145deg,#0D6A38 0%,#0B2C20 68%,#0B2C20 100%)!important;
  border:1px solid rgba(184,230,32,.42)!important;
  border-radius:20px!important;
  overflow:hidden!important;
  box-shadow:0 16px 36px rgba(11,44,32,.28),inset 0 1px 0 rgba(244,243,237,.10)!important;
}
#entityInformationSection #farmCard>.company-command-split,
#entityInformationSection .agworld-company-entity-card>.company-command-split,
#entityInformationSection .agworld-entity-command-interface>.company-command-split{background:transparent!important}
#entityInformationSection .company-command-stats-pane,
#entityInformationSection .company-command-right-pane,
#entityInformationSection .company-command-facility-side,
#entityInformationSection .company-command-skills-pane,
#entityInformationSection .company-skill-chart-expanded,
#entityInformationSection .company-skill-chart-main,
#entityInformationSection .company-skill-visual,
#entityInformationSection .company-command-kpis>div,
#entityInformationSection .company-stats-summary>div,
#entityInformationSection .company-facility-row,
#entityInformationSection #farmCard .stats,
#entityInformationSection #farmCard .stat,
#entityInformationSection #farmCard .farm-extra,
#entityInformationSection #farmCard .farm-extra>div,
#entityInformationSection #agworldV2FarmDetailHost,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content,
#entityInformationSection #farmActions{
  background:rgba(244,243,237,.055)!important;
  border:1px solid rgba(217,218,213,.14)!important;
  border-radius:14px!important;
  box-shadow:inset 0 1px 0 rgba(244,243,237,.055)!important;
}
#entityInformationSection .company-command-pane-title,
#entityInformationSection .company-command-pane-title>*{background:transparent!important}
#entityInformationSection .company-command-kpis>div:hover,
#entityInformationSection .company-facility-row:hover,
#entityInformationSection .stat:hover{
  background:rgba(184,230,32,.075)!important;
  border-color:rgba(184,230,32,.30)!important;
}
#entityInformationSection .company-command-kpis,
#entityInformationSection .company-stats-summary{gap:8px!important}
#entityInformationSection .company-skill-chart,
#entityInformationSection .company-skill-chart-expanded,
#entityInformationSection .company-skill-chart-main,
#entityInformationSection .company-skill-visual{
  background:
    radial-gradient(circle at 50% 46%,rgba(184,230,32,.12),transparent 44%),
    rgba(244,243,237,.04)!important;
}


/* ABSOLUTE VISUAL FAMILY LOCK — match the approved Player / Skill / Mission cards.
   This intentionally uses the exact teal surface construction already approved
   on the left, rather than the saturated Growth Green treatment. */
:root{
  --ag-approved-card-1:#1a4650;
  --ag-approved-card-2:#123640;
  --ag-approved-card-3:#0d2831;
  --ag-approved-border:rgba(81,157,124,.48);
  --ag-approved-text:#f6fbf7;
  --ag-approved-muted:#c8d7d3;
}

/* TERRITORY STATS: same teal floating card, not a green dashboard slab. */
#territoryStatsDrawer,
#territoryStatsDrawer.ag-territory-drawer,
#territoryStatsDrawerContent{
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
  border-radius:14px!important;
}
#territoryInfoPanel,
#territoryInfoPanel.show,
#territoryInfoPanel.agworld-territory-command-panel{
  background:linear-gradient(145deg,var(--ag-approved-card-1),var(--ag-approved-card-2) 62%,var(--ag-approved-card-3))!important;
  border:1px solid var(--ag-approved-border)!important;
  border-radius:14px!important;
  overflow:hidden!important;
  box-shadow:0 10px 22px rgba(13,40,47,.18),inset 0 1px 0 rgba(255,255,255,.08)!important;
}
#territoryInfoPanel .agworld-territory-stats-heading,
#territoryInfoPanel .territory-info-header{
  background:transparent!important;
  border-radius:0!important;
  border-bottom:1px solid rgba(176,210,198,.16)!important;
}
#territoryInfoPanel .territory-info-grid>div,
#territoryInfoPanel .territory-national-scope,
#territoryInfoPanel .territory-info-empty,
#territoryInfoPanel .territory-info-control,
#territoryInfoPanel .territory-info-footer{
  background:rgba(255,255,255,.055)!important;
  border:1px solid rgba(176,210,198,.16)!important;
  border-radius:12px!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06)!important;
}
#territoryStatsToggle{
  background:linear-gradient(145deg,var(--ag-approved-card-1),var(--ag-approved-card-2) 62%,var(--ag-approved-card-3))!important;
  border:1px solid var(--ag-approved-border)!important;
  border-radius:12px!important;
  color:var(--ag-approved-text)!important;
  box-shadow:0 10px 22px rgba(13,40,47,.15),inset 0 1px 0 rgba(255,255,255,.08)!important;
}
#territoryInfoPanel .territory-info-level,
#territoryInfoPanel .territory-info-footer,
#territoryInfoPanel .territory-info-grid span{color:var(--ag-approved-muted)!important}
#territoryInfoPanel .territory-info-name,
#territoryInfoPanel .territory-info-grid strong{color:#fff!important}
#territoryInfoPanel .territory-info-control-value,
#territoryStatsToggle .ag-territory-toggle-arrow{color:#c2e95d!important}

/* COMMAND CENTER: remove the full-width dark slab. The warm-white field is
   the stage; heading and command content are separate rounded floating cards. */
#entityInformationSection,
#entityInformationSection.bottom-game-panel,
#entityInformationSection.entity-game-panel{
  background:#F4F3ED!important;
  border:0!important;
  padding:10px!important;
  box-sizing:border-box!important;
  display:flex!important;
  flex-direction:column!important;
  gap:8px!important;
}
#entityCommandCentreHeading,
#entityInformationSection>#entityCommandCentreHeading,
#entityInformationSection>#entityCommandCentreHeading.agworld-command-center-heading-exact{
  flex:0 0 auto!important;
  width:100%!important;
  min-height:38px!important;
  height:38px!important;
  margin:0!important;
  padding:0 14px!important;
  box-sizing:border-box!important;
  background:linear-gradient(145deg,var(--ag-approved-card-1),var(--ag-approved-card-2) 62%,var(--ag-approved-card-3))!important;
  border:1px solid var(--ag-approved-border)!important;
  border-radius:14px!important;
  color:var(--ag-approved-text)!important;
  box-shadow:0 10px 22px rgba(13,40,47,.15),inset 0 1px 0 rgba(255,255,255,.08)!important;
}
#entityCommandCentreHeading .agworld-command-center-label,
#entityCommandCentreHeading .agworld-command-center-label-exact{color:#fff!important}
#entityCommandCentreHeading .agworld-command-center-live,
#entityCommandCentreHeading .agworld-command-center-live-exact{
  background:rgba(194,233,93,.10)!important;
  border:1px solid rgba(194,233,93,.22)!important;
  border-radius:999px!important;
  color:#c2e95d!important;
}

/* The actual command surface is one rounded teal card sitting inside the white
   stage — never edge-to-edge, never square. */
#entityInformationSection #farmCard,
#entityInformationSection #farmCard.farm-card,
#entityInformationSection .farm-card,
#entityInformationSection .agworld-company-entity-card,
#entityInformationSection .agworld-entity-command-interface{
  flex:1 1 auto!important;
  width:100%!important;
  min-width:0!important;
  margin:0!important;
  box-sizing:border-box!important;
  background:linear-gradient(145deg,var(--ag-approved-card-1),var(--ag-approved-card-2) 62%,var(--ag-approved-card-3))!important;
  border:1px solid var(--ag-approved-border)!important;
  border-radius:14px!important;
  overflow:hidden!important;
  box-shadow:0 10px 22px rgba(13,40,47,.15),inset 0 1px 0 rgba(255,255,255,.08)!important;
}
#entityInformationSection #farmCard .company-command-split,
#entityInformationSection .agworld-company-entity-card .company-command-split{
  background:transparent!important;
}
#entityInformationSection .company-command-stats-pane,
#entityInformationSection .company-command-right-pane,
#entityInformationSection .company-command-facility-side,
#entityInformationSection .company-command-skills-pane,
#entityInformationSection .company-skill-chart-expanded,
#entityInformationSection .company-skill-chart-main,
#entityInformationSection .company-skill-visual,
#entityInformationSection .company-command-kpis>div,
#entityInformationSection .company-stats-summary>div,
#entityInformationSection .company-facility-row,
#entityInformationSection #farmCard .stats,
#entityInformationSection #farmCard .stat,
#entityInformationSection #farmCard .farm-extra,
#entityInformationSection #farmCard .farm-extra>div{
  background:rgba(255,255,255,.055)!important;
  border:1px solid rgba(176,210,198,.16)!important;
  border-radius:12px!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.06)!important;
}
#entityInformationSection .company-skill-chart,
#entityInformationSection .company-skill-chart-expanded,
#entityInformationSection .company-skill-chart-main,
#entityInformationSection .company-skill-visual{
  background:radial-gradient(circle at 50% 45%,rgba(194,233,93,.10),rgba(20,54,62,.20) 58%,rgba(7,25,32,.35))!important;
}

`;
  function installStyle(){
    document.getElementById(STYLE_ID)?.remove();
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=css;
    document.head.appendChild(s);
  }
  const set=(el,p,v)=>el&&el.style.setProperty(p,v,'important');
  const panelBg='radial-gradient(circle at 84% 8%,rgba(184,230,32,.14),transparent 30%),linear-gradient(145deg,#0D6A38 0%,#0B2C20 70%)';
  const headerBg='linear-gradient(145deg,#0D6A38,#0B2C20 74%)';
  const insetBg='rgba(11,44,32,.34)';

  function paint(){
    if(document.documentElement.dataset.agGameTheme==='reference')return;
    const territory=document.getElementById('territoryInfoPanel');
    if(territory){
      set(territory,'background',panelBg);
      set(territory,'border-radius','18px');
      set(territory,'overflow','hidden');
      set(territory,'border','1px solid rgba(184,230,32,.46)');
      territory.querySelectorAll('.agworld-territory-stats-heading').forEach(el=>{
        set(el,'background','linear-gradient(90deg,rgba(184,230,32,.12),rgba(13,106,56,.12),transparent)');
        set(el,'border-radius','17px 17px 0 0');
      });
      territory.querySelectorAll('.territory-info-grid>div,.territory-national-scope,.territory-info-empty,.territory-info-control,.territory-info-footer').forEach(el=>{
        set(el,'background',insetBg);
        set(el,'border-radius','12px');
        set(el,'border','1px solid rgba(217,218,213,.16)');
      });
      territory.querySelectorAll('.territory-national-left,.territory-national-right').forEach(el=>set(el,'background','transparent'));
    }

    const toggle=document.getElementById('territoryStatsToggle');
    if(toggle){
      set(toggle,'background',headerBg);
      set(toggle,'border-radius','14px');
      set(toggle,'border','1px solid rgba(184,230,32,.46)');
    }

    const section=document.getElementById('entityInformationSection');
    if(section){
      set(section,'background','#F4F3ED');
      set(section,'padding','8px 10px 10px');
      set(section,'box-sizing','border-box');
    }

    const heading=document.getElementById('entityCommandCentreHeading');
    if(heading){
      set(heading,'background',headerBg);
      set(heading,'border-radius','14px');
      set(heading,'margin','0 0 8px 0');
      set(heading,'border','1px solid rgba(184,230,32,.46)');
    }

    const card=document.getElementById('farmCard');
    if(card){
      set(card,'background',panelBg);
      set(card,'border-radius','18px');
      set(card,'overflow','hidden');
      set(card,'border','1px solid rgba(184,230,32,.46)');
      card.querySelectorAll('.company-command-split').forEach(el=>set(el,'background','transparent'));
      card.querySelectorAll('.company-command-stats-pane,.company-command-right-pane,.company-command-facility-side,.company-command-skills-pane,.company-skill-chart-expanded,.company-skill-chart-main,.company-skill-visual,.company-command-kpis>div,.company-stats-summary>div,.company-facility-row,.stats,.stat,.farm-extra,.farm-extra>div,#agworldV2FarmDetailHost,.agworld-v2-detail-tabs,.agworld-v2-detail-content,#farmActions').forEach(el=>{
        set(el,'background',insetBg);
        set(el,'border-radius','12px');
        set(el,'border','1px solid rgba(217,218,213,.16)');
      });
    }

    document.querySelectorAll('#entityInformationSection .agworld-company-entity-card,#entityInformationSection .agworld-entity-command-interface').forEach(el=>{
      set(el,'background',panelBg);
      set(el,'border-radius','18px');
      set(el,'overflow','hidden');
      set(el,'border','1px solid rgba(184,230,32,.46)');
    });
  }

  installStyle();
  paint();
  [100,350,900,1800,3500,7000].forEach(ms=>setTimeout(paint,ms));
  new MutationObserver(()=>paint()).observe(document.documentElement,{childList:true,subtree:true});
})();