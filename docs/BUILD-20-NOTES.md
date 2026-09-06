# BUILD 20 — FIABILITÉ ET FRONTIÈRE WEB

- Version client, passerelle et cache PWA synchronisés BUILD 20.
- Ajout d’une politique CSP côté application : scripts/styles locaux uniquement ; connexions cerveau uniquement en HTTPS.
- Referrer désactivé pour réduire les fuites d’adresse lors des navigations/requêtes.
- Passerelle : en-têtes de sécurité supplémentaires (no-referrer, permissions caméra/géolocalisation/paiement désactivées, politique cross-origin).
- Le verrou zéro-coût reste fermé : aucun fournisseur IA, aucune clé API, aucune facturation automatique.
- La mémoire distante proposée reste non enregistrée automatiquement.
