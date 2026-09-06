# BUILD 35 — sauvegarde personnelle plus complète

- La sauvegarde JSON conserve maintenant la mémoire, le profil, la langue et les préférences locales disponibles.
- La restauration reste compatible avec les anciennes sauvegardes qui ne contiennent pas encore les préférences.
- Les réglages sensibles ne sont pas transformés en autorisation implicite : seules les valeurs explicitement présentes sont restaurées.
- Version active synchronisée sur BUILD 35 dans le client, le service worker et la passerelle.
