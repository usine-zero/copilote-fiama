# OBINA Restaurant — chantier BUILD 45

Produit officiel : **OBINA Restaurant**.

La branche actuelle dérive de l'ancien Copilote Fiama BUILD 44. Les noms techniques historiques peuvent rester temporairement pour compatibilité, mais le produit utilisateur porte désormais le nom **OBINA Restaurant**.

## Règle d'interface
OBINA Restaurant est multi-appareils : téléphone, tablette et ordinateur. Le téléphone reçoit une interface plus compacte et simplifiée, mais aucune fonction métier importante ne doit être réservée à un seul type d'appareil.

Voir `docs/OBINA-RESTAURANT-DIRECTIVE.md` pour la directive de chantier complète.

## Structure
- `public/` : PWA publique à déployer.
- `server/` : passerelle cerveau distante, désactivée par défaut.
- `docs/` : dossier maître, audits et historique de construction. Ne pas publier comme racine web.

## Sécurité
- Aucun secret ne doit être commité.
- Le cerveau distant reste désactivé tant qu'un fournisseur et un budget ne sont pas explicitement configurés côté serveur.
- Pour un déploiement statique, publier uniquement le dossier `public/`.
