# V2.6 Relationship Engine Acceptance Test

Run the SQL migration first:

```bash
psql "$DATABASE_URL" -f server/v2-relationship-engine.sql
```

## 1. Verify API health

```bash
curl -s "$AGWORLD_API_URL/api/health"
```

Expected:

```json
{"ok":true}
```

## 2. Select two real farms

```bash
curl -s "$AGWORLD_API_URL/api/farms"
```

Choose two returned IDs and export them:

```bash
export FARM_A="..."
export FARM_B="..."
```

## 3. Create a real relationship

```bash
curl -i -X POST "$AGWORLD_API_URL/api/v2/relationships" \
  -H "Content-Type: application/json" \
  -d "{\"sourceEntityId\":\"$FARM_A\",\"sourceEntityType\":\"farm\",\"relationshipType\":\"associated_with\",\"targetEntityId\":\"$FARM_B\",\"targetEntityType\":\"farm\",\"metadata\":{\"source\":\"v2.6 acceptance test\"}}"
```

Expected: HTTP 201.

## 4. Read relationships for Farm A

```bash
curl -s "$AGWORLD_API_URL/api/v2/relationships?entityId=$FARM_A"
```

Expected: the relationship created above.

## 5. Deactivate the test relationship

Copy the returned relationship ID:

```bash
curl -i -X DELETE "$AGWORLD_API_URL/api/v2/relationships/RELATIONSHIP_ID"
```

Expected: HTTP 204.

## 6. Confirm soft deletion

Repeat step 4. The inactive relationship must not be returned by the active relationship endpoint.

## UI acceptance

1. Open AG World.
2. Click a real Farm rendered through FarmLayerV2.
3. Confirm the V2 Farm Detail Panel opens.
4. Open Relationships.
5. Confirm active relationships are displayed.
6. Confirm the base map remains functional if the relationship request fails.
