import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
const root=process.cwd(),output=path.resolve(process.argv[2]||'../development-v2-audit');fs.mkdirSync(output,{recursive:true});
const inventory=[],findings=[],syntax=[];
const patterns=[['browser-storage-write',/localStorage\.setItem|sessionStorage\.setItem/],['global-api-override',/window\.fetch\s*=|Storage\.prototype\.[\w]+\s*=/],['interval',/setInterval\s*\(/],['observer',/new MutationObserver/],['html-write',/\.innerHTML\s*=/],['client-credential-verifier',/passwordSha256\s*:/],['dynamic-code',/\beval\s*\(|new Function\s*\(/]];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules'].includes(entry.name))continue;const p=path.join(dir,entry.name);if(entry.isDirectory()){walk(p);continue;}const rel=path.relative(root,p).replaceAll('\\','/');if(!/\.(js|mjs|ts|css|html|py|sql|json|md|yml|yaml)$/.test(rel))continue;const buffer=fs.readFileSync(p),source=buffer.toString('utf8'),lines=source.split(/\r?\n/);const vendor=/vendor|three\.mjs|three.core\.mjs/.test(rel);inventory.push({path:rel,bytes:buffer.length,lines:lines.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex'),vendor});if(vendor)continue;lines.forEach((line,i)=>{for(const [category,pattern]of patterns)if(pattern.test(line))findings.push({path:rel,line:i+1,category});});if(rel.endsWith('.js')&&!/^\s*(import|export)\b/m.test(source)){try{new vm.Script(source,{filename:rel});}catch(error){syntax.push({path:rel,error:error.message});}}}}
walk(root);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'AG WORLD/boot/v1/source-order.json'),'utf8'));
const report={method:'Every line scanned by the listed static rules; parse checks for classic JavaScript. Findings are review candidates, not proof of vulnerabilities. Manual review and browser coverage are recorded separately.',files:inventory.length,lines:inventory.reduce((n,f)=>n+f.lines,0),authoredLines:inventory.filter(f=>!f.vendor).reduce((n,f)=>n+f.lines,0),runtimeSources:manifest.length,syntaxFailures:syntax,categories:Object.fromEntries(patterns.map(([category])=>[category,findings.filter(f=>f.category===category).length])),inventory,findings};
fs.writeFileSync(path.join(output,'source-inventory.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,inventory:undefined,findings:undefined},null,2));
if(syntax.length)process.exitCode=1;
