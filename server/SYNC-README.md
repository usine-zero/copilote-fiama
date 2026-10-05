# OBINA Restaurant Sync — BUILD 46

Service Node.js sans dépendance externe pour synchroniser le même restaurant entre téléphone, tablette et ordinateur.

Variables :
- `OBINA_SYNC_TOKEN` obligatoire.
- `OBINA_SYNC_DIR` dossier de données (défaut `.obina-sync-data`).
- `OBINA_SYNC_ALLOWED_ORIGINS` origines web autorisées, séparées par virgules.
- `HOST` et `PORT` pour l'écoute réseau.

Le client conserve le jeton uniquement dans `sessionStorage`. Chaque écriture fournit `baseVersion`; le serveur renvoie HTTP 409 si un autre appareil a déjà écrit une version plus récente. Les écritures disque sont atomiques.

Le serveur doit être exposé en HTTPS en production. Aucun secret ne doit être commité.