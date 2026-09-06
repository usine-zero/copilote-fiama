# Copilote Fiama — BUILD 44

Base maître: COPILOTE-FIAMA-V1-BUILD-44.

## Structure
- `public/` : PWA publique à déployer.
- `server/` : passerelle cerveau distante, désactivée par défaut.
- `docs/` : dossier maître, audits et historique de construction. Ne pas publier comme racine web.

## Sécurité
- Aucun secret ne doit être commité.
- Le cerveau distant reste désactivé tant qu'un fournisseur et un budget ne sont pas explicitement configurés côté serveur.
- Pour un déploiement statique, publier uniquement le dossier `public/`.
