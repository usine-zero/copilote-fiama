# POINT DE REPRISE — FIAMA Restaurant BUILD 45

## Branche
`sol/fiama-restaurant-v1-20261005`

## État
Le cockpit restaurant et le moteur vocal métier sont construits dans `public/`. La BUILD 44 de `main` doit rester intacte tant que la BUILD 45 n’est pas validée sur téléphone réel.

## Validation à faire sur smartphone
1. Ouvrir la PWA sur HTTPS.
2. Vérifier navigation et installation.
3. Autoriser le micro.
4. Tester press-to-talk : « Table 12 occupée ».
5. Tester contexte : sélectionner table 12 puis « elle veut l’addition ».
6. Tester confirmation : « Table 4 allergie aux arachides » puis « confirme ».
7. Tester mains libres : « FIAMA, rupture saumon ».
8. Tester Studio avec une vraie photo et export JPEG.
9. Tester fermeture écran / arrière-plan : le micro doit s’arrêter.
10. Exporter une sauvegarde JSON puis la restaurer.

## Ne pas prétendre validé avant test réel
- qualité micro selon navigateur/téléphone ;
- comportement mains libres longue durée (les navigateurs mobiles peuvent interrompre la reconnaissance) ;
- installation PWA selon plateforme ;
- qualité visuelle du Studio selon photos réelles.

## Suite après validation
- corriger les phrases vocales mal reconnues observées sur le terrain ;
- brancher éventuellement un cerveau distant autorisé pour les questions libres, sans déplacer les permissions côté client ;
- ajouter authentification serveur seulement si FIAMA devient multi-utilisateur / multi-restaurant.