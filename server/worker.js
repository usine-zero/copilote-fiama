// COPILOTE FIAMA — Brain Gateway
const FIAMA_BUILD='44';
// Secure boundary only. No AI provider is enabled by default.
// This file is designed for a server/edge worker, NEVER for the iPhone client.

const ALLOWED_LANG = new Set(['fr','es','en']);
const ALLOWED_INTENT = new Set(['conversation','urgent','challenge','simulation','language','safety']);
const MAX_REQUEST_BYTES=24000;
const RATE_WINDOW_MS=60_000, RATE_MAX=20;
const buckets=new Map();
function allowedRate(key){const now=Date.now();const b=buckets.get(key)||{start:now,n:0};if(now-b.start>RATE_WINDOW_MS){b.start=now;b.n=0}b.n++;buckets.set(key,b);return b.n<=RATE_MAX;}
function corsHeaders(origin,env){const allowed=(env?.FIAMA_ALLOWED_ORIGIN||'').trim();const ok=allowed && origin===allowed;return ok?{'access-control-allow-origin':origin,'vary':'origin'}:{};}
function reqId(){return crypto.randomUUID?crypto.randomUUID():String(Date.now())}

function json(data,status=200,extra={}){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','permissions-policy':'camera=(), geolocation=(), payment=()','cross-origin-resource-policy':'same-site',...extra}})}
function validRequest(x){
 return x && x.schema==='fiama.brain.request.v1' && ALLOWED_LANG.has(x.language) && ALLOWED_INTENT.has(x.intent) &&
 typeof x.message==='string' && x.message.length>0 && x.message.length<=6000 &&
 (x.profile===undefined || (typeof x.profile==='string' && x.profile.length<=1000)) &&
 (x.contextSharing===undefined || typeof x.contextSharing==='boolean') &&
 (!x.authorizedMemory || (Array.isArray(x.authorizedMemory)&&x.authorizedMemory.length<=3&&x.authorizedMemory.every(m=>m&&typeof m==='object'&&typeof m.text==='string'&&m.text.length<=500))) &&
 (x.contextSharing===true || ((!x.profile || x.profile==='') && (!x.authorizedMemory || x.authorizedMemory.length===0)));
}
export default {async fetch(request,env){
 const id=reqId(), origin=request.headers.get('origin')||'';
 const cors=corsHeaders(origin,env);
 if(request.method==='OPTIONS'){if(!Object.keys(cors).length)return json({error:'origin_not_allowed',requestId:id},403);return new Response(null,{status:204,headers:{...cors,'access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type'}})}
 if(request.method==='GET' && new URL(request.url).pathname.endsWith('/health')) return json({app:'COPILOTE-FIAMA-BRAIN-GATEWAY',build:FIAMA_BUILD,status:'ok',remoteBrainEnabled:env?.FIAMA_REMOTE_BRAIN_ENABLED==='true'},200,cors);
 if(request.method!=='POST') return json({error:'method_not_allowed',requestId:id},405,cors);
 if(env?.FIAMA_ALLOWED_ORIGIN && !Object.keys(cors).length)return json({error:'origin_not_allowed',requestId:id},403);
 const ip=request.headers.get('cf-connecting-ip')||'unknown'; if(!allowedRate(ip))return json({error:'rate_limited',requestId:id},429,cors);
 const len=Number(request.headers.get('content-length')||0);if(len>MAX_REQUEST_BYTES)return json({error:'request_too_large',requestId:id},413,cors);
 let raw;try{raw=await request.text()}catch{return json({error:'invalid_body',requestId:id},400,cors)};if(raw.length>MAX_REQUEST_BYTES)return json({error:'request_too_large',requestId:id},413,cors);
 let body; try{body=JSON.parse(raw)}catch{return json({error:'invalid_json',requestId:id},400,cors)}
 if(!validRequest(body)) return json({error:'invalid_request',requestId:id},400,cors);
 // Hard cost lock: remote generation cannot run unless explicitly enabled server-side.
 if(env?.FIAMA_REMOTE_BRAIN_ENABLED!=='true') return json({
  schema:'fiama.brain.response.v1', reply:'', uncertainty:'unavailable', safetyFlag:false,
  memoryProposal:null, engineStatus:'disabled_zero_cost_lock', requestId:id
 },503,cors);
 // Provider adapter intentionally absent in the current build. A future adapter must live server-side,
 // enforce a hard usage ceiling, validate output, and never expose secrets to the iPhone.
 return json({error:'provider_not_configured',requestId:id},503,cors);
}};
