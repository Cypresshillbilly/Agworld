-- AG World canonical relational database schema
-- Production target: PostgreSQL + PostGIS.
-- This schema mirrors the farm/map data model and keeps every map object auditable.

CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS farms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner TEXT,
  region TEXT,
  status TEXT NOT NULL DEFAULT 'Prospect',
  boundary GEOMETRY(Polygon, 4326),
  center GEOMETRY(Point, 4326),
  annual_harvest TEXT,
  last_service DATE,
  opportunity_score NUMERIC(5,2) DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS farms_boundary_gix ON farms USING GIST (boundary);
CREATE INDEX IF NOT EXISTS farms_center_gix ON farms USING GIST (center);
CREATE INDEX IF NOT EXISTS farms_region_idx ON farms(region);
CREATE INDEX IF NOT EXISTS farms_status_idx ON farms(status);

CREATE TABLE IF NOT EXISTS farm_crops (
  id BIGSERIAL PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  crop_type TEXT NOT NULL,
  hectares NUMERIC(12,2),
  season TEXT,
  geometry GEOMETRY(Polygon, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS farm_crops_geometry_gix ON farm_crops USING GIST (geometry);

CREATE TABLE IF NOT EXISTS farm_objects (
  id TEXT PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  object_type TEXT NOT NULL,
  name TEXT,
  position GEOMETRY(Point, 4326),
  source TEXT NOT NULL DEFAULT 'manual',
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS farm_objects_position_gix ON farm_objects USING GIST (position);
CREATE INDEX IF NOT EXISTS farm_objects_farm_idx ON farm_objects(farm_id);
CREATE INDEX IF NOT EXISTS farm_objects_type_idx ON farm_objects(object_type);

CREATE TABLE IF NOT EXISTS farm_audit (
  id BIGSERIAL PRIMARY KEY,
  farm_id TEXT NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_id TEXT,
  source TEXT NOT NULL,
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS farm_audit_farm_idx ON farm_audit(farm_id, created_at DESC);

-- Canonical counts used by the map/card without duplicating mutable counters.
CREATE OR REPLACE VIEW farm_summary AS
SELECT
  f.id,
  f.name,
  f.owner,
  f.region,
  f.status,
  f.annual_harvest,
  f.last_service,
  f.opportunity_score,
  f.source,
  f.notes,
  ST_Y(f.center) AS latitude,
  ST_X(f.center) AS longitude,
  COALESCE((SELECT COUNT(*) FROM farm_objects o WHERE o.farm_id=f.id AND o.object_type='drone'),0) AS drones,
  COALESCE((SELECT COUNT(*) FROM farm_objects o WHERE o.farm_id=f.id AND o.object_type='tractor'),0) AS tractors,
  COALESCE((SELECT COUNT(*) FROM farm_objects o WHERE o.farm_id=f.id AND o.object_type='livestock-area'),0) AS livestock,
  COALESCE((SELECT COUNT(*) FROM farm_crops c WHERE c.farm_id=f.id),0) AS crop_count,
  f.created_at,
  f.updated_at
FROM farms f;
