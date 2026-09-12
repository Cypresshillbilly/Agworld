import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { registerV2RelationshipRoutes } from './v2-relationship-routes.js';
import { playerAuthorization } from './player-auth.js';

const { Pool } = pg;
const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false } });
const PORT = Number(process.env.PORT || 8080);
app.use('/api',playerAuthorization(pool));

// V2.6 Relationship Engine: register before feature routes so relationships are available to all entity types.
registerV2RelationshipRoutes(app, pool);

async function ensureV2RelationshipSchema() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  await pool.query(`CREATE TABLE IF NOT EXISTS entity_relationships (
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
  )`);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_entity_relationships_source ON entity_relationships(source_entity_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_entity_relationships_target ON entity_relationships(target_entity_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_entity_relationships_type ON entity_relationships(relationship_type)');
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uq_entity_relationship_active ON entity_relationships(source_entity_id, relationship_type, target_entity_id) WHERE status = 'active'`);
  console.log('V2 relationship schema ready');
}


const allowedTypes = new Set(['crop-field','dam','building','tractor','drone','competitor-drone','competitor drone','our drone','livestock-area','irrigation']);
const point = p => `SRID=4326;POINT(${Number(p.lng)} ${Number(p.lat)})`;
const polygon = ring => { const coords=ring.map(p=>`${Number(p.lng)} ${Number(p.lat)}`).join(','); const first=ring[0],last=ring[ring.length-1]; const closed=first.lat===last.lat&&first.lng===last.lng; return `SRID=4326;POLYGON((${coords}${closed?'':`,${Number(first.lng)} ${Number(first.lat)}`}))`; };
function validateBoundary(boundary){if(!Array.isArray(boundary)||boundary.length<3)throw new Error('boundary requires at least 3 points');boundary.forEach(p=>{if(!Number.isFinite(Number(p.lat))||!Number.isFinite(Number(p.lng)))throw new Error('invalid boundary coordinate');});}
function farmPayload(body={}){validateBoundary(body.boundary);if(!body.id||!body.name)throw new Error('id and name are required');const center=body.center||body.boundary.reduce((a,p)=>({lat:a.lat+Number(p.lat)/body.boundary.length,lng:a.lng+Number(p.lng)/body.boundary.length}),{lat:0,lng:0});return {...body,center,boundary:body.boundary.map(p=>({lat:Number(p.lat),lng:Number(p.lng)})),crops:Array.isArray(body.crops)?body.crops:[]};}
app.get('/api/health',async(_req,res)=>{try{await pool.query('SELECT 1');res.json({ok:true});}catch(e){res.status(503).json({ok:false,error:'database unavailable'});}});

// Live user data used by the profile/footer. No presentation metrics are hard-coded in the client.
app.get('/api/users/:id/profile',async(req,res)=>{try{const u=(await pool.query(`SELECT id,username,full_name,role,territory,level,xp,xp_to_next_level,controlled_farms,opportunities,drone_fleet,territory_control,regional_position,national_position,profile_image,status FROM users WHERE id=$1`,[req.params.id])).rows[0];if(!u)return res.status(404).json({error:'user not found'});const achievements=(await pool.query(`SELECT achievement_key,achievement_name,unlocked_at FROM user_achievements WHERE user_id=$1 ORDER BY unlocked_at`,[u.id])).rows;const rewards=(await pool.query(`SELECT reward_key,reward_name,required_level,required_xp,status,unlocked_at FROM user_rewards WHERE user_id=$1 ORDER BY required_xp NULLS LAST,reward_name`,[u.id])).rows;res.json({id:u.id,username:u.username,fullName:u.full_name,role:u.role,territory:u.territory,level:u.level,xp:u.xp,xpToNextLevel:u.xp_to_next_level,controlledFarms:u.controlled_farms,opportunities:u.opportunities,droneFleet:u.drone_fleet,territoryControl:Number(u.territory_control||0),regionalPosition:u.regional_position,nationalPosition:u.national_position,profileImage:u.profile_image,status:u.status,achievements,rewards});}catch(e){console.error(e);res.status(500).json({error:'failed to load user profile'});}});
app.get('/api/users/:id/leaderboard',async(req,res)=>{try{const u=(await pool.query('SELECT territory FROM users WHERE id=$1',[req.params.id])).rows[0];if(!u)return res.status(404).json({error:'user not found'});const rows=(await pool.query(`SELECT id,full_name,level,xp,territory FROM users WHERE status='active' AND territory=$1 ORDER BY xp DESC,full_name LIMIT 10`,[u.territory])).rows;res.json({territory:u.territory,leaders:rows.map((r,i)=>({id:r.id,name:r.full_name,level:r.level,xp:r.xp,position:i+1}))});}catch(e){console.error(e);res.status(500).json({error:'failed to load leaderboard'});}});

app.get('/api/farms',async(req,res)=>{try{const values=[],where=[];if(req.query.region){values.push(req.query.region);where.push(`region=$${values.length}`);}if(req.query.status){values.push(req.query.status);where.push(`status=$${values.length}`);}const sql=`SELECT id,name,owner,region,status,annual_harvest,last_service,opportunity_score,source,notes,ST_Y(center) latitude,ST_X(center) longitude,ST_AsGeoJSON(boundary)::json boundary_geo FROM farms ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY opportunity_score DESC,name`;const {rows}=await pool.query(sql,values);const ids=rows.map(r=>r.id);if(!ids.length)return res.json({farms:[]});const objects=await pool.query(`SELECT id,farm_id,object_type,name,ST_Y(position) latitude,ST_X(position) longitude,source,properties FROM farm_objects WHERE farm_id=ANY($1::text[])`,[ids]);const crops=await pool.query(`SELECT farm_id,crop_type,hectares,season,ST_AsGeoJSON(geometry)::json geometry FROM farm_crops WHERE farm_id=ANY($1::text[])`,[ids]);const byFarm=new Map(ids.map(id=>[id,{objects:[],crops:[]}])) ;objects.rows.forEach(o=>byFarm.get(o.farm_id)?.objects.push({id:o.id,type:o.object_type,name:o.name,position:{lat:Number(o.latitude),lng:Number(o.longitude)},source:o.source,properties:o.properties||{}}));crops.rows.forEach(c=>byFarm.get(c.farm_id)?.crops.push(c));res.json({farms:rows.map(r=>({id:r.id,name:r.name,owner:r.owner,region:r.region,status:r.status,annualHarvest:r.annual_harvest,lastService:r.last_service,opportunityScore:Number(r.opportunity_score||0),source:r.source,notes:r.notes,center:{lat:Number(r.latitude),lng:Number(r.longitude)},boundary:r.boundary_geo?.coordinates?.[0]?.map(c=>({lat:c[1],lng:c[0]}))||[],...byFarm.get(r.id)}))});}catch(e){console.error(e);res.status(500).json({error:'failed to load farms'});}});
app.get('/api/farms/:id',async(req,res)=>{try{const {rows}=await pool.query(`SELECT id,name,owner,region,status,annual_harvest,last_service,opportunity_score,source,notes,ST_Y(center) latitude,ST_X(center) longitude,ST_AsGeoJSON(boundary)::json boundary_geo FROM farms WHERE id=$1`,[req.params.id]);if(!rows[0])return res.status(404).json({error:'farm not found'});const f=rows[0];const o=await pool.query('SELECT id,object_type,name,ST_Y(position) lat,ST_X(position) lng,source,properties FROM farm_objects WHERE farm_id=$1',[req.params.id]);const c=await pool.query('SELECT id,crop_type,hectares,season,ST_AsGeoJSON(geometry)::json geometry FROM farm_crops WHERE farm_id=$1 ORDER BY id',[req.params.id]);const boundary=f.boundary_geo?.coordinates?.[0]?.map(x=>({lat:x[1],lng:x[0]}))||[];res.json({id:f.id,name:f.name,owner:f.owner,region:f.region,status:f.status,annualHarvest:f.annual_harvest,lastService:f.last_service,opportunityScore:Number(f.opportunity_score||0),source:f.source,notes:f.notes,center:{lat:Number(f.latitude),lng:Number(f.longitude)},boundary,objects:o.rows.map(x=>({id:x.id,type:x.object_type,name:x.name,position:{lat:Number(x.lat),lng:Number(x.lng)},source:x.source,properties:x.properties||{}})),crops:c.rows});}catch(e){console.error(e);res.status(500).json({error:'failed to load farm'});}});
app.post('/api/farms',async(req,res)=>{let f,client;try{f=farmPayload(req.body);}catch(e){return res.status(400).json({error:e.message});}try{client=await pool.connect();await client.query('BEGIN');await client.query(`INSERT INTO farms(id,name,owner,region,status,boundary,center,annual_harvest,last_service,opportunity_score,source,notes) VALUES($1,$2,$3,$4,$5,ST_GeomFromText($6,4326),ST_GeomFromText($7,4326),$8,$9,$10,$11,$12)`,[f.id,f.name,f.owner||null,f.region||null,f.status||'Prospect',polygon(f.boundary),point(f.center),f.annualHarvest||null,f.lastService||null,Number(f.opportunityScore||0),f.source||'manual',f.notes||null]);for(const o of(f.objects||[])){if(!o?.id||!allowedTypes.has(o.type)||!o.position||!Number.isFinite(Number(o.position.lat))||!Number.isFinite(Number(o.position.lng))){console.warn('Skipping legacy farm object with no valid map position',o?.id||o?.type);continue;}await client.query(`INSERT INTO farm_objects(id,farm_id,object_type,name,position,source,properties) VALUES($1,$2,$3,$4,ST_GeomFromText($5,4326),$6,$7)`,[o.id,f.id,o.type,o.name||null,point(o.position),o.source||'manual',o.properties||{}]);}await client.query(`INSERT INTO farm_audit(farm_id,action,actor_id,source,after_state) VALUES($1,'created',$2,$3,$4)`,[f.id,req.get('x-actor-id')||null,'api',f]);await client.query('COMMIT');res.status(201).json({id:f.id});}catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});console.error(e);res.status(client?400:503).json({error:client?'could not save farm':'database unavailable'});}finally{client?.release();}});
app.patch('/api/farms/:id',async(req,res)=>{let f,client;try{f=farmPayload({...req.body,id:req.params.id});}catch(e){return res.status(400).json({error:e.message});}try{client=await pool.connect();await client.query('BEGIN');const old=await client.query('SELECT row_to_json(farms) state FROM farms WHERE id=$1',[req.params.id]);if(!old.rows[0]){await client.query('ROLLBACK');return res.status(404).json({error:'farm not found'});}await client.query(`UPDATE farms SET name=$2,owner=$3,region=$4,status=$5,boundary=ST_GeomFromText($6,4326),center=ST_GeomFromText($7,4326),annual_harvest=$8,last_service=$9,opportunity_score=$10,notes=$11,updated_at=now() WHERE id=$1`,[req.params.id,f.name,f.owner||null,f.region||null,f.status||'Prospect',polygon(f.boundary),point(f.center),f.annualHarvest||null,f.lastService||null,Number(f.opportunityScore||0),f.notes||null]);await client.query(`INSERT INTO farm_audit(farm_id,action,actor_id,source,before_state,after_state) VALUES($1,'updated',$2,'api',$3,$4)`,[req.params.id,req.get('x-actor-id')||null,old.rows[0].state,f]);await client.query('COMMIT');res.json({id:req.params.id});}catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});res.status(client?400:503).json({error:client?'could not update farm':'database unavailable'});}finally{client?.release();}});
app.post('/api/farms/:id/objects',async(req,res)=>{const o=req.body;if(!allowedTypes.has(o.type)||!o.id||!o.position)return res.status(400).json({error:'valid id, type and position required'});try{await pool.query(`INSERT INTO farm_objects(id,farm_id,object_type,name,position,source,properties) VALUES($1,$2,$3,$4,ST_GeomFromText($5,4326),$6,$7)`,[o.id,req.params.id,o.type,o.name||null,point(o.position),o.source||'manual',o.properties||{}]);await pool.query(`INSERT INTO farm_audit(farm_id,action,actor_id,source,after_state) VALUES($1,'object_created',$2,'api',$3)`,[req.params.id,req.get('x-actor-id')||null,o]);res.status(201).json(o);}catch(e){res.status(400).json({error:e.message});}});

// V2.6 authenticated acceptance endpoint. This keeps database access private
// while allowing an end-to-end relationship lifecycle test through the API.
app.post('/api/v2/relationships/acceptance-test', async (req, res) => {
  const token = req.get('x-agworld-admin-token');
  if (!process.env.AGWORLD_ADMIN_TOKEN || token !== process.env.AGWORLD_ADMIN_TOKEN) {
    return res.status(403).json({ error: 'forbidden' });
  }

  const client = await pool.connect();
  try {
    const farms = (await client.query('SELECT id,name FROM farms ORDER BY id LIMIT 2')).rows;
    if (farms.length < 2) return res.status(409).json({ error: 'at least two farms are required' });

    const [a,b] = farms;
    await client.query('BEGIN');

    const created = (await client.query(
      `INSERT INTO entity_relationships
       (source_entity_id,source_entity_type,relationship_type,target_entity_id,target_entity_type,status,metadata)
       VALUES($1,'farm','associated_with',$2,'farm','active',$3)
       RETURNING id,status,created_at`,
      [a.id,b.id,{ source:'v2.6 acceptance test', temporary:true }]
    )).rows[0];

    const retrieved = (await client.query(
      `SELECT id FROM entity_relationships
       WHERE id=$1 AND status='active'
         AND (source_entity_id=$2 OR target_entity_id=$2)`,
      [created.id,a.id]
    )).rows[0];

    const deactivated = (await client.query(
      `UPDATE entity_relationships
       SET status='inactive',updated_at=now()
       WHERE id=$1 AND status='active'
       RETURNING id,status`,
      [created.id]
    )).rows[0];

    const activeAfterDeactivate = (await client.query(
      `SELECT id FROM entity_relationships WHERE id=$1 AND status='active'`,
      [created.id]
    )).rows.length;

    const retainedInactive = (await client.query(
      `SELECT id,status FROM entity_relationships WHERE id=$1 AND status='inactive'`,
      [created.id]
    )).rows[0];

    await client.query('COMMIT');

    const passed = Boolean(retrieved && deactivated && activeAfterDeactivate === 0 && retainedInactive);
    res.json({
      passed,
      farms: { source:a, target:b },
      lifecycle: {
        created: Boolean(created),
        retrieved: Boolean(retrieved),
        deactivated: Boolean(deactivated),
        confirmedInactive: activeAfterDeactivate === 0,
        retainedInactive: Boolean(retainedInactive)
      }
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('V2.6 acceptance test failed', error);
    res.status(500).json({ error: 'acceptance test failed', detail: error.message });
  } finally {
    client.release();
  }
});

ensureV2RelationshipSchema().then(() => {
  app.listen(PORT,()=>console.log(`AG World API listening on ${PORT}`));
}).catch(error => {
  console.error('Failed to initialise V2 relationship schema', error);
  process.exit(1);
});
