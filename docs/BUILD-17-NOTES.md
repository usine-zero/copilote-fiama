# BUILD 17 — client bout-en-bout de la porte cerveau

- Le client iPhone sait maintenant appeler un endpoint cerveau HTTPS configuré côté installation.
- Timeout de 12 secondes puis retour automatique au mode local sécurisé.
- Validation minimale stricte de la réponse avant affichage.
- Aucune clé/API secrète n'est acceptée ni stockée dans le client.
- Le gateway serveur reste verrouillé par défaut : aucun fournisseur IA n'est activé.
- Le mode local continue de fonctionner si le serveur est absent, désactivé ou en erreur.
- BUILD, cache, sauvegarde et payload client synchronisés sur 17.

Cette build ferme la boucle technique client → gateway → réponse/fallback, sans créer de coût distant.
