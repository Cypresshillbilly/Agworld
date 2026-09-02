# AG World Data API Contract

The browser map is the presentation layer. Production farm data must live behind an authenticated API backed by PostgreSQL/PostGIS.

## Required endpoints

`GET /api/farms` — list farms visible to the signed-in user/role. Supports `region`, `status`, `bbox`, and `updatedSince` filters.

`GET /api/farms/:id` — return the canonical farm record, boundary, crops and mapped objects.

`POST /api/farms` — create a farm. The server assigns/validates the ID, timestamps, geometry and audit record.

`PATCH /api/farms/:id` — update farm metadata/boundary. Must write an audit record containing before/after state and actor.

`DELETE /api/farms/:id` — soft-delete/archive only; production data must remain recoverable.

`GET /api/farms/:id/objects` — return all mapped farm objects.

`POST /api/farms/:id/objects` — create an object with type, position and properties.

`PATCH /api/farms/:id/objects/:objectId` — update object details/position.

`DELETE /api/farms/:id/objects/:objectId` — archive/remove an object and write audit history.

`GET /api/territory/opportunities` — return explainable opportunity candidates and scores for the current user's permitted territory.

## Response shape

Farm responses should use the same canonical field names already used by the web prototype:

```json
{
  "id": "farm-001",
  "name": "Example Farm",
  "owner": "Farmer",
  "region": "Limpopo",
  "status": "Opportunity",
  "center": {"lat": -24.78, "lng": 28.32},
  "boundary": [{"lat": -24.78, "lng": 28.31}],
  "crops": [],
  "objects": [],
  "annualHarvest": "",
  "lastService": "",
  "opportunityScore": 0,
  "source": "manual",
  "notes": ""
}
```

## Security requirements

- Never expose database credentials in the browser.
- Require authentication and role/territory authorization on every endpoint.
- Validate all geometry server-side and store WGS84 / EPSG:4326.
- Validate object types against the AG World controlled vocabulary.
- Do not allow a browser client to write audit records directly; the API must create them.
- Log actor, timestamp, action, source and before/after state for material changes.
- Apply rate limits and input-size limits.
- Use parameterized SQL/PostGIS queries.
- Keep customer/farmer personal information protected by role-based access.

## Browser integration rule

The current GitHub Pages prototype may use local storage as a temporary offline fallback. Once `API_BASE_URL` is configured, the application should load and save canonical records through this API. Local storage must never silently become the production source of truth.
