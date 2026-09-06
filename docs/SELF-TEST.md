# SELF-TEST — BUILD 24

Contrôles attendus :
- JavaScript client syntaxiquement valide.
- JavaScript passerelle syntaxiquement valide.
- `speakText` et `stopSpeaking` définies avant `render` et hors de `render`.
- Cache PWA synchronisé `fiama-v1-build24`.
- Contrat client BUILD 24.
- Maximum 3 mémoires autorisées vers le futur cerveau.
- Pas de clé API/provider dans le client.
- Verrou distant serveur fermé par défaut.
- ZIP intègre.

- BUILD 23 : mémoire/profil non envoyés par défaut ; partage distant exige `fiama-share-context=yes`.
- Passerelle : refuse profil/mémoire si `contextSharing` n’est pas vrai.


BUILD 23: voix automatique locale optionnelle ajoutée; aucun service vocal payant.

- BUILD 24 : diagnostic, cache, export et passerelle resynchronisés.
- BUILD 24 : changement de langue arrête la lecture vocale en cours.

- BUILD 25 : client/build/export/cache synchronisés.
- BUILD 25 : lecture vocale stoppée avant dictée; une seule reconnaissance active à la fois.

- BUILD 28 : diagnostic/client/cache/passerelle synchronisés.
- BUILD 28 : dictée ne déclenche jamais un envoi automatique.

## BUILD 28 — audio lifecycle
- [x] `visibilitychange` coupe voix + dictée lorsque l'app est masquée.
- [x] `pagehide` coupe voix + dictée à la sortie de page.
- [x] Aucun envoi automatique après dictée.

## BUILD 29
- Vérifier cache `fiama-v1-build29`.
- Vérifier payload cerveau `build:'29'`.
- Vérifier export sauvegarde `BUILD-29`.
- Vérifier messages dictée : permission / no-speech / network.
- Vérifier `decisionFrame` dans Challenge FR, ES et EN.

## BUILD 30
- Vérifier diagnostic `BUILD 30`.
- Vérifier cache `fiama-v1-build30`.
- Vérifier dictée : aperçu progressif possible, puis validation manuelle avant ENVOYER.
- Vérifier qu'aucun envoi automatique n'est déclenché par la dictée.


## BUILD 33
- Vérifier qu’un texte déjà saisi reste présent après dictée.
- Vérifier que la dictée s’ajoute au texte existant.
- Vérifier cache `fiama-v1-build33`.
- Vérifier qu’aucun envoi automatique n’est introduit.


## BUILD 34
- Vérifier `FIAMA_BUILD=34` dans le client.
- Vérifier payload cerveau `build:FIAMA_BUILD`.
- Vérifier export `BUILD-${FIAMA_BUILD}`.
- Vérifier cache construit depuis `FIAMA_BUILD`.
- Vérifier `/health` passerelle renvoie `build:FIAMA_BUILD`.

## BUILD 35 — sauvegarde / restauration
- Exporter une sauvegarde et vérifier la présence de `memory`, `profile`, `lang` et `preferences`.
- Restaurer une ancienne sauvegarde sans `preferences` : elle doit rester acceptée.
- Restaurer une sauvegarde BUILD 35 : la langue et la voix automatique disponibles doivent revenir sans perdre la mémoire.

## BUILD 36 — restauration réversible
- Importer une sauvegarde valide : vérifier que le bouton d'annulation apparaît.
- Annuler : vérifier le retour de la mémoire, du profil, de la langue et des préférences précédentes.
- Vérifier qu'une annulation réussie supprime l'instantané temporaire.

## BUILD 37 — stockage local
- Vérifier que l'application démarre même si `navigator.storage.persist()` est absent ou refusé.
- Vérifier qu'aucune donnée n'est envoyée au réseau par le contrôle de stockage.
- Vérifier que la sauvegarde/restauration BUILD 36 reste fonctionnelle.


## BUILD 38 — stockage
- Ouvrir INSTALLATION / DIAGNOSTIC.
- Vérifier que la ligne « Protection renforcée des données » correspond à l’état réellement renvoyé par le navigateur.
- Vérifier que l’application reste utilisable si StorageManager.persisted() est indisponible.

## BUILD 39 — restauration défensive
- Import valide FR/ES/EN : doit fonctionner.
- Import avec `profile` non texte : doit être refusé sans mutation.
- Import avec langue inconnue : doit être refusé sans mutation.
- Import avec `preferences` non objet : doit être refusé sans mutation.
- Profil très long : restauré avec limite défensive.

## BUILD 40 — intégrité sauvegarde
- Exporter une sauvegarde : vérifier la présence de `integrity.algorithm = SHA-256` quand Web Crypto est disponible.
- Restaurer le fichier exporté intact : doit fonctionner.
- Modifier manuellement un caractère dans une sauvegarde signée puis restaurer : doit être refusé sans modifier les données locales.
- Restaurer une ancienne sauvegarde sans champ `integrity` : doit rester compatible.


## BUILD 41 — sauvegarde/restauration
- Export : vérifier `backupSchema: 2`.
- Import valide : vérifier résumé mémoire/langue/date avant confirmation.
- Import avec `backupSchema` différent de 2 : refus sans modification locale.
- Ancienne sauvegarde sans `backupSchema` : compatibilité conservée.

## BUILD 42 — progression
- [ ] Une mémoire liée aux coûts/rentabilité apparaît dans cette zone.
- [ ] Une mémoire liée à la coordination salle/cuisine apparaît dans cette zone.
- [ ] Une zone sans preuve est proposée comme prochaine zone à travailler.
- [ ] Aucune zone n'est présentée comme « maîtrisée » sur la seule base d'une trace.

## BUILD 43 — pré-audit V1
- Vérifier que MA PROGRESSION parle de situations/traces enregistrées et jamais d'expériences « validées » par le système.
- Vérifier que AUDIT-V1.md et TEST-IPHONE-V1.md sont présents.
- Le statut « testé iPhone » reste interdit avant exécution du protocole sur appareil réel.


## BUILD 44 — cohérence finale
- [ ] La progression ne qualifie aucune trace de compétence maîtrisée.
- [ ] Les textes actifs FR/ES/EN parlent de situations/traces, pas d’expériences validées.
- [ ] BUILD 44 identique dans client, cache et gateway.
