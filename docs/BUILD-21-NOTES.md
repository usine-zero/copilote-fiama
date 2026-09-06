# BUILD 21 — CORRECTION VOIX ET TEST RUNTIME

- Correction d’un défaut de portée JavaScript : `speakText` et `stopSpeaking` sont maintenant de vraies fonctions de niveau application, accessibles aux boutons de lecture/arrêt.
- Synchronisation client / passerelle / cache PWA sur BUILD 21.
- Aucun fournisseur IA activé. Le verrou zéro coût reste fermé.
- Aucun secret ajouté au client.
- Ajout d’un contrôle statique dédié pour empêcher le retour de cette régression.
