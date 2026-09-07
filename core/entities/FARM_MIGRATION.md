# V2.2 Farm Migration

Farms remain backed by the existing production API during this migration.

## Compatibility flow

Legacy Farm API → FarmRepositoryAdapter → V2 Farm Entity → future map/UI

The adapter converts:

- legacy boundary arrays ↔ GeoJSON geometry
- legacy region ↔ territoryIds
- legacy farm fields ↔ entity metadata

This allows Farms to become V2 entities without breaking the existing database, PostGIS geometry, audit history, farm objects, or current map rendering.

## Next migration step

Wire the map renderer and Farm detail panel to consume `AGWorldV2.FarmEntityService`, then retire direct frontend reads from legacy farm structures.
