/* AG World API bridge
   Keeps the approved dashboard layout unchanged while moving farm data from
   browser-local storage to the Render API / Supabase database.
*/
(() => {
  const API_BASE = 'https://ag-world-api.onrender.com';
  const FARM_KEY = 'agworld-farms-v2';
  const nativeFetch = window.fetch.bind(window);
  const apiFetch = (path, options = {}) => nativeFetch(`${API_BASE}${path}`, options);
  let apiFarmIds = new Set();
  let syncing = false;

  function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function normalizeFarm(farm) {
    const objects = Array.isArray(farm.objects) ? farm.objects : [];
    const cropRows = Array.isArray(farm.crops) ? farm.crops : [];
    const cropNames = cropRows.map(c => typeof c === 'string' ? c : c?.crop_type).filter(Boolean);
    return {
      ...farm,
      crops: cropNames,
      drones: objects.filter(o => o.type === 'drone').length,
      tractors: objects.filter(o => o.type === 'tractor').length,
      livestock: objects.filter(o => o.type === 'livestock-area')
        .map(o => o.properties?.['Estimated head'])
        .filter(v => v !== undefined && v !== '').reduce((sum, v) => sum + Number(v || 0), 0) || undefined
    };
  }

  async function loadApiFarms() {
    const response = await apiFetch('/api/farms');
    if (!response.ok) throw new Error(`API farms request failed: ${response.status}`);
    const data = await response.json();
    const normalized = (data.farms || []).map(normalizeFarm);
    apiFarmIds = new Set(normalized.map(farm => farm.id));
    return { ...data, farms: normalized };
  }

  async function syncFarms(raw) {
    if (syncing) return;
    syncing = true;
    try {
      const data = JSON.parse(raw || '{"farms":[]}');
      const list = Array.isArray(data) ? data : (data.farms || []);
      for (const farm of list) {
        if (!farm?.id || !farm?.name || !Array.isArray(farm.boundary) || farm.boundary.length < 3) continue;
        const response = await apiFetch(apiFarmIds.has(farm.id) ? `/api/farms/${encodeURIComponent(farm.id)}` : '/api/farms', {
          method: apiFarmIds.has(farm.id) ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Actor-Id': 'web-dashboard' },
          body: JSON.stringify(farm)
        });
        if (!response.ok) {
          const message = await response.text();
          console.error('AG World farm sync failed', farm.id, message);
          continue;
        }
        apiFarmIds.add(farm.id);
      }
    } catch (error) {
      console.error('AG World database sync failed', error);
    } finally {
      syncing = false;
    }
  }

  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (url.includes('data/farms.json')) {
      try {
        const apiData = await loadApiFarms();
        if ((apiData.farms || []).length) return jsonResponse(apiData);

        // First run: retain the supplied demo records and immediately seed them
        // into the database so the database becomes the persistent source.
        const localResponse = await nativeFetch(input, init);
        const localData = await localResponse.json();
        setTimeout(() => syncFarms(JSON.stringify(localData)), 0);
        return jsonResponse(localData);
      } catch (error) {
        console.error('AG World API load failed', error);
        return nativeFetch(input, init);
      }
    }
    return nativeFetch(input, init);
  };

  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;

  Storage.prototype.getItem = function(key) {
    if (key === FARM_KEY) return null;
    return originalGetItem.call(this, key);
  };

  Storage.prototype.setItem = function(key, value) {
    const result = originalSetItem.call(this, key, value);
    if (key === FARM_KEY && this === window.localStorage) {
      syncFarms(value);
    }
    return result;
  };

  // Boundary workflow control: when the modal closes to let the user draw on
  // the satellite map, provide a prominent action on the map to lock/capture
  // the boundary and return to the farm form. The boundary is the primary
  // geographic definition of the farm and must be captured before objects or
  // farm details are entered.
  function installBoundaryControl() {
    if (document.getElementById('boundaryCaptureControl')) return;
    const mapArea = document.querySelector('.map-area');
    const mapStatus = document.getElementById('mapStatus');
    if (!mapArea || !mapStatus) return;

    const wrap = document.createElement('div');
    wrap.id = 'boundaryCaptureControl';
    wrap.style.cssText = 'position:absolute;top:58px;left:50%;transform:translateX(-50%);z-index:20;display:none;gap:8px;align-items:center;background:rgba(18,27,31,.96);padding:8px 10px;border:1px solid rgba(0,184,217,.75);box-shadow:0 6px 18px rgba(0,0,0,.35);border-radius:4px;';

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = '✓ SAVE BOUNDARY & CONTINUE';
    button.style.cssText = 'background:#00b8d9;color:#fff;border:0;padding:10px 16px;font-weight:800;font-size:12px;letter-spacing:.4px;cursor:pointer;';
    button.onclick = () => {
      if (typeof window.finishBoundary === 'function') {
        window.finishBoundary();
      } else {
        const finish = document.getElementById('finishBoundary');
        if (finish) finish.click();
      }
    };

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.textContent = 'CANCEL';
    cancel.style.cssText = 'background:transparent;color:#fff;border:1px solid #61747b;padding:10px 12px;font-weight:700;font-size:11px;cursor:pointer;';
    cancel.onclick = () => {
      if (typeof window.clearBoundary === 'function') window.clearBoundary();
      const modal = document.getElementById('farmCreateModal');
      if (modal) modal.classList.add('show');
    };

    wrap.append(button, cancel);
    mapArea.style.position = mapArea.style.position || 'relative';
    mapArea.appendChild(wrap);

    const update = () => {
      const drawing = mapStatus.textContent.includes('DRAWING MODE');
      wrap.style.display = drawing ? 'flex' : 'none';
    };
    new MutationObserver(update).observe(mapStatus, { childList: true, characterData: true, subtree: true });
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installBoundaryControl);
  else installBoundaryControl();
  setTimeout(installBoundaryControl, 500);

  window.AG_WORLD_API = { baseUrl: API_BASE };
})();
