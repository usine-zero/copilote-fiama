# COPILOTE FIAMA — AUDIT V1 — BUILD 43

## Statut
Pré-audit statique terminé. Aucun test réel iPhone/Safari n'est encore revendiqué.

## Contrôles de fin de V1
- Interface FR / ES / EN présente.
- Mémoire locale explicite et modifiable.
- Sauvegarde/restauration avec validation et intégrité quand Web Crypto est disponible.
- Dictée : jamais d'envoi automatique.
- Lecture vocale : arrêt manuel et arrêt en arrière-plan.
- Progression : aucune note inventée et aucune compétence déclarée maîtrisée automatiquement.
- Passerelle distante désactivable ; aucun secret API prévu dans le client.
- Mode hors ligne : coque locale via service worker ; le cerveau distant n'est pas présenté comme hors ligne.

## Limites à vérifier sur appareil réel
- Autorisation microphone Safari/iOS.
- Ajout à l'écran d'accueil et lancement standalone.
- Dictée longue et arrêt manuel.
- Lecture vocale longue / verrouillage écran / changement d'app.
- Persistance mémoire après fermeture et réouverture.
- Export puis restauration d'une sauvegarde.
- Fonctionnement hors ligne après premier chargement.

## Critère de sortie V1
La V1 ne doit être déclarée « testée iPhone » qu'après passage du protocole TEST-IPHONE-V1.md sur un vrai iPhone.
