# Brain Gateway — BUILD 17

Cette couche est la porte sécurisée entre l’iPhone et un futur moteur conversationnel.

- aucun fournisseur IA n’est activé ;
- aucune clé n’est stockée côté iPhone ;
- `FIAMA_REMOTE_BRAIN_ENABLED` est désactivé par défaut ;
- la requête est validée et limitée ;
- maximum 3 souvenirs autorisés par requête ;
- aucun coût distant ne peut partir avec ce paquet seul.

Le prochain branchement devra respecter la règle du projet : aucune facturation incontrôlée et aucune promesse de gratuité technique si le fournisseur choisi facture l’inférence.

BUILD 17 : le client peut désormais appeler cette porte via HTTPS et revient au mode local si elle est indisponible.
