/* Agriculture Build Manifest */
window.GAME_CHANGER_AGRICULTURE_BUILD={
 id:'agriculture',
 name:'Agriculture',
 version:'2.0',
 login:{background:'assets/ag_world_login_v2.jpg',fallback:'assets/ag_world_login_v1.jpg'},
 pages:{salesProfile:'index.html',map:'index.html',admin:'admin.html'},
 roles:['agriculture_sales'],
 capabilities:['missions','territory_map','farm_intelligence','agriculture_layers'],
 assets:{root:'assets/'},
 data:{namespace:'agriculture'}
};