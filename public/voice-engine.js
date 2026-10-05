const NUMBER_WORDS = new Map([
  ['zero',0],['un',1],['une',1],['deux',2],['trois',3],['quatre',4],['cinq',5],['six',6],['sept',7],['huit',8],['neuf',9],['dix',10],
  ['onze',11],['douze',12],['treize',13],['quatorze',14],['quinze',15],['seize',16],['vingt',20],['trente',30],['quarante',40],['cinquante',50],['soixante',60]
]);

const TABLE_STATUS_WORDS = [
  ['libre','free'],['disponible','free'],['reservee','reserved'],['reserve','reserved'],['occupee','occupied'],['occupe','occupied'],
  ['installee','occupied'],['installe','occupied'],['commande','ordered'],['commandee','ordered'],['servie','served'],['servi','served'],
  ['addition','bill'],['a nettoyer','dirty'],['sale','dirty'],['nettoyee','free'],['nettoye','free']
];

export function normalizeVoice(input='') {
  return String(input)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[’']/g,' ')
    .replace(/[^a-z0-9€.,:+\-\s]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function wordsToNumber(raw) {
  if (!raw) return null;
  const s = normalizeVoice(raw);
  const numeric = s.match(/\b\d+(?:[.,]\d+)?\b/);
  if (numeric) return Number(numeric[0].replace(',','.'));
  const parts = s.split(' ');
  let total = 0;
  let found = false;
  for (const p of parts) {
    if (NUMBER_WORDS.has(p)) { total += NUMBER_WORDS.get(p); found = true; }
  }
  return found ? total : null;
}

function extractTable(text, context={}) {
  const m = text.match(/\btable\s*(?:(?:numero|n)\s*)?(\d{1,3})\b/);
  if (m) return Number(m[1]);
  const pronoun = /\b(elle|celle ci|cette table|la table)\b/.test(text);
  if (pronoun && Number.isFinite(context.tableId)) return Number(context.tableId);
  return null;
}

function extractTime(text) {
  let m = text.match(/\b([01]?\d|2[0-3])\s*(?:h|heure|heures)\s*([0-5]\d)?\b/);
  if (m) return `${String(Number(m[1])).padStart(2,'0')}:${String(m[2] ? Number(m[2]) : 0).padStart(2,'0')}`;
  m = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (m) return `${String(Number(m[1])).padStart(2,'0')}:${String(Number(m[2])).padStart(2,'0')}`;
  return null;
}

function extractDateHint(text) {
  if (/\bapres demain\b/.test(text)) return 'day-after-tomorrow';
  if (/\bdemain\b/.test(text)) return 'tomorrow';
  if (/\b(aujourd hui|ce soir|ce midi)\b/.test(text)) return 'today';
  return null;
}

function extractPeople(text) {
  const m = text.match(/(?:pour|de)\s+(\d{1,2})\s*(?:personnes|personne|couverts|clients)?/);
  if (m) return Number(m[1]);
  const m2 = text.match(/\b(\d{1,2})\s*(?:personnes|personne|couverts|clients)\b/);
  if (m2) return Number(m2[1]);
  return null;
}

function extractNameAfter(text, markers) {
  for (const marker of markers) {
    const idx = text.indexOf(marker);
    if (idx >= 0) {
      const rest = text.slice(idx + marker.length).trim();
      if (!rest) continue;
      const stop = rest.split(/\b(?:a|pour|table|ce soir|demain|aujourd hui|avec|et)\b/)[0].trim();
      if (stop) return stop.replace(/\b(monsieur|madame|mme|m)\b/g,'').trim();
    }
  }
  return null;
}

function extractMoney(text) {
  const m = text.match(/\b(\d+(?:[.,]\d{1,2})?)\s*(?:chf|francs?|€|euros?)\b/);
  return m ? Number(m[1].replace(',','.')) : null;
}

function extractQuantityProduct(text, verbPattern) {
  const re = new RegExp(`${verbPattern}\\s+(?:de\\s+)?(\\d+(?:[.,]\\d+)?)\\s*(?:x\\s*)?(.+)$`);
  const m = text.match(re);
  if (!m) return null;
  const quantity = Number(m[1].replace(',','.'));
  const product = m[2].replace(/\b(en stock|au stock|dans le stock)\b/g,'').trim();
  if (!product) return null;
  return {quantity, product};
}

function result(intent, entities={}, opts={}) {
  return {
    intent,
    entities,
    confidence: opts.confidence ?? 0.92,
    sensitive: !!opts.sensitive,
    requiresConfirmation: !!opts.requiresConfirmation,
    destructive: !!opts.destructive,
    section: opts.section || null,
    reply: opts.reply || null,
    raw: opts.raw || null
  };
}

export function parseRestaurantCommand(input, context={}) {
  const raw = String(input || '').trim();
  const text = normalizeVoice(raw);
  if (!text) return result('EMPTY',{}, {confidence:1, raw});

  if (/^(confirme|je confirme|oui confirme|valide|c est bon|execute)$/.test(text)) return result('CONFIRM',{}, {confidence:1, raw});
  if (/^(annule|annuler|non|laisse tomber|stop)$/.test(text)) return result('CANCEL_PENDING',{}, {confidence:1, raw});

  if (/\b(aide|que peux tu faire|commandes vocales|comment te parler)\b/.test(text)) {
    return result('HELP_VOICE',{}, {section:'voice', raw});
  }

  const nav = [
    ['dashboard','dashboard'],['accueil','dashboard'],['salle','floor'],['tables','floor'],['cuisine','kitchen'],['stock','stock'],['stocks','stock'],
    ['equipe','team'],['planning','team'],['reservations','reservations'],['reservation','reservations'],['clients','customers'],
    ['taches','tasks'],['incidents','incidents'],['rapports','reports'],['rapport','reports'],['studio','studio'],['photos','studio'],
    ['reglages','settings'],['parametres','settings'],['checklist','checklists'],['checklists','checklists']
  ];
  for (const [word, section] of nav) {
    if (new RegExp(`\\b(?:ouvre|affiche|va sur|montre|aller a|aller aux)\\s+(?:la |le |les )?${word}\\b`).test(text)) {
      return result('NAVIGATE',{section},{section,confidence:.98,raw});
    }
  }

  if (/\b(ouvre|demarre|commence)\s+(?:le )?service\b/.test(text)) return result('SERVICE_OPEN',{}, {section:'dashboard', raw});
  if (/\b(ferme|termine|cloture)\s+(?:le )?service\b/.test(text)) return result('SERVICE_CLOSE',{}, {section:'dashboard', sensitive:true, requiresConfirmation:true, raw});

  const tableId = extractTable(text, context);

  // A spoken kitchen ticket has priority over generic table-state words such as 'commande'.
  if (tableId !== null && /\b(commande|ticket)\b/.test(text) && !/\b(commande prise|commande envoyee|commandee)\b/.test(text)) {
    const items = raw.replace(/^.*?table\s*\d+\s*[:,-]?/i,'').trim();
    if (items) return result('KITCHEN_TICKET',{tableId,items},{section:'kitchen',raw});
  }

  if (tableId !== null) {
    if (/\b(selectionne|ouvre|affiche|montre)\b/.test(text) && /\btable\b/.test(text)) return result('TABLE_SELECT',{tableId},{section:'floor',raw});
    if (/\b(addition|facture|encaisser|encaissement)\b/.test(text)) return result('TABLE_BILL_REQUEST',{tableId},{section:'floor',raw});
    if (/\b(allergie|allergique|intolerance)\b/.test(text)) {
      const allergy = text.split(/allerg(?:ie|ique)|intolerance/)[1]?.replace(/^(a|au|aux|de|des)\s+/,'').trim() || 'non precisee';
      return result('TABLE_ALLERGY',{tableId,allergy},{section:'floor',sensitive:true,requiresConfirmation:true,raw});
    }
    if (/\b(note|remarque|demande speciale|preference)\b/.test(text)) {
      const note = text.replace(/^.*?\b(?:note|remarque|demande speciale|preference)\b\s*/,'').trim();
      return result('TABLE_NOTE',{tableId,note:note || raw},{section:'floor',raw});
    }
    if (/\b(libere|libre|nettoyee|nettoye)\b/.test(text)) return result('TABLE_STATUS',{tableId,status:'free'},{section:'floor',raw});
    if (/\b(occupee|occupe|installee|installe|assise|assis)\b/.test(text)) return result('TABLE_STATUS',{tableId,status:'occupied'},{section:'floor',raw});
    if (/\b(servie|servi)\b/.test(text)) return result('TABLE_STATUS',{tableId,status:'served'},{section:'floor',raw});
    if (/\b(a nettoyer|sale)\b/.test(text)) return result('TABLE_STATUS',{tableId,status:'dirty'},{section:'floor',raw});
    if (/\b(commandee|commande prise|commande envoyee)\b/.test(text)) return result('TABLE_STATUS',{tableId,status:'ordered'},{section:'floor',raw});
    for (const [word,status] of TABLE_STATUS_WORDS) {
      if (text.includes(word)) return result('TABLE_STATUS',{tableId,status},{section:'floor',raw});
    }
  }

  if (/\b(reserve|reservation|ajoute une reservation|prends une reservation)\b/.test(text) && !/\b(annule|supprime)\b/.test(text)) {
    const people = extractPeople(text);
    const time = extractTime(text);
    const name = extractNameAfter(text,['au nom de','nom de','pour']);
    const dateHint = extractDateHint(text);
    const phone = (text.match(/\b(?:0|\+?41)\s?\d(?:[\s.-]?\d){7,11}\b/)||[])[0] || null;
    if (people || time || name) return result('RESERVATION_CREATE',{people,time,name,phone,dateHint},{section:'reservations',raw});
  }
  if (/\b(annule|supprime)\b.*\breservation\b|\breservation\b.*\b(annule|supprime)\b/.test(text)) {
    const name = extractNameAfter(text,['de','au nom de','nom de']);
    const time = extractTime(text);
    return result('RESERVATION_CANCEL',{name,time},{section:'reservations',sensitive:true,requiresConfirmation:true,destructive:true,raw});
  }

  if (/\b(rupture|epuise|plus de)\b/.test(text)) {
    const product = text.replace(/^.*?\b(?:rupture|epuise|plus de)\b\s*(?:de\s+)?/,'').replace(/\b(en cuisine|en stock|aujourd hui)\b/g,'').trim();
    if (product) return result('STOCK_OUT',{product},{section:'stock',raw});
  }

  let qp = extractQuantityProduct(text,'(?:ajoute|rajoute|recois|receptionne)');
  if (qp) return result('STOCK_ADD',qp,{section:'stock',raw});
  qp = extractQuantityProduct(text,'(?:retire|enleve|utilise|consomme)');
  if (qp) return result('STOCK_SUBTRACT',qp,{section:'stock',sensitive:true,requiresConfirmation:true,raw});

  const setStock = text.match(/\b(?:il reste|reste|stock de)\s+(\d+(?:[.,]\d+)?)\s+(.+)$/);
  if (setStock) return result('STOCK_SET',{quantity:Number(setStock[1].replace(',','.')),product:setStock[2].trim()},{section:'stock',raw});

  if (/\b(ajoute|cree|note)\b.*\b(tache|a faire)\b/.test(text) || /^rappelle\s+/.test(text)) {
    const task = text.replace(/^.*?\b(?:tache|a faire)\b\s*(?:de\s+)?/,'').replace(/^rappelle\s+(?:moi\s+)?(?:de\s+)?/,'').trim();
    return result('TASK_CREATE',{task:task || raw},{section:'tasks',raw});
  }
  if (/\btermine|fait|fini\b/.test(text) && /\b(tache|nettoyage|controle|check)\b/.test(text)) {
    return result('TASK_COMPLETE',{query:raw},{section:'tasks',raw});
  }

  if (/\b(incident|probleme|accident|casse|panne)\b/.test(text) && !/\bpas de probleme\b/.test(text)) {
    const severity = /\b(urgent|grave|danger|bless|incendie|gaz|electri|allerg)\b/.test(text) ? 'high' : 'normal';
    return result('INCIDENT_CREATE',{description:raw,severity},{section:'incidents',sensitive:severity==='high',requiresConfirmation:severity==='high',raw});
  }

  if (/\b(absent|absente|malade)\b/.test(text)) {
    const m = text.match(/^(.+?)\s+(?:est\s+)?(?:absent|absente|malade)\b/);
    const name = m ? m[1].replace(/^(marque|note|dis que)\s+/,'').trim() : null;
    if (name) return result('TEAM_ABSENCE',{name},{section:'team',sensitive:true,requiresConfirmation:true,raw});
  }
  if (/\b(retard|en retard)\b/.test(text)) {
    const m = text.match(/^(.+?)\s+(?:est\s+)?(?:en\s+)?retard\b/);
    const name = m ? m[1].replace(/^(marque|note)\s+/,'').trim() : null;
    if (name) return result('TEAM_LATE',{name},{section:'team',raw});
  }

  if (/\b(86|en rupture cuisine|retire du menu)\b/.test(text)) {
    const item = text.replace(/^.*?\b(?:86|en rupture cuisine|retire du menu)\b\s*/,'').trim();
    return result('KITCHEN_86',{item:item || raw},{section:'kitchen',raw});
  }

  if (/\b(chiffre|ca|recette)\b/.test(text)) {
    const amount = extractMoney(text);
    if (amount !== null) return result('METRIC_REVENUE',{amount},{section:'reports',sensitive:true,requiresConfirmation:true,raw});
  }
  if (/\b(couverts|clients servis)\b/.test(text)) {
    const count = wordsToNumber(text);
    if (count !== null) return result('METRIC_COVERS',{count},{section:'reports',raw});
  }

  if (/\b(photo|assiette|plat|dressage|table)\b/.test(text) && /\b(embellis|ameliore|studio|photo|presentation)\b/.test(text)) {
    return result('STUDIO_OPEN',{query:raw},{section:'studio',raw});
  }

  if (/\b(rapport|resume|bilan)\b/.test(text)) {
    return result('REPORT_SUMMARY',{scope:/\bjour|aujourd/.test(text)?'today':'service'},{section:'reports',raw});
  }

  if (/\b(checklist|controle)\b/.test(text)) {
    const type = /fermeture|soir/.test(text) ? 'closing' : /ouverture|matin/.test(text) ? 'opening' : /hygiene|haccp/.test(text) ? 'hygiene' : 'service';
    return result('CHECKLIST_OPEN',{type},{section:'checklists',raw});
  }

  if (/\b(supprime tout|efface tout|reinitialise|reset)\b/.test(text)) {
    return result('DANGEROUS_BLOCKED',{reason:'destructive-global-action'},{sensitive:true,destructive:true,confidence:1,raw});
  }

  return result('FREEFORM_RESTAURANT',{message:raw},{section:context.section || 'assistant',confidence:.45,raw});
}

export function summarizeCommand(cmd) {
  const e = cmd.entities || {};
  switch (cmd.intent) {
    case 'TABLE_STATUS': return `Table ${e.tableId} → ${e.status}`;
    case 'TABLE_BILL_REQUEST': return `Addition demandée pour la table ${e.tableId}`;
    case 'TABLE_ALLERGY': return `Allergie table ${e.tableId} : ${e.allergy}`;
    case 'TABLE_NOTE': return `Note table ${e.tableId} : ${e.note}`;
    case 'RESERVATION_CREATE': return `Réservation ${e.people||'?'} pers. ${e.time||''} ${e.name?`— ${e.name}`:''}`.trim();
    case 'RESERVATION_CANCEL': return `Annuler réservation ${e.name||''} ${e.time||''}`.trim();
    case 'STOCK_OUT': return `Rupture : ${e.product}`;
    case 'STOCK_ADD': return `Stock +${e.quantity} ${e.product}`;
    case 'STOCK_SUBTRACT': return `Stock -${e.quantity} ${e.product}`;
    case 'STOCK_SET': return `Stock ${e.product} = ${e.quantity}`;
    case 'TASK_CREATE': return `Nouvelle tâche : ${e.task}`;
    case 'INCIDENT_CREATE': return `Incident ${e.severity}: ${e.description}`;
    case 'TEAM_ABSENCE': return `Absence : ${e.name}`;
    case 'TEAM_LATE': return `Retard : ${e.name}`;
    case 'KITCHEN_TICKET': return `Ticket table ${e.tableId} : ${e.items}`;
    case 'KITCHEN_86': return `Rupture cuisine : ${e.item}`;
    case 'METRIC_REVENUE': return `Chiffre : ${e.amount}`;
    case 'METRIC_COVERS': return `Couverts : ${e.count}`;
    case 'SERVICE_CLOSE': return 'Clôturer le service';
    case 'SERVICE_OPEN': return 'Ouvrir le service';
    case 'NAVIGATE': return `Ouvrir ${e.section}`;
    default: return cmd.raw || cmd.intent;
  }
}

export const VOICE_EXAMPLES = [
  'Table 12 occupée',
  'Table 7 veut l’addition',
  'Table 4 allergie aux arachides',
  'Réserve pour 4 personnes à 20h au nom de Diallo',
  'Il reste 6 saumons',
  'Rupture de saumon',
  'Ajoute 12 bouteilles d’eau',
  'Fatou est absente',
  'Ajoute une tâche : nettoyer la machine à café',
  'Incident : frigo cuisine en panne',
  'Commande table 5 : deux burgers et une salade',
  'Ouvre le rapport du jour'
];