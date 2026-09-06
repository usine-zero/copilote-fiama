# BUILD 38 — Diagnostic stockage réel

- Le diagnostic installation affiche maintenant si la protection renforcée du stockage local a réellement été accordée par le navigateur.
- Le diagnostic reste honnête si l’API n’est pas disponible : aucun faux statut « protégé ».
- Le diagnostic installation devient asynchrone afin de lire l’état réel du stockage avant affichage.
- Aucun nouveau partage de données, aucun coût, aucun secret côté client.
