# AG World V2.5 Relationship Engine

## Relationship model

Every connection is represented as:

Source Entity → Relationship Type → Target Entity

Examples:

- Farm → works_with → Contractor
- Farm → customer_of → Company
- Farm → competes_with → Competitor
- Company → operates → Company Facility
- Contractor → serves → Farm

## API

GET /api/v2/relationships?entityId={id}

POST /api/v2/relationships

DELETE /api/v2/relationships/{id}

Relationships are soft-deactivated so history can be retained.

## Database

Run `server/v2-relationship-engine.sql` before enabling the routes.

Then import and register `registerV2RelationshipRoutes(app, pool)` in the API bootstrap.
