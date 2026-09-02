/* AG World automatic farm zoom visualisation.
   At farm-level selection the existing interactive farm visual opens automatically.
   Real mapped objects are used when present. Demo records also expand their
   explicit summary counts into clearly marked demo objects so the demo is useful.
*/
(() => {
  let lastFarmId = null;
  let opening = false;

  function makeDemoObjects(farm) {
    if (!farm || !String(farm.id || '').startsWith('demo-') || Array.isArray(farm.objects) && farm.objects.length) return;
    const boundary = farm.boundary || [];
    const center = farm.center || boundary[0];
    if (!center) return;
    const points = (boundary.length >= 3 ? boundary : [center]).map(p => ({ lat:Number(p.lat), lng:Number(p.lng) }));
    const minLat = Math.min(...points.map(p => p.lat)), maxLat = Math.max(...points.map(p => p.lat));
    const minLng = Math.min(...points.map(p => p.lng)), maxLng = Math.max(...points.map(p => p.lng));
    const pointAt = (i, total, spread = .7) => ({
      lat: Number(center.lat) + (maxLat-minLat) * ((i % 4) / 3 - .5) * spread,
      lng: Number(center.lng) + (maxLng-minLng) * ((Math.floor(i/4) % 4) / 3 - .5) * spread
    });
    const objects = [];
    (farm.crops || []).forEach((crop, i) => objects.push({
      id:`${farm.id}-crop-${i+1}`, type:'crop-field', name:crop,
      position:pointAt(i, farm.crops.length), source:'demo-summary',
      properties:{'Crop type':crop,'Area (ha)':20}
    }));
    for(let i=0;i<Number(farm.tractors||0);i++) objects.push({ id:`${farm.id}-tractor-${i+1}`, type:'tractor', name:`Demo Tractor ${i+1}`, position:pointAt(i+1, farm.tractors), source:'demo-summary', properties:{} });
    for(let i=0;i<Number(farm.drones||0);i++) objects.push({ id:`${farm.id}-drone-${i+1}`, type:'drone', name:`Company Drone ${i+1}`, position:pointAt(i+2, farm.drones), source:'demo-summary', properties:{} });
    if(Number(farm.livestock||0)>0) objects.push({ id:`${farm.id}-livestock-1`, type:'livestock-area', name:'Livestock Area', position:pointAt(3,1), source:'demo-summary', properties:{'Estimated head':Number(farm.livestock)} });
    farm.objects = objects;
  }

  function selectedFarm() {
    const title = document.getElementById('farmName')?.textContent?.trim();
    if(!title || title === 'Farm') return null;
    const farms = window.__AG_WORLD_FARMS || [];
    return farms.find(f => f.name === title) || null;
  }

  function atFarmStage() {
    const stage = document.getElementById('zoomStage')?.textContent || '';
    return /ZOOM\s+[34]/i.test(stage) || /FARM/i.test(stage);
  }

  function tryOpen() {
    if(opening || !atFarmStage()) return;
    const farm = selectedFarm();
    const button = document.getElementById('farm3d');
    if(!farm || !button || !farm.boundary?.length) return;
    if(lastFarmId === farm.id && document.getElementById('farm3dModal')?.classList.contains('show')) return;
    lastFarmId = farm.id;
    makeDemoObjects(farm);
    opening = true;
    setTimeout(() => { button.click(); opening = false; }, 120);
  }

  function connect() {
    const stage = document.getElementById('zoomStage');
    const card = document.getElementById('farmCard');
    if(!stage && !card) return false;
    const observer = new MutationObserver(tryOpen);
    if(stage) observer.observe(stage,{childList:true,characterData:true,subtree:true});
    if(card) observer.observe(card,{childList:true,characterData:true,attributes:true,subtree:true});
    document.addEventListener('click', () => setTimeout(tryOpen, 80));
    setTimeout(tryOpen, 500);
    return true;
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',()=>{ if(!connect()) setTimeout(connect,800); });
  else if(!connect()) setTimeout(connect,800);
})();
