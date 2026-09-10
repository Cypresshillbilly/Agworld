/* AG WORLD — Unified panel polish: Missions, Territory Stats and Command Center */
(()=>{
  const style=document.createElement('style');
  style.id='agworld-unified-panel-polish-v1';
  style.textContent=`
  :root{
    --ag-panel-navy:#102b36;
    --ag-panel-deep:#0a2029;
    --ag-panel-teal:#1d7d82;
    --ag-panel-green:#72b84a;
    --ag-panel-lime:#c2e95d;
    --ag-panel-line:#d8e2de;
    --ag-panel-soft:#f7faf8;
  }

  /* ================= SKILL PROFILE =================
     One continuous premium surface. No separate white/light chart box. */
  html body.ag-profile-mode .missions #agMissionSkillProfile,
  html body.ag-profile-mode .missions .ag-mission-skill-profile{
    background:
      radial-gradient(circle at 82% 4%,rgba(194,233,93,.13),transparent 31%),
      radial-gradient(circle at 8% 100%,rgba(29,125,130,.18),transparent 48%),
      linear-gradient(145deg,#173c45 0%,#102b36 58%,#0a2029 100%)!important;
  }
  html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-chart,
  html body.ag-profile-mode .missions .ag-mission-skill-profile .ag-mission-skill-chart,
  html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-chart>*,
  html body.ag-profile-mode .missions .ag-mission-skill-profile .ag-mission-skill-chart>*{
    background:transparent!important;
    background-color:transparent!important;
    box-shadow:none!important;
  }
  html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-chart,
  html body.ag-profile-mode .missions .ag-mission-skill-profile .ag-mission-skill-chart{
    position:relative!important;
    isolation:isolate!important;
    border-radius:0!important;
    margin:0!important;
  }
  html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-chart:before,
  html body.ag-profile-mode .missions .ag-mission-skill-profile .ag-mission-skill-chart:before{
    content:""!important;
    position:absolute!important;inset:10px!important;
    z-index:-1!important;border-radius:14px!important;
    background:
      radial-gradient(circle at 50% 48%,rgba(194,233,93,.10),transparent 38%),
      linear-gradient(145deg,rgba(255,255,255,.025),rgba(0,0,0,.06))!important;
    border:1px solid rgba(194,233,93,.08)!important;
  }
  html body.ag-profile-mode .missions #agMissionSkillProfile svg,
  html body.ag-profile-mode .missions .ag-mission-skill-profile svg,
  html body.ag-profile-mode .missions #agMissionSkillProfile canvas,
  html body.ag-profile-mode .missions .ag-mission-skill-profile canvas{
    background:transparent!important;background-color:transparent!important;
  }

  /* ================= TERRITORY STATS =================
     Same white page + floating dark intelligence card language as My Missions. */
  #territoryStatsDrawer{
    background:transparent!important;box-shadow:none!important;
  }
  #territoryStatsDrawerContent{
    padding:0!important;background:transparent!important;
  }
  #territoryInfoPanel{
    overflow:hidden!important;
    background:
      radial-gradient(circle at 86% 5%,rgba(194,233,93,.13),transparent 30%),
      linear-gradient(145deg,#173c45 0%,#102b36 60%,#0a2029 100%)!important;
    border:1px solid rgba(92,167,116,.48)!important;
    border-radius:14px!important;
    box-shadow:0 14px 30px rgba(13,40,47,.22),inset 0 1px 0 rgba(255,255,255,.09)!important;
  }
  #territoryInfoPanel:before{
    content:""!important;display:block!important;height:3px!important;
    background:linear-gradient(90deg,var(--ag-panel-lime),var(--ag-panel-green),var(--ag-panel-teal),transparent)!important;
  }
  #territoryInfoPanel .territory-info-grid div{
    background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.025))!important;
    border:1px solid rgba(194,233,93,.14)!important;
    border-radius:9px!important;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.04)!important;
  }
  #territoryInfoPanel .territory-info-level{
    color:#c3d9d2!important;font-weight:800!important;
  }
  #territoryInfoPanel .territory-info-name,
  #territoryInfoPanel .territory-info-grid strong{color:#fff!important}
  #territoryInfoPanel .territory-info-control-value{
    color:var(--ag-panel-lime)!important;
    text-shadow:0 0 10px rgba(194,233,93,.18)!important;
  }
  #territoryInfoPanel .territory-info-footer{
    border-top:1px solid rgba(194,233,93,.12)!important;color:#b7cec6!important;
  }
  #territoryStatsToggle{
    overflow:hidden!important;
    background:linear-gradient(145deg,#173c45,#102b36 62%,#0a2029)!important;
    border:1px solid rgba(92,167,116,.44)!important;
    border-radius:11px 0 0 11px!important;
    box-shadow:0 10px 24px rgba(13,40,47,.22),inset 0 1px 0 rgba(255,255,255,.08)!important;
  }
  #territoryStatsToggle:before{
    content:""!important;position:absolute!important;left:0!important;top:0!important;bottom:0!important;width:3px!important;
    background:linear-gradient(var(--ag-panel-lime),var(--ag-panel-green),var(--ag-panel-teal))!important;
  }
  #territoryStatsToggle .ag-territory-toggle-label{color:#f7fbf8!important}
  #territoryStatsToggle .ag-territory-toggle-arrow{color:var(--ag-panel-lime)!important}

  /* ================= COMMAND CENTER =================
     White outer game surface, dark floating cards, identical green accent system. */
  #entityInformationSection{
    background:#fff!important;
    border-top:1px solid var(--ag-panel-line)!important;
    box-shadow:0 -8px 24px rgba(15,38,46,.055)!important;
  }
  #entityCommandCentreHeading{
    position:relative!important;
    background:#fff!important;
    color:var(--ag-panel-navy)!important;
    border-bottom:1px solid var(--ag-panel-line)!important;
  }
  #entityCommandCentreHeading:before{
    content:""!important;position:absolute!important;left:0!important;right:0!important;top:0!important;height:3px!important;
    background:linear-gradient(90deg,var(--ag-panel-lime),var(--ag-panel-green),var(--ag-panel-teal),transparent)!important;
  }
  #entityCommandCentreHeading .agworld-command-center-label{
    color:var(--ag-panel-navy)!important;font-weight:950!important;letter-spacing:1.25px!important;
  }
  #entityCommandCentreHeading .agworld-command-center-live{
    color:#37634c!important;background:#f0f7eb!important;border-color:#d4e8c5!important;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.9)!important;
  }

  /* Treat every content card in the command centre as part of one family. */
  #entityInformationSection #farmCard,
  #entityInformationSection .farm-card,
  #entityInformationSection .entity-card,
  #entityInformationSection .command-card,
  #entityInformationSection .farm-info-card,
  #entityInformationSection .stat-card{
    position:relative!important;overflow:hidden!important;
    background:
      radial-gradient(circle at 92% 8%,rgba(194,233,93,.10),transparent 28%),
      linear-gradient(145deg,#173c45 0%,#102b36 63%,#0a2029 100%)!important;
    color:#eef7f2!important;
    border:1px solid rgba(92,167,116,.42)!important;
    border-radius:12px!important;
    box-shadow:0 10px 22px rgba(13,40,47,.16),inset 0 1px 0 rgba(255,255,255,.08)!important;
  }
  #entityInformationSection #farmCard:before,
  #entityInformationSection .farm-card:before,
  #entityInformationSection .entity-card:before,
  #entityInformationSection .command-card:before,
  #entityInformationSection .farm-info-card:before,
  #entityInformationSection .stat-card:before{
    content:""!important;position:absolute!important;left:0!important;top:0!important;bottom:0!important;width:3px!important;
    background:linear-gradient(var(--ag-panel-lime),var(--ag-panel-green),var(--ag-panel-teal))!important;
  }
  #entityInformationSection #farmCard *{border-color:rgba(176,210,198,.15)!important}
  #entityInformationSection #farmCard h1,
  #entityInformationSection #farmCard h2,
  #entityInformationSection #farmCard h3,
  #entityInformationSection #farmCard strong,
  #entityInformationSection .farm-card strong{color:#fff!important}
  #entityInformationSection #farmCard .eyebrow,
  #entityInformationSection #farmCard .label,
  #entityInformationSection #farmCard small{color:#abc9c1!important}
  #entityInformationSection #farmCard button,
  #entityInformationSection .farm-card button{
    background:rgba(194,233,93,.10)!important;color:#efffd2!important;
    border:1px solid rgba(194,233,93,.28)!important;border-radius:9px!important;
  }
  #entityInformationSection #farmCard button:hover,
  #entityInformationSection .farm-card button:hover{
    background:rgba(194,233,93,.18)!important;
    box-shadow:0 0 0 1px rgba(194,233,93,.12),0 6px 16px rgba(0,0,0,.16)!important;
  }
  `;
  document.head.appendChild(style);
})();
