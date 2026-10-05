import {parseRestaurantCommand, summarizeCommand, VOICE_EXAMPLES, normalizeVoice} from './voice-engine.js';

const BUILD='46';
const STORAGE_KEY='fiama-restaurant-v1';
const nowIso=()=>new Date().toISOString();
const uid=(p='x')=>`${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const escapeHtml=(v='')=>String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmtTime=(iso)=>{if(!iso)return '—';try{return new Intl.DateTimeFormat('fr-CH',{hour:'2-digit',minute:'2-digit'}).format(new Date(iso))}catch{return '—'}};
const localDateKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const todayKey=()=>localDateKey(new Date());
const dateFromHint=(hint)=>{const d=new Date();if(hint==='tomorrow')d.setDate(d.getDate()+1);if(hint==='day-after-tomorrow')d.setDate(d.getDate()+2);return localDateKey(d)};

const NAV=[
  ['dashboard','🏠','Aujourd’hui'],['floor','🪑','Salle'],['orders','🧾','Commandes'],['kitchen','🍳','Cuisine'],
  ['reservations','📒','Réservations'],['customers','🤝','Clients'],['stock','📦','Stocks'],['recipes','📚','Recettes'],
  ['team','👥','Équipe'],['planning','🗓️','Planning'],['tasks','✅','Tâches'],['cash','💳','Caisse'],
  ['direction','📈','Direction'],['training','🎓','Formation'],['checklists','🧼','Contrôles'],['incidents','⚠️','Incidents'],
  ['studio','📸','Studio'],['reports','📊','Rapports'],['settings','⚙️','Réglages']
];

const STATUS_LABEL={free:'Libre',reserved:'Réservée',occupied:'Occupée',ordered:'Commandée',served:'Servie',bill:'Addition',dirty:'À nettoyer'};
const STATUS_CLASS={free:'ok',reserved:'',occupied:'warn',ordered:'',served:'ok',bill:'danger',dirty:''};
const PRESETS={
  natural:{label:'Naturel',filter:'brightness(1.04) contrast(1.04) saturate(1.05)'},
  menu:{label:'Menu propre',filter:'brightness(1.08) contrast(1.06) saturate(1.02)'},
  appetizing:{label:'Appétissant',filter:'brightness(1.05) contrast(1.08) saturate(1.16) warm(1)'},
  soft:{label:'Lumière douce',filter:'brightness(1.1) contrast(.98) saturate(1.03)'},
  neutral:{label:'Neutre',filter:'brightness(1.03) contrast(1.02) saturate(.98)'},
  dramatic:{label:'Soirée',filter:'brightness(.98) contrast(1.12) saturate(1.07)'}
};

function baseChecklist(){return {
  opening:[
    'Accès, éclairage et équipements principaux vérifiés','Salle propre et tables prêtes','Réservations et groupes relus','Brief équipe effectué','Ruptures et allergènes du jour communiqués','Postes cuisine prêts avant service'
  ],
  service:[
    'Eau, pain, couverts et consommables disponibles','Temps d’attente surveillés','Ruptures transmises salle ↔ cuisine','Allergènes confirmés avant envoi','Incidents consignés immédiatement'
  ],
  hygiene:[
    'Lavage des mains et postes propres','Températures / contrôles obligatoires effectués selon procédure du restaurant','Séparation et identification des produits respectées','Déchets évacués et zones sensibles propres','Produits de nettoyage rangés séparément'
  ],
  closing:[
    'Dernières tables soldées','Cuisine et salle nettoyées','Stocks critiques notés','Pertes / casse / incidents consignés','Matériel sensible arrêté ou sécurisé','Tâches du prochain service créées'
  ]
};}

function defaultState(){
  return {
    schema:1,build:BUILD,createdAt:nowIso(),updatedAt:nowIso(),
    restaurant:{name:'Mon restaurant',currency:'CHF',tablesCount:20,role:'owner'},
    service:{open:false,openedAt:null,closedAt:null},
    ui:{section:'dashboard',selectedTable:null,checklistType:'opening'},
    voice:{autoSpeak:true,handsFree:false,wakeWord:true},
    tables:Array.from({length:20},(_,i)=>({id:i+1,status:'free',seats:4,guests:0,notes:[],allergies:[],billRequested:false,updatedAt:null})),
    reservations:[],stock:[],team:[],tasks:[],customers:[],incidents:[],tickets:[],recipes:[],shifts:[],
    cash:{date:todayKey(),openingFloat:0,cashSales:0,cardSales:0,otherSales:0,actualCash:0,notes:'',closedAt:null,history:[]},
    training:{completed:{},notes:[]},
    sync:{mode:'local',restaurantId:'',endpoint:'',lastSync:null},
    checklist:{templates:baseChecklist(),runs:{}},
    metrics:{date:todayKey(),covers:0,revenue:0},
    audit:[]
  };
}

function migrateState(raw){
  const d=raw&&typeof raw==='object'?raw:defaultState();
  const base=defaultState();
  const out={...base,...d};
  out.restaurant={...base.restaurant,...(d.restaurant||{})};
  out.service={...base.service,...(d.service||{})};
  out.ui={...base.ui,...(d.ui||{})};
  out.voice={...base.voice,...(d.voice||{})};
  out.checklist={...base.checklist,...(d.checklist||{}),templates:{...base.checklist.templates,...(d.checklist?.templates||{})}};
  out.metrics={...base.metrics,...(d.metrics||{})};
  out.cash={...base.cash,...(d.cash||{}),history:Array.isArray(d.cash?.history)?d.cash.history:[]};
  out.training={...base.training,...(d.training||{}),completed:{...base.training.completed,...(d.training?.completed||{})},notes:Array.isArray(d.training?.notes)?d.training.notes:[]};
  out.sync={...base.sync,...(d.sync||{})};
  for(const key of ['tables','reservations','stock','team','tasks','customers','incidents','tickets','recipes','shifts','audit']) if(!Array.isArray(out[key])) out[key]=base[key];
  out.build=BUILD;return out;
}

function loadState(){
  try{return migrateState(JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'))}catch{return defaultState()}
}
let state=loadState();
if(state.metrics?.date!==todayKey()) state.metrics={date:todayKey(),covers:0,revenue:0};
if(state.cash?.date!==todayKey()) state.cash={...defaultState().cash,history:Array.isArray(state.cash?.history)?state.cash.history:[]};
let pendingCommand=null;
let recognition=null;
let recognitionMode='manual';
let restarting=false;
let currentPhoto={url:null,file:null,preset:'natural'};
let voiceContext={tableId:state.ui.selectedTable,section:state.ui.section};

function save(reason='update'){
  state.updatedAt=nowIso();
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  audit('state',reason);
}
function audit(type,detail){
  try{
    state.audit.push({id:uid('a'),date:nowIso(),type,detail:String(detail).slice(0,700)});
    if(state.audit.length>400) state.audit=state.audit.slice(-400);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  }catch{}
}
function toast(msg){const el=$('#toast');if(!el)return;el.textContent=msg;el.classList.remove('hidden');clearTimeout(toast._t);toast._t=setTimeout(()=>el.classList.add('hidden'),2300)}
function setSection(section){
  if(!NAV.some(x=>x[0]===section)) section='dashboard';
  state.ui.section=section;voiceContext.section=section;save(`navigate:${section}`);render();
}
function ensureTables(count){
  count=Math.max(1,Math.min(100,Number(count)||20));
  const existing=new Map(state.tables.map(t=>[t.id,t]));
  state.tables=Array.from({length:count},(_,i)=>existing.get(i+1)||{id:i+1,status:'free',seats:4,guests:0,notes:[],allergies:[],billRequested:false,updatedAt:null});
  state.restaurant.tablesCount=count;
  if(state.ui.selectedTable>count)state.ui.selectedTable=null;
}
function tableById(id){return state.tables.find(t=>t.id===Number(id))}
function stockByName(name){const n=normalizeVoice(name);return state.stock.find(s=>normalizeVoice(s.name)===n)}
function teamByName(name){const n=normalizeVoice(name);return state.team.find(m=>normalizeVoice(m.name)===n)}
function currency(v){try{return new Intl.NumberFormat('fr-CH',{style:'currency',currency:state.restaurant.currency||'CHF'}).format(Number(v)||0)}catch{return `${Number(v)||0} ${state.restaurant.currency||'CHF'}`}}
function activeReservations(){return state.reservations.filter(r=>!r.cancelled&&!r.seatedAt&&r.date===todayKey()).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'))}
function alerts(){
  const out=[];
  const lows=state.stock.filter(s=>Number(s.quantity)<=Number(s.min||0));
  if(lows.length) out.push({level:'danger',text:`${lows.length} stock(s) critique(s) : ${lows.slice(0,4).map(x=>x.name).join(', ')}`});
  const high=state.incidents.filter(i=>!i.closed&&i.severity==='high');
  if(high.length) out.push({level:'danger',text:`${high.length} incident(s) prioritaire(s) ouvert(s)`});
  const urgent=state.tasks.filter(t=>!t.done&&t.priority==='high');
  if(urgent.length) out.push({level:'warn',text:`${urgent.length} tâche(s) prioritaire(s) à faire`});
  const bills=state.tables.filter(t=>t.billRequested);
  if(bills.length) out.push({level:'warn',text:`Addition demandée : table(s) ${bills.map(t=>t.id).join(', ')}`});
  return out;
}

function render(){
  const app=$('#app');
  app.innerHTML=`<div class="app-shell">
    <header class="topbar">
      <div class="brand"><h1>OBINA Restaurant</h1><p>${escapeHtml(state.restaurant.name)} · BUILD ${BUILD}</p></div>
      <button class="service-pill ${state.service.open?'open':''}" data-action="toggle-service">${state.service.open?'● SERVICE OUVERT':'○ SERVICE FERMÉ'}</button>
    </header>
    <nav class="nav" aria-label="Sections">${NAV.map(([id,ico,label])=>`<button data-nav="${id}" class="${state.ui.section===id?'active':''}">${ico} ${label}</button>`).join('')}</nav>
    <main class="page" id="page">${renderSection(state.ui.section)}</main>
  </div>${renderVoiceDock()}`;
  bindDynamicPhoto();
  syncVoiceUi();
}

function renderSection(section){
  switch(section){
    case 'dashboard': return renderDashboard();
    case 'floor': return renderFloor();
    case 'orders': return renderOrders();
    case 'kitchen': return renderKitchen();
    case 'reservations': return renderReservations();
    case 'customers': return renderCustomers();
    case 'stock': return renderStock();
    case 'recipes': return renderRecipes();
    case 'team': return renderTeam();
    case 'planning': return renderPlanning();
    case 'tasks': return renderTasks();
    case 'cash': return renderCash();
    case 'direction': return renderDirection();
    case 'training': return renderTraining();
    case 'checklists': return renderChecklists();
    case 'incidents': return renderIncidents();
    case 'studio': return renderStudio();
    case 'reports': return renderReports();
    case 'settings': return renderSettings();
    default:return renderDashboard();
  }
}

function renderDashboard(){
  const free=state.tables.filter(t=>t.status==='free').length;
  const occupied=state.tables.filter(t=>['occupied','ordered','served','bill'].includes(t.status)).length;
  const res=activeReservations();
  const a=alerts();
  return `<section class="hero"><h2>${state.service.open?'Service en cours':'Prêt pour le prochain service'}</h2><p>Un seul restaurant connecté : salle, commandes, cuisine, réservations, stocks, équipe, caisse, direction, formation, studio et voix.</p><div class="hero-actions"><button class="light" data-action="voice-start">🎙️ Parler à OBINA</button><button class="ghost" data-nav="floor">Voir la salle</button><button class="ghost" data-nav="studio">Studio photo</button></div></section>
  ${a.length?`<div class="grid">${a.map(x=>`<div class="alert ${x.level==='danger'?'danger':''}">${escapeHtml(x.text)}</div>`).join('')}</div>`:''}
  <div class="grid three"><div class="card"><div class="label">Tables libres</div><div class="metric">${free}</div><p>${occupied} en cours</p></div><div class="card"><div class="label">Réservations aujourd’hui</div><div class="metric">${res.length}</div><p>${res.reduce((n,r)=>n+(Number(r.people)||0),0)} couverts prévus</p></div><div class="card"><div class="label">Tâches ouvertes</div><div class="metric">${state.tasks.filter(t=>!t.done).length}</div><p>${state.incidents.filter(i=>!i.closed).length} incident(s) ouvert(s)</p></div></div>
  <div class="grid two"><div class="card"><h3>Prochaines réservations</h3>${res.length?`<div class="list">${res.slice(0,5).map(r=>reservationItem(r)).join('')}</div>`:'<div class="empty">Aucune réservation enregistrée aujourd’hui.</div>'}</div><div class="card"><h3>Priorités opérationnelles</h3>${renderPriorityList()}</div></div>
  <div class="card"><h3>Commandes vocales utiles</h3><p>Appuie sur le micro, ou active le mode mains libres. Exemples :</p><div class="quick">${VOICE_EXAMPLES.slice(0,8).map(x=>`<button class="btn small" data-voice-example="${escapeHtml(x)}">${escapeHtml(x)}</button>`).join('')}</div></div>`;
}
function renderPriorityList(){
  const items=[];
  state.tables.filter(t=>t.billRequested).forEach(t=>items.push(`Table ${t.id} attend l’addition`));
  state.stock.filter(s=>Number(s.quantity)<=Number(s.min||0)).slice(0,4).forEach(s=>items.push(`Stock critique : ${s.name} (${s.quantity} ${s.unit||''})`));
  state.tasks.filter(t=>!t.done&&t.priority==='high').slice(0,4).forEach(t=>items.push(`Tâche : ${t.text}`));
  state.incidents.filter(i=>!i.closed).slice(0,3).forEach(i=>items.push(`Incident : ${i.description}`));
  return items.length?`<div class="list">${items.map(x=>`<div class="item"><div class="item-main"><strong>${escapeHtml(x)}</strong></div></div>`).join('')}</div>`:'<div class="empty">Aucune priorité bloquante enregistrée.</div>';
}

function renderFloor(){
  const selected=tableById(state.ui.selectedTable);
  return `<div class="section-head"><div><h2>Salle & tables</h2><p>Un toucher ou une phrase vocale met la table à jour.</p></div><button class="btn" data-action="all-tables-free">Tout voir</button></div>
  <div class="tables">${state.tables.map(t=>`<button class="table-card ${t.status}" data-table="${t.id}"><strong>T${t.id}</strong><small>${STATUS_LABEL[t.status]||t.status}</small><small>${t.guests?`${t.guests} pers.`:`${t.seats} places`}</small>${t.allergies?.length?'<span class="badge danger">Allergie</span>':''}</button>`).join('')}</div>
  ${selected?renderTableDetail(selected):'<div class="card"><p>Sélectionne une table pour voir les actions rapides.</p></div>'}`;
}
function renderTableDetail(t){
  return `<div class="card"><div class="section-head"><div><h3>Table ${t.id}</h3><p>État actuel : ${STATUS_LABEL[t.status]||t.status}</p></div><span class="badge ${STATUS_CLASS[t.status]||''}">${STATUS_LABEL[t.status]||t.status}</span></div>
  <div class="quick">${[['occupied','Occupée'],['ordered','Commandée'],['served','Servie'],['bill','Addition'],['dirty','À nettoyer'],['free','Libre']].map(([s,l])=>`<button class="btn small" data-table-status="${s}" data-id="${t.id}">${l}</button>`).join('')}</div>
  <form class="form" data-form="table-note" data-id="${t.id}" style="margin-top:12px"><div class="field"><label>Note / demande client</label><input name="note" placeholder="Ex. sans glaçons, anniversaire, chaise bébé"></div><button class="btn primary">Ajouter la note</button></form>
  ${t.allergies?.length?`<div class="alert danger" style="margin-top:12px"><strong>Allergies / intolérances :</strong> ${escapeHtml(t.allergies.join(', '))}</div>`:''}
  ${t.notes?.length?`<div class="list" style="margin-top:12px">${t.notes.slice(-5).reverse().map(n=>`<div class="item"><div class="item-main"><small>${escapeHtml(n.text)} · ${fmtTime(n.date)}</small></div></div>`).join('')}</div>`:''}</div>`;
}

function reservationItem(r){return `<div class="item"><div class="item-main"><strong>${escapeHtml(r.time||'Heure ?')} · ${escapeHtml(r.name||'Sans nom')}</strong><small>${Number(r.people)||'?'} personne(s)${r.phone?` · ${escapeHtml(r.phone)}`:''}${r.note?` · ${escapeHtml(r.note)}`:''}</small></div><div class="item-actions"><button class="btn small" data-reservation-seat="${r.id}">Installer</button><button class="btn small danger" data-reservation-cancel="${r.id}">Annuler</button></div></div>`}
function renderReservations(){
  const rows=state.reservations.filter(r=>!r.cancelled).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  return `<div class="section-head"><div><h2>Réservations</h2><p>Création rapide, installation et historique local.</p></div></div>
  <div class="grid two"><div class="card"><h3>Nouvelle réservation</h3><form class="form" data-form="reservation"><div class="form-row"><div class="field"><label>Nom</label><input name="name" required></div><div class="field"><label>Personnes</label><input name="people" type="number" min="1" max="40" required></div></div><div class="form-row"><div class="field"><label>Date</label><input name="date" type="date" value="${todayKey()}" required></div><div class="field"><label>Heure</label><input name="time" type="time" required></div></div><div class="field"><label>Téléphone (optionnel)</label><input name="phone" inputmode="tel"></div><div class="field"><label>Note</label><input name="note" placeholder="Terrasse, poussette, anniversaire…"></div><button class="btn primary">Enregistrer</button></form></div><div class="card"><h3>À venir</h3>${rows.length?`<div class="list">${rows.slice(0,15).map(reservationItem).join('')}</div>`:'<div class="empty">Aucune réservation active.</div>'}</div></div>`;
}


function ticketStatus(t){return t.status || (t.done?'ready':'ordered')}
function orderStatusLabel(status){return ({ordered:'Commandée',preparing:'En préparation',ready:'Prête',served:'Servie',paid:'Payée',cancelled:'Annulée'})[status]||status}
function orderAmount(t){return Number(t.amount||0)}
function renderOrders(){
  const rows=[...state.tickets].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  const active=rows.filter(t=>!['paid','cancelled'].includes(ticketStatus(t)));
  return `<div class="section-head"><div><h2>Commandes</h2><p>Du bon de salle jusqu’au paiement, avec état visible pour toute l’équipe.</p></div><span class="badge">${active.length} active(s)</span></div>
  <div class="grid two"><div class="card"><h3>Nouvelle commande</h3><form class="form" data-form="order"><div class="form-row"><div class="field"><label>Table</label><input name="tableId" type="number" min="1" max="${state.tables.length}" required></div><div class="field"><label>Montant estimé (${escapeHtml(state.restaurant.currency)})</label><input name="amount" type="number" min="0" step="0.01" value="0"></div></div><div class="field"><label>Articles / demandes</label><textarea name="items" required placeholder="2 plats du jour, 1 eau, sans arachides…"></textarea></div><button class="btn primary">Créer et envoyer en cuisine</button></form></div>
  <div class="card"><h3>Commandes actives</h3>${active.length?`<div class="list">${active.map(orderItem).join('')}</div>`:'<div class="empty">Aucune commande active.</div>'}</div></div>
  <div class="card"><h3>Historique récent</h3>${rows.length?`<div class="list">${rows.slice(0,30).map(orderItem).join('')}</div>`:'<div class="empty">Aucune commande enregistrée.</div>'}</div>`;
}
function orderItem(t){
  const st=ticketStatus(t);const amount=orderAmount(t);
  return `<div class="item"><div class="item-main"><strong>Table ${t.tableId} · ${orderStatusLabel(st)} ${t.priority==='high'?'<span class="badge danger">PRIORITÉ</span>':''}</strong><small>${escapeHtml(t.items)} · ${fmtTime(t.createdAt)}${amount?` · ${currency(amount)}`:''}</small></div><div class="item-actions">${st==='ordered'?`<button class="btn small" data-order-status="preparing" data-id="${t.id}">Préparer</button>`:''}${['ordered','preparing'].includes(st)?`<button class="btn small ok" data-order-status="ready" data-id="${t.id}">Prête</button>`:''}${st==='ready'?`<button class="btn small ok" data-order-status="served" data-id="${t.id}">Servie</button>`:''}${st==='served'?`<button class="btn small" data-order-status="paid" data-id="${t.id}">Payée</button>`:''}</div></div>`;
}

function renderKitchen(){
  const open=state.tickets.filter(t=>['ordered','preparing'].includes(ticketStatus(t)));
  const out=state.stock.filter(s=>Number(s.quantity)<=0);
  return `<div class="section-head"><div><h2>Cuisine</h2><p>Tickets, ruptures et coordination salle ↔ cuisine.</p></div></div>
  ${out.length?`<div class="alert danger"><strong>Ruptures :</strong> ${escapeHtml(out.map(x=>x.name).join(', '))}</div>`:''}
  <div class="grid two"><div class="card"><h3>Nouveau ticket</h3><form class="form" data-form="ticket"><div class="form-row"><div class="field"><label>Table</label><input name="tableId" type="number" min="1" max="${state.tables.length}" required></div><div class="field"><label>Priorité</label><select name="priority"><option value="normal">Normale</option><option value="high">Prioritaire</option></select></div></div><div class="field"><label>Commande</label><textarea name="items" required placeholder="2 burgers cuisson à point, 1 salade sans noix…"></textarea></div><button class="btn primary">Envoyer en cuisine</button></form></div><div class="card"><h3>Tickets en cours</h3>${open.length?`<div class="list">${open.map(t=>`<div class="item kitchen-ticket"><div class="item-main"><strong>Table ${t.tableId} · ${orderStatusLabel(ticketStatus(t))} ${t.priority==='high'?'<span class="badge danger">PRIORITÉ</span>':''}</strong><small>${escapeHtml(t.items)} · ${fmtTime(t.createdAt)}</small></div><div class="item-actions"><button class="btn small" data-order-status="preparing" data-id="${t.id}">En préparation</button><button class="btn small ok" data-order-status="ready" data-id="${t.id}">Prêt</button></div></div>`).join('')}</div>`:'<div class="empty">Aucun ticket en attente.</div>'}</div></div>`;
}

function renderStock(){
  const sorted=[...state.stock].sort((a,b)=>a.name.localeCompare(b.name));
  return `<div class="section-head"><div><h2>Stocks</h2><p>Quantité actuelle, seuil minimum et ruptures visibles immédiatement.</p></div></div><div class="grid two"><div class="card"><h3>Ajouter / mettre à jour</h3><form class="form" data-form="stock"><div class="field"><label>Produit</label><input name="name" required placeholder="Saumon, eau gazeuse, riz…"></div><div class="form-row"><div class="field"><label>Quantité</label><input name="quantity" type="number" step="0.01" min="0" required></div><div class="field"><label>Unité</label><input name="unit" placeholder="pcs, kg, L"></div></div><div class="field"><label>Seuil d’alerte</label><input name="min" type="number" step="0.01" min="0" value="0"></div><button class="btn primary">Enregistrer</button></form></div><div class="card"><h3>État du stock</h3>${sorted.length?`<div class="list">${sorted.map(s=>{const low=Number(s.quantity)<=Number(s.min||0);return `<div class="item"><div class="item-main"><strong>${escapeHtml(s.name)} ${low?'<span class="badge danger">ALERTE</span>':''}</strong><small>${s.quantity} ${escapeHtml(s.unit||'')} · seuil ${s.min||0}</small></div><div class="item-actions"><button class="btn small" data-stock-step="1" data-id="${s.id}">+1</button><button class="btn small" data-stock-step="-1" data-id="${s.id}">−1</button></div></div>`}).join('')}</div>`:'<div class="empty">Ajoute les produits importants à surveiller.</div>'}</div></div>`;
}


function renderRecipes(){
  const rows=[...state.recipes].sort((a,b)=>a.name.localeCompare(b.name));
  return `<div class="section-head"><div><h2>Recettes & fiches techniques</h2><p>Ingrédients, portions, allergènes, coûts et dressage dans une fiche simple.</p></div></div><div class="grid two"><div class="card"><h3>Nouvelle fiche</h3><form class="form" data-form="recipe"><div class="form-row"><div class="field"><label>Nom du plat</label><input name="name" required></div><div class="field"><label>Catégorie</label><input name="category" placeholder="Entrée, plat, dessert…"></div></div><div class="form-row"><div class="field"><label>Portions</label><input name="portions" type="number" min="1" value="1"></div><div class="field"><label>Prix de vente</label><input name="price" type="number" min="0" step="0.01"></div></div><div class="field"><label>Ingrédients / quantités</label><textarea name="ingredients" required placeholder="250 g…, 20 ml…"></textarea></div><div class="field"><label>Étapes</label><textarea name="steps" required></textarea></div><div class="field"><label>Allergènes connus</label><input name="allergens" placeholder="Gluten, arachides…"></div><div class="field"><label>Dressage / présentation</label><textarea name="plating" placeholder="Assiette chaude, sauce à gauche…"></textarea></div><div class="field"><label>Coût matière estimé</label><input name="cost" type="number" min="0" step="0.01"></div><button class="btn primary">Enregistrer la fiche</button></form></div><div class="card"><h3>Fiches</h3>${rows.length?`<div class="list">${rows.map(r=>{const margin=Number(r.price||0)-Number(r.cost||0);return `<div class="item"><div class="item-main"><strong>${escapeHtml(r.name)}${r.category?` · ${escapeHtml(r.category)}`:''}</strong><small>${r.portions||1} portion(s)${r.allergens?` · Allergènes : ${escapeHtml(r.allergens)}`:''}${r.price?` · ${currency(r.price)}`:''}${r.cost?` · marge brute indicative ${currency(margin)}`:''}</small><small><b>Ingrédients :</b> ${escapeHtml(r.ingredients)}</small><small><b>Étapes :</b> ${escapeHtml(r.steps)}</small>${r.plating?`<small><b>Dressage :</b> ${escapeHtml(r.plating)}</small>`:''}</div><div class="item-actions"><button class="btn small" data-recipe-studio="${r.id}">Studio</button><button class="btn small danger" data-recipe-delete="${r.id}">Supprimer</button></div></div>`}).join('')}</div>`:'<div class="empty">Aucune fiche technique.</div>'}</div></div><div class="alert">Les allergènes doivent être vérifiés selon les recettes et procédures réelles du restaurant. Cette fiche ne remplace pas le contrôle réglementaire de l’établissement.</div>`;
}

function renderTeam(){
  return `<div class="section-head"><div><h2>Équipe</h2><p>Présence du service et rôle opérationnel. Ce n’est pas un système RH officiel.</p></div></div><div class="grid two"><div class="card"><h3>Ajouter un membre</h3><form class="form" data-form="team"><div class="field"><label>Prénom / nom</label><input name="name" required></div><div class="field"><label>Poste</label><select name="role"><option>Salle</option><option>Cuisine</option><option>Bar</option><option>Plonge</option><option>Responsable</option><option>Autre</option></select></div><button class="btn primary">Ajouter</button></form></div><div class="card"><h3>Équipe du service</h3>${state.team.length?`<div class="list">${state.team.map(m=>`<div class="item"><div class="item-main"><strong>${escapeHtml(m.name)}</strong><small>${escapeHtml(m.role)} · ${escapeHtml(m.status||'présent')}</small></div><div class="item-actions"><button class="btn small" data-team-status="present" data-id="${m.id}">Présent</button><button class="btn small" data-team-status="late" data-id="${m.id}">Retard</button><button class="btn small danger" data-team-status="absent" data-id="${m.id}">Absent</button></div></div>`).join('')}</div>`:'<div class="empty">Aucun membre ajouté.</div>'}</div></div>`;
}


function renderPlanning(){
  const rows=[...state.shifts].sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
  const today=rows.filter(x=>x.date===todayKey());
  return `<div class="section-head"><div><h2>Planning</h2><p>Organisation opérationnelle des services, sans remplacer le système RH officiel.</p></div><span class="badge">${today.length} poste(s) aujourd’hui</span></div><div class="grid two"><div class="card"><h3>Ajouter un service</h3><form class="form" data-form="shift"><div class="form-row"><div class="field"><label>Personne</label><input name="name" required list="teamNames"></div><div class="field"><label>Poste</label><input name="role" required placeholder="Salle, cuisine…"></div></div><datalist id="teamNames">${state.team.map(m=>`<option value="${escapeHtml(m.name)}">`).join('')}</datalist><div class="form-row"><div class="field"><label>Date</label><input name="date" type="date" value="${todayKey()}" required></div><div class="field"><label>Début</label><input name="start" type="time" required></div></div><div class="form-row"><div class="field"><label>Fin</label><input name="end" type="time" required></div><div class="field"><label>Note</label><input name="note"></div></div><button class="btn primary">Ajouter au planning</button></form></div><div class="card"><h3>Aujourd’hui</h3>${today.length?`<div class="list">${today.map(shiftItem).join('')}</div>`:'<div class="empty">Aucun service planifié aujourd’hui.</div>'}</div></div><div class="card"><h3>À venir</h3>${rows.length?`<div class="list">${rows.slice(0,40).map(shiftItem).join('')}</div>`:'<div class="empty">Planning vide.</div>'}</div>`;
}
function shiftItem(x){return `<div class="item"><div class="item-main"><strong>${escapeHtml(x.name)} · ${escapeHtml(x.role)}</strong><small>${escapeHtml(x.date)} · ${escapeHtml(x.start)}–${escapeHtml(x.end)}${x.note?` · ${escapeHtml(x.note)}`:''}</small></div><button class="btn small danger" data-shift-delete="${x.id}">Retirer</button></div>`}

function renderTasks(){
  const open=state.tasks.filter(t=>!t.done);const done=state.tasks.filter(t=>t.done).slice(-8).reverse();
  return `<div class="section-head"><div><h2>Tâches</h2><p>Petites actions concrètes, assignables et vérifiables.</p></div></div><div class="grid two"><div class="card"><h3>Nouvelle tâche</h3><form class="form" data-form="task"><div class="field"><label>À faire</label><input name="text" required></div><div class="form-row"><div class="field"><label>Responsable</label><input name="owner" placeholder="Équipe / prénom"></div><div class="field"><label>Priorité</label><select name="priority"><option value="normal">Normale</option><option value="high">Prioritaire</option></select></div></div><button class="btn primary">Créer</button></form></div><div class="card"><h3>Ouvertes</h3>${open.length?`<div class="list">${open.map(t=>`<div class="item"><div class="item-main"><strong>${escapeHtml(t.text)} ${t.priority==='high'?'<span class="badge danger">PRIORITÉ</span>':''}</strong><small>${escapeHtml(t.owner||'Non assignée')} · ${fmtTime(t.createdAt)}</small></div><button class="btn small ok" data-task-done="${t.id}">Fait</button></div>`).join('')}</div>`:'<div class="empty">Aucune tâche ouverte.</div>'}${done.length?`<h3 style="margin-top:16px">Terminées récemment</h3><div class="list">${done.map(t=>`<div class="item"><div class="item-main"><small>✓ ${escapeHtml(t.text)}</small></div></div>`).join('')}</div>`:''}</div></div>`;
}

function renderCustomers(){
  return `<div class="section-head"><div><h2>Clients</h2><p>Notes utiles choisies par le restaurant. Évite les données inutiles ou sensibles.</p></div></div><div class="grid two"><div class="card"><h3>Ajouter une fiche</h3><form class="form" data-form="customer"><div class="field"><label>Nom / repère</label><input name="name" required></div><div class="field"><label>Note utile</label><textarea name="note" required placeholder="Préférence communiquée par le client, demande récurrente…"></textarea></div><button class="btn primary">Enregistrer</button></form></div><div class="card"><h3>Fiches locales</h3>${state.customers.length?`<div class="list">${state.customers.map(c=>`<div class="item"><div class="item-main"><strong>${escapeHtml(c.name)}</strong><small>${escapeHtml(c.note)}</small></div></div>`).join('')}</div>`:'<div class="empty">Aucune fiche client enregistrée.</div>'}</div></div>`;
}


function cashTotals(){
  const c=state.cash||{};const sales=Number(c.cashSales||0)+Number(c.cardSales||0)+Number(c.otherSales||0);const expected=Number(c.openingFloat||0)+Number(c.cashSales||0);const actual=Number(c.actualCash||0);return {sales,expected,actual,diff:actual-expected};
}
function renderCash(){
  const c=state.cash;const t=cashTotals();
  return `<div class="section-head"><div><h2>Caisse & clôture</h2><p>Saisie opérationnelle manuelle. OBINA Restaurant n’est pas encore un système fiscal/POS certifié.</p></div>${c.closedAt?`<span class="badge ok">Clôturée ${fmtTime(c.closedAt)}</span>`:'<span class="badge warn">Ouverte</span>'}</div><div class="grid two"><div class="card"><h3>Totaux du jour</h3><form class="form" data-form="cash"><div class="field"><label>Fond de caisse au départ</label><input name="openingFloat" type="number" min="0" step="0.01" value="${Number(c.openingFloat)||0}"></div><div class="form-row"><div class="field"><label>Ventes espèces</label><input name="cashSales" type="number" min="0" step="0.01" value="${Number(c.cashSales)||0}"></div><div class="field"><label>Ventes carte</label><input name="cardSales" type="number" min="0" step="0.01" value="${Number(c.cardSales)||0}"></div></div><div class="form-row"><div class="field"><label>Autres paiements</label><input name="otherSales" type="number" min="0" step="0.01" value="${Number(c.otherSales)||0}"></div><div class="field"><label>Espèces comptées en caisse</label><input name="actualCash" type="number" min="0" step="0.01" value="${Number(c.actualCash)||0}"></div></div><div class="field"><label>Note de clôture</label><textarea name="notes">${escapeHtml(c.notes||'')}</textarea></div><button class="btn primary">Mettre à jour</button></form><div class="quick" style="margin-top:10px"><button class="btn danger" data-action="cash-close">Clôturer la caisse</button></div></div><div class="card"><h3>Contrôle</h3><div class="grid two"><div><div class="label">Ventes saisies</div><div class="metric">${currency(t.sales)}</div></div><div><div class="label">Ticket moyen</div><div class="metric">${currency((state.metrics.covers||0)?t.sales/Number(state.metrics.covers):0)}</div></div></div><div class="list" style="margin-top:12px"><div class="item"><span>Espèces attendues</span><strong>${currency(t.expected)}</strong></div><div class="item"><span>Espèces comptées</span><strong>${currency(t.actual)}</strong></div><div class="item"><span>Écart caisse</span><strong class="${Math.abs(t.diff)>.009?'danger-text':'ok-text'}">${currency(t.diff)}</strong></div></div></div></div><div class="card"><h3>Clôtures précédentes</h3>${c.history?.length?`<div class="list">${c.history.slice(-12).reverse().map(h=>`<div class="item"><div class="item-main"><strong>${escapeHtml(h.date)} · ${currency(h.sales)}</strong><small>Écart ${currency(h.diff)} · ${fmtTime(h.closedAt)}</small></div></div>`).join('')}</div>`:'<div class="empty">Aucune clôture archivée.</div>'}</div>`;
}
function renderDirection(){
  const t=cashTotals();const covers=Number(state.metrics.covers||0);const low=state.stock.filter(s=>Number(s.quantity)<=Number(s.min||0));const activeOrders=state.tickets.filter(x=>!['paid','cancelled'].includes(ticketStatus(x))).length;const openInc=state.incidents.filter(i=>!i.closed).length;const openTasks=state.tasks.filter(t=>!t.done).length;
  return `<div class="section-head"><div><h2>Direction</h2><p>Vue synthétique à partir des données réellement saisies. Pas de chiffres inventés.</p></div></div><div class="grid three"><div class="card"><div class="label">Ventes saisies</div><div class="metric">${currency(t.sales||state.metrics.revenue)}</div></div><div class="card"><div class="label">Couverts</div><div class="metric">${covers}</div><p>Ticket moyen ${currency(covers?(t.sales||state.metrics.revenue)/covers:0)}</p></div><div class="card"><div class="label">Commandes actives</div><div class="metric">${activeOrders}</div></div></div><div class="grid two"><div class="card"><h3>Risques maintenant</h3><div class="list"><div class="item"><span>Stocks sous seuil</span><strong>${low.length}</strong></div><div class="item"><span>Incidents ouverts</span><strong>${openInc}</strong></div><div class="item"><span>Tâches ouvertes</span><strong>${openTasks}</strong></div><div class="item"><span>Écart caisse actuel</span><strong>${currency(t.diff)}</strong></div></div></div><div class="card"><h3>Capacité / équipe</h3><div class="list"><div class="item"><span>Tables libres</span><strong>${state.tables.filter(x=>x.status==='free').length}/${state.tables.length}</strong></div><div class="item"><span>Réservations à venir aujourd’hui</span><strong>${activeReservations().length}</strong></div><div class="item"><span>Équipe présente</span><strong>${state.team.filter(x=>(x.status||'present')==='present').length}</strong></div><div class="item"><span>Services planifiés aujourd’hui</span><strong>${state.shifts.filter(x=>x.date===todayKey()).length}</strong></div></div></div></div><div class="card"><h3>Point OBINA</h3><p>${escapeHtml(buildSummary())}</p></div>`;
}
const TRAINING_MODULES=[
  ['welcome','Accueil client','Accueil, prise en charge, écoute et transmission claire.'],
  ['allergens','Allergènes','Identifier, confirmer et transmettre une information allergène sans improviser.'],
  ['hygiene','Hygiène','Rappels internes de propreté, séparation, contrôles et traçabilité.'],
  ['service','Service salle ↔ cuisine','Fluidité des commandes, priorités, temps d’attente et communication.'],
  ['cash','Caisse','Saisie, contrôle, écart et clôture interne.'],
  ['incidents','Incidents','Signaler rapidement, sécuriser, escalader au responsable et tracer.'],
  ['voice','Commande vocale OBINA','Utiliser des phrases courtes, le contexte de table et les confirmations sensibles.']
];
function renderTraining(){
  const done=state.training.completed||{};const count=TRAINING_MODULES.filter(([id])=>done[id]).length;
  return `<div class="section-head"><div><h2>Formation</h2><p>Mini-parcours interne pour rendre les gestes et procédures plus réguliers.</p></div><span class="badge ${count===TRAINING_MODULES.length?'ok':''}">${count}/${TRAINING_MODULES.length}</span></div><div class="grid two">${TRAINING_MODULES.map(([id,title,desc])=>`<div class="card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(desc)}</p><button class="btn ${done[id]?'ok':'primary'}" data-training-toggle="${id}">${done[id]?'✓ Révisé':'Marquer comme révisé'}</button>${done[id]?`<p class="ok-text">Dernière validation : ${fmtTime(done[id])}</p>`:''}</div>`).join('')}</div><div class="alert">Ces modules sont des aides internes. Ils ne remplacent ni une formation obligatoire, ni une certification, ni les consignes légales de l’établissement.</div>`;
}

function checklistRun(type){const key=`${todayKey()}:${type}`;if(!state.checklist.runs[key])state.checklist.runs[key]={date:todayKey(),type,checked:{},completedAt:null};return state.checklist.runs[key]}
function renderChecklists(){
  const type=state.ui.checklistType||'opening';const run=checklistRun(type);const items=state.checklist.templates[type]||[];const done=items.filter((_,i)=>run.checked[i]).length;
  return `<div class="section-head"><div><h2>Contrôles & check-lists</h2><p>Des preuves simples, datées, adaptées aux procédures de ton restaurant.</p></div><span class="badge ${done===items.length&&items.length?'ok':''}">${done}/${items.length}</span></div><div class="quick">${[['opening','Ouverture'],['service','Service'],['hygiene','Hygiène'],['closing','Fermeture']].map(([id,l])=>`<button class="btn small ${type===id?'primary':''}" data-checklist-type="${id}">${l}</button>`).join('')}</div><div class="card">${items.map((item,i)=>`<label class="check-row"><input type="checkbox" data-check="${i}" ${run.checked[i]?'checked':''}><span>${escapeHtml(item)}</span></label>`).join('')}<div class="quick" style="margin-top:12px"><button class="btn primary" data-action="complete-checklist">Valider ce contrôle</button></div>${run.completedAt?`<p class="ok-text">Validé à ${fmtTime(run.completedAt)}</p>`:''}</div><div class="alert">OBINA aide à suivre tes contrôles. Les exigences légales/HACCP exactes restent celles applicables à ton établissement et à ton canton/pays.</div>`;
}

function renderIncidents(){
  const open=state.incidents.filter(i=>!i.closed);return `<div class="section-head"><div><h2>Incidents</h2><p>Consigner vite, traiter, puis fermer avec une trace.</p></div></div><div class="grid two"><div class="card"><h3>Signaler</h3><form class="form" data-form="incident"><div class="field"><label>Description</label><textarea name="description" required></textarea></div><div class="field"><label>Niveau</label><select name="severity"><option value="normal">Normal</option><option value="high">Prioritaire</option></select></div><button class="btn primary">Créer l’incident</button></form></div><div class="card"><h3>Ouverts</h3>${open.length?`<div class="list">${open.map(i=>`<div class="item"><div class="item-main"><strong>${i.severity==='high'?'<span class="badge danger">PRIORITÉ</span> ':''}${escapeHtml(i.description)}</strong><small>${fmtTime(i.createdAt)}</small></div><button class="btn small ok" data-incident-close="${i.id}">Résolu</button></div>`).join('')}</div>`:'<div class="empty">Aucun incident ouvert.</div>'}</div></div>`;
}

function renderStudio(){
  const p=PRESETS[currentPhoto.preset]||PRESETS.natural;
  return `<div class="section-head"><div><h2>Studio OBINA</h2><p>Amélioration locale des vraies photos : plats, tables et salle.</p></div></div><div class="grid two"><div class="card"><h3>Photo</h3><div class="photo-stage">${currentPhoto.url?`<img id="studioImage" src="${currentPhoto.url}" alt="Photo à améliorer" style="filter:${p.filter.replace(' warm(1)',' sepia(.05)')}">`:'<div class="muted">Choisis une photo du téléphone.</div>'}</div><div class="quick" style="margin-top:10px"><label class="btn primary">Choisir une photo<input id="photoInput" type="file" accept="image/*" capture="environment" hidden></label>${currentPhoto.url?'<button class="btn" data-action="photo-export">Exporter JPEG</button>':''}</div></div><div class="card"><h3>Rendu</h3><div class="preset-row">${Object.entries(PRESETS).map(([id,v])=>`<button class="btn small ${currentPhoto.preset===id?'primary':''}" data-photo-preset="${id}">${v.label}</button>`).join('')}</div><p>OBINA ajuste lumière, contraste et couleurs sans inventer un autre plat. Pour la publicité, garde une image fidèle à ce que le client reçoit.</p><h3 style="margin-top:18px">Coach présentation</h3><div class="quick"><button class="btn small" data-studio-advice="plate">Assiette</button><button class="btn small" data-studio-advice="table">Table</button><button class="btn small" data-studio-advice="room">Salle</button><button class="btn small" data-studio-advice="social">Réseaux sociaux</button></div><div id="studioAdvice" class="alert" style="margin-top:10px">Choisis un type pour obtenir une check-list de présentation.</div></div></div>`;
}

function renderReports(){
  const todayReservations=activeReservations();const completedTickets=state.tickets.filter(t=>['ready','served','paid'].includes(ticketStatus(t))&&(t.completedAt||t.readyAt||t.servedAt||t.paidAt)?.startsWith(todayKey())).length;const incidentsToday=state.incidents.filter(i=>i.createdAt?.startsWith(todayKey())).length;const occupied=state.tables.filter(t=>t.status!=='free').length;
  return `<div class="section-head"><div><h2>Rapports</h2><p>Vue opérationnelle du jour basée uniquement sur ce qui est enregistré dans OBINA.</p></div></div><div class="grid three"><div class="card"><div class="label">Couverts enregistrés</div><div class="metric">${Number(state.metrics.covers)||0}</div></div><div class="card"><div class="label">Chiffre saisi</div><div class="metric">${currency(state.metrics.revenue)}</div></div><div class="card"><div class="label">Tickets terminés</div><div class="metric">${completedTickets}</div></div></div><div class="grid two"><div class="card"><h3>Indicateurs</h3><div class="list"><div class="item"><span>Réservations du jour</span><strong>${todayReservations.length}</strong></div><div class="item"><span>Tables non libres maintenant</span><strong>${occupied}</strong></div><div class="item"><span>Incidents créés aujourd’hui</span><strong>${incidentsToday}</strong></div><div class="item"><span>Tâches ouvertes</span><strong>${state.tasks.filter(t=>!t.done).length}</strong></div></div></div><div class="card"><h3>Saisie rapide</h3><form class="form" data-form="metrics"><div class="field"><label>Couverts servis</label><input name="covers" type="number" min="0" value="${Number(state.metrics.covers)||0}"></div><div class="field"><label>Chiffre du jour (${escapeHtml(state.restaurant.currency)})</label><input name="revenue" type="number" min="0" step="0.01" value="${Number(state.metrics.revenue)||0}"></div><button class="btn primary">Mettre à jour</button></form></div></div><div class="card"><h3>Résumé OBINA</h3><p>${escapeHtml(buildSummary())}</p></div>`;
}
function buildSummary(){
  const free=state.tables.filter(t=>t.status==='free').length;const low=state.stock.filter(s=>Number(s.quantity)<=Number(s.min||0));const openInc=state.incidents.filter(i=>!i.closed);const openTasks=state.tasks.filter(t=>!t.done);
  return `Aujourd’hui : ${activeReservations().length} réservation(s), ${free}/${state.tables.length} table(s) libre(s), ${openTasks.length} tâche(s) ouverte(s), ${low.length} alerte(s) stock et ${openInc.length} incident(s) non résolu(s). Couverts saisis : ${state.metrics.covers||0}. Chiffre saisi : ${currency(state.metrics.revenue||0)}.`;
}

function renderSettings(){
  const legacy=(()=>{try{return JSON.parse(localStorage.getItem('fiama-memory')||'[]').length}catch{return 0}})();
  const deviceId=getDeviceId();
  return `<div class="section-head"><div><h2>Réglages</h2><p>Restaurant, appareils, voix, sauvegarde et rôle d’utilisation.</p></div></div><div class="grid two"><div class="card"><h3>Restaurant</h3><form class="form" data-form="settings"><div class="field"><label>Nom</label><input name="name" value="${escapeHtml(state.restaurant.name)}"></div><div class="form-row"><div class="field"><label>Nombre de tables</label><input name="tablesCount" type="number" min="1" max="100" value="${state.tables.length}"></div><div class="field"><label>Devise</label><select name="currency">${['CHF','EUR','XOF'].map(c=>`<option ${state.restaurant.currency===c?'selected':''}>${c}</option>`).join('')}</select></div></div><div class="field"><label>Profil local</label><select name="role">${[['owner','Propriétaire'],['manager','Responsable'],['kitchen','Cuisine'],['floor','Salle'],['viewer','Lecture seule']].map(([v,l])=>`<option value="${v}" ${state.restaurant.role===v?'selected':''}>${l}</option>`).join('')}</select></div><button class="btn primary">Enregistrer</button></form><p>Le profil local limite des actions sur cet appareil. Une authentification serveur reste nécessaire pour de vrais comptes multi-utilisateurs.</p></div><div class="card"><h3>Commande vocale</h3><label class="check-row"><input type="checkbox" data-setting="autoSpeak" ${state.voice.autoSpeak?'checked':''}><span>Réponse vocale automatique</span></label><label class="check-row"><input type="checkbox" data-setting="wakeWord" ${state.voice.wakeWord?'checked':''}><span>En mode mains libres, exiger « OBINA » au début</span></label><label class="check-row"><input type="checkbox" data-setting="handsFree" ${state.voice.handsFree?'checked':''}><span>Mode mains libres tant que l’application reste au premier plan</span></label><p>Exemple : « OBINA, table 12 addition ». « FIAMA » reste accepté temporairement comme ancien mot d’activation pour compatibilité.</p></div></div><div class="grid two"><div class="card"><h3>Multi-appareils</h3><p><strong>Appareil :</strong> <span class="mono">${escapeHtml(deviceId)}</span></p><p><strong>État :</strong> ${state.sync?.mode==='connected'?'<span class="badge ok">Synchronisé</span>':'<span class="badge warn">Local uniquement</span>'}</p><form class="form" data-form="sync"><div class="field"><label>Adresse du service Sync</label><input name="endpoint" inputmode="url" value="${escapeHtml(state.sync?.endpoint||'')}" placeholder="https://sync.exemple.ch"></div><div class="field"><label>Identifiant du restaurant</label><input name="restaurantId" value="${escapeHtml(state.sync?.restaurantId||'')}" placeholder="mon-restaurant-01"></div><div class="field"><label>Jeton de session</label><input name="token" type="password" autocomplete="off" placeholder="Non enregistré sur l’appareil"></div><button class="btn primary">Enregistrer le raccordement</button></form><div class="quick" style="margin-top:10px"><button class="btn" data-action="sync-pull">↓ Recevoir</button><button class="btn" data-action="sync-push">↑ Envoyer</button></div><p>Le jeton reste uniquement dans la session du navigateur. Le serveur Sync BUILD 46 refuse un écrasement si un autre appareil a déjà une version plus récente.</p></div><div class="card"><h3>Sauvegarde</h3><div class="quick"><button class="btn" data-action="export">Exporter mes données</button><label class="btn">Importer<input id="importInput" type="file" accept="application/json" hidden></label></div><p>${legacy?`Mémoire historique détectée : ${legacy} élément(s). Elle reste conservée séparément.`:'La mémoire historique, si elle existe, reste séparée.'}</p></div></div><div class="grid two"><div class="card"><h3>Compatibilité</h3><p>Les clés techniques historiques <span class="mono">fiama-*</span> restent temporairement inchangées afin de ne pas perdre les données locales existantes pendant le renommage vers OBINA Restaurant.</p></div><div class="card"><h3>Zone sensible</h3><p>La réinitialisation efface uniquement les données OBINA Restaurant de cet appareil.</p><button class="btn danger" data-action="reset">Réinitialiser OBINA Restaurant</button></div></div><div class="card"><h3>Journal local</h3><p class="mono">${escapeHtml(state.audit.slice(-10).reverse().map(a=>`${a.date} · ${a.type} · ${a.detail}`).join('\n')||'Aucune entrée.')}</p></div>`;
}
function getDeviceId(){let id=localStorage.getItem('obina-restaurant-device-id');if(!id){id=`device-${Math.random().toString(36).slice(2,10)}`;localStorage.setItem('obina-restaurant-device-id',id)}return id}

function renderVoiceDock(){
  return `<aside class="voice-dock" id="voiceDock"><div class="voice-top"><button class="mic" id="micBtn" data-action="voice-start" aria-label="Parler à OBINA">🎙️</button><div class="voice-text"><strong id="voiceTitle">Commande restaurant</strong><small id="voiceStatus">Appuie et parle normalement.</small></div><button class="voice-mini" data-action="voice-expand">⌨️</button><button class="voice-mini" data-action="handsfree">${state.voice.handsFree?'MAINS LIBRES ON':'MAINS LIBRES'}</button></div><div class="voice-panel hidden" id="voicePanel"><div class="voice-input"><input id="voiceTextInput" placeholder="Ex. Table 12 veut l’addition"><button class="btn" data-action="voice-send">Envoyer</button></div><small class="muted">La commande est analysée localement d’abord. Les actions sensibles demandent confirmation.</small></div>${pendingCommand?`<div class="pending" id="voicePending"><strong>Confirmation requise</strong><br>${escapeHtml(summarizeCommand(pendingCommand))}<div class="quick" style="margin-top:7px"><button class="voice-mini" data-action="voice-confirm">CONFIRMER</button><button class="voice-mini" data-action="voice-cancel">ANNULER</button></div></div>`:''}</aside>`;
}

function bindDynamicPhoto(){
  const input=$('#photoInput');if(input)input.onchange=e=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/'))return toast('Ce fichier n’est pas une image.');if(currentPhoto.url)URL.revokeObjectURL(currentPhoto.url);currentPhoto={file,url:URL.createObjectURL(file),preset:'natural'};render();};
  const imp=$('#importInput');if(imp)imp.onchange=handleImport;
}

function studioAdvice(type){
  const map={
    plate:['Nettoyer le bord de l’assiette','Choisir un point focal clair','Éviter de surcharger','Créer un contraste de couleur naturel','Vérifier sauce et garniture juste avant photo'],
    table:['Aligner couverts et verres','Retirer les objets inutiles','Choisir une lumière cohérente','Laisser de l’espace autour de chaque couvert','Vérifier nappes, serviettes et traces'],
    room:['Dégager les axes de circulation','Uniformiser les tables visibles','Équilibrer zones sombres et lumineuses','Retirer cartons et éléments techniques','Photographier depuis hauteur naturelle'],
    social:['Montrer le vrai plat vendu','Format vertical si destiné aux stories/statuts','Éviter trop de texte sur la photo','Privilégier une scène simple','Garder identité visuelle constante']
  };return map[type]||[];
}

function canExecute(cmd){
  const role=state.restaurant.role||'owner';
  if(['owner','manager'].includes(role))return true;
  if(cmd.intent==='ORDER_STATUS'&&cmd.entities?.status==='paid')return false;
  const floor=new Set(['NAVIGATE','TABLE_SELECT','TABLE_STATUS','TABLE_NOTE','TABLE_ALLERGY','TABLE_BILL_REQUEST','RESERVATION_CREATE','TASK_CREATE','TASK_COMPLETE','INCIDENT_CREATE','KITCHEN_TICKET','ORDER_STATUS','STUDIO_OPEN','REPORT_SUMMARY','CHECKLIST_OPEN','HELP_VOICE','FREEFORM_RESTAURANT']);
  const kitchen=new Set(['NAVIGATE','STOCK_SET','STOCK_ADD','STOCK_SUBTRACT','STOCK_OUT','TASK_CREATE','TASK_COMPLETE','INCIDENT_CREATE','KITCHEN_TICKET','KITCHEN_86','ORDER_STATUS','CHECKLIST_OPEN','STUDIO_OPEN','REPORT_SUMMARY','HELP_VOICE','FREEFORM_RESTAURANT']);
  const viewer=new Set(['NAVIGATE','REPORT_SUMMARY','HELP_VOICE','FREEFORM_RESTAURANT','TABLE_SELECT']);
  if(role==='kitchen'&&cmd.intent==='ORDER_STATUS'&&!['preparing','ready'].includes(cmd.entities?.status))return false;
  return role==='floor'?floor.has(cmd.intent):role==='kitchen'?kitchen.has(cmd.intent):viewer.has(cmd.intent);
}

async function handleVoiceInput(raw,{fromRecognition=false}={}){
  raw=String(raw||'').trim();if(!raw)return;
  let commandText=raw;
  if(fromRecognition&&recognitionMode==='handsfree'&&state.voice.wakeWord){
    const n=normalizeVoice(raw);
    if(!/^(?:obina|fiama)\b/.test(n)){voiceMessage('J’attends « OBINA… » avant la commande.',false);return;}
    commandText=raw.replace(/^\s*(?:obina|fiama)[\s,;:.-]*/i,'').trim();
    if(!commandText){voiceMessage('Oui, je t’écoute.',true);return;}
  }
  const cmd=parseRestaurantCommand(commandText,voiceContext);
  audit('voice-heard',`${cmd.intent}: ${commandText}`);
  if(cmd.intent==='CONFIRM'){
    if(!pendingCommand)return voiceMessage('Il n’y a rien à confirmer.',true);
    const p=pendingCommand;pendingCommand=null;await applyCommand(p,true);return;
  }
  if(cmd.intent==='CANCEL_PENDING'){
    pendingCommand=null;render();voiceMessage('Commande annulée.',true);return;
  }
  if(cmd.intent==='DANGEROUS_BLOCKED'){
    voiceMessage('Je bloque cette commande globale. Pour effacer les données, passe par Réglages et confirme manuellement.',true);return;
  }
  if(!canExecute(cmd)){
    voiceMessage('Cette action n’est pas autorisée avec le profil local actuel. Un responsable peut changer le profil dans Réglages.',true);return;
  }
  if(cmd.requiresConfirmation){
    pendingCommand=cmd;render();voiceMessage(`J’ai compris : ${summarizeCommand(cmd)}. Dis « confirme » pour l’exécuter, ou « annule ».`,true);return;
  }
  await applyCommand(cmd,false);
}

async function applyCommand(cmd,confirmed=false){
  const e=cmd.entities||{};let reply='';
  switch(cmd.intent){
    case 'HELP_VOICE': reply=`Tu peux me parler comme à un responsable de restaurant. Par exemple : ${VOICE_EXAMPLES.slice(0,6).join(' ; ')}.`;break;
    case 'NAVIGATE': setSection(e.section);reply=`J’ouvre ${NAV.find(x=>x[0]===e.section)?.[2]||e.section}.`;break;
    case 'TABLE_SELECT': state.ui.selectedTable=e.tableId;voiceContext.tableId=e.tableId;state.ui.section='floor';save('voice-table-select');render();reply=`Table ${e.tableId} ouverte.`;break;
    case 'TABLE_STATUS': {const t=tableById(e.tableId);if(!t){reply=`Je ne trouve pas la table ${e.tableId}.`;break;}t.status=e.status;t.billRequested=e.status==='bill';if(e.status==='free'){t.guests=0;t.notes=[];t.allergies=[];t.billRequested=false;}t.updatedAt=nowIso();state.ui.selectedTable=t.id;voiceContext.tableId=t.id;save(`table:${t.id}:${e.status}`);render();reply=`Table ${t.id} : ${STATUS_LABEL[e.status]||e.status}.`;break;}
    case 'TABLE_BILL_REQUEST': {const t=tableById(e.tableId);if(!t){reply=`Table ${e.tableId} introuvable.`;break;}t.status='bill';t.billRequested=true;t.updatedAt=nowIso();state.ui.selectedTable=t.id;voiceContext.tableId=t.id;save(`bill:${t.id}`);render();reply=`C’est noté. La table ${t.id} attend l’addition.`;break;}
    case 'TABLE_NOTE': {const t=tableById(e.tableId);if(!t){reply=`Table ${e.tableId} introuvable.`;break;}t.notes=t.notes||[];t.notes.push({text:e.note,date:nowIso()});save(`table-note:${t.id}`);render();reply=`Note ajoutée à la table ${t.id}.`;break;}
    case 'TABLE_ALLERGY': {const t=tableById(e.tableId);if(!t){reply=`Table ${e.tableId} introuvable.`;break;}t.allergies=t.allergies||[];if(!t.allergies.includes(e.allergy))t.allergies.push(e.allergy);t.notes=t.notes||[];t.notes.push({text:`ALLERGIE / INTOLÉRANCE : ${e.allergy}`,date:nowIso(),critical:true});save(`allergy:${t.id}`);render();reply=`Allergie enregistrée pour la table ${t.id} : ${e.allergy}. Elle reste visible dans la salle.`;break;}
    case 'RESERVATION_CREATE': {const r={id:uid('r'),name:e.name||'Sans nom',people:Number(e.people)||1,time:e.time||'',date:dateFromHint(e.dateHint),phone:e.phone||'',note:'Créée par commande vocale',createdAt:nowIso(),cancelled:false};state.reservations.push(r);save('reservation-create-voice');render();reply=`Réservation enregistrée : ${r.people} personne(s)${r.time?` à ${r.time}`:''}${r.name?` au nom de ${r.name}`:''}.`;break;}
    case 'RESERVATION_CANCEL': {const candidates=state.reservations.filter(r=>!r.cancelled&&(!e.name||normalizeVoice(r.name).includes(normalizeVoice(e.name)))&&(!e.time||r.time===e.time));if(candidates.length!==1){reply=candidates.length===0?'Je ne trouve pas cette réservation.':'J’en trouve plusieurs. Ouvre Réservations pour choisir la bonne.';break;}candidates[0].cancelled=true;candidates[0].cancelledAt=nowIso();save('reservation-cancel-voice');render();reply=`Réservation de ${candidates[0].name} annulée.`;break;}
    case 'STOCK_SET': {let s=stockByName(e.product);if(!s){s={id:uid('s'),name:e.product,quantity:0,unit:'',min:0,updatedAt:null};state.stock.push(s);}s.quantity=Number(e.quantity);s.updatedAt=nowIso();save(`stock-set:${s.name}`);render();reply=`Stock ${s.name} : ${s.quantity}${s.unit?` ${s.unit}`:''}.`;break;}
    case 'STOCK_ADD': {let s=stockByName(e.product);if(!s){s={id:uid('s'),name:e.product,quantity:0,unit:'',min:0,updatedAt:null};state.stock.push(s);}s.quantity=Number(s.quantity||0)+Number(e.quantity||0);s.updatedAt=nowIso();save(`stock-add:${s.name}`);render();reply=`J’ai ajouté ${e.quantity} à ${s.name}. Total : ${s.quantity}.`;break;}
    case 'STOCK_SUBTRACT': {let s=stockByName(e.product);if(!s){reply=`Je ne trouve pas ${e.product} dans le stock.`;break;}s.quantity=Math.max(0,Number(s.quantity||0)-Number(e.quantity||0));s.updatedAt=nowIso();save(`stock-sub:${s.name}`);render();reply=`J’ai retiré ${e.quantity} de ${s.name}. Reste : ${s.quantity}.`;break;}
    case 'STOCK_OUT': {let s=stockByName(e.product);if(!s){s={id:uid('s'),name:e.product,quantity:0,unit:'',min:0,updatedAt:nowIso()};state.stock.push(s);}s.quantity=0;s.updatedAt=nowIso();save(`stock-out:${s.name}`);render();reply=`Rupture enregistrée : ${s.name}.`;break;}
    case 'TASK_CREATE': {state.tasks.push({id:uid('t'),text:e.task,owner:'',priority:/urgent|priorit/i.test(cmd.raw||'')?'high':'normal',done:false,createdAt:nowIso()});save('task-create-voice');render();reply=`Tâche créée : ${e.task}.`;break;}
    case 'TASK_COMPLETE': {const open=state.tasks.filter(t=>!t.done);if(open.length===1){open[0].done=true;open[0].doneAt=nowIso();save('task-done-voice');render();reply=`Tâche terminée : ${open[0].text}.`;}else reply='Ouvre Tâches pour choisir précisément celle à terminer.';break;}
    case 'INCIDENT_CREATE': {state.incidents.push({id:uid('i'),description:e.description,severity:e.severity||'normal',closed:false,createdAt:nowIso()});save('incident-create-voice');render();reply=e.severity==='high'?'Incident prioritaire enregistré. OBINA le garde visible jusqu’à résolution.':'Incident enregistré.';break;}
    case 'TEAM_ABSENCE': {let m=teamByName(e.name);if(!m){m={id:uid('m'),name:e.name,role:'À préciser',status:'present'};state.team.push(m);}m.status='absent';m.updatedAt=nowIso();save(`team-absent:${m.name}`);render();reply=`${m.name} marqué absent pour le service.`;break;}
    case 'TEAM_LATE': {let m=teamByName(e.name);if(!m){m={id:uid('m'),name:e.name,role:'À préciser',status:'present'};state.team.push(m);}m.status='late';m.updatedAt=nowIso();save(`team-late:${m.name}`);render();reply=`Retard noté pour ${m.name}.`;break;}
    case 'KITCHEN_TICKET': {const t=tableById(e.tableId);state.tickets.push({id:uid('k'),tableId:e.tableId,items:e.items,priority:'normal',status:'ordered',done:false,amount:0,createdAt:nowIso()});if(t){t.status='ordered';t.updatedAt=nowIso();}save(`ticket:${e.tableId}`);state.ui.section='kitchen';render();reply=`Commande envoyée en cuisine pour la table ${e.tableId}.`;break;}
    case 'ORDER_STATUS': {const order=[...state.tickets].reverse().find(x=>Number(x.tableId)===Number(e.tableId)&&!['paid','cancelled'].includes(ticketStatus(x)));if(!order){reply=`Je ne trouve pas de commande active pour la table ${e.tableId}.`;break;}order.status=e.status;if(e.status==='preparing')order.preparingAt=nowIso();if(e.status==='ready'){order.readyAt=nowIso();order.done=true;order.completedAt=order.readyAt}if(e.status==='served'){order.servedAt=nowIso();const t=tableById(e.tableId);if(t)t.status='served'}if(e.status==='paid'){order.paidAt=nowIso();const t=tableById(e.tableId);if(t){t.status='dirty';t.billRequested=false}}save(`order-voice:${order.id}:${e.status}`);render();reply=`Commande table ${e.tableId} : ${orderStatusLabel(e.status)}.`;break;}
    case 'KITCHEN_86': {let s=stockByName(e.item);if(!s){s={id:uid('s'),name:e.item,quantity:0,unit:'',min:0,updatedAt:nowIso()};state.stock.push(s);}s.quantity=0;save(`86:${s.name}`);render();reply=`${s.name} est signalé en rupture cuisine.`;break;}
    case 'METRIC_REVENUE': state.metrics.revenue=Number(e.amount)||0;state.metrics.date=todayKey();save('metric-revenue-voice');render();reply=`Chiffre du jour enregistré : ${currency(state.metrics.revenue)}.`;break;
    case 'METRIC_COVERS': state.metrics.covers=Number(e.count)||0;state.metrics.date=todayKey();save('metric-covers-voice');render();reply=`${state.metrics.covers} couverts enregistrés.`;break;
    case 'CASH_CLOSE': {const t=cashTotals();state.cash.history=state.cash.history||[];state.cash.history.push({date:todayKey(),sales:t.sales,expected:t.expected,actual:t.actual,diff:t.diff,closedAt:nowIso()});state.cash.closedAt=nowIso();state.metrics.revenue=t.sales;save('cash-close-voice');render();reply=`Caisse clôturée. Ventes saisies ${currency(t.sales)}. Écart ${currency(t.diff)}.`;break;}
    case 'SERVICE_OPEN': state.service={open:true,openedAt:nowIso(),closedAt:null};save('service-open');render();reply='Service ouvert. Je surveille maintenant les priorités enregistrées.';break;
    case 'SERVICE_CLOSE': state.service.open=false;state.service.closedAt=nowIso();save('service-close');render();reply=`Service clôturé. ${buildSummary()}`;break;
    case 'STUDIO_OPEN': setSection('studio');reply='Studio OBINA ouvert. Choisis une photo du plat, de la table ou de la salle.';break;
    case 'REPORT_SUMMARY': state.ui.section='reports';save('report-open-voice');render();reply=buildSummary();break;
    case 'CHECKLIST_OPEN': state.ui.checklistType=e.type||'service';state.ui.section='checklists';save('checklist-open-voice');render();reply=`J’ouvre le contrôle ${e.type||'service'}.`;break;
    case 'FREEFORM_RESTAURANT': reply=await restaurantAssistant(e.message);break;
    default:reply='Je n’ai pas exécuté cette commande.';
  }
  audit('voice-executed',`${cmd.intent}${confirmed?':confirmed':''}`);
  voiceMessage(reply,true);
}

async function restaurantAssistant(message){
  const n=normalizeVoice(message);
  if(/combien.*table.*libre|table.*disponible/.test(n))return `${state.tables.filter(t=>t.status==='free').length} table(s) libre(s) sur ${state.tables.length}.`;
  if(/combien.*table.*occupe|table.*en cours/.test(n))return `${state.tables.filter(t=>['occupied','ordered','served','bill'].includes(t.status)).length} table(s) en cours.`;
  if(/prochaine.*reservation|reservation.*prochaine/.test(n)){const r=activeReservations()[0];return r?`Prochaine réservation : ${r.time||'heure non précisée'}, ${r.people} personne(s), ${r.name}.`:'Aucune réservation enregistrée aujourd’hui.';}
  if(/priorite|urgent|attention|alerte/.test(n)){const a=alerts();return a.length?a.map(x=>x.text).join('. '):'Aucune alerte opérationnelle enregistrée.';}
  if(/stock.*critique|rupture|manque/.test(n)){const a=state.stock.filter(s=>Number(s.quantity)<=Number(s.min||0));return a.length?`Stocks critiques : ${a.map(s=>`${s.name} (${s.quantity}${s.unit?` ${s.unit}`:''})`).join(', ')}.`:'Aucun stock critique selon les seuils enregistrés.';}
  if(/resume|bilan|etat.*restaurant|comment.*service/.test(n))return buildSummary();
  if(/que peux tu faire|aide moi/.test(n))return `Je peux agir sur les tables, commandes, réservations, cuisine, stocks, équipe, tâches, incidents, contrôles, caisse, rapports et Studio photo. Dis par exemple : « table 8 servie » ou « rupture saumon ».`;
  const remote=await callRestaurantBrain(message);
  if(remote)return remote;
  return `Je n’ai pas assez de structure pour exécuter cette phrase sans risque. Reformule avec l’objet et l’action : par exemple « table 8 addition », « ajoute 6 bouteilles d’eau », « réserve 4 personnes à 20h », ou « ouvre les stocks ».`;
}

async function callRestaurantBrain(message){
  const endpoint=(localStorage.getItem('fiama-brain-endpoint')||'').trim();if(!endpoint)return null;
  try{
    const u=new URL(endpoint);if(u.protocol!=='https:'&&u.hostname!=='localhost')return null;
    const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),10000);
    const payload={schema:'obina.restaurant.voice.v1',build:BUILD,message,language:'fr',role:state.restaurant.role,summary:{serviceOpen:state.service.open,freeTables:state.tables.filter(t=>t.status==='free').length,totalTables:state.tables.length,reservationsToday:activeReservations().length,openTasks:state.tasks.filter(t=>!t.done).length,stockAlerts:state.stock.filter(s=>Number(s.quantity)<=Number(s.min||0)).map(s=>s.name).slice(0,10),openIncidents:state.incidents.filter(i=>!i.closed).length}};
    const r=await fetch(u.toString(),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),signal:ctl.signal,cache:'no-store'});clearTimeout(timer);if(!r.ok)return null;const d=await r.json();return typeof d.reply==='string'&&d.reply.trim()?d.reply.trim():null;
  }catch{return null;}
}

function voiceMessage(text,speak=false){
  const status=$('#voiceStatus');if(status)status.textContent=text||'';
  if(speak&&state.voice.autoSpeak) speakText(text);
}
function speakText(text){
  if(!('speechSynthesis'in window)||!text)return;
  try{window.speechSynthesis.cancel();if(recognition){try{recognition.abort()}catch{}recognition=null;}}
  catch{}
  const u=new SpeechSynthesisUtterance(String(text).slice(0,700));u.lang='fr-FR';u.rate=.96;u.pitch=.98;
  u.onend=()=>{if(state.voice.handsFree&&document.visibilityState==='visible')setTimeout(()=>startRecognition('handsfree'),350)};
  window.speechSynthesis.speak(u);
}

const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function startRecognition(mode='manual'){
  if(!SR){voiceMessage('La reconnaissance vocale de ce navigateur n’est pas disponible. Utilise le champ texte.',false);$('#voicePanel')?.classList.remove('hidden');return;}
  if(recognition){try{recognition.stop()}catch{}return;}
  recognitionMode=mode;
  try{window.speechSynthesis?.cancel()}catch{}
  const r=new SR();recognition=r;r.lang='fr-FR';r.interimResults=true;r.continuous=false;r.maxAlternatives=1;
  let final='';
  r.onstart=()=>{syncVoiceUi(true);voiceMessage(mode==='handsfree'?(state.voice.wakeWord?'Mains libres : dis « OBINA… » puis ta commande.':'Mains libres : je t’écoute.'):'Je t’écoute. Parle naturellement.',false)};
  r.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const part=e.results[i][0]?.transcript||'';if(e.results[i].isFinal)final=(final+' '+part).trim();else interim=(interim+' '+part).trim();}const heard=(final+' '+interim).trim();const status=$('#voiceStatus');if(status&&heard)status.textContent=`« ${heard} »`;};
  r.onerror=e=>{audit('voice-error',e.error||'unknown');if(!['aborted','no-speech'].includes(e.error||''))voiceMessage(`Micro : ${e.error||'erreur'}.`,false)};
  r.onend=()=>{recognition=null;syncVoiceUi(false);if(final)handleVoiceInput(final,{fromRecognition:true});else if(mode==='handsfree'&&state.voice.handsFree&&document.visibilityState==='visible'&&!window.speechSynthesis?.speaking)setTimeout(()=>startRecognition('handsfree'),450)};
  try{r.start()}catch{recognition=null;syncVoiceUi(false)}
}
function stopRecognition(){state.voice.handsFree=false;save('handsfree-stop');if(recognition){try{recognition.abort()}catch{}recognition=null}syncVoiceUi(false);}
function syncVoiceUi(listening=!!recognition){const b=$('#micBtn');if(b)b.classList.toggle('listening',listening)}

function toggleService(){
  if(state.service.open){const cmd={intent:'SERVICE_CLOSE',entities:{},requiresConfirmation:true,sensitive:true,raw:'ferme le service'};pendingCommand=cmd;render();voiceMessage('La clôture du service demande confirmation.',false);}
  else applyCommand({intent:'SERVICE_OPEN',entities:{},raw:'ouvre le service'});
}

function handleClick(e){
  const nav=e.target.closest('[data-nav]');if(nav){setSection(nav.dataset.nav);return;}
  const ex=e.target.closest('[data-voice-example]');if(ex){handleVoiceInput(ex.dataset.voiceExample);return;}
  const table=e.target.closest('[data-table]');if(table){state.ui.selectedTable=Number(table.dataset.table);voiceContext.tableId=state.ui.selectedTable;save('table-select');render();return;}
  const ts=e.target.closest('[data-table-status]');if(ts){applyCommand({intent:'TABLE_STATUS',entities:{tableId:Number(ts.dataset.id),status:ts.dataset.tableStatus},raw:'ui'});return;}
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(action==='voice-start'){startRecognition(state.voice.handsFree?'handsfree':'manual');return;}
  if(action==='voice-expand'){$('#voicePanel')?.classList.toggle('hidden');$('#voiceTextInput')?.focus();return;}
  if(action==='voice-send'){const v=$('#voiceTextInput')?.value.trim();if(v){$('#voiceTextInput').value='';handleVoiceInput(v)}return;}
  if(action==='voice-confirm'){handleVoiceInput('confirme');return;}
  if(action==='voice-cancel'){handleVoiceInput('annule');return;}
  if(action==='handsfree'){state.voice.handsFree=!state.voice.handsFree;save('handsfree-toggle');render();if(state.voice.handsFree)setTimeout(()=>startRecognition('handsfree'),120);else stopRecognition();return;}
  if(action==='toggle-service'){toggleService();return;}
  if(action==='all-tables-free'){state.ui.selectedTable=null;voiceContext.tableId=null;save('table-selection-clear');render();return;}
  if(action==='complete-checklist'){const run=checklistRun(state.ui.checklistType);const items=state.checklist.templates[state.ui.checklistType]||[];if(items.some((_,i)=>!run.checked[i]))return toast('Il reste des points non cochés.');run.completedAt=nowIso();save(`checklist-complete:${state.ui.checklistType}`);render();toast('Contrôle validé.');return;}
  if(action==='photo-export'){exportPhoto();return;}
  if(action==='export'){exportData();return;}
  if(action==='sync-pull'){syncPull();return;}
  if(action==='sync-push'){syncPush();return;}
  if(action==='cash-close'){if(!['owner','manager'].includes(state.restaurant.role))return toast('Profil responsable requis.');if(!confirm('Clôturer la caisse avec les montants actuellement saisis ?'))return;const t=cashTotals();state.cash.history=state.cash.history||[];state.cash.history.push({date:todayKey(),sales:t.sales,expected:t.expected,actual:t.actual,diff:t.diff,closedAt:nowIso()});state.cash.closedAt=nowIso();state.metrics.revenue=t.sales;save('cash-close');render();toast('Caisse clôturée et archivée.');return;}
  if(action==='reset'){if(confirm('Effacer toutes les données OBINA Restaurant de cet appareil ? La mémoire historique BUILD 44 n’est pas touchée.')){localStorage.removeItem(STORAGE_KEY);state=defaultState();pendingCommand=null;save('reset');render();toast('OBINA Restaurant réinitialisé.')}return;}

  const preset=e.target.closest('[data-photo-preset]');if(preset){currentPhoto.preset=preset.dataset.photoPreset;render();return;}
  const advice=e.target.closest('[data-studio-advice]');if(advice){const box=$('#studioAdvice');if(box)box.innerHTML=studioAdvice(advice.dataset.studioAdvice).map(x=>`• ${escapeHtml(x)}`).join('<br>');return;}
  const ct=e.target.closest('[data-checklist-type]');if(ct){state.ui.checklistType=ct.dataset.checklistType;save('checklist-type');render();return;}
  const done=e.target.closest('[data-task-done]');if(done){const t=state.tasks.find(x=>x.id===done.dataset.taskDone);if(t){t.done=true;t.doneAt=nowIso();save('task-done');render()}return;}
  const td=e.target.closest('[data-ticket-done]');if(td){const t=state.tickets.find(x=>x.id===td.dataset.ticketDone);if(t){t.status='ready';t.done=true;t.readyAt=nowIso();t.completedAt=t.readyAt;save('ticket-ready');render()}return;}
  const os=e.target.closest('[data-order-status]');if(os){const t=state.tickets.find(x=>x.id===os.dataset.id);if(t){const st=os.dataset.orderStatus;t.status=st;if(st==='preparing')t.preparingAt=nowIso();if(st==='ready'){t.readyAt=nowIso();t.done=true;t.completedAt=t.readyAt}if(st==='served'){t.servedAt=nowIso();const table=tableById(t.tableId);if(table)table.status='served'}if(st==='paid'){t.paidAt=nowIso();const table=tableById(t.tableId);if(table){table.status='dirty';table.billRequested=false}}save(`order:${t.id}:${st}`);render()}return;}
  const rt=e.target.closest('[data-recipe-studio]');if(rt){state.ui.section='studio';save(`recipe-studio:${rt.dataset.recipeStudio}`);render();toast('Studio ouvert pour préparer une photo fidèle du plat.');return;}
  const rd=e.target.closest('[data-recipe-delete]');if(rd){if(!['owner','manager'].includes(state.restaurant.role))return toast('Profil responsable requis.');const r=state.recipes.find(x=>x.id===rd.dataset.recipeDelete);if(r&&confirm(`Supprimer la fiche « ${r.name} » ?`)){state.recipes=state.recipes.filter(x=>x.id!==r.id);save('recipe-delete');render()}return;}
  const sd=e.target.closest('[data-shift-delete]');if(sd){if(!['owner','manager'].includes(state.restaurant.role))return toast('Profil responsable requis.');state.shifts=state.shifts.filter(x=>x.id!==sd.dataset.shiftDelete);save('shift-delete');render();return;}
  const tr=e.target.closest('[data-training-toggle]');if(tr){const id=tr.dataset.trainingToggle;if(state.training.completed[id])delete state.training.completed[id];else state.training.completed[id]=nowIso();save(`training:${id}`);render();return;}
  const ic=e.target.closest('[data-incident-close]');if(ic){const i=state.incidents.find(x=>x.id===ic.dataset.incidentClose);if(i){i.closed=true;i.closedAt=nowIso();save('incident-close');render()}return;}
  const step=e.target.closest('[data-stock-step]');if(step){const s=state.stock.find(x=>x.id===step.dataset.id);if(s){s.quantity=Math.max(0,Number(s.quantity||0)+Number(step.dataset.stockStep));s.updatedAt=nowIso();save('stock-step');render()}return;}
  const tm=e.target.closest('[data-team-status]');if(tm){const m=state.team.find(x=>x.id===tm.dataset.id);if(m){if(tm.dataset.teamStatus==='absent'&&!['owner','manager'].includes(state.restaurant.role))return toast('Profil responsable requis pour marquer une absence.');m.status=tm.dataset.teamStatus;m.updatedAt=nowIso();save('team-status');render()}return;}
  const rc=e.target.closest('[data-reservation-cancel]');if(rc){const r=state.reservations.find(x=>x.id===rc.dataset.reservationCancel);if(r&&confirm(`Annuler la réservation de ${r.name} ?`)){r.cancelled=true;r.cancelledAt=nowIso();save('reservation-cancel');render()}return;}
  const rs=e.target.closest('[data-reservation-seat]');if(rs){const r=state.reservations.find(x=>x.id===rs.dataset.reservationSeat);if(!r)return;const free=state.tables.find(t=>t.status==='free');if(!free)return toast('Aucune table libre enregistrée.');free.status='occupied';free.guests=r.people;free.notes.push({text:`Réservation ${r.name}${r.note?` · ${r.note}`:''}`,date:nowIso()});r.seatedAt=nowIso();r.tableId=free.id;state.ui.selectedTable=free.id;save('reservation-seated');state.ui.section='floor';render();toast(`Installé à la table ${free.id}.`);return;}
}

document.addEventListener('click',handleClick);
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target?.id==='voiceTextInput'){e.preventDefault();const v=e.target.value.trim();if(v){e.target.value='';handleVoiceInput(v)}}});
document.addEventListener('change',e=>{
  if(e.target.matches('[data-check]')){const run=checklistRun(state.ui.checklistType);run.checked[e.target.dataset.check]=e.target.checked;save('checklist-toggle');render();return;}
  if(e.target.matches('[data-setting]')){state.voice[e.target.dataset.setting]=e.target.checked;save(`voice-setting:${e.target.dataset.setting}`);render();if(e.target.dataset.setting==='handsFree'){if(state.voice.handsFree)setTimeout(()=>startRecognition('handsfree'),120);else stopRecognition()}return;}
});

document.addEventListener('submit',e=>{
  const form=e.target.closest('[data-form]');if(!form)return;e.preventDefault();const fd=new FormData(form);const kind=form.dataset.form;
  if(kind==='reservation'){state.reservations.push({id:uid('r'),name:String(fd.get('name')).trim(),people:Number(fd.get('people')),date:String(fd.get('date')),time:String(fd.get('time')),phone:String(fd.get('phone')||'').trim(),note:String(fd.get('note')||'').trim(),createdAt:nowIso(),cancelled:false});save('reservation-create');render();toast('Réservation enregistrée.');}
  if(kind==='ticket'){const tableId=Number(fd.get('tableId'));state.tickets.push({id:uid('k'),tableId,items:String(fd.get('items')).trim(),priority:String(fd.get('priority')),status:'ordered',done:false,amount:0,createdAt:nowIso()});const t=tableById(tableId);if(t)t.status='ordered';save('ticket-create');render();toast('Ticket envoyé en cuisine.');}
  if(kind==='order'){const tableId=Number(fd.get('tableId'));state.tickets.push({id:uid('k'),tableId,items:String(fd.get('items')).trim(),priority:'normal',status:'ordered',done:false,amount:Number(fd.get('amount')||0),createdAt:nowIso()});const t=tableById(tableId);if(t)t.status='ordered';save('order-create');render();toast('Commande créée et envoyée en cuisine.');}
  if(kind==='recipe'){state.recipes.push({id:uid('r'),name:String(fd.get('name')).trim(),category:String(fd.get('category')||'').trim(),portions:Number(fd.get('portions')||1),ingredients:String(fd.get('ingredients')).trim(),steps:String(fd.get('steps')).trim(),allergens:String(fd.get('allergens')||'').trim(),plating:String(fd.get('plating')||'').trim(),cost:Number(fd.get('cost')||0),price:Number(fd.get('price')||0),createdAt:nowIso()});save('recipe-add');render();toast('Fiche technique enregistrée.');}
  if(kind==='shift'){state.shifts.push({id:uid('sh'),name:String(fd.get('name')).trim(),role:String(fd.get('role')).trim(),date:String(fd.get('date')),start:String(fd.get('start')),end:String(fd.get('end')),note:String(fd.get('note')||'').trim(),createdAt:nowIso()});save('shift-add');render();toast('Service ajouté au planning.');}
  if(kind==='cash'){if(!['owner','manager'].includes(state.restaurant.role))return toast('Profil responsable requis.');state.cash={...state.cash,date:todayKey(),openingFloat:Number(fd.get('openingFloat')||0),cashSales:Number(fd.get('cashSales')||0),cardSales:Number(fd.get('cardSales')||0),otherSales:Number(fd.get('otherSales')||0),actualCash:Number(fd.get('actualCash')||0),notes:String(fd.get('notes')||'').trim(),closedAt:null};state.metrics.revenue=cashTotals().sales;save('cash-update');render();toast('Caisse mise à jour.');}

  if(kind==='stock'){const name=String(fd.get('name')).trim();let s=stockByName(name);if(!s){s={id:uid('s'),name,quantity:0,unit:'',min:0};state.stock.push(s)}s.quantity=Number(fd.get('quantity'));s.unit=String(fd.get('unit')||'').trim();s.min=Number(fd.get('min')||0);s.updatedAt=nowIso();save('stock-save');render();toast('Stock enregistré.');}
  if(kind==='team'){state.team.push({id:uid('m'),name:String(fd.get('name')).trim(),role:String(fd.get('role')),status:'present',createdAt:nowIso()});save('team-add');render();toast('Membre ajouté.');}
  if(kind==='task'){state.tasks.push({id:uid('t'),text:String(fd.get('text')).trim(),owner:String(fd.get('owner')||'').trim(),priority:String(fd.get('priority')),done:false,createdAt:nowIso()});save('task-add');render();toast('Tâche créée.');}
  if(kind==='customer'){state.customers.push({id:uid('c'),name:String(fd.get('name')).trim(),note:String(fd.get('note')).trim(),createdAt:nowIso()});save('customer-add');render();toast('Fiche client enregistrée.');}
  if(kind==='incident'){state.incidents.push({id:uid('i'),description:String(fd.get('description')).trim(),severity:String(fd.get('severity')),closed:false,createdAt:nowIso()});save('incident-add');render();toast('Incident enregistré.');}
  if(kind==='table-note'){const t=tableById(form.dataset.id);const note=String(fd.get('note')||'').trim();if(t&&note){t.notes.push({text:note,date:nowIso()});save('table-note-ui');render();toast('Note ajoutée.');}}
  if(kind==='metrics'){if(!['owner','manager'].includes(state.restaurant.role))return toast('Profil responsable requis.');state.metrics={date:todayKey(),covers:Number(fd.get('covers')||0),revenue:Number(fd.get('revenue')||0)};save('metrics-save');render();toast('Indicateurs enregistrés.');}
  if(kind==='sync'){const endpoint=String(fd.get('endpoint')||'').trim().replace(/\/+$/,'');const restaurantId=String(fd.get('restaurantId')||'').trim();const token=String(fd.get('token')||'').trim();if(endpoint){try{const u=new URL(endpoint);if(u.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(u.hostname))throw Error('protocol')}catch{return toast('Adresse Sync invalide : HTTPS requis, sauf localhost.')}}if(restaurantId&&!/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,63}$/.test(restaurantId))return toast('Identifiant restaurant invalide.');state.sync.endpoint=endpoint;state.sync.restaurantId=restaurantId;state.sync.mode='local';if(token)sessionStorage.setItem('obina-restaurant-sync-token',token);save('sync-settings');render();toast('Raccordement Sync enregistré.');}
  if(kind==='settings'){state.restaurant.name=String(fd.get('name')||'Mon restaurant').trim()||'Mon restaurant';ensureTables(fd.get('tablesCount'));state.restaurant.currency=String(fd.get('currency')||'CHF');state.restaurant.role=String(fd.get('role')||'owner');save('settings-save');render();toast('Réglages enregistrés.');}
});


function syncConfig(){
  const endpoint=String(state.sync?.endpoint||'').trim().replace(/\/+$/,'');const restaurantId=String(state.sync?.restaurantId||'').trim();const token=sessionStorage.getItem('obina-restaurant-sync-token')||'';
  if(!endpoint||!restaurantId)return {error:'Configure d’abord l’adresse Sync et l’identifiant du restaurant.'};
  if(!token)return {error:'Saisis le jeton Sync dans Réglages pour cette session.'};
  try{const u=new URL(endpoint);if(u.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(u.hostname))return {error:'Le service Sync doit utiliser HTTPS.'};}catch{return {error:'Adresse Sync invalide.'}}
  return {endpoint,restaurantId,token};
}
async function syncPull(){
  const c=syncConfig();if(c.error)return toast(c.error);
  try{
    const r=await fetch(`${c.endpoint}/api/restaurants/${encodeURIComponent(c.restaurantId)}/state`,{headers:{authorization:`Bearer ${c.token}`},cache:'no-store'});
    if(r.status===404)return toast('Aucune donnée distante pour ce restaurant.');
    if(r.status===401)return toast('Jeton Sync refusé.');
    if(!r.ok)return toast(`Sync impossible (${r.status}).`);
    const d=await r.json();if(!d.state||typeof d.state!=='object')return toast('Réponse Sync invalide.');
    if(!confirm(`Recevoir la version distante ${d.version||''} et remplacer les données locales de cet appareil ?`))return;
    const localSync={...state.sync};state=migrateState(d.state);state.sync={...state.sync,...localSync,mode:'connected',lastVersion:d.version||null,lastSync:nowIso()};save('sync-pull');render();toast('Données reçues.');
  }catch{toast('Service Sync inaccessible.')}
}
async function syncPush(){
  const c=syncConfig();if(c.error)return toast(c.error);
  try{
    const body={state,deviceId:getDeviceId(),baseVersion:state.sync?.lastVersion||null};
    const r=await fetch(`${c.endpoint}/api/restaurants/${encodeURIComponent(c.restaurantId)}/state`,{method:'PUT',headers:{authorization:`Bearer ${c.token}`,'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store'});
    if(r.status===409){const d=await r.json().catch(()=>({}));return toast(`Une version plus récente existe (${d.currentVersion||'conflit'}). Fais « Recevoir » avant d’envoyer.`)}
    if(r.status===401)return toast('Jeton Sync refusé.');
    if(!r.ok)return toast(`Envoi Sync impossible (${r.status}).`);
    const d=await r.json();state.sync.mode='connected';state.sync.lastVersion=d.version||null;state.sync.lastSync=nowIso();save('sync-push');render();toast('Données envoyées aux autres appareils.');
  }catch{toast('Service Sync inaccessible.')}
}

function exportData(){
  const payload={app:'OBINA-RESTAURANT',schema:2,build:BUILD,exportedAt:nowIso(),data:state};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`OBINA-RESTAURANT-${todayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);audit('export','restaurant-backup');
}
async function handleImport(e){
  const f=e.target.files?.[0];if(!f)return;try{const d=JSON.parse(await f.text());if(!['OBINA-RESTAURANT','FIAMA-RESTAURANT'].includes(d.app)||!d.data||typeof d.data!=='object')throw Error('format');if(!confirm('Restaurer cette sauvegarde OBINA Restaurant ? Les données actuelles seront remplacées.'))return;state=migrateState(d.data);save('import');render();toast('Sauvegarde restaurée.');}catch{toast('Sauvegarde invalide. Aucune donnée modifiée.')}finally{e.target.value=''}
}
function exportPhoto(){
  const img=$('#studioImage');if(!img||!currentPhoto.url)return;const canvas=document.createElement('canvas');const max=1800;const scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=canvas.getContext('2d');const filter=(PRESETS[currentPhoto.preset]||PRESETS.natural).filter.replace(' warm(1)',' sepia(.05)');ctx.filter=filter;ctx.drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>{if(!blob)return;const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`obina-restaurant-photo-${currentPhoto.preset}.jpg`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);},'image/jpeg',.92);
}

function stopAudio(){try{window.speechSynthesis?.cancel()}catch{}if(recognition){try{recognition.abort()}catch{}recognition=null}syncVoiceUi(false)}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAudio();else if(state.voice.handsFree)setTimeout(()=>startRecognition('handsfree'),300)});
window.addEventListener('pagehide',stopAudio);
window.addEventListener('offline',()=>toast('Hors ligne : les fonctions locales restent disponibles.'));

if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
try{navigator.storage?.persist?.()}catch{}
render();
if(state.voice.handsFree&&document.visibilityState==='visible')setTimeout(()=>startRecognition('handsfree'),500);