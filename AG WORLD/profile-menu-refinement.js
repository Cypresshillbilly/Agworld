/* AG WORLD — Profile menu. Profile Summary ALWAYS stays to the right of the avatar. */
(()=>{
const LOGO_SRC='brand/logos/PNG_Transparent/AgWorld_Primary_Horizontal.png?v=primary-horizontal-readable-v1';
const STYLE_ID='ag-profile-menu-refinement-style';
const css=`
:root{--ag-hero-header-h:170px;--ag-logo-fit-width:142px;}
/* Final layout contract:
   SIDEBAR: official AG World logo → navigation → logout.
   MISSIONS: player avatar/profile + level/XP → My Missions / Mission Control. */

/* Reserve enough horizontal space for the official logo. */
body.ag-profile-mode .app-shell,.app-shell{
  grid-template-columns:154px 145px minmax(0,1fr)!important;
}
body.ag-profile-mode .sidebar,.app-shell .sidebar{
  padding:6px 5px 5px!important;box-sizing:border-box!important;
  overflow:hidden!important;display:flex!important;flex-direction:column!important;
  width:154px!important;min-width:154px!important;
}
body.ag-profile-mode .sidebar .menu-user,.app-shell .sidebar .menu-user{display:none!important}
body.ag-profile-mode .sidebar .profile,.app-shell .sidebar .profile{display:none!important}

/* Official AG World logo owns the complete top header band of the sidebar.
   Its bottom edge is synchronised to the bottom of the My Missions player card,
   so navigation can never climb into or clip the logo/tagline artwork. */
body.ag-profile-mode .sidebar .brand,.app-shell .sidebar .brand{
  order:1!important;display:flex!important;align-items:center!important;justify-content:center!important;
  width:100%!important;height:var(--ag-hero-header-h)!important;
  min-height:var(--ag-hero-header-h)!important;
  flex:0 0 var(--ag-hero-header-h)!important;
  margin:0!important;padding:6px 0!important;box-sizing:border-box!important;overflow:hidden!important;
}
body.ag-profile-mode .sidebar .brand .brand-logo,.app-shell .sidebar .brand .brand-logo{
  display:block!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;
  object-fit:contain!important;object-position:center center!important;width:var(--ag-logo-fit-width)!important;height:auto!important;
  filter:drop-shadow(0 3px 5px rgba(0,0,0,.28))!important;
}

/* Mission profile is deliberately above the eyebrow and My Missions heading. */
body.ag-profile-mode .missions .ag-player-mission-profile,.app-shell .missions .ag-player-mission-profile{
  display:grid!important;visibility:visible!important;opacity:1!important;
  grid-template-columns:96px minmax(0,1fr)!important;align-items:center!important;column-gap:16px!important;
  width:calc(100% - 12px)!important;height:var(--ag-hero-header-h)!important;min-height:var(--ag-hero-header-h)!important;
  margin:0 6px 10px!important;padding:18px 16px!important;
  position:relative!important;z-index:50!important;box-sizing:border-box!important;overflow:hidden!important;
  border:1px solid rgba(93,128,141,.55)!important;border-radius:10px!important;
  background:linear-gradient(145deg,rgba(17,39,49,.96),rgba(8,22,29,.98))!important;
  box-shadow:0 7px 15px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.07),inset 0 -2px 5px rgba(0,0,0,.22)!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-avatar,.app-shell .missions .ag-player-mission-profile .ag-player-avatar{
  display:flex!important;align-items:center!important;justify-content:center!important;
  width:92px!important;height:92px!important;min-width:92px!important;min-height:92px!important;border-radius:50%!important;
  background:
    radial-gradient(circle at 35% 28%,#7c99a5 0%,#3d5b68 22%,#1a3541 52%,#0b1e27 76%)!important;
  border:3px solid #9eb1b8!important;outline:2px solid rgba(178,220,71,.52)!important;outline-offset:2px!important;
  color:#fff!important;font:900 38px Arial,sans-serif!important;letter-spacing:-1px!important;
  text-shadow:0 2px 4px rgba(0,0,0,.65)!important;box-sizing:border-box!important;
  box-shadow:0 7px 12px rgba(0,0,0,.38),inset 0 2px 4px rgba(255,255,255,.24),inset 0 -5px 9px rgba(0,0,0,.35)!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-summary,.app-shell .missions .ag-player-mission-profile .ag-player-summary{
  display:flex!important;visibility:visible!important;opacity:1!important;flex-direction:column!important;
  justify-content:center!important;align-items:stretch!important;min-width:0!important;overflow:hidden!important;text-align:left!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-name,.app-shell .missions .ag-player-mission-profile .ag-player-name{
  display:block!important;width:100%!important;overflow:hidden!important;text-overflow:ellipsis!important;
  color:#f1f6f7!important;font:900 16px/1.15 Arial,sans-serif!important;letter-spacing:.35px!important;white-space:nowrap!important;
  text-shadow:0 1px 2px rgba(0,0,0,.45)!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-role,
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-level,
.app-shell .missions .ag-player-mission-profile .ag-player-role,
.app-shell .missions .ag-player-mission-profile .ag-player-level{
  display:block!important;color:#9fb1b8!important;font:800 11px/1.45 Arial,sans-serif!important;letter-spacing:.22px!important;white-space:nowrap!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-xp-track,.app-shell .missions .ag-player-mission-profile .ag-player-xp-track{
  display:block!important;width:100%!important;height:8px!important;margin:6px 0 4px!important;border-radius:999px!important;overflow:hidden!important;
  background:#0a171d!important;border:1px solid rgba(167,199,208,.28)!important;box-sizing:border-box!important;
  box-shadow:inset 0 2px 3px rgba(0,0,0,.5),0 1px 0 rgba(255,255,255,.05)!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-xp-fill,.app-shell .missions .ag-player-mission-profile .ag-player-xp-fill{
  display:block!important;height:100%!important;width:0!important;border-radius:inherit!important;
  background:linear-gradient(90deg,#6f9f2a,#c6e85b)!important;box-shadow:0 0 8px rgba(190,229,80,.48),inset 0 1px 0 rgba(255,255,255,.38)!important;
}
body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-xp-text,.app-shell .missions .ag-player-mission-profile .ag-player-xp-text{
  display:flex!important;justify-content:space-between!important;gap:6px!important;color:#b8c6cb!important;font:800 7.2px/1 Arial,sans-serif!important;white-space:nowrap!important;
}
/* Navigation occupies only the space below the fixed logo.  The logo can never be compressed by menu items. */
body.ag-profile-mode .sidebar .nav,.app-shell .sidebar .nav{
  order:2!important;display:flex!important;flex-direction:column!important;gap:1px!important;margin:0!important;padding:0 1px!important;
  flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;
}
body.ag-profile-mode .sidebar .nav button,.app-shell .sidebar .nav button{
  width:100%!important;min-height:23px!important;height:23px!important;flex:0 0 23px!important;
  margin:0!important;padding:4px 7px!important;font:700 8px/1 Arial,sans-serif!important;
  letter-spacing:.08px!important;white-space:nowrap!important;box-sizing:border-box!important;
}
body.ag-profile-mode .sidebar .nav button .icon,.app-shell .sidebar .nav button .icon{
  transform:scale(.82)!important;transform-origin:center!important;
}
body.ag-profile-mode .sidebar button[id*="logout"],.app-shell .sidebar button[id*="logout"],
body.ag-profile-mode .sidebar .logout,.app-shell .sidebar .logout{
  order:3!important;flex:0 0 auto!important;min-height:18px!important;height:18px!important;
}
/* Keep the map's command tools clear of the dedicated Developer Mode corner. */
body.ag-profile-mode .map-area .map-header,.app-shell .map-area .map-header{padding-right:118px!important}
body.ag-profile-mode .map-area .map-tools,.app-shell .map-area .map-tools{justify-content:flex-start!important;right:auto!important;max-width:calc(100% - 118px)!important}
#developerModeBtn{position:absolute!important;top:10px!important;right:12px!important;z-index:1250!important;min-width:94px!important;height:24px!important;padding:0 9px!important;border-radius:6px!important;font-size:7px!important;white-space:nowrap!important}
body.ag-profile-mode .map-area .ag-world-map-logo,.app-shell .map-area .ag-world-map-logo{display:none!important}
/* The mission card is the only player profile shown on this screen. */
.map-area .map-player-profile,.map-area .player-profile,.map-area .map-user-profile,.map-area .player-avatar-control,.map-area [id*="mapPlayerProfile"],.map-area [id*="mapUserProfile"],.map-area [data-player],.map-area [data-player-id],.map-area [data-user-profile],.map-area [aria-label*="Nico" i],.map-area [title*="Nico" i]{display:none!important}
body.ag-profile-mode .bottom{height:23%!important}

@media(min-width:1500px){
  body.ag-profile-mode .app-shell{grid-template-columns:210px 158px minmax(0,1fr)!important}.app-shell{grid-template-columns:210px 158px minmax(0,1fr)!important}
  body.ag-profile-mode .sidebar,.app-shell .sidebar{width:210px!important;min-width:210px!important}
  body.ag-profile-mode .sidebar .brand,.app-shell .sidebar .brand{height:118px!important;min-height:118px!important;flex-basis:118px!important}
  body.ag-profile-mode .sidebar .brand .brand-logo,.app-shell .sidebar .brand .brand-logo{height:110px!important}
  body.ag-profile-mode .sidebar .nav button,.app-shell .sidebar .nav button{height:24px!important;min-height:24px!important;flex-basis:24px!important;font-size:8.4px!important}
  body.ag-profile-mode .missions .ag-player-mission-profile,.app-shell .missions .ag-player-mission-profile{min-height:108px!important;grid-template-columns:74px minmax(0,1fr)!important}
  body.ag-profile-mode .missions .ag-player-mission-profile .ag-player-avatar,.app-shell .missions .ag-player-mission-profile .ag-player-avatar{width:72px!important;height:72px!important;min-width:72px!important;min-height:72px!important;font-size:29px!important}
/* === AGWORLD HERO IDENTITY CARD — FINAL VISUAL PASS === */
html body.ag-profile-mode .sidebar .brand,html body.ag-game-mode .sidebar .brand,html body.ag-premium-mode .sidebar .brand,html body.ag-profile-mode .app-shell .sidebar .brand{
  height:var(--ag-hero-header-h)!important;min-height:var(--ag-hero-header-h)!important;flex-basis:var(--ag-hero-header-h)!important;
  margin:0!important;padding:8px 6px 10px!important;overflow:visible!important;background:none!important;background-image:none!important;position:relative!important;z-index:10!important;
}
html body.ag-profile-mode .sidebar .brand .brand-logo,html body.ag-game-mode .sidebar .brand .brand-logo,html body.ag-premium-mode .sidebar .brand .brand-logo,html body.ag-profile-mode .app-shell .sidebar .brand .brand-logo{
  display:block!important;width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;
  object-fit:contain!important;object-position:center center!important;visibility:visible!important;opacity:1!important;clip-path:none!important;transform:none!important;
  filter:drop-shadow(0 5px 10px rgba(0,0,0,.32))!important;
}
html body.ag-profile-mode .missions .ag-player-mission-profile,html body.ag-game-mode .missions .ag-player-mission-profile,html body.ag-profile-mode .app-shell .missions .ag-player-mission-profile{
  display:block!important;width:calc(100% - 12px)!important;height:var(--ag-hero-header-h)!important;min-height:var(--ag-hero-header-h)!important;margin:0 6px 10px!important;padding:8px!important;
  overflow:visible!important;border:1px solid rgba(170,207,214,.42)!important;border-radius:16px!important;
  background:radial-gradient(circle at 87% 10%,rgba(189,228,77,.17),transparent 34%),radial-gradient(circle at 8% 92%,rgba(52,166,181,.18),transparent 38%),linear-gradient(145deg,#193943 0%,#102933 48%,#0a1d26 100%)!important;
  box-shadow:0 14px 26px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.10),inset 0 -1px 0 rgba(0,0,0,.28)!important;position:relative!important;isolation:isolate!important;
}
html body.ag-profile-mode .missions .ag-player-mission-profile:before,html body.ag-game-mode .missions .ag-player-mission-profile:before{content:""!important;position:absolute!important;inset:5px!important;border-radius:12px!important;border:1px solid rgba(188,231,90,.12)!important;pointer-events:none!important;z-index:-1!important}
html body.ag-profile-mode .missions .ag-player-identity,html body.ag-game-mode .missions .ag-player-identity{display:grid!important;grid-template-columns:74px minmax(0,1fr)!important;gap:10px!important;align-items:center!important;width:100%!important;height:100%!important}
html body.ag-profile-mode .missions .ag-player-avatar-frame,html body.ag-game-mode .missions .ag-player-avatar-frame{width:70px!important;height:70px!important;align-self:center!important;justify-self:center!important;border-radius:50%!important;padding:4px!important;box-sizing:border-box!important;position:relative!important;background:linear-gradient(145deg,#d7f06a,#6c9b32 38%,#4ab2bb 76%,#1b3742)!important;box-shadow:0 0 0 2px rgba(7,20,26,.8),0 8px 18px rgba(0,0,0,.34),0 0 18px rgba(183,225,81,.18)!important}
html body.ag-profile-mode .missions .ag-player-avatar,html body.ag-game-mode .missions .ag-player-avatar{width:100%!important;height:100%!important;min-width:0!important;min-height:0!important;border:0!important;outline:0!important;border-radius:50%!important;background:radial-gradient(circle at 35% 28%,#87a9b2 0%,#426773 28%,#1a3642 58%,#091b24 82%)!important;color:#f7fbf0!important;font:900 32px/1 Arial,sans-serif!important;letter-spacing:-1px!important;text-shadow:0 3px 8px rgba(0,0,0,.72)!important}
html body.ag-profile-mode .missions .ag-player-online-dot,html body.ag-game-mode .missions .ag-player-online-dot{position:absolute!important;right:2px!important;bottom:4px!important;width:13px!important;height:13px!important;border-radius:50%!important;background:#bde950!important;border:2px solid #10262f!important;box-shadow:0 0 10px rgba(189,233,80,.75)!important}
html body.ag-profile-mode .missions .ag-player-summary,html body.ag-game-mode .missions .ag-player-summary{display:flex!important;min-width:0!important;height:100%!important;justify-content:center!important;gap:3px!important}
html body.ag-profile-mode .missions .ag-player-kicker,html body.ag-game-mode .missions .ag-player-kicker{display:block!important;color:#c5ea68!important;font:900 7px/1 Arial,sans-serif!important;letter-spacing:1.35px!important}
html body.ag-profile-mode .missions .ag-player-name,html body.ag-game-mode .missions .ag-player-name{display:block!important;color:#f7fbf8!important;font:900 15px/1.05 Arial,sans-serif!important;letter-spacing:.55px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
html body.ag-profile-mode .missions .ag-player-role,html body.ag-game-mode .missions .ag-player-role{display:block!important;color:#8fb0b8!important;font:800 6.5px/1.15 Arial,sans-serif!important;letter-spacing:.75px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
html body.ag-profile-mode .missions .ag-player-meta,html body.ag-game-mode .missions .ag-player-meta{display:flex!important;gap:5px!important;align-items:center!important}
html body.ag-profile-mode .missions .ag-player-level,html body.ag-game-mode .missions .ag-player-level,html body.ag-profile-mode .missions .ag-player-chapter,html body.ag-game-mode .missions .ag-player-chapter{display:inline-flex!important;width:auto!important;align-items:center!important;padding:3px 6px!important;border-radius:999px!important;font:900 7px/1 Arial,sans-serif!important;letter-spacing:.55px!important;white-space:nowrap!important}
html body.ag-profile-mode .missions .ag-player-level,html body.ag-game-mode .missions .ag-player-level{color:#11251c!important;background:#c4e85a!important;box-shadow:0 2px 6px rgba(190,232,90,.18)!important}
html body.ag-profile-mode .missions .ag-player-chapter,html body.ag-game-mode .missions .ag-player-chapter{color:#b9d9df!important;background:rgba(98,158,171,.18)!important;border:1px solid rgba(117,183,196,.25)!important}
html body.ag-profile-mode .missions .ag-player-xp-label,html body.ag-game-mode .missions .ag-player-xp-label{display:flex!important;justify-content:space-between!important;align-items:center!important;color:#8ea8af!important;font:900 6px/1 Arial,sans-serif!important;letter-spacing:.7px!important}
html body.ag-profile-mode .missions .ag-player-xp-label b,html body.ag-game-mode .missions .ag-player-xp-label b{color:#d7f27a!important;font-size:7px!important}
html body.ag-profile-mode .missions .ag-player-xp-track,html body.ag-game-mode .missions .ag-player-xp-track{display:block!important;width:100%!important;height:7px!important;margin:0!important;border:1px solid rgba(167,203,210,.22)!important;background:#07141a!important;box-shadow:inset 0 2px 4px rgba(0,0,0,.62)!important}
html body.ag-profile-mode .missions .ag-player-xp-fill,html body.ag-game-mode .missions .ag-player-xp-fill{background:linear-gradient(90deg,#6e9e2f,#c8ee5d 65%,#e4f7a1)!important;box-shadow:0 0 12px rgba(196,236,90,.52)!important}
html body.ag-profile-mode .missions .ag-player-xp-text,html body.ag-game-mode .missions .ag-player-xp-text{display:flex!important;justify-content:space-between!important;gap:5px!important;color:#7f9aa2!important;font:800 5.8px/1 Arial,sans-serif!important;letter-spacing:.25px!important}
html body.ag-profile-mode .missions .ag-player-xp-text b,html body.ag-game-mode .missions .ag-player-xp-text b{color:#a9bdc3!important;font-weight:800!important}

/* === AGWORLD MISSION BAR — PREMIUM DRAWER + BRAND SURFACES === */
html body.ag-profile-mode .missions{
  background:radial-gradient(circle at 92% 6%,rgba(189,233,80,.13),transparent 26%),radial-gradient(circle at 8% 78%,rgba(67,174,185,.16),transparent 35%),linear-gradient(155deg,#193943 0%,#112d37 48%,#0b2029 100%)!important;
  border-right:1px solid rgba(138,181,190,.32)!important;
  box-shadow:12px 0 32px rgba(3,14,18,.18),inset -1px 0 rgba(255,255,255,.06)!important;
  overflow:visible!important;
  transition:transform .34s cubic-bezier(.22,.72,.18,1)!important;
}
html body.ag-profile-mode .missions:before{
  content:"MY MISSIONS  •  MISSION CONTROL"!important;
  position:relative!important;z-index:2!important;
  display:block!important;margin:0!important;padding:15px 16px 11px!important;
  color:#eaf3ef!important;border-bottom:1px solid rgba(184,219,224,.16)!important;
  background:linear-gradient(180deg,rgba(6,20,27,.32),rgba(6,20,27,0))!important;
  font:900 10px/1 Arial,sans-serif!important;letter-spacing:1.25px!important;
  cursor:pointer!important;
}
html body.ag-profile-mode .missions.ag-missions-collapsed{transform:translateX(calc(-100% + 30px))!important;box-shadow:none!important}
html body.ag-profile-mode .missions .ag-missions-drawer-handle{
  position:absolute!important;right:-34px!important;top:184px!important;width:34px!important;height:72px!important;
  border:1px solid rgba(161,204,210,.34)!important;border-left:0!important;border-radius:0 12px 12px 0!important;
  background:linear-gradient(180deg,#173842,#0b222b)!important;color:#d8f4e2!important;
  box-shadow:8px 8px 20px rgba(0,0,0,.22)!important;display:flex!important;align-items:center!important;justify-content:center!important;
  cursor:pointer!important;z-index:60!important;font:900 9px/1 Arial,sans-serif!important;letter-spacing:.6px!important;
}
html body.ag-profile-mode .missions .ag-missions-drawer-handle span{display:block!important;transform:rotate(-90deg)!important;white-space:nowrap!important}
html body.ag-profile-mode .missions .ag-missions-drawer-handle:after{content:"‹"!important;position:absolute!important;bottom:7px!important;font-size:16px!important;color:#bfe85b!important;transform:none!important}
html body.ag-profile-mode .missions.ag-missions-collapsed .ag-missions-drawer-handle:after{content:"›"!important}

/* Premium player card sits naturally on the same mission-bar material. */
html body.ag-profile-mode .missions .ag-player-mission-profile{
  margin:10px 10px 11px!important;width:calc(100% - 20px)!important;
}

/* Skill profile: dark command card with AgWorld lime/teal radar treatment. */
html body.ag-profile-mode .missions #agMissionSkillProfile,
html body.ag-profile-mode .missions .ag-mission-skill-profile{
  margin:9px 10px 12px!important;padding:11px!important;border-radius:14px!important;
  background:linear-gradient(145deg,rgba(22,55,64,.98),rgba(10,29,37,.98))!important;
  border:1px solid rgba(132,190,197,.28)!important;
  box-shadow:0 12px 22px rgba(0,0,0,.20),inset 0 1px 0 rgba(255,255,255,.07)!important;
}
html body.ag-profile-mode .missions .ag-mission-skill-head{
  display:flex!important;align-items:flex-start!important;justify-content:space-between!important;
  padding-bottom:8px!important;margin-bottom:8px!important;border-bottom:1px solid rgba(184,220,224,.13)!important;
}
html body.ag-profile-mode .missions .ag-mission-skill-head span{
  display:block!important;color:#91b9c0!important;font:900 6.5px/1 Arial,sans-serif!important;letter-spacing:1.05px!important;
}
html body.ag-profile-mode .missions .ag-mission-skill-head b{
  display:block!important;margin-top:4px!important;color:#f4fbf5!important;font:900 12px/1 Arial,sans-serif!important;letter-spacing:.55px!important;
}
html body.ag-profile-mode .missions .ag-mission-skill-head>strong{
  min-width:32px!important;height:32px!important;border-radius:10px!important;display:flex!important;align-items:center!important;justify-content:center!important;
  color:#dff58a!important;background:linear-gradient(145deg,rgba(190,232,90,.18),rgba(79,142,57,.18))!important;border:1px solid rgba(190,232,90,.28)!important;
  font:900 10px/1 Arial,sans-serif!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08)!important;
}
html body.ag-profile-mode .missions .ag-mission-skill-body{display:grid!important;grid-template-columns:1.05fr .95fr!important;gap:8px!important;align-items:center!important}
html body.ag-profile-mode .missions .ag-mission-skill-chart{
  border-radius:12px!important;padding:5px!important;background:radial-gradient(circle at center,rgba(80,157,170,.13),rgba(5,18,24,.14))!important;
  border:1px solid rgba(129,190,199,.12)!important;
}
html body.ag-profile-mode .missions .ag-mission-skill-chart svg{width:100%!important;height:auto!important;filter:drop-shadow(0 6px 10px rgba(0,0,0,.32))!important}
html body.ag-profile-mode .missions .ag-mission-skill-list{display:flex!important;flex-direction:column!important;gap:4px!important}
html body.ag-profile-mode .missions .ag-mission-skill-list>div{
  display:flex!important;align-items:center!important;justify-content:space-between!important;gap:5px!important;padding:5px 6px!important;
  border-radius:7px!important;background:rgba(255,255,255,.045)!important;border:1px solid rgba(173,216,221,.09)!important;
  color:#a9c2c8!important;font:800 5.8px/1 Arial,sans-serif!important;letter-spacing:.25px!important;
}
html body.ag-profile-mode .missions .ag-mission-skill-list>div b{color:#cbed6b!important;font:900 8px/1 Arial,sans-serif!important}

/* White mission cards float over the dark branded mission bar. */
html body.ag-profile-mode .missions .mission{
  position:relative!important;margin:9px 10px!important;padding:12px 11px 11px!important;border-radius:12px!important;
  background:linear-gradient(145deg,#ffffff 0%,#f5f8f7 68%,#edf3f2 100%)!important;
  border:1px solid rgba(203,218,219,.9)!important;
  box-shadow:0 10px 22px rgba(2,15,20,.18),inset 0 1px 0 #fff!important;
  overflow:hidden!important;transition:transform .18s ease,box-shadow .18s ease!important;
}
html body.ag-profile-mode .missions .mission:before{
  content:""!important;position:absolute!important;left:0!important;top:0!important;bottom:0!important;width:4px!important;
  background:linear-gradient(180deg,#c8ee5d,#5aaeb8)!important;
}
html body.ag-profile-mode .missions .mission:hover{transform:translateY(-2px)!important;box-shadow:0 14px 26px rgba(2,15,20,.25),inset 0 1px 0 #fff!important}
html body.ag-profile-mode .missions .mission .tag{color:#4f9c8e!important;font:900 7px/1 Arial,sans-serif!important;letter-spacing:1px!important}
html body.ag-profile-mode .missions .mission strong{color:#17323a!important;font:900 10px/1.2 Arial,sans-serif!important;padding-right:20px!important}
html body.ag-profile-mode .missions .mission p{color:#667b80!important;font:600 7px/1.42 Arial,sans-serif!important}
html body.ag-profile-mode .missions .mission .reward{
  display:inline-flex!important;align-items:center!important;padding:4px 7px!important;border-radius:999px!important;
  background:#edf6d6!important;color:#507f27!important;font:900 6.2px/1 Arial,sans-serif!important;
}
html body.ag-profile-mode .missions .mission:after{color:#b9d955!important;text-shadow:0 2px 5px rgba(0,0,0,.12)!important}

/* Stacked emblem: vertical artwork gets the full hero band and readable tagline. */
html body.ag-profile-mode .sidebar .brand,html body.ag-game-mode .sidebar .brand,html body.ag-premium-mode .sidebar .brand{
  padding:7px 9px 8px!important;background:radial-gradient(circle at 50% 18%,rgba(189,233,80,.10),transparent 46%)!important;
}
html body.ag-profile-mode .sidebar .brand .brand-logo,html body.ag-game-mode .sidebar .brand .brand-logo,html body.ag-premium-mode .sidebar .brand .brand-logo{
  object-fit:contain!important;object-position:center center!important;transform:scale(1.48)!important;
}

/* === AGWORLD ADVISOR BAY ===
   Replaces future locked mission cards. Five character portals live here and
   activate the shared map guide. */
html body.ag-profile-mode .missions #agAdvisorBay{
  position:relative!important;
  display:flex!important;flex-direction:column!important;
  margin:10px 10px 12px!important;padding:12px!important;
  min-height:132px!important;
  border-radius:14px!important;
  background:linear-gradient(145deg,#173c45,#102b36 64%,#0b2028)!important;
  border:1px solid rgba(100,178,113,.46)!important;
  box-shadow:0 12px 28px rgba(14,42,49,.18),inset 0 1px 0 rgba(255,255,255,.09),inset 0 0 0 1px rgba(176,210,198,.06)!important;
  overflow:hidden!important;
}
html body.ag-profile-mode .missions #agAdvisorBay:before{
  content:""!important;position:absolute!important;inset:0!important;
  background:radial-gradient(circle at 18% 0,rgba(194,233,93,.10),transparent 38%),linear-gradient(90deg,transparent,rgba(29,125,130,.06),transparent)!important;
  pointer-events:none!important;
}
html body.ag-profile-mode .ag-advisor-bay-head{
  position:relative!important;display:flex!important;align-items:center!important;justify-content:space-between!important;
  margin-bottom:9px!important;z-index:1!important;
}
html body.ag-profile-mode .ag-advisor-bay-head strong{color:#f7fbf8!important;font:900 9px/1 Arial,sans-serif!important;letter-spacing:1.05px!important}
html body.ag-profile-mode .ag-advisor-bay-head span{color:#a9cbc1!important;font:800 5.8px/1 Arial,sans-serif!important;letter-spacing:.7px!important}
html body.ag-profile-mode .ag-advisor-grid{
  position:relative!important;display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;
  gap:6px!important;z-index:1!important;
}
html body.ag-profile-mode .ag-advisor{
  position:relative!important;min-width:0!important;height:78px!important;padding:5px 2px 4px!important;
  border-radius:11px!important;border:1px solid rgba(176,210,198,.18)!important;
  background:linear-gradient(155deg,rgba(255,255,255,.075),rgba(4,20,26,.32))!important;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 7px 14px rgba(2,15,20,.18)!important;
  color:#eff7f3!important;cursor:pointer!important;overflow:hidden!important;
  display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-end!important;
  transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease!important;
}
html body.ag-profile-mode .ag-advisor:hover,html body.ag-profile-mode .ag-advisor.is-active{
  transform:translateY(-3px)!important;border-color:rgba(194,233,93,.72)!important;
  box-shadow:0 10px 20px rgba(4,18,23,.32),0 0 0 1px rgba(194,233,93,.14),inset 0 1px 0 rgba(255,255,255,.12)!important;
}
html body.ag-profile-mode .ag-advisor-icon{
  position:absolute!important;left:50%!important;top:5px!important;transform:translateX(-50%)!important;
  width:38px!important;height:46px!important;filter:drop-shadow(0 5px 6px rgba(0,0,0,.32))!important;
}
html body.ag-profile-mode .ag-advisor-icon .head{
  position:absolute!important;left:50%!important;top:1px!important;transform:translateX(-50%)!important;
  width:16px!important;height:17px!important;border-radius:48% 48% 45% 45%!important;
  background:linear-gradient(145deg,#d6a47f,#8c573f)!important;border:1px solid rgba(255,255,255,.15)!important;
}
html body.ag-profile-mode .ag-advisor-icon .hair{
  position:absolute!important;left:50%!important;top:0!important;transform:translateX(-50%)!important;
  width:18px!important;height:7px!important;border-radius:12px 12px 4px 4px!important;background:#111c1b!important;
}
html body.ag-profile-mode .ag-advisor-icon .body{
  position:absolute!important;left:50%!important;bottom:0!important;transform:translateX(-50%)!important;
  width:34px!important;height:29px!important;border-radius:12px 12px 5px 5px!important;
  background:linear-gradient(145deg,#275a45,#0b2b22)!important;border:1px solid rgba(194,233,93,.18)!important;
}
html body.ag-profile-mode .ag-advisor-icon .mark{
  position:absolute!important;left:50%!important;bottom:10px!important;transform:translateX(-50%)!important;
  color:#d9f276!important;font:900 8px/1 Arial,sans-serif!important;text-shadow:0 1px 3px rgba(0,0,0,.7)!important;
}
html body.ag-profile-mode .ag-advisor[data-advisor="compliance"] .body{background:linear-gradient(145deg,#1d4b58,#102934)!important}
html body.ag-profile-mode .ag-advisor[data-advisor="sales"] .body{background:linear-gradient(145deg,#41611f,#142916)!important}
html body.ag-profile-mode .ag-advisor[data-advisor="product"] .body{background:linear-gradient(145deg,#285a70,#112d3a)!important}
html body.ag-profile-mode .ag-advisor[data-advisor="operations"] .body{background:linear-gradient(145deg,#5c4d27,#292411)!important}
html body.ag-profile-mode .ag-advisor[data-advisor="technical"] .body{background:linear-gradient(145deg,#4c3970,#21182f)!important}
html body.ag-profile-mode .ag-advisor-label{
  position:relative!important;z-index:2!important;max-width:100%!important;
  color:#dbe9e4!important;font:900 5.7px/1.08 Arial,sans-serif!important;letter-spacing:.45px!important;
  text-align:center!important;white-space:normal!important;
}
html body.ag-profile-mode .ag-advisor.is-active .ag-advisor-label{color:#d9f276!important}

/* === PLAYER LANDING CONTRACT v2 ===
   One current/next mission stays visible. The Advisor Bay occupies the lower
   mission surface aligned with the Command Center rather than replacing missions. */
html body.ag-profile-mode .missions .mission{
  display:none!important;
}
html body.ag-profile-mode .missions .mission.ag-landing-mission{
  display:block!important;
  margin:10px 10px 9px!important;
}
html body.ag-profile-mode .missions{
  position:relative!important;
}
html body.ag-profile-mode .missions #agAdvisorBay{
  position:absolute!important;
  left:10px!important;right:10px!important;
  top:var(--ag-advisor-top,300px)!important;
  margin:0!important;
  min-height:86px!important;
  height:var(--ag-advisor-height,180px)!important;
  box-sizing:border-box!important;
  padding:10px!important;
  overflow:hidden!important;
  z-index:40!important;
}
html body.ag-profile-mode .missions .ag-advisor-bay-head{margin-bottom:5px!important}
html body.ag-profile-mode .missions .ag-advisor{
  height:54px!important;
  padding:3px 2px!important;
}
html body.ag-profile-mode .ag-advisor-icon{transform:translateX(-50%) scale(.82)!important;transform-origin:top center!important;top:2px!important}
html body.ag-profile-mode .ag-advisor-label{font-size:5.3px!important}

/* Full Missions command panel. */
#agMissionHub{
  position:fixed!important;inset:0!important;z-index:2200000000!important;
  display:none;align-items:center;justify-content:center;padding:28px;
  background:rgba(4,15,20,.66)!important;backdrop-filter:blur(7px)!important;
  box-sizing:border-box!important;
}
#agMissionHub.show{display:flex!important}
#agMissionHub .ag-mission-hub-card{
  width:min(900px,94vw)!important;max-height:min(760px,88vh)!important;
  overflow:hidden!important;border-radius:18px!important;
  background:linear-gradient(145deg,#173c45,#102b36 60%,#0a2029)!important;
  border:1px solid rgba(120,194,130,.46)!important;
  box-shadow:0 30px 90px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.1)!important;
  color:#edf7f1!important;
}
#agMissionHub .ag-mission-hub-head{
  display:flex!important;justify-content:space-between!important;align-items:flex-start!important;
  gap:18px!important;padding:22px 24px 16px!important;border-bottom:1px solid rgba(255,255,255,.1)!important;
}
#agMissionHub .ag-mission-hub-kicker{color:#c6e85b!important;font:900 8px/1 Arial,sans-serif!important;letter-spacing:1.4px!important}
#agMissionHub h2{margin:6px 0 0!important;color:#fff!important;font:900 24px/1 Arial,sans-serif!important;letter-spacing:.4px!important}
#agMissionHub .ag-mission-hub-close{
  width:34px!important;height:34px!important;border-radius:9px!important;border:1px solid rgba(255,255,255,.15)!important;
  background:rgba(255,255,255,.06)!important;color:#fff!important;font:900 22px/1 Arial,sans-serif!important;cursor:pointer!important;
}
#agMissionHub .ag-mission-tabs{display:flex!important;gap:7px!important;padding:14px 24px!important;border-bottom:1px solid rgba(255,255,255,.08)!important}
#agMissionHub .ag-mission-tab{
  border:1px solid rgba(169,203,193,.22)!important;border-radius:999px!important;padding:8px 12px!important;
  background:rgba(255,255,255,.045)!important;color:#b9cbc4!important;font:900 9px/1 Arial,sans-serif!important;letter-spacing:.6px!important;cursor:pointer!important;
}
#agMissionHub .ag-mission-tab.is-active{background:#c6e85b!important;color:#11251c!important;border-color:#dff58c!important}
#agMissionHub .ag-mission-hub-body{padding:18px 24px 24px!important;overflow:auto!important;max-height:calc(min(760px,88vh) - 175px)!important}
#agMissionHub .ag-mission-panel{display:none!important}
#agMissionHub .ag-mission-panel.is-active{display:block!important}
#agMissionHub .ag-mission-panel .mission{
  display:block!important;visibility:visible!important;opacity:1!important;margin:0 0 10px!important;
}
#agMissionHub .ag-mission-empty{
  padding:28px!important;border:1px dashed rgba(169,203,193,.22)!important;border-radius:12px!important;
  color:#a9cbc1!important;font:800 12px/1.5 Arial,sans-serif!important;text-align:center!important;
}

}
`;
function installStyles(){let s=document.getElementById(STYLE_ID);if(!s){s=document.createElement('style');s.id=STYLE_ID;document.head.appendChild(s)}if(s.textContent!==css)s.textContent=css}
function playerData(){
 const player=window.AGWorldPlayer||{};
 const name=(player.display_name||sessionStorage.getItem('gamechanger.username')||'PLAYER').toUpperCase();
 const level=Math.max(1,Number(player.level||sessionStorage.getItem('gamechanger.level')||1));
 const chapter=Math.max(1,Number(player.chapter||sessionStorage.getItem('gamechanger.chapter')||1));
 const xp=Math.max(0,Number(player.xp||sessionStorage.getItem('gamechanger.xp')||0));
 const next=Math.max(1000,Math.ceil((xp+1)/1000)*1000);
 const pct=Math.max(0,Math.min(100,Math.round((xp/next)*100)));
 return {name,level,chapter,xp,next,pct,initial:(name.trim().charAt(0)||'P').toUpperCase()};
}
function ensureMissionsPlayerProfile(){
 const missions=document.querySelector('.missions');if(!missions)return null;
 let card=missions.querySelector('#agPlayerMissionProfile');
 if(!card){
   card=document.createElement('section');
   card.id='agPlayerMissionProfile';
   card.className='ag-player-mission-profile';
   card.setAttribute('aria-label','Player profile');
 }
 card.innerHTML=playerCardHTML(playerData());
 const eyebrow=missions.querySelector('.eyebrow');
 const heading=missions.querySelector('h1,.missions-title,.mission-title');
 const anchor=eyebrow||heading||missions.firstElementChild;
 if(anchor && card.nextElementSibling!==anchor)anchor.insertAdjacentElement('beforebegin',card);
 else if(!anchor && missions.firstElementChild!==card)missions.prepend(card);
 return card;
}

function ensureAdvisorBay(){
 const missions=document.querySelector('.missions');if(!missions)return null;
 const cards=Array.from(missions.querySelectorAll('.mission'));
 // Landing page: exactly one mission is visible — current if active, otherwise next available.
 let landing=cards.find(m=>/current|active|in progress/i.test((m.dataset.status||'')+' '+(m.textContent||'')))||cards[0]||null;
 cards.forEach(m=>{
   const show=m===landing;
   m.classList.toggle('ag-landing-mission',show);
   m.setAttribute('aria-hidden',show?'false':'true');
   if(show)m.style.removeProperty('display');else m.style.setProperty('display','none','important');
 });
 let bay=missions.querySelector('#agAdvisorBay');
 if(!bay){
   bay=document.createElement('section');
   bay.id='agAdvisorBay';
   bay.setAttribute('aria-label','AgWorld advisor bay');
   bay.innerHTML='<div class="ag-advisor-bay-head"><strong>ADVISOR BAY</strong><span>SELECT A DISCIPLINE</span></div><div class="ag-advisor-grid">'+[
     ['compliance','C','COMPLIANCE'],
     ['sales','S','SALES'],
     ['product','P','PRODUCT'],
     ['operations','O','OPERATIONS'],
     ['technical','T','TECHNICAL']
   ].map(([id,mark,label])=>'<button type="button" class="ag-advisor" data-advisor="'+id+'" aria-label="Open '+label+' advisor"><span class="ag-advisor-icon" aria-hidden="true"><i class="head"></i><i class="hair"></i><i class="body"></i><b class="mark">'+mark+'</b></span><span class="ag-advisor-label">'+label+'</span></button>').join('')+'</div>';
 }
 // The Advisor Bay is an independent lower landing surface. It is positioned
 // against the live Command Center geometry, not stacked directly below missions.
 if(bay.parentElement!==missions)missions.appendChild(bay);
 bay.querySelectorAll('.ag-advisor').forEach(btn=>{
   if(btn.dataset.agAdvisorBound)return;
   btn.dataset.agAdvisorBound='1';
   btn.addEventListener('click',()=>{
     const advisor=btn.dataset.advisor;
     bay.querySelectorAll('.ag-advisor').forEach(x=>x.classList.toggle('is-active',x===btn));
     window.AGWorldAdvisorState={id:advisor,label:btn.querySelector('.ag-advisor-label')?.textContent||advisor};
     window.dispatchEvent(new CustomEvent('agworld:advisor-selected',{detail:window.AGWorldAdvisorState}));
     const reopen=document.querySelector('.ag-guide-reopen');
     const holo=document.querySelector('.ag-guide-hologram');
     const root=document.querySelector('.ag-system-guide');
     if(reopen?.classList.contains('show'))reopen.click();
     else if(root?.classList.contains('avatar-only')||root?.classList.contains('show'))holo?.click();
     else holo?.click();
   });
 });
 return bay;
}

function syncAdvisorBayGeometry(){
 const missions=document.querySelector('.missions');
 const bay=missions?.querySelector('#agAdvisorBay');
 const command=document.getElementById('entityInformationSection');
 if(!missions||!bay||!command)return;
 const mr=missions.getBoundingClientRect(),cr=command.getBoundingClientRect();
 if(!mr.height||!cr.height)return;
 // Match the Advisor Bay exactly to the Command Center's vertical footprint.
 // This makes the two lower surfaces read as one aligned row.
 const top=Math.max(0,Math.round(cr.top-mr.top));
 const maxH=Math.max(86,Math.round(mr.bottom-cr.top-6));
 const height=Math.max(86,Math.min(Math.round(cr.height),maxH));
 missions.style.setProperty('--ag-advisor-top',top+'px');
 missions.style.setProperty('--ag-advisor-height',height+'px');
 bay.style.setProperty('top',top+'px','important');
 bay.style.setProperty('height',height+'px','important');
}

function ensureMissionHub(){
 let hub=document.getElementById('agMissionHub');
 if(!hub){
   hub=document.createElement('div');
   hub.id='agMissionHub';
   hub.setAttribute('role','dialog');hub.setAttribute('aria-modal','true');hub.setAttribute('aria-label','Missions');
   hub.innerHTML='<div class="ag-mission-hub-card"><div class="ag-mission-hub-head"><div><div class="ag-mission-hub-kicker">MISSION COMMAND</div><h2>Missions</h2></div><button class="ag-mission-hub-close" type="button" aria-label="Close Missions">×</button></div><div class="ag-mission-tabs"><button class="ag-mission-tab is-active" data-tab="active" type="button">CURRENT / NEXT</button><button class="ag-mission-tab" data-tab="upcoming" type="button">UPCOMING MISSIONS</button><button class="ag-mission-tab" data-tab="history" type="button">MISSION HISTORY</button></div><div class="ag-mission-hub-body"><section class="ag-mission-panel is-active" data-panel="active"></section><section class="ag-mission-panel" data-panel="upcoming"></section><section class="ag-mission-panel" data-panel="history"></section></div></div>';
   document.body.appendChild(hub);
   hub.querySelector('.ag-mission-hub-close').onclick=()=>hub.classList.remove('show');
   hub.addEventListener('click',e=>{if(e.target===hub)hub.classList.remove('show');});
   hub.querySelectorAll('.ag-mission-tab').forEach(tab=>tab.onclick=()=>{
     const key=tab.dataset.tab;
     hub.querySelectorAll('.ag-mission-tab').forEach(x=>x.classList.toggle('is-active',x===tab));
     hub.querySelectorAll('.ag-mission-panel').forEach(x=>x.classList.toggle('is-active',x.dataset.panel===key));
   });
 }
 return hub;
}

function openMissionHub(){
 const hub=ensureMissionHub();
 const missions=document.querySelector('.missions');
 const cards=Array.from(missions?.querySelectorAll('.mission')||[]);
 const active=cards.find(m=>/current|active|in progress/i.test((m.dataset.status||'')+' '+(m.textContent||'')))||cards[0]||null;
 const completed=cards.filter(m=>m!==active&&/complete|completed|history/i.test((m.dataset.status||'')+' '+(m.textContent||'')));
 const upcoming=cards.filter(m=>m!==active&&!completed.includes(m));
 const fill=(key,items,empty)=>{
   const panel=hub.querySelector('[data-panel="'+key+'"]');panel.replaceChildren();
   if(!items.length){panel.innerHTML='<div class="ag-mission-empty">'+empty+'</div>';return;}
   items.forEach(m=>{const c=m.cloneNode(true);c.classList.remove('ag-landing-mission');c.style.removeProperty('display');c.style.removeProperty('visibility');c.removeAttribute('aria-hidden');panel.appendChild(c);});
 };
 fill('active',active?[active]:[],'No active mission is currently available.');
 fill('upcoming',upcoming,'No additional missions are currently queued.');
 const stored=(()=>{try{return JSON.parse(localStorage.getItem('agworldMissionHistory')||'[]')}catch{return[]}})();
 const historyPanel=hub.querySelector('[data-panel="history"]');historyPanel.replaceChildren();
 if(completed.length){
   completed.forEach(m=>{const c=m.cloneNode(true);c.style.removeProperty('display');c.removeAttribute('aria-hidden');historyPanel.appendChild(c);});
 }else if(Array.isArray(stored)&&stored.length){
   stored.forEach(item=>{const d=document.createElement('div');d.className='ag-mission-empty';d.textContent=typeof item==='string'?item:(item.title||'Completed mission');historyPanel.appendChild(d);});
 }else historyPanel.innerHTML='<div class="ag-mission-empty">Your completed missions will appear here.</div>';
 hub.classList.add('show');
}

function ensureMissionsDrawer(){
 const missions=document.querySelector('.missions');if(!missions)return;
 let handle=missions.querySelector('.ag-missions-drawer-handle');
 if(!handle){
   handle=document.createElement('button');
   handle.type='button';handle.className='ag-missions-drawer-handle';
   handle.setAttribute('aria-label','Toggle Missions');
   handle.innerHTML='<span>MISSIONS</span>';
   missions.appendChild(handle);
 }
 const toggle=()=>missions.classList.toggle('ag-missions-collapsed');
 handle.onclick=(e)=>{e.preventDefault();e.stopPropagation();toggle();};
 const header=missions.querySelector('.eyebrow,h1,.missions-title,.mission-title');
 if(header&&!header.dataset.agDrawerBound){
   header.dataset.agDrawerBound='1';
   header.style.cursor='pointer';
   header.addEventListener('click',toggle);
 }
}

function ensureSidebarBrand(s){
 if(!s)return null;
 let brand=s.querySelector('.brand');
 if(!brand){
   brand=document.createElement('div');
   brand.className='brand';
   const logo=document.createElement('img');
   logo.className='brand-logo';
   logo.alt='AgWorld';
   brand.appendChild(logo);
   s.prepend(brand);
 }
 let logo=brand.querySelector('.brand-logo');
 if(!logo){logo=document.createElement('img');logo.className='brand-logo';logo.alt='AgWorld';brand.replaceChildren(logo)}
 logo.src=LOGO_SRC;
 return brand;
}
function playerCardHTML(d){
 return '<div class="ag-player-identity"><div class="ag-player-avatar-frame"><div class="ag-player-avatar" aria-hidden="true">'+d.initial+'</div><span class="ag-player-online-dot"></span></div><div class="ag-player-summary"><span class="ag-player-kicker">ACTIVE PLAYER</span><strong class="ag-player-name">'+d.name+'</strong><span class="ag-player-role">AGWORLD FIELD COMMANDER</span><div class="ag-player-meta"><span class="ag-player-level">LVL '+d.level+'</span><span class="ag-player-chapter">CH '+d.chapter+'</span></div><div class="ag-player-xp-label"><span>PROGRESS</span><b>'+d.pct+'%</b></div><span class="ag-player-xp-track"><i class="ag-player-xp-fill" style="width:'+d.pct+'%"></i></span><span class="ag-player-xp-text"><b>'+d.xp.toLocaleString()+' XP</b><b>NEXT '+d.next.toLocaleString()+'</b></span></div></div>';
}
const SIDEBAR_MENU=[
 ['profile','Profile'],
 ['pipeline','Sales Funnel'],
 ['clients','Client List'],
 ['products','Sales Products'],
 ['after sales','After Sales'],
 ['mission history','Missions'],
 ['ai assistant','AI Assistant'],
 ['territory campaigns','Territory Campaigns'],
 ['territory graphics','Territory Graphics'],
 ['settings','Settings'],
 ['logout','Logout']
];
function menuKey(el){
 // IDs are implementation details (e.g. agCampaignCommandButton); labels are
 // the canonical navigation identity, so consider all sources together.
 const raw=[
   el.dataset&&el.dataset.menu,
   el.dataset&&el.dataset.view,
   el.getAttribute&&el.getAttribute('aria-label'),
   el.textContent,
   el.id
 ].filter(Boolean).join(' ').toLowerCase();
 return raw.replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
}
function ensureTerritoryCampaignMenuItem(nav){
 if(!nav)return null;
 let campaign=document.getElementById('agCampaignCommandButton');
 // If Chapter 3 loads after the menu, create a safe menu bridge now and bind it
 // to the real campaign system as soon as that system becomes available.
 if(!campaign){
   campaign=document.createElement('button');
   campaign.id='agCampaignCommandButton';
   campaign.type='button';
   campaign.textContent='Territory Campaigns';
   campaign.onclick=()=>window.AGWorldCampaign?.open?.();
 }
 // Re-home the existing functional button rather than cloning it. If the
 // Chapter 3 script replaces or upgrades it, its own click handler is retained.
 campaign.style.position='static';
 campaign.style.right='auto';
 campaign.style.bottom='auto';
 campaign.style.zIndex='auto';
 campaign.style.display='';
 campaign.style.visibility='visible';
 campaign.style.opacity='1';
 campaign.textContent='Territory Campaigns';
 if(campaign.parentElement!==nav)nav.appendChild(campaign);
 return campaign;
}
function normaliseSidebarMenu(nav){
 if(!nav)return;
 ensureTerritoryCampaignMenuItem(nav);
 const nodes=Array.from(nav.querySelectorAll('button,a,[role="button"],.nav-item,.menu-item,.nav-link,[data-view],[data-menu]'));
 const matched=new Map();
 nodes.forEach(el=>{
   const key=menuKey(el);
   for(const [needle,label] of SIDEBAR_MENU){
     if(!matched.has(needle) && (key===needle || key.includes(needle) || (needle==='profile' && key.includes('my profile')) || (needle==='pipeline' && key.includes('my pipeline')) || (needle==='clients' && key.includes('my clients')) || (needle==='products' && key.includes('my products')))){
       matched.set(needle,el);
       el.textContent=label;
       el.setAttribute('data-ag-menu-label',label);
       break;
     }
   }
 });
 // Remove only stale navigation entries; matching keeps the original elements, IDs and click handlers intact.
 nodes.forEach(el=>{if(!Array.from(matched.values()).includes(el))el.remove()});
 SIDEBAR_MENU.forEach(([needle])=>{const el=matched.get(needle);if(el)nav.appendChild(el)});
 const missionMenu=matched.get('mission history');
 if(missionMenu&&!missionMenu.dataset.agMissionsBound){
   missionMenu.dataset.agMissionsBound='1';
   missionMenu.setAttribute('aria-label','Missions');
   missionMenu.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openMissionHub();});
 }
}
function removeMapPlayerProfile(){
 const mapArea=document.querySelector('.map-area');if(!mapArea)return;
 mapArea.querySelectorAll('.map-player-profile,.player-profile,.map-user-profile,.player-avatar-control,[id*="mapPlayerProfile"],[id*="mapUserProfile"]').forEach(el=>el.remove());
 // Remove a late-injected standalone player chip only when it is clearly a
 // map overlay, leaving map controls and the mission profile untouched.
 [...mapArea.children].forEach(el=>{
   if(el.id==='map'||el.classList.contains('map-header')||el.classList.contains('map-status')||el.id==='farmCard')return;
   const text=(el.textContent||'').trim().toUpperCase();
   const cls=((el.id||'')+' '+(el.className||'')).toLowerCase();
   if((/player|profile|avatar|user/.test(cls)) && (text.length<=40||/NICO VAN ROOYEN/.test(text)))el.remove();
 });
}
function removeExplicitlyObsoleteSidebarItems(nav){
 const s=document.querySelector('.sidebar');if(!s)return;
 const obsolete=/(^|\b)(company commands?|company controls?)(\b|$)|(^|\b)developer mode(\b|$)/i;
 // Legacy entries can include icons or wrappers, so identify the smallest
 // matching element rather than relying on an exact plain-text match.
 const matches=Array.from(s.querySelectorAll('button,a,[role="button"],.nav-item,.menu-item,.nav-link,li,div,span')).filter(el=>{
   const label=(el.textContent||'').replace(/\s+/g,' ').trim();
   if(!obsolete.test(label))return false;
   return !Array.from(el.children).some(child=>obsolete.test((child.textContent||'').replace(/\s+/g,' ').trim()));
 });
 matches.forEach(el=>{
   const clickable=el.closest('button,a,[role="button"],.nav-item,.menu-item,.nav-link,li');
   (clickable||el).remove();
 });
}
function forceMapProfileRemoval(){
 const mapArea=document.querySelector('.map-area');if(!mapArea)return;
 const hasPlayerIdentity=el=>{
   const values=[
     el.id,
     typeof el.className==='string'?el.className:'',
     el.getAttribute?.('aria-label')||'',
     el.getAttribute?.('title')||'',
     el.getAttribute?.('data-player')||'',
     el.getAttribute?.('data-player-id')||'',
     el.getAttribute?.('data-user')||'',
     el.getAttribute?.('data-user-profile')||'',
     el.textContent||''
   ].join(' ').replace(/\s+/g,' ').trim().toUpperCase();
   return /NICO VAN ROOYEN|AG WORLD PLAYER|\bPLAYER PROFILE\b|\bMAP PLAYER\b/.test(values) ||
     /(^|\s)(MAP[-_ ]?)?(PLAYER|USER|PROFILE|AVATAR)([-_ ]?CONTROL)?(\s|$)/i.test([
       el.id,typeof el.className==='string'?el.className:''
     ].join(' '));
 };
 const removeCandidate=el=>{
   if(!el||el===mapArea||el.id==='developerModeBtn'||el.closest('#farmCard'))return;
   // Prefer the smallest meaningful overlay container, but never remove the map
   // canvas/header wholesale.
   let target=el;
   for(let p=el.parentElement,steps=0;p&&p!==mapArea&&steps<4;p=p.parentElement,steps++){
     const tag=(p.tagName||'').toLowerCase();
     const cls=((p.id||'')+' '+(typeof p.className==='string'?p.className:'')).toLowerCase();
     if(tag==='button'||tag==='a'||/player|profile|avatar|user|control|chip/.test(cls)) target=p;
   }
   if(target.classList?.contains('map-header')||target.id==='map') return;
   target.remove();
 };
 Array.from(mapArea.querySelectorAll('*')).forEach(el=>{
   if(hasPlayerIdentity(el)) removeCandidate(el);
 });
 // The remaining visual is the small circular "N" avatar in the map's top-right.
 // It can be injected without the player's name in text, so remove only a compact
 // button/control in the top-right that contains a single N and is not a map tool.
 Array.from(mapArea.querySelectorAll('button,[role="button"],div,span')).forEach(el=>{
   if(el.id==='developerModeBtn'||el.closest('.map-tools'))return;
   const text=(el.textContent||'').replace(/\s+/g,'').trim().toUpperCase();
   if(text!=='N')return;
   const rect=el.getBoundingClientRect?.();
   const mapRect=mapArea.getBoundingClientRect?.();
   if(!rect||!mapRect||rect.width>90||rect.height>90||rect.width<12||rect.height<12)return;
   const nearTop=rect.top-mapRect.top<100;
   const nearRight=mapRect.right-rect.right<140;
   if(nearTop&&nearRight) removeCandidate(el);
 });
}
function syncSidebarBrandHeader(){
 const sidebar=document.querySelector('.sidebar');
 const card=document.querySelector('.missions #agPlayerMissionProfile');
 if(!sidebar||!card)return;
 // The logo and player profile are equal-status hero elements. They intentionally
 // share one generous header height so neither is visually treated as secondary.
 const shellH=document.querySelector('.app-shell')?.clientHeight||820;
 const heroHeight=Math.max(160,Math.min(190,Math.round(shellH*0.207)));
 document.documentElement.style.setProperty('--ag-hero-header-h',heroHeight+'px');
 sidebar.style.setProperty('--ag-sidebar-brand-header-h',heroHeight+'px','important');
 card.style.setProperty('height',heroHeight+'px','important');
 card.style.setProperty('min-height',heroHeight+'px','important');
}
function correctSidebar(){
 const s=document.querySelector('.sidebar');if(!s)return;
 // Remove legacy duplicate player blocks only. The official sidebar brand is retained.
 s.querySelectorAll('.menu-user,.profile').forEach(el=>el.remove());
 const brand=ensureSidebarBrand(s);
 const nav=s.querySelector('.nav');
 if(s.firstElementChild!==brand)s.prepend(brand);
 if(nav && brand.nextElementSibling!==nav)brand.insertAdjacentElement('afterend',nav);
 normaliseSidebarMenu(nav);
 removeExplicitlyObsoleteSidebarItems(nav);
 // Campaign can appear late; move it again after all other menu cleanup.
 ensureTerritoryCampaignMenuItem(nav);
 normaliseSidebarMenu(nav);
 ensureMissionsPlayerProfile();
 ensureAdvisorBay();
 // Measure after the card exists; a second animation-frame pass catches fonts
 // and responsive layout settling before the user sees the navigation.
 syncSidebarBrandHeader();
 requestAnimationFrame(syncSidebarBrandHeader);
 removeMapPlayerProfile();
 forceMapProfileRemoval();
 document.querySelectorAll('.map-area .ag-world-map-logo').forEach(el=>el.remove());
}
function refreshPlayerUI(){
 const card=document.querySelector('.missions #agPlayerMissionProfile');if(!card)return;
 const d=playerData();card.innerHTML=playerCardHTML(d);
}
function start(){
 installStyles();correctSidebar();ensureAdvisorBay();syncAdvisorBayGeometry();ensureMissionHub();ensureMissionsDrawer();
 window.addEventListener('agworld:player-profile',refreshPlayerUI);
 const observer=new MutationObserver(()=>{
  installStyles();
  const s=document.querySelector('.sidebar');if(!s)return;
  const good=!!(s.querySelector('.brand .brand-logo')&&document.querySelector('.missions #agPlayerMissionProfile'));
  if(!good)correctSidebar();
  ensureMissionsPlayerProfile();
  ensureAdvisorBay();
  ensureMissionHub();
  ensureMissionsDrawer();
  syncAdvisorBayGeometry();
 });
 /* Important: watch descendants because game-view-mode changes sidebar.innerHTML. The callback is inert once final markup exists, so it cannot loop. */
 observer.observe(document.body,{childList:true,subtree:true});
 // Defensive health check: later game modules are not allowed to remove the
 // mission player profile or its style rules after the layout has been normalised.
 window.addEventListener('resize',syncAdvisorBayGeometry);[0,100,300,700,1500,3000,6000].forEach(ms=>setTimeout(syncAdvisorBayGeometry,ms));
 setInterval(()=>{installStyles();correctSidebar();ensureMissionsPlayerProfile();ensureAdvisorBay();syncAdvisorBayGeometry();ensureMissionHub();ensureMissionsDrawer();refreshPlayerUI();},900);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
