import assert from 'node:assert/strict';
import fs from 'node:fs';

// Check the real module graph. A source inventory alone cannot catch a CDN 404.
const adapter=fs.readFileSync(new URL('./three.mjs',import.meta.url),'utf8');
const entry=adapter.match(/from '([^']+)'/)[1];
const seen=new Set();
async function check(url){
  if(seen.has(url))return;
  seen.add(url);
  const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
  assert.equal(response.ok,true,`${url}: HTTP ${response.status}`);
  const source=await response.text();
  assert.match(response.headers.get('content-type'),/javascript/);
  assert.ok(source.length>100,'Dependency response is empty');
  for(const match of source.matchAll(/\bfrom\s*["'](\.[^"']+)["']/g)) await check(new URL(match[1],url).href);
}
await check(entry);
console.log(`Three r178 dependency graph available: ${seen.size} modules`);
