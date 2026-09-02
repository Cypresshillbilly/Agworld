/* AG World Farm Visual Engine
   The farm record supplies WHAT exists and WHERE it exists.
   The visual library supplies the consistent asset + animation for each item.
   This keeps maize, orchards, drones, tractors, etc. visually consistent across farms.
*/
(() => {
  let library = null;
  let active = null;
  let raf = null;
  let clock = null;

  const get = id => document.getElementById(id);

  async function loadLibrary() {
    if (library) return library;
    const response = await fetch('data/farm-visual-library.json?v=20260902');
    if (!response.ok) throw new Error('visual library unavailable');
    library = await response.json();
    return library;
  }

  function hex(n) { return Number(n) || 0x788d65; }
  function cropKey(value) {
    const raw = String(value || '').trim().toLowerCase();
    return library.cropAliases?.[raw] || (library.assets?.[raw] ? raw : 'default-crop');
  }

  function pos(object, fallback) {
    if (object?.position) return { lat: Number(object.position.lat), lng: Number(object.position.lng) };
    if (object?.geometry?.coordinates) return { lat: Number(object.geometry.coordinates[1]), lng: Number(object.geometry.coordinates[0]) };
    return fallback;
  }

  function bounds(points) {
    const lats = points.map(p => p.lat), lngs = points.map(p => p.lng);
    return { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLng: Math.min(...lngs), maxLng: Math.max(...lngs) };
  }

  function localPoint(point, b) {
    const x = ((point.lng - b.minLng) / Math.max(b.maxLng - b.minLng, 0.00001) - 0.5) * 22;
    const z = -((point.lat - b.minLat) / Math.max(b.maxLat - b.minLat, 0.00001) - 0.5) * 16;
    return { x, z };
  }

  function material(color, roughness = .9) {
    return new THREE.MeshStandardMaterial({ color: hex(color), roughness });
  }

  function addBox(group, x, y, z, sx, sy, sz, color) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material(color));
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
    return mesh;
  }

  function addCropField(group, x, z, asset, areaHa = 20) {
    const scale = Math.max(.7, Math.min(2.8, Math.sqrt(Math.max(Number(areaHa) || 20, 1) / 20)));
    const field = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(5.2 * scale, .12, 3.2 * scale), material(asset.color));
    base.position.y = .08; base.receiveShadow = true; field.add(base);
    const rows = new THREE.Group();
    const count = Math.max(5, Math.round(7 * scale));
    for (let i = 0; i < count; i++) {
      const row = new THREE.Group();
      const zRow = ((i / Math.max(count - 1, 1)) - .5) * 2.7 * scale;
      for (let j = 0; j < 7; j++) {
        const stem = new THREE.Mesh(new THREE.BoxGeometry(.055, .42 + (j % 2) * .06, .055), material(asset.accent));
        stem.position.set(((j / 6) - .5) * 4.4 * scale, .34, zRow);
        row.add(stem);
      }
      rows.add(row);
    }
    field.add(rows); field.position.set(x, 0, z); group.add(field);
    field.userData.animation = asset.animation; field.userData.phase = Math.random() * 6.28;
    return field;
  }

  function addOrchard(group, x, z, asset, areaHa = 20) {
    const scale = Math.max(.7, Math.min(2.5, Math.sqrt(Math.max(Number(areaHa) || 20, 1) / 20)));
    const orchard = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(5 * scale, .1, 3.4 * scale), material(asset.color));
    base.position.y = .06; orchard.add(base);
    const rows = 5, cols = 7;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const tree = new THREE.Group();
      const trunk = addBox(tree, 0, .45, 0, .12, .75, .12, 0x765437);
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(.48, 1), material(asset.accent));
      crown.position.y = 1; crown.castShadow = true; tree.add(crown);
      tree.position.set(((c / (cols - 1)) - .5) * 4.2 * scale, 0, ((r / (rows - 1)) - .5) * 2.6 * scale);
      orchard.add(tree);
    }
    orchard.position.set(x, 0, z); group.add(orchard);
    orchard.userData.animation = asset.animation; orchard.userData.phase = Math.random() * 6.28;
    return orchard;
  }

  function addBuilding(group, x, z, asset) {
    const b = new THREE.Group();
    addBox(b, 0, 1.05, 0, 3.2, 2.1, 2.4, asset.color);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.25, 4), material(asset.accent));
    roof.rotation.y = Math.PI / 4; roof.position.y = 2.7; roof.scale.z = .78; roof.castShadow = true; b.add(roof);
    b.position.set(x, 0, z); group.add(b); return b;
  }

  function addTractor(group, x, z, asset) {
    const t = new THREE.Group();
    addBox(t, 0, .55, 0, 1.7, .65, 1.05, asset.color);
    addBox(t, .15, 1.05, -.05, .8, .55, .85, asset.accent);
    [ [-.62,.42], [.62,.42] ].forEach(([wx,wz]) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.16,16), material(0x202528)); w.rotation.z = Math.PI/2; w.position.set(wx,.3,wz); t.add(w); });
    t.position.set(x, 0, z); group.add(t); return t;
  }

  function addDrone(group, x, z, asset, competitor = false) {
    const d = new THREE.Group();
    addBox(d, 0, 0, 0, .9, .18, .55, competitor ? 0x777777 : asset.color);
    [[-.65,-.42],[.65,-.42],[-.65,.42],[.65,.42]].forEach(([px,pz]) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(.8,.07,.07), material(asset.accent)); arm.position.set(px/2,0,pz/2); arm.rotation.y = Math.atan2(pz,px); d.add(arm);
    });
    d.position.set(x, 3, z); group.add(d); d.userData.animation = asset.animation; d.userData.phase = Math.random()*6.28; return d;
  }

  function addDam(group, x, z, asset) {
    const pond = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, .12, 40), new THREE.MeshStandardMaterial({ color: hex(asset.color), roughness: .25, metalness: .05 }));
    pond.scale.set(1.35,.9,1); pond.position.set(x,.08,z); group.add(pond); pond.userData.animation = asset.animation; pond.userData.phase = Math.random()*6.28; return pond;
  }

  function addLivestock(group, x, z, asset, head = 8) {
    const area = new THREE.Group();
    addBox(area, x, .16, z, 3.8, .25, 2.8, asset.color);
    const count = Math.max(1, Math.min(18, Number(head) || 8));
    for (let i=0;i<count;i++) {
      const animal = new THREE.Group();
      addBox(animal,0,.3,0,.42,.42,.7,0x5d5147);
      animal.position.set(x + ((i%6)-2.5)*.5, .15, z + (Math.floor(i/6)-1)*.65); group.add(animal);
      animal.userData.animation='animal-graze'; animal.userData.phase=Math.random()*6.28;
    }
    return area;
  }

  function addIrrigation(group, x, z, asset) {
    const pivot = new THREE.Group();
    const arm = new THREE.Mesh(new THREE.BoxGeometry(7,.12,.12), material(asset.color)); pivot.add(arm);
    for(let i=-3;i<=3;i++) { const tower = new THREE.Mesh(new THREE.BoxGeometry(.08,.8,.08), material(asset.accent)); tower.position.set(i, .4, 0); pivot.add(tower); }
    pivot.position.set(x,.15,z); group.add(pivot); pivot.userData.animation='pivot-turn'; return pivot;
  }

  function addRoads(group) {
    const road = new THREE.Mesh(new THREE.BoxGeometry(28,.05,1), material(0x8d8170)); road.position.set(0,.05,5.8); group.add(road);
  }

  function renderFarm(farm) {
    const host = get('farmScene');
    if (!host || !window.THREE) return;
    if (raf) cancelAnimationFrame(raf);
    host.innerHTML = '';
    const points = (farm.boundary || []).map(p => ({ lat:Number(p.lat), lng:Number(p.lng) })).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    const b = points.length >= 3 ? bounds(points) : {minLat:-1,maxLat:1,minLng:-1,maxLng:1};

    const scene = new THREE.Scene(); scene.background = new THREE.Color(0xb9c7b2);
    const camera = new THREE.PerspectiveCamera(42, Math.max(host.clientWidth,1)/Math.max(host.clientHeight,1), .1, 1000);
    camera.position.set(19,18,21); camera.lookAt(0,0,0);
    const renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)); renderer.setSize(host.clientWidth,host.clientHeight); renderer.shadowMap.enabled=true;
    host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff,0x64705d,2.1));
    const sun = new THREE.DirectionalLight(0xffffff,2.5); sun.position.set(8,20,10); sun.castShadow=true; scene.add(sun);
    const root = new THREE.Group(); scene.add(root);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(30,23), material(0x788d65)); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; root.add(ground);
    addRoads(root);

    // Always render the farm boundary as the visual footprint, so the miniature never becomes a generic unrelated picture.
    if (points.length >= 3) {
      const shape = new THREE.Shape();
      points.forEach((p,i)=>{ const q=localPoint(p,b); if(i===0) shape.moveTo(q.x,q.z); else shape.lineTo(q.x,q.z); }); shape.closePath();
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({color:0x8fa46d,transparent:true,opacity:.55})); mesh.rotation.x=-Math.PI/2; mesh.position.y=.025; root.add(mesh);
    }

    const objects = Array.isArray(farm.objects) ? farm.objects : [];
    const cropObjects = objects.filter(o=>o.type==='crop-field');
    if (cropObjects.length) cropObjects.forEach((o,i)=>{
      const p=localPoint(pos(o, farm.center || points[0]),b), name=o.properties?.['Crop type'] || o.name, key=cropKey(name), asset=library.assets[key]||library.assets['default-crop'];
      if(asset.style==='trees') addOrchard(root,p.x,p.z,asset,o.properties?.['Area (ha)']); else addCropField(root,p.x,p.z,asset,o.properties?.['Area (ha)']);
    });
    if (!cropObjects.length && Array.isArray(farm.crops)) farm.crops.forEach((name,i)=>{
      const key=cropKey(name), asset=library.assets[key]||library.assets['default-crop']; const p={x:-5+(i%3)*5,z:-3+Math.floor(i/3)*3};
      if(asset.style==='trees') addOrchard(root,p.x,p.z,asset,20); else addCropField(root,p.x,p.z,asset,20);
    });

    let indexes={building:0,tractor:0,drone:0,'competitor-drone':0,dam:0,'livestock-area':0,irrigation:0};
    objects.forEach(o=>{
      if(o.type==='crop-field') return;
      const asset=library.assets[o.type]||library.assets.building; const p=localPoint(pos(o,farm.center||points[0]),b); const i=indexes[o.type]||0; indexes[o.type]=i+1;
      if(o.type==='building') addBuilding(root,p.x,p.z,asset);
      else if(o.type==='tractor') addTractor(root,p.x+(i%2)*1.1,p.z+(Math.floor(i/2))*1.1,asset);
      else if(o.type==='drone') addDrone(root,p.x,p.z,asset,false);
      else if(o.type==='competitor-drone') addDrone(root,p.x,p.z,asset,true);
      else if(o.type==='dam') addDam(root,p.x,p.z,asset);
      else if(o.type==='livestock-area') addLivestock(root,p.x,p.z,asset,o.properties?.['Estimated head']);
      else if(o.type==='irrigation') addIrrigation(root,p.x,p.z,asset);
    });

    // Summary counts are data-driven, with no visual asset invented beyond what the farm record contains.
    const cropCount = objects.filter(o=>o.type==='crop-field').length || (farm.crops||[]).length;
    get('sceneSummary').textContent = `${farm.name} · ${(farm.boundary||[]).length} boundary points · ${cropCount} crop type${cropCount===1?'':'s'} · ${objects.length} mapped assets · visual library v${library.version}`;
    active={scene,camera,renderer,root,farm}; clock=clock||new THREE.Clock();
    function frame(){
      if(!active||active.renderer!==renderer) return;
      raf=requestAnimationFrame(frame); const t=clock.getElapsedTime();
      root.traverse(obj=>{
        const a=obj.userData?.animation; const ph=obj.userData?.phase||0; const def=library.animations?.[a]; if(!def) return;
        if(a==='drone-hover') obj.position.y=3+Math.sin(t*def.speed+ph)*def.amplitude;
        else if(a==='crop-sway'||a==='tree-sway'||a==='grass-sway') obj.rotation.z=Math.sin(t*def.speed+ph)*def.amplitude;
        else if(a==='water-ripple') { const s=1+Math.sin(t*def.speed+ph)*def.amplitude; obj.scale.x=s; obj.scale.z=1/s; }
        else if(a==='animal-graze') obj.rotation.x=Math.sin(t*def.speed+ph)*def.amplitude;
        else if(a==='pivot-turn') obj.rotation.y=t*def.speed*.12;
      });
      renderer.render(scene,camera);
    }
    frame();
  }

  async function openVisualFarm() {
    const farm = window.__AG_WORLD_SELECTED_FARM;
    // app.js keeps the selected farm private, so read the currently selected farm from the visible card's name as fallback.
    let selectedFarm = farm;
    if (!selectedFarm && window.AG_WORLD_SELECTED_FARM) selectedFarm = window.AG_WORLD_SELECTED_FARM;
    if (!selectedFarm) {
      const title = get('farmName')?.textContent;
      selectedFarm = (window.__AG_WORLD_FARMS||[]).find(f=>f.name===title);
    }
    if (!selectedFarm) { const old=get('farm3d'); if(old&&old.__agFarm) selectedFarm=old.__agFarm; }
    if (!selectedFarm) { if(window.alert) alert('Select a farm first.'); return; }
    try {
      await loadLibrary();
      get('sceneTitle').textContent = selectedFarm.name.toUpperCase();
      get('sceneMeta').textContent = `${selectedFarm.region || 'Farm'} · ${selectedFarm.status || '—'} · DATA-DRIVEN FARM VISUAL`;
      get('farm3dModal').classList.add('show');
      renderFarm(selectedFarm);
    } catch(e) { console.error(e); alert('AG World visual library could not be loaded.'); }
  }

  function connect() {
    const button=get('farm3d'); if(!button) return;
    button.onclick=openVisualFarm;
    button.textContent='OPEN INTERACTIVE FARM';
    // app.js does not expose its selected farm; capture it whenever the farm card opens by observing its title.
    const card=get('farmCard');
    const observer=new MutationObserver(()=>{
      const title=get('farmName')?.textContent;
      const farms=window.__AG_WORLD_FARMS||[];
      const found=farms.find(f=>f.name===title);
      if(found) button.__agFarm=found;
    });
    if(card) observer.observe(card,{subtree:true,childList:true,characterData:true});
  }

  window.addEventListener('resize',()=>{
    if(active?.renderer && active?.camera){ const host=get('farmScene'); active.camera.aspect=Math.max(host.clientWidth,1)/Math.max(host.clientHeight,1); active.camera.updateProjectionMatrix(); active.renderer.setSize(host.clientWidth,host.clientHeight); }
  });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',connect); else connect();
  setTimeout(connect,800);
})();
