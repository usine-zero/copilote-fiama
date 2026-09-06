# BUILD 16 — durcissement de la porte cerveau

- Origine iPhone/PWA autorisée explicitement côté serveur via `FIAMA_ALLOWED_ORIGIN`.
- Pré-vol CORS contrôlé; une origine inconnue est refusée.
- Limite stricte de taille de requête.
- Limitation anti-boucle/anti-abus de base avant tout futur appel IA.
- Identifiant de requête renvoyé pour diagnostiquer un échec sans exposer de secret.
- En-têtes `no-store` et `nosniff`.
- Le verrou `FIAMA_REMOTE_BRAIN_ENABLED` reste fermé par défaut.
- Aucun fournisseur IA, aucune clé, aucun coût distant ajouté.

Cette build prépare un branchement bout-en-bout sans encore prétendre qu'un moteur IA est actif.
