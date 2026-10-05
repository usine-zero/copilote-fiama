import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createSyncServer} from '../server/sync-server.mjs';
const dir=await mkdtemp(join(tmpdir(),'obina-sync-'));const token='test-token-46';
const server=createSyncServer({token,dataDir:dir,allowedOrigins:'http://example.test'});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const {port}=server.address();const base=`http://127.0.0.1:${port}`;
try{
  let r=await fetch(`${base}/health`);assert.equal(r.status,200);assert.equal((await r.json()).build,'46');
  r=await fetch(`${base}/api/restaurants/resto-01/state`);assert.equal(r.status,401);
  const h={authorization:`Bearer ${token}`,'content-type':'application/json'};
  r=await fetch(`${base}/api/restaurants/resto-01/state`,{headers:{authorization:`Bearer ${token}`}});assert.equal(r.status,404);
  r=await fetch(`${base}/api/restaurants/resto-01/state`,{method:'PUT',headers:h,body:JSON.stringify({state:{service:{open:true}},deviceId:'phone',baseVersion:null})});assert.equal(r.status,200);let d=await r.json();assert.equal(d.version,1);
  r=await fetch(`${base}/api/restaurants/resto-01/state`,{headers:{authorization:`Bearer ${token}`}});d=await r.json();assert.equal(d.version,1);assert.equal(d.state.service.open,true);
  r=await fetch(`${base}/api/restaurants/resto-01/state`,{method:'PUT',headers:h,body:JSON.stringify({state:{service:{open:false}},deviceId:'tablet',baseVersion:null})});assert.equal(r.status,409);assert.equal((await r.json()).currentVersion,1);
  r=await fetch(`${base}/api/restaurants/resto-01/state`,{method:'PUT',headers:h,body:JSON.stringify({state:{service:{open:false}},deviceId:'tablet',baseVersion:1})});d=await r.json();assert.equal(r.status,200);assert.equal(d.version,2);
  r=await fetch(`${base}/api/restaurants/resto-01/state`,{method:'OPTIONS',headers:{origin:'http://example.test'}});assert.equal(r.status,204);assert.equal(r.headers.get('access-control-allow-origin'),'http://example.test');
  console.log('sync-server: 15 assertions PASS');
} finally {await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}