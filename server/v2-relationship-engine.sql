-- AG World V2 Relationship Engine
CREATE TABLE IF NOT EXISTS entity_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id text NOT NULL,
  source_entity_type text,
  relationship_type text NOT NULL,
  target_entity_id text NOT NULL,
  target_entity_type text,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (source_entity_id <> target_entity_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_relationships_source
  ON entity_relationships(source_entity_id);

CREATE INDEX IF NOT EXISTS idx_entity_relationships_target
  ON entity_relationships(target_entity_id);

CREATE INDEX IF NOT EXISTS idx_entity_relationships_type
  ON entity_relationships(relationship_type);

CREATE UNIQUE INDEX IF NOT EXISTS uq_entity_relationship_active
  ON entity_relationships(source_entity_id, relationship_type, target_entity_id)
  WHERE status = 'active';