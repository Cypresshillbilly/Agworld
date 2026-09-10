/* AG WORLD — FINAL brand unification.
   Source of truth: AG WORLD/brand/colour-system.md
   This file intentionally loads last and removes legacy white/blue styling
   from the Skill Profile and Command Center. */
(()=>{
  const id='agworld-final-brand-unification-v1';
  document.getElementById(id)?.remove();

  const style=document.createElement('style');
  style.id=id;
  style.textContent=`
:root{
  --ag-lime:#B8E620;
  --ag-growth:#0D6A38;
  --ag-forest:#0B2C20;
  --ag-gold:#D69212;
  --ag-silver:#D9DAD5;
  --ag-warm-white:#F4F3ED;
}

/* =========================================================
   FINAL SKILL PROFILE — ONE CONTINUOUS AGWORLD SURFACE
   No white card, no pale chart box, no pale skill strip.
   ========================================================= */
html body.ag-profile-mode .missions #agMissionSkillProfile,
html body.ag-profile-mode .missions .ag-mission-skill-profile{
  background:
    radial-gradient(circle at 82% 4%,rgba(184,230,32,.14),transparent 30%),
    linear-gradient(145deg,var(--ag-growth) 0%,var(--ag-forest) 68%)!important;
  border:1px solid rgba(184,230,32,.46)!important;
  color:var(--ag-warm-white)!important;
  box-shadow:0 14px 30px rgba(11,44,32,.34),inset 0 1px 0 rgba(244,243,237,.12)!important;
}

/* Remove every legacy light layer inside the panel. */
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-head,
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-body,
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-chart,
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-list,
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-list div{
  background-color:transparent!important;
  background-image:none!important;
  box-shadow:none!important;
}

html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-head{
  background:linear-gradient(90deg,rgba(184,230,32,.11),rgba(13,106,56,.08),transparent)!important;
  border-bottom:1px solid rgba(217,218,213,.22)!important;
}

html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-body{
  background:transparent!important;
}

html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-chart{
  position:relative!important;
  background:
    radial-gradient(circle at 50% 48%,rgba(184,230,32,.12),transparent 42%)!important;
  border:0!important;
  border-radius:0!important;
}

html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-chart::before,
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-chart::after{
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
}

html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-list{
  background:rgba(11,44,32,.34)!important;
  border-top:1px solid rgba(217,218,213,.16)!important;
}

html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-list div{
  background:transparent!important;
  border-color:rgba(217,218,213,.16)!important;
}

html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-head span,
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-list span{
  color:var(--ag-silver)!important;
}
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-head b{
  color:var(--ag-warm-white)!important;
}
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-head strong,
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-mission-skill-list b{
  color:var(--ag-lime)!important;
  background:transparent!important;
  border-color:rgba(184,230,32,.42)!important;
}

html body.ag-profile-mode .missions #agMissionSkillProfile svg,
html body.ag-profile-mode .missions #agMissionSkillProfile svg *,
html body.ag-profile-mode .missions #agMissionSkillProfile canvas{
  background-color:transparent!important;
}
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-radar-grid polygon{
  fill:none!important;
  stroke:rgba(184,230,32,.48)!important;
}
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-radar-axes line{
  stroke:rgba(217,218,213,.34)!important;
}
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-radar-fill{
  fill:rgba(184,230,32,.18)!important;
}
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-radar-outline{
  stroke:var(--ag-lime)!important;
}
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-radar-points circle{
  fill:var(--ag-lime)!important;
  stroke:var(--ag-growth)!important;
}
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-radar-center{
  fill:var(--ag-lime)!important;
  stroke:var(--ag-warm-white)!important;
}
html body.ag-profile-mode .missions #agMissionSkillProfile .ag-radar-labels text{
  fill:var(--ag-warm-white)!important;
  stroke:var(--ag-forest)!important;
}

/* =========================================================
   FINAL COMMAND CENTER — SAME DESIGN SYSTEM AS MY MISSIONS
   Warm white field + Deep Forest floating cards + official
   Lime/Growth Green/Territory Gold/Silver accents only.
   ========================================================= */
#entityInformationSection{
  background:var(--ag-warm-white)!important;
  border-top:1px solid var(--ag-silver)!important;
  box-shadow:0 -8px 22px rgba(11,44,32,.10)!important;
}

#entityCommandCentreHeading{
  position:relative!important;
  background:var(--ag-warm-white)!important;
  color:var(--ag-forest)!important;
  border-bottom:1px solid var(--ag-silver)!important;
}
#entityCommandCentreHeading::before{
  content:""!important;
  position:absolute!important;
  left:0!important;right:0!important;top:0!important;height:3px!important;
  background:linear-gradient(90deg,var(--ag-lime),var(--ag-growth),transparent)!important;
}
#entityCommandCentreHeading .agworld-command-center-label{
  color:var(--ag-forest)!important;
}
#entityCommandCentreHeading .agworld-command-center-live{
  color:var(--ag-growth)!important;
  background:rgba(184,230,32,.14)!important;
  border-color:rgba(13,106,56,.30)!important;
}

/* Main entity command card and every nested legacy pale surface. */
#entityInformationSection .farm-card,
#entityInformationSection .agworld-entity-command-interface{
  background:linear-gradient(145deg,var(--ag-growth),var(--ag-forest) 70%)!important;
  color:var(--ag-warm-white)!important;
  border:1px solid rgba(184,230,32,.38)!important;
  border-radius:14px!important;
  box-shadow:0 12px 26px rgba(11,44,32,.24),inset 0 1px 0 rgba(244,243,237,.10)!important;
}

#entityInformationSection .farm-card::before{
  color:var(--ag-lime)!important;
}

/* Left summary column */
#entityInformationSection #farmName{
  color:var(--ag-warm-white)!important;
}
#entityInformationSection #farmMeta,
#entityInformationSection .farm-extra span{
  color:var(--ag-silver)!important;
}
#entityInformationSection .farm-extra{
  background:rgba(11,44,32,.42)!important;
  border-top-color:rgba(217,218,213,.16)!important;
}
#entityInformationSection .farm-extra>div{
  border-bottom-color:rgba(217,218,213,.13)!important;
}
#entityInformationSection .farm-extra b{
  color:var(--ag-warm-white)!important;
}

/* KPI cards */
#entityInformationSection .stat,
#entityInformationSection .stats .stat{
  background:rgba(11,44,32,.34)!important;
  border:1px solid rgba(184,230,32,.18)!important;
  box-shadow:inset 0 1px 0 rgba(244,243,237,.05)!important;
}
#entityInformationSection .stat b{
  color:var(--ag-lime)!important;
}
#entityInformationSection .stat span{
  color:var(--ag-silver)!important;
}

/* Right detail area: remove all white/blue legacy panels. */
#entityInformationSection #agworldV2FarmDetailHost{
  background:rgba(11,44,32,.24)!important;
}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-panel{
  color:var(--ag-warm-white)!important;
}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-header{
  border-bottom-color:rgba(217,218,213,.16)!important;
}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-entity-type{
  color:var(--ag-lime)!important;
}
#entityInformationSection #agworldV2FarmDetailHost h2{
  color:var(--ag-warm-white)!important;
}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-status{
  color:var(--ag-forest)!important;
  background:var(--ag-lime)!important;
}

/* Tabs are floating cards on the same dark command surface. */
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs{
  background:rgba(11,44,32,.30)!important;
  border-color:rgba(217,218,213,.14)!important;
}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button{
  background:rgba(244,243,237,.05)!important;
  color:var(--ag-silver)!important;
  border:1px solid rgba(217,218,213,.12)!important;
}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button:hover{
  color:var(--ag-lime)!important;
  border-color:rgba(184,230,32,.45)!important;
}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button.is-active{
  background:var(--ag-growth)!important;
  color:var(--ag-warm-white)!important;
  border-color:var(--ag-lime)!important;
  box-shadow:0 0 0 1px rgba(184,230,32,.16)!important;
}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button[data-tab]{
  border-bottom-color:rgba(184,230,32,.34)!important;
}

/* Active content becomes a proper dark floating card, never white. */
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content{
  background:rgba(11,44,32,.42)!important;
  color:var(--ag-warm-white)!important;
  border-color:rgba(217,218,213,.15)!important;
  box-shadow:inset 0 1px 0 rgba(244,243,237,.05)!important;
}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content *,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content p,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content span,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content small{
  border-color:rgba(217,218,213,.14)!important;
}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content h1,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content h2,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content h3,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content strong{
  color:var(--ag-warm-white)!important;
}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content p,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content span,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content small{
  color:var(--ag-silver)!important;
}

/* Action rail */
#entityInformationSection #farmActions{
  background:rgba(11,44,32,.34)!important;
  border-top-color:rgba(217,218,213,.16)!important;
}
#entityInformationSection #farmActions button{
  background:rgba(244,243,237,.05)!important;
  color:var(--ag-warm-white)!important;
  border-color:rgba(217,218,213,.22)!important;
  box-shadow:none!important;
}
#entityInformationSection #farmActions button:hover{
  border-color:var(--ag-lime)!important;
  color:var(--ag-lime)!important;
}
#entityInformationSection #farmActions .save-farm,
#entityInformationSection #farmActions button:first-child{
  background:var(--ag-growth)!important;
  color:var(--ag-warm-white)!important;
  border-color:var(--ag-lime)!important;
}

/* Shared command-center intelligence cards */
#entityInformationSection .agworld-company-entity-card,
#entityInformationSection .company-command-skills-pane,
#entityInformationSection .company-command-stats-pane,
#entityInformationSection .company-command-kpis>div,
#entityInformationSection .company-skill-chart{
  background:rgba(11,44,32,.36)!important;
  color:var(--ag-warm-white)!important;
  border-color:rgba(184,230,32,.18)!important;
}
#entityInformationSection .company-command-pane-title span,
#entityInformationSection .company-command-stats-pane span{
  color:var(--ag-silver)!important;
}
#entityInformationSection .company-command-pane-title b,
#entityInformationSection .company-command-kpis b,
#entityInformationSection .company-stats-summary b{
  color:var(--ag-lime)!important;
}
#entityInformationSection .company-kpi-icon{
  background:rgba(184,230,32,.12)!important;
  color:var(--ag-lime)!important;
  border-color:rgba(184,230,32,.28)!important;
}

/* Company radar uses exactly the same green intelligence language. */
#entityInformationSection .company-skill-chart .ag-radar-grid polygon{
  stroke:rgba(184,230,32,.46)!important;
  fill:none!important;
}
#entityInformationSection .company-skill-chart .ag-radar-axes line{
  stroke:rgba(217,218,213,.28)!important;
}
#entityInformationSection .company-skill-chart .ag-radar-fill{
  fill:rgba(184,230,32,.18)!important;
}
#entityInformationSection .company-skill-chart .ag-radar-outline{
  stroke:var(--ag-lime)!important;
}
#entityInformationSection .company-skill-chart .ag-radar-points circle{
  fill:var(--ag-lime)!important;
  stroke:var(--ag-growth)!important;
}
#entityInformationSection .company-skill-chart .ag-radar-center{
  fill:var(--ag-lime)!important;
  stroke:var(--ag-warm-white)!important;
}
#entityInformationSection .company-skill-chart .ag-radar-labels text{
  fill:var(--ag-warm-white)!important;
  stroke:var(--ag-forest)!important;
}

/* Territory Gold is reserved for achievement/territory emphasis only. */
#entityInformationSection .territory-gold,
#entityInformationSection .award-gold{
  color:var(--ag-gold)!important;
}
`;
  document.head.appendChild(style);
})();