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

  async function loadApiFarms() {
    const response = await apiFetch('/api/farms');
    if (!response.ok) throw new Error(`API farms request failed: ${response.status}`);
    const data = await response.json();
    apiFarmIds = new Set((data.farms || []).map(farm => farm.id));
    return data;
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

  window.AG_WORLD_API = { baseUrl: API_BASE };
})();
