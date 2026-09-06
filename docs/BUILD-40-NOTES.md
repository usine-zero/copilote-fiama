# BUILD 40 — Intégrité des sauvegardes

- Les nouvelles sauvegardes JSON reçoivent une empreinte SHA-256 quand le navigateur le permet.
- À la restauration, une sauvegarde portant cette empreinte est vérifiée avant toute modification locale.
- Si le fichier a été altéré/corrompu après export, la restauration est refusée sans modifier les données.
- Compatibilité conservée avec les anciennes sauvegardes qui ne possèdent pas encore d'empreinte.
- Aucun secret, aucun serveur et aucun coût requis pour cette vérification locale.
