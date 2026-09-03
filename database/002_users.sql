-- AG World migration 002: employee/user profile data
-- Execute against the production PostgreSQL/Supabase database after schema.sql.
-- Idempotent: safe to run more than once.

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

CREATE TABLE IF NOT EXISTS user_achievements (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

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

INSERT INTO users (
  id, username, password_hash, full_name, role, territory,
  level, xp, xp_to_next_level, controlled_farms, opportunities,
  drone_fleet, territory_control, regional_position, national_position, status
) VALUES (
  'user-nico-van-rooyen', 'Admin',
  'e11cc812d74ac85a0aa6ff6ab4c4e1d43510930d4d988ee2609648d7d7da77ee',
  'NICO VAN ROOYEN', 'SALES REPRESENTATIVE', 'Territory 03',
  7, 6820, 10000, 18, 14, 27, 74, 2, 11, 'active'
)
ON CONFLICT (id) DO UPDATE SET
  full_name=EXCLUDED.full_name,
  role=EXCLUDED.role,
  territory=EXCLUDED.territory,
  level=EXCLUDED.level,
  xp=EXCLUDED.xp,
  xp_to_next_level=EXCLUDED.xp_to_next_level,
  controlled_farms=EXCLUDED.controlled_farms,
  opportunities=EXCLUDED.opportunities,
  drone_fleet=EXCLUDED.drone_fleet,
  territory_control=EXCLUDED.territory_control,
  regional_position=EXCLUDED.regional_position,
  national_position=EXCLUDED.national_position,
  status=EXCLUDED.status,
  updated_at=now();

INSERT INTO user_achievements (user_id, achievement_key, achievement_name) VALUES
 ('user-nico-van-rooyen','first-meeting','First Meeting'),
 ('user-nico-van-rooyen','opportunity-finder','Opportunity Finder'),
 ('user-nico-van-rooyen','presentation-pro','Presentation Pro'),
 ('user-nico-van-rooyen','proposal-pro','Proposal Pro')
ON CONFLICT (user_id, achievement_key) DO NOTHING;

INSERT INTO user_rewards (user_id, reward_key, reward_name, required_level, required_xp, status) VALUES
 ('user-nico-van-rooyen','top-performer','Top Performer',8,10000,'locked'),
 ('user-nico-van-rooyen','dji-mavic-3','DJI Mavic 3 Sales Certification',8,10000,'locked')
ON CONFLICT (user_id, reward_key) DO NOTHING;
