# BUILD 41 — Restauration lisible avant validation

- Les nouvelles sauvegardes portent `backupSchema: 2` pour identifier clairement leur format.
- Avant restauration, COPILOTE FIAMA affiche un résumé simple : nombre d’éléments de mémoire, langue et date de sauvegarde.
- La restauration ne commence qu’après validation explicite de Fiama.
- Une sauvegarde annonçant un schéma futur/incompatible est refusée sans modifier les données.
- Les anciennes sauvegardes sans champ `backupSchema` restent compatibles.
- L’empreinte SHA-256 du BUILD 40 reste vérifiée avant ce résumé.
