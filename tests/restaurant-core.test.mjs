import assert from 'node:assert/strict';
import {parseRestaurantCommand, normalizeVoice} from '../public/voice-engine.js';

const cases = [
  ['Table n° 2 occupée','TABLE_STATUS',x=>x.entities.tableId===2&&x.entities.status==='occupied'],
  ['Table 12 occupée','TABLE_STATUS',x=>x.entities.tableId===12&&x.entities.status==='occupied'],
  ['Table 7 veut l’addition','TABLE_BILL_REQUEST',x=>x.entities.tableId===7],
  ['Table 4 allergie aux arachides','TABLE_ALLERGY',x=>x.entities.tableId===4&&x.requiresConfirmation],
  ['Réserve pour 4 personnes demain à 20h au nom de Diallo','RESERVATION_CREATE',x=>x.entities.people===4&&x.entities.time==='20:00'&&x.entities.dateHint==='tomorrow'],
  ['Réserve pour 4 personnes à 20h au nom de Diallo','RESERVATION_CREATE',x=>x.entities.people===4&&x.entities.time==='20:00'],
  ['Il reste 6 saumons','STOCK_SET',x=>x.entities.quantity===6&&x.entities.product.includes('saumon')],
  ['Rupture de saumon','STOCK_OUT',x=>x.entities.product.includes('saumon')],
  ['Ajoute 12 bouteilles eau','STOCK_ADD',x=>x.entities.quantity===12],
  ['Fatou est absente','TEAM_ABSENCE',x=>x.entities.name==='fatou'&&x.requiresConfirmation],
  ['Ajoute une tâche de nettoyer la machine à café','TASK_CREATE',x=>x.entities.task.includes('nettoyer')],
  ['Incident frigo cuisine en panne','INCIDENT_CREATE',x=>x.entities.description.length>5],
  ['Commande table 5 : 2 burgers et une salade','KITCHEN_TICKET',x=>x.entities.tableId===5],
  ['Ouvre le rapport','NAVIGATE',x=>x.entities.section==='reports'],
  ['Ferme le service','SERVICE_CLOSE',x=>x.requiresConfirmation],
  ['supprime tout','DANGEROUS_BLOCKED',x=>x.destructive],
];
for (const [input,intent,check] of cases) {
  const got = parseRestaurantCommand(input,{});
  assert.equal(got.intent,intent,`${input} => ${got.intent}`);
  assert.ok(check(got),`${input} entities invalid: ${JSON.stringify(got)}`);
}
const ctx = parseRestaurantCommand('elle veut l addition',{tableId:9});
assert.equal(ctx.intent,'TABLE_BILL_REQUEST');
assert.equal(ctx.entities.tableId,9);
assert.equal(normalizeVoice('Équipe — Table n° 2'), 'equipe table n 2');
console.log(`PASS ${cases.length+2} assertions`);