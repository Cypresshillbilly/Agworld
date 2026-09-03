-- AG World canonical relational database schema
-- Production target: PostgreSQL + PostGIS.
-- This schema mirrors the farm/map data model and keeps every map object auditable.

CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- USERS / EMPLOYEE PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  territory TEXT,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  xp_to_next_level INTEGER NOT NULL DEFAULT 1000,
  controlled_farms INTEGER NOT NULL DEFAULT 0,
  opportunities INTEGER NOT NULL DEFAULT 0,
  drone_fleet INTEGER NOT NULL DEFAULT 0,
  territory_control NUMERIC(5,2) NOT NULL DEFAULT 0,
  regional_position INTEGER,
  national_position INTEGER,
  profile_image TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);
CREATE INDEX IF NOT EXISTS users_territory_idx ON users(territory);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);

CREATE TABLE IF NOT EXISTS user_achievements (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);
CREATE INDEX IF NOT EXISTS user_achievements_user_idx ON user_achievements(user_id);

CREATE TABLE IF NOT EXISTS user_rewards (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_key TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  required_level INTEGER,
  required_xp INTEGER,
  status TEXT NOT NULL DEFAULT 'locked',
  unlocked_at TIMESTAMPTZ,
  UNIQUE(user_id, reward_key)
);
CREATE INDEX IF NOT EXISTS user_rewards_user_idx ON user_rewards(user_id);

-- ============================================================
-- FARMS
-- ============================================================
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

-- ============================================================
-- NICO VAN ROOYEN — initial employee record
-- Safe to run repeatedly; the row is updated rather than duplicated.
-- ============================================================
INSERT INTO users (
  id, username, password_hash, full_name, role, territory,
  level, xp, xp_to_next_level, controlled_farms, opportunities,
  drone_fleet, territory_control, regional_position, national_position,
  status
) VALUES (
  'user-nico-van-rooyen',
  'Admin',
  'e11cc812d74ac85a0aa6ff6ab4c4e1d43510930d4d988ee2609648d7d7da77ee',
  'NICO VAN ROOYEN',
  'SALES REPRESENTATIVE',
  'Territory 03',
  7,
  6820,
  10000,
  18,
  14,
  27,
  74,
  2,
  11,
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  territory = EXCLUDED.territory,
  level = EXCLUDED.level,
  xp = EXCLUDED.xp,
  xp_to_next_level = EXCLUDED.xp_to_next_level,
  controlled_farms = EXCLUDED.controlled_farms,
  opportunities = EXCLUDED.opportunities,
  drone_fleet = EXCLUDED.drone_fleet,
  territory_control = EXCLUDED.territory_control,
  regional_position = EXCLUDED.regional_position,
  national_position = EXCLUDED.national_position,
  status = EXCLUDED.status,
  updated_at = now();

INSERT INTO user_achievements (user_id, achievement_key, achievement_name) VALUES
  ('user-nico-van-rooyen', 'first-meeting', 'First Meeting'),
  ('user-nico-van-rooyen', 'opportunity-finder', 'Opportunity Finder'),
  ('user-nico-van-rooyen', 'presentation-pro', 'Presentation Pro'),
  ('user-nico-van-rooyen', 'proposal-pro', 'Proposal Pro')
ON CONFLICT (user_id, achievement_key) DO NOTHING;

INSERT INTO user_rewards (user_id, reward_key, reward_name, required_level, required_xp, status) VALUES
  ('user-nico-van-rooyen', 'top-performer', 'Top Performer', 8, 10000, 'locked'),
  ('user-nico-van-rooyen', 'dji-mavic-3', 'DJI Mavic 3 Sales Certification', 8, 10000, 'locked')
ON CONFLICT (user_id, reward_key) DO NOTHING;
