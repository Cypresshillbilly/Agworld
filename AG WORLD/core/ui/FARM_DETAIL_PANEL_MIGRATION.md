# V2.4 Farm Entity Detail Panel

The panel listens for the standard map event:

`agworld:v2-entity-selected`

and consumes the V2 entity directly.

## Panel modules

- Overview
- Farm Details
- Relationships
- Activity
- Documents
- Media
- Notes

The base `EntityDetailPanelV2` is reusable by every V2 entity type. `FarmDetailPanelV2` only supplies Farm-specific detail rendering.

## Integration

After the map and V2 modules are loaded:

`new AGWorldV2.FarmDetailPanelV2({ container: '#your-panel', relationshipRepository: new AGWorldV2.RelationshipRepository() })`

The selected Farm automatically opens in the panel when clicked on the V2 Farm map layer.
