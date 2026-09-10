/* AG WORLD — Command Center + Territory Stats surface unification v2
   Loaded last. Matches the lighter teal intelligence treatment established by
   the approved My Missions / Skill Profile surfaces. */
(()=>{
  const id='agworld-command-territory-surface-v2';
  document.getElementById(id)?.remove();
  const style=document.createElement('style');
  style.id=id;
  style.textContent=`
:root{
  --ag-surface-teal-1:#214b52;
  --ag-surface-teal-2:#173c45;
  --ag-surface-teal-3:#102f38;
  --ag-surface-deep:#0b2c20;
  --ag-lime:#B8E620;
  --ag-growth:#0D6A38;
  --ag-silver:#D9DAD5;
  --ag-warm-white:#F4F3ED;
}

/* =========================================================
   TERRITORY STATS — remove the black slab and use the same
   lighter teal intelligence surface as the Skill Profile.
   ========================================================= */
#territoryStatsDrawer,
#territoryStatsDrawerContent{
  background:transparent!important;
  box-shadow:none!important;
}

#territoryInfoPanel{
  background:
    radial-gradient(circle at 84% 8%,rgba(184,230,32,.13),transparent 31%),
    radial-gradient(circle at 8% 100%,rgba(33,75,82,.34),transparent 52%),
    linear-gradient(145deg,var(--ag-surface-teal-1) 0%,var(--ag-surface-teal-2) 58%,var(--ag-surface-teal-3) 100%)!important;
  border:1px solid rgba(184,230,32,.32)!important;
  border-radius:14px!important;
  box-shadow:0 14px 30px rgba(11,44,32,.22),inset 0 1px 0 rgba(244,243,237,.12)!important;
  color:var(--ag-warm-white)!important;
}

#territoryInfoPanel:before{
  height:3px!important;
  background:linear-gradient(90deg,var(--ag-lime),var(--ag-growth),transparent)!important;
}

#territoryInfoPanel .territory-info-header{
  border-bottom-color:rgba(217,218,213,.20)!important;
}
#territoryInfoPanel .territory-info-level{
  color:var(--ag-silver)!important;
}
#territoryInfoPanel .territory-info-name,
#territoryInfoPanel .territory-info-grid strong{
  color:var(--ag-warm-white)!important;
}
#territoryInfoPanel .territory-info-close{
  color:var(--ag-silver)!important;
}
#territoryInfoPanel .territory-info-control-value{
  color:var(--ag-lime)!important;
  text-shadow:0 0 12px rgba(184,230,32,.16)!important;
}
#territoryInfoPanel .territory-info-control-title,
#territoryInfoPanel .territory-info-legend,
#territoryInfoPanel .territory-info-grid span,
#territoryInfoPanel .territory-info-footer{
  color:var(--ag-silver)!important;
}
#territoryInfoPanel .territory-info-grid div{
  background:rgba(244,243,237,.055)!important;
  border-color:rgba(217,218,213,.16)!important;
  box-shadow:inset 0 1px 0 rgba(244,243,237,.06)!important;
}
#territoryInfoPanel .territory-info-progress{
  background:rgba(11,44,32,.42)!important;
}
#territoryInfoPanel .territory-info-footer{
  border-top-color:rgba(217,218,213,.16)!important;
}

#territoryStatsToggle{
  background:
    linear-gradient(145deg,var(--ag-surface-teal-1),var(--ag-surface-teal-2) 62%,var(--ag-surface-teal-3))!important;
  border-color:rgba(184,230,32,.30)!important;
  box-shadow:0 10px 24px rgba(11,44,32,.20),inset 0 1px 0 rgba(244,243,237,.10)!important;
}
#territoryStatsToggle:before{
  background:linear-gradient(var(--ag-lime),var(--ag-growth),transparent)!important;
}
#territoryStatsToggle .ag-territory-toggle-label{
  color:var(--ag-warm-white)!important;
}
#territoryStatsToggle .ag-territory-toggle-arrow{
  color:var(--ag-lime)!important;
}

/* =========================================================
   COMMAND CENTER — one unified lighter teal intelligence
   language. The heading, tab strip, cards and radar must no
   longer fall back to the older near-black command theme.
   ========================================================= */
#entityInformationSection{
  background:var(--ag-warm-white)!important;
  border-top-color:var(--ag-silver)!important;
}

#entityCommandCentreHeading{
  background:var(--ag-warm-white)!important;
  color:var(--ag-surface-teal-2)!important;
  border-bottom-color:var(--ag-silver)!important;
}
#entityCommandCentreHeading::before{
  background:linear-gradient(90deg,var(--ag-lime),var(--ag-growth),transparent)!important;
}
#entityCommandCentreHeading .agworld-command-center-label{
  color:var(--ag-surface-teal-2)!important;
}
#entityCommandCentreHeading .agworld-command-center-live{
  background:rgba(13,106,56,.10)!important;
  color:var(--ag-growth)!important;
  border-color:rgba(13,106,56,.24)!important;
}

/* The command surface itself: lighter teal, never near-black. */
#entityInformationSection .farm-card,
#entityInformationSection #farmCard,
#entityInformationSection .agworld-entity-command-interface,
#entityInformationSection #agworldV2FarmDetailHost,
#entityInformationSection .company-command-skills-pane,
#entityInformationSection .company-command-stats-pane{
  background:
    radial-gradient(circle at 84% 8%,rgba(184,230,32,.10),transparent 32%),
    linear-gradient(145deg,var(--ag-surface-teal-1) 0%,var(--ag-surface-teal-2) 62%,var(--ag-surface-teal-3) 100%)!important;
  color:var(--ag-warm-white)!important;
  border-color:rgba(184,230,32,.26)!important;
  box-shadow:0 10px 24px rgba(11,44,32,.18),inset 0 1px 0 rgba(244,243,237,.10)!important;
}

/* Nested surfaces remain part of the same teal card instead of
   becoming almost-black blocks. */
#entityInformationSection .farm-extra,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-content,
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs,
#entityInformationSection #farmActions,
#entityInformationSection .stat,
#entityInformationSection .stats .stat,
#entityInformationSection .company-command-kpis>div,
#entityInformationSection .company-skill-chart{
  background:rgba(33,75,82,.38)!important;
  border-color:rgba(217,218,213,.15)!important;
  box-shadow:inset 0 1px 0 rgba(244,243,237,.06)!important;
}

/* Top command tabs: teal cards, not dark/black pills. */
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button{
  background:rgba(244,243,237,.07)!important;
  color:var(--ag-silver)!important;
  border-color:rgba(217,218,213,.14)!important;
}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button.is-active{
  background:linear-gradient(145deg,rgba(13,106,56,.92),rgba(33,75,82,.94))!important;
  color:var(--ag-warm-white)!important;
  border-color:rgba(184,230,32,.72)!important;
  box-shadow:0 0 0 1px rgba(184,230,32,.12),inset 0 1px 0 rgba(244,243,237,.10)!important;
}
#entityInformationSection #agworldV2FarmDetailHost .agworld-v2-detail-tabs button:hover{
  background:rgba(184,230,32,.10)!important;
  color:var(--ag-lime)!important;
  border-color:rgba(184,230,32,.42)!important;
}

/* Typography and KPI hierarchy. */
#entityInformationSection #farmName,
#entityInformationSection h1,
#entityInformationSection h2,
#entityInformationSection h3,
#entityInformationSection strong,
#entityInformationSection .farm-extra b{
  color:var(--ag-warm-white)!important;
}
#entityInformationSection #farmMeta,
#entityInformationSection .farm-extra span,
#entityInformationSection p,
#entityInformationSection small,
#entityInformationSection .stat span,
#entityInformationSection .company-command-pane-title span,
#entityInformationSection .company-command-stats-pane span{
  color:var(--ag-silver)!important;
}
#entityInformationSection .stat b,
#entityInformationSection .company-command-pane-title b,
#entityInformationSection .company-command-kpis b,
#entityInformationSection .company-stats-summary b{
  color:var(--ag-lime)!important;
}

/* Radar: same lighter teal card with the Skill Profile's lime intelligence. */
#entityInformationSection .company-skill-chart{
  background:
    radial-gradient(circle at 50% 48%,rgba(184,230,32,.10),transparent 42%),
    rgba(33,75,82,.28)!important;
}
#entityInformationSection .company-skill-chart .ag-radar-grid polygon{
  stroke:rgba(184,230,32,.42)!important;
}
#entityInformationSection .company-skill-chart .ag-radar-axes line{
  stroke:rgba(217,218,213,.28)!important;
}
#entityInformationSection .company-skill-chart .ag-radar-fill{
  fill:rgba(184,230,32,.16)!important;
}
#entityInformationSection .company-skill-chart .ag-radar-outline{
  stroke:var(--ag-lime)!important;
}

/* Action controls stay light enough to belong to the teal system. */
#entityInformationSection #farmActions button{
  background:rgba(244,243,237,.07)!important;
  color:var(--ag-warm-white)!important;
  border-color:rgba(217,218,213,.20)!important;
}
#entityInformationSection #farmActions button:hover{
  background:rgba(184,230,32,.10)!important;
  color:var(--ag-lime)!important;
  border-color:rgba(184,230,32,.48)!important;
}
`;
  document.head.appendChild(style);
})();