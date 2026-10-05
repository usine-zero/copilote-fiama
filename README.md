# FIAMA Restaurant — BUILD 45

BUILD 44 reste la base historique. BUILD 45 transforme l’interface publique en cockpit spécialisé restauration sans supprimer les principes de sécurité : fonctionnement local par défaut, sauvegarde contrôlée, aucune clé secrète côté navigateur, confirmation des actions sensibles et arrêt du micro quand l’application quitte le premier plan.

## Modules
- Aujourd’hui / service
- Salle et tables
- Réservations
- Cuisine et tickets
- Stocks / ruptures
- Équipe (présence opérationnelle, pas dossier RH)
- Tâches
- Clients (notes minimales choisies)
- Contrôles / check-lists
- Incidents
- Studio FIAMA pour améliorer localement les vraies photos
- Rapports
- Réglages et sauvegarde

## Commande vocale métier
Le moteur `public/voice-engine.js` analyse d’abord les commandes localement : table, addition, allergie, réservation, stock, rupture, équipe, tâche, incident, ticket cuisine, rapports, check-lists et navigation. Les actions sensibles demandent confirmation. Le mode mains libres peut exiger le mot-clé « FIAMA ».

## Structure
- `public/` : PWA à publier
- `server/` : passerelle cerveau distante existante, désactivée par défaut
- `tests/` : tests du routeur vocal restaurant
- `docs/` : dossier de conception et point de reprise

## Vérification
```bash
npm run verify
```