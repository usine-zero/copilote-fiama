# BUILD 37 — Résilience de la mémoire locale

- Ajout d'une demande non bloquante de stockage persistant quand le navigateur/PWA la permet.
- Aucun échec de cette demande ne bloque COPILOTE FIAMA.
- Ajout d'un contrôle interne de l'état/quota du stockage pour préparer les diagnostics futurs.
- Aucun envoi réseau et aucun coût ajouté.
- Version client, cache et passerelle synchronisée sur BUILD 37.
