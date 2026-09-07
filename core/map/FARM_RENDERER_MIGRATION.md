# V2.3 Farm Map Renderer Migration

The V2 farm map layer consumes only V2 Farm Entities.

## Flow

Existing Farm API → FarmRepositoryAdapter → FarmEntityService → FarmLayerV2 → Google Maps overlays

The legacy map renderer is not deleted yet. The new layer is isolated so it can be enabled beside the existing implementation during migration.

## Integration contract

After the Google Map instance exists:

`AGWorldV2.attachFarmLayer(map)`

This creates an independent V2 farm layer. Individual entity selection emits:

`agworld:v2-entity-selected`

with the selected V2 entity in the event detail.

## V2 guarantees

- Farms do not block base map startup.
- The Farm layer can fail independently.
- The layer can be hidden without destroying the map.
- The layer can be cleared and reloaded independently.
