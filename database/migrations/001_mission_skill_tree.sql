-- AG World mission / skill-tree progression model
-- Each mission can award profile XP plus one or more skill-specific stars.

CREATE TABLE IF NOT EXISTS missions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT,
  profile_xp INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS missions_active_idx ON missions(active);

CREATE TABLE IF NOT EXISTS mission_skill_rewards (
  id BIGSERIAL PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  skill_key TEXT NOT NULL CHECK (skill_key IN (
    'technical-knowledge',
    'operational-knowledge',
    'product-knowledge',
    'management-skills',
    'people-skills'
  )),
  stars INTEGER NOT NULL DEFAULT 0 CHECK (stars >= 0),
  UNIQUE(mission_id, skill_key)
);

CREATE INDEX IF NOT EXISTS mission_skill_rewards_mission_idx ON mission_skill_rewards(mission_id);
CREATE INDEX IF NOT EXISTS mission_skill_rewards_skill_idx ON mission_skill_rewards(skill_key);

CREATE TABLE IF NOT EXISTS user_mission_completions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  profile_xp_awarded INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id)
);

CREATE INDEX IF NOT EXISTS user_mission_completions_user_idx ON user_mission_completions(user_id, completed_at DESC);

-- Snapshot of skill stars earned by a user. This is derived from completed missions,
-- rather than being manually editable, so the Skill Tree always reflects mission history.
CREATE OR REPLACE VIEW user_skill_progress AS
SELECT
  u.id AS user_id,
  s.skill_key,
  s.skill_name,
  COALESCE(SUM(msr.stars), 0)::INTEGER AS stars
FROM users u
CROSS JOIN (
  VALUES
    ('technical-knowledge', 'Technical knowledge'),
    ('operational-knowledge', 'Operational knowledge'),
    ('product-knowledge', 'Product Knowledge'),
    ('management-skills', 'Management skills'),
    ('people-skills', 'People skills')
) AS s(skill_key, skill_name)
LEFT JOIN user_mission_completions umc ON umc.user_id = u.id
LEFT JOIN mission_skill_rewards msr ON msr.mission_id = umc.mission_id AND msr.skill_key = s.skill_key
GROUP BY u.id, s.skill_key, s.skill_name;

-- Initial missions. Profile XP is separate from skill stars: completing a mission
-- contributes to the user's overall level AND to the relevant Skill Tree branches.
INSERT INTO missions (id,title,description,category,priority,profile_xp) VALUES
  ('mission-top-client-meeting','Set Meeting with Top Client','Schedule and complete a face-to-face meeting with a top client in your area.','CLIENT','HIGH',150),
  ('mission-follow-up-opportunity','Follow Up Opportunity','Follow up on an active opportunity and move it to the next stage.','PIPELINE','HIGH',180),
  ('mission-dji-repair-assessment','DJI Repair Assessment','Complete the next technical knowledge challenge to improve your support handover skill.','SKILL','OPTIONAL',120)
ON CONFLICT (id) DO UPDATE SET
  title=EXCLUDED.title,
  description=EXCLUDED.description,
  category=EXCLUDED.category,
  priority=EXCLUDED.priority,
  profile_xp=EXCLUDED.profile_xp,
  updated_at=now();

-- A mission may award stars to multiple skills.
INSERT INTO mission_skill_rewards (mission_id,skill_key,stars) VALUES
  ('mission-top-client-meeting','people-skills',2),
  ('mission-top-client-meeting','management-skills',1),
  ('mission-follow-up-opportunity','management-skills',2),
  ('mission-follow-up-opportunity','people-skills',1),
  ('mission-follow-up-opportunity','product-knowledge',1),
  ('mission-dji-repair-assessment','technical-knowledge',3),
  ('mission-dji-repair-assessment','product-knowledge',1)
ON CONFLICT (mission_id,skill_key) DO UPDATE SET stars=EXCLUDED.stars;
