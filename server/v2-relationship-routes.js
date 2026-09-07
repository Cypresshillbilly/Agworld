import { randomUUID } from 'crypto';

export function registerV2RelationshipRoutes(app, pool) {
  const base = '/api/v2/relationships';

  app.get(base, async (req, res) => {
    try {
      const entityId = req.query.entityId;
      const values = [];
      const where = ["status='active'"];

      if (entityId) {
        values.push(entityId);
        where.push(`(source_entity_id=$${values.length} OR target_entity_id=$${values.length})`);
      }

      const { rows } = await pool.query(
        `SELECT id,source_entity_id "sourceEntityId",source_entity_type "sourceEntityType",
                relationship_type "relationshipType",target_entity_id "targetEntityId",
                target_entity_type "targetEntityType",status,metadata,
                created_at "createdAt",updated_at "updatedAt"
           FROM entity_relationships
          WHERE ${where.join(' AND ')}
          ORDER BY created_at DESC`,
        values
      );
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'failed to load relationships' });
    }
  });

  app.post(base, async (req, res) => {
    const body = req.body || {};
    if (!body.sourceEntityId || !body.targetEntityId || !body.relationshipType) {
      return res.status(400).json({ error: 'sourceEntityId, targetEntityId and relationshipType are required' });
    }
    if (body.sourceEntityId === body.targetEntityId) {
      return res.status(400).json({ error: 'an entity cannot relate to itself' });
    }

    try {
      const id = body.id || randomUUID();
      const { rows } = await pool.query(
        `INSERT INTO entity_relationships
          (id,source_entity_id,source_entity_type,relationship_type,target_entity_id,target_entity_type,status,metadata,created_by)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING id,source_entity_id "sourceEntityId",source_entity_type "sourceEntityType",
                   relationship_type "relationshipType",target_entity_id "targetEntityId",
                   target_entity_type "targetEntityType",status,metadata,
                   created_at "createdAt",updated_at "updatedAt"`,
        [id,body.sourceEntityId,body.sourceEntityType||null,body.relationshipType,
         body.targetEntityId,body.targetEntityType||null,body.status||'active',
         body.metadata||{},req.get('x-actor-id')||null]
      );
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  });

  app.delete(base + '/:id', async (req, res) => {
    try {
      const { rowCount } = await pool.query(
        `UPDATE entity_relationships
            SET status='inactive',updated_at=now()
          WHERE id=$1 AND status='active'`,
        [req.params.id]
      );
      if (!rowCount) return res.status(404).json({ error: 'relationship not found' });
      res.status(204).end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'failed to remove relationship' });
    }
  });
}