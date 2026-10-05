# BUILD 45 — FIAMA Restaurant

Date: 2026-10-05
Branche de chantier: `sol/fiama-restaurant-v1-20261005`
Base: BUILD 44

## But
Transformer COPILOTE FIAMA en cockpit 100 % restauration utilisable sur smartphone, sans reconstruire la base et sans introduire de secret côté client.

## Livré dans cette build
1. Tableau de bord service avec alertes opérationnelles.
2. Salle : 1–100 tables, états, notes, allergies/intolérances, demande d’addition.
3. Réservations : création, annulation confirmée, installation automatique sur table libre.
4. Cuisine : tickets, priorités, état commandé/servi, ruptures visibles.
5. Stocks : quantité, unité, seuil, incrément/décrément, rupture.
6. Équipe : présence opérationnelle et poste, avec confirmation/permission sur absence vocale.
7. Tâches, clients, incidents, check-lists ouverture/service/hygiène/fermeture.
8. Studio FIAMA : photo réelle, presets locaux lumière/contraste/saturation, export JPEG et conseils assiette/table/salle/social.
9. Rapports : couverts, chiffre saisi, réservations, tickets, incidents, tâches.
10. Sauvegarde/import JSON et conservation séparée de la mémoire historique BUILD 44.
11. Commande vocale restaurant : parseur dédié, contexte de table, confirmations sensibles, blocage des suppressions globales vocales, mode mains libres + mot-clé « FIAMA ».
12. Arrêt micro/TTS au passage en arrière-plan.

## Sécurité / vérité
- Aucune action globale destructive par voix.
- Allergies, absence équipe, retrait stock, chiffre et clôture de service demandent confirmation vocale selon le cas.
- Les exigences hygiène/HACCP exactes ne sont pas inventées : FIAMA fournit des check-lists génériques et rappelle que la procédure applicable reste celle de l’établissement et du droit local.
- Le rôle local est une limitation d’interface, pas une authentification serveur.
- Le Studio améliore une photo réelle mais ne remplace pas le plat par un produit fictif.

## Tests
- `node --check public/app.js`
- `node --check public/voice-engine.js`
- `node --check public/sw.js`
- `node tests/restaurant-core.test.mjs`

Le test vocal couvre notamment : table occupée, addition, allergie, réservation, stock, rupture, ajout stock, absence, tâche, incident, ticket cuisine, navigation rapport, clôture confirmée, blocage destructif et contexte « elle veut l’addition ».