import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const app=new URL('../../AG WORLD/',import.meta.url),catalogue=JSON.parse(fs.readFileSync(new URL('builds/agriculture/missions/mission-catalogue.json',app),'utf8'));
const client=fs.readFileSync(new URL('player-progression-v27.js',app),'utf8'),sql=fs.readFileSync(new URL('server/development-v2.sql',app),'utf8');
test('UI and transaction agree on ordered missions, owners and XP',()=>{
 const ui=JSON.parse(client.match(/const CHAPTERS=([\s\S]+?);\s*let db,user/)[1]);
 const server=JSON.parse(sql.match(/\$catalog\$([\s\S]+?)\$catalog\$/)[1]);
 assert.deepEqual(ui,catalogue);assert.deepEqual(server,catalogue.flatMap(c=>c.missions.map(m=>({...m,chapter:c.id}))));
 const ids=server.map(m=>m.id);assert.equal(new Set(ids).size,ids.length);
 assert.equal(server[0].owner,'system-administrator');assert.ok(server.slice(1,5).every(m=>m.owner==='compliance'));assert.ok(catalogue[1].missions.every(m=>m.owner==='product'));assert.ok(catalogue[2].missions.every(m=>m.owner==='sales'));
});
