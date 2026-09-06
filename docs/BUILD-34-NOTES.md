# BUILD 34 — cohérence de version

- Ajout d’une constante centrale `FIAMA_BUILD` côté application.
- Le diagnostic, le contrat cerveau et l’export utilisent cette constante.
- Le service worker utilise la même règle pour son cache.
- La passerelle serveur expose désormais sa propre constante de build dans `/health`.
- Correction des anciennes références actives 29/25/27 qui pouvaient donner un faux diagnostic.
- Aucun fournisseur IA activé et aucun secret ajouté au client.
