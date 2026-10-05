import http from 'node:http';
import {mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import crypto from 'node:crypto';

const BUILD='46';
const MAX_BODY=2_000_000;
const ID_RE=/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/;

function json(res,status,data,headers={}){
  res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...headers});
  res.end(JSON.stringify(data));
}
function authOk(req,token){
  const h=req.headers.authorization||'';
  if(!token||!h.startsWith('Bearer '))return false;
  const got=Buffer.from(h.slice(7));const want=Buffer.from(token);
  return got.length===want.length&&crypto.timingSafeEqual(got,want);
}
function cors(origin,allowed){
  if(!origin)return {};
  const list=String(allowed||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(list.includes('*')||list.includes(origin))return {'access-control-allow-origin':origin,'vary':'origin'};
  return null;
}
async function readBody(req){
  let size=0;const chunks=[];
  for await (const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw Object.assign(new Error('too_large'),{code:413});chunks.push(chunk)}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}')}catch{throw Object.assign(new Error('invalid_json'),{code:400})}
}
async function loadRecord(file){
  try{return JSON.parse(await readFile(file,'utf8'))}catch(e){if(e?.code==='ENOENT')return null;throw e}
}
async function saveAtomic(file,data){
  const tmp=`${file}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp,JSON.stringify(data),'utf8');await rename(tmp,file);
}
export function createSyncServer({token=process.env.OBINA_SYNC_TOKEN,dataDir=process.env.OBINA_SYNC_DIR||'.obina-sync-data',allowedOrigins=process.env.OBINA_SYNC_ALLOWED_ORIGINS||''}={}){
  return http.createServer(async(req,res)=>{
    const origin=req.headers.origin||'';const ch=cors(origin,allowedOrigins);
    if(origin&&!ch)return json(res,403,{error:'origin_not_allowed'});
    if(req.method==='OPTIONS'){
      res.writeHead(204,{...ch,'access-control-allow-methods':'GET, PUT, OPTIONS','access-control-allow-headers':'authorization, content-type','access-control-max-age':'600'});return res.end();
    }
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/health'&&req.method==='GET')return json(res,200,{app:'OBINA-RESTAURANT-SYNC',build:BUILD,status:'ok'},ch||{});
    const m=url.pathname.match(/^\/api\/restaurants\/([^/]+)\/state$/);
    if(!m)return json(res,404,{error:'not_found'},ch||{});
    const id=decodeURIComponent(m[1]);if(!ID_RE.test(id))return json(res,400,{error:'invalid_restaurant_id'},ch||{});
    if(!authOk(req,token))return json(res,401,{error:'unauthorized'},ch||{});
    try{
      await mkdir(dataDir,{recursive:true});const file=join(dataDir,`${id}.json`);const current=await loadRecord(file);
      if(req.method==='GET'){
        if(!current)return json(res,404,{error:'not_found'},ch||{});
        return json(res,200,{restaurantId:id,version:current.version,updatedAt:current.updatedAt,deviceId:current.deviceId,state:current.state},ch||{});
      }
      if(req.method!=='PUT')return json(res,405,{error:'method_not_allowed'},ch||{});
      const body=await readBody(req);
      if(!body||typeof body.state!=='object'||body.state===null||Array.isArray(body.state))return json(res,400,{error:'invalid_state'},ch||{});
      const base=body.baseVersion??null;const currentVersion=current?.version??null;
      if(current&&base!==currentVersion)return json(res,409,{error:'version_conflict',currentVersion},ch||{});
      if(!current&&base!==null)return json(res,409,{error:'version_conflict',currentVersion:null},ch||{});
      const next={version:(currentVersion||0)+1,updatedAt:new Date().toISOString(),deviceId:String(body.deviceId||'unknown').slice(0,128),state:body.state};
      await saveAtomic(file,next);return json(res,200,{ok:true,restaurantId:id,version:next.version,updatedAt:next.updatedAt},ch||{});
    }catch(e){
      if(e?.code===413)return json(res,413,{error:'request_too_large'},ch||{});
      if(e?.code===400)return json(res,400,{error:'invalid_json'},ch||{});
      return json(res,500,{error:'server_error'},ch||{});
    }
  });
}

if(import.meta.url===pathToFileURL(process.argv[1]||'').href){
  const token=process.env.OBINA_SYNC_TOKEN;
  if(!token){console.error('OBINA_SYNC_TOKEN obligatoire.');process.exit(1)}
  const port=Number(process.env.PORT||8787);const host=process.env.HOST||'127.0.0.1';
  createSyncServer({token}).listen(port,host,()=>console.log(`OBINA Restaurant Sync BUILD ${BUILD} sur http://${host}:${port}`));
}