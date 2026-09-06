# DOSSIER MAÎTRE — COPILOTE FIAMA V1

## Mission
Outil professionnel personnel destiné à une seule utilisatrice. Il aide à préparer un service, réagir pendant le service, débriefer, challenger une décision, s'entraîner et progresser vers des compétences de direction.

## Contraintes verrouillées
- iPhone prioritaire, PWA installable.
- Français / espagnol / anglais dès la V1.
- Voix prioritaire + texte.
- Aucun abonnement, Premium, publicité ou achat intégré pour l'utilisatrice.
- Interface très simple; complexité cachée derrière.
- Mémoire professionnelle contrôlée par l'utilisatrice.
- Observation ≠ vérité; aucune conclusion grave sur une personne à partir d'un seul récit.
- Le copilote conseille et challenge; les décisions humaines importantes restent humaines.
- En urgence/sécurité, priorité aux procédures et personnes compétentes.

## Écrans V1
1. Parler
2. Préparer mon service
3. J'ai un problème
4. Fin de service
5. Challenge mon idée
6. Ma progression
7. Sélecteur FR/ES/EN

## Architecture
Interface PWA -> aiguilleur d'intention -> cerveau de conseil -> contrôleur -> mémoire -> réponse.

## Mémoire cible
Profil professionnel; situations; décisions; résultats; leçons validées; progression. Toute mémoire durable importante doit pouvoir être corrigée ou oubliée.

## Lots
1. Coque PWA iPhone + 3 langues.
2. Conversation texte/voix.
3. Cerveau/aiguilleur/contrôleur.
4. Service/urgence/débrief.
5. Mémoire structurée et droit d'oubli.
6. Simulations.
7. Progression vers direction.
8. Tests réels iPhone et sécurité.

## État de ce paquet
LOT 1 démarré et fonctionnel comme prototype local : interface, trois langues, modes, dictée navigateur si disponible, stockage local de notes, service worker hors-ligne. Le cerveau IA distant n'est volontairement pas simulé : il reste à brancher dans le prochain lot après choix d'une architecture compatible avec la contrainte de coût.

## Avancement fabrication — LOT 2 / fondations LOT 3
- Ajout des espaces Simulation et Ma Mémoire.
- Mémoire locale structurée par date, mode, texte et langue.
- Consultation et effacement volontaire de la mémoire.
- Progression locale basée uniquement sur les expériences enregistrées.
- Aiguilleur local par mode (urgence / challenge / conversation).
- Garde-fou d'urgence local pour quelques signaux critiques : priorité aux procédures et secours compétents.
- Aucun faux branchement IA : tant que le moteur intelligent gratuit n'est pas choisi et branché, l'application le dit explicitement.
- Cache hors-ligne versionné et mise à jour du service worker.

### Reste avant livraison V1
1. Choisir/brancher un moteur conversationnel réellement compatible avec la contrainte zéro abonnement pour l'utilisatrice.
2. Construire le contrôleur de sécurité complet.
3. Construire préparation de service et débrief guidés.
4. Construire challenge comparatif et simulations interactives.
5. Construire progression par compétences avec preuves.
6. Tester Safari/iPhone réel, installation PWA, micro, stockage et hors-ligne.

## Avancement fabrication — BUILD 03
- Préparation de service guidée en 4 étapes, dans les 3 langues.
- Débrief guidé en 5 étapes : bilan, problème, décision, résultat, leçon proposée.
- Enregistrement structuré des réponses validées dans la mémoire locale.
- Le débrief est explicitement stocké comme observation et non comme vérité générale.
- Premier moteur local « Deuxième regard » : force, risque, information manquante, alternative, décision humaine.
- Première structure de simulation utilisable sans prétendre qu'un moteur IA distant est branché.
- Conservation du principe zéro faux conseil IA : les fonctions locales restent déterministes et indiquent leurs limites.

### Prochain verrou technique
Le point critique restant est le cerveau conversationnel réellement intelligent avec voix sur iPhone, sans abonnement pour l'utilisatrice et sans introduire de facturation automatique cachée. Il doit être isolé derrière l'orchestrateur afin de pouvoir être remplacé sans reconstruire l'application.

## Avancement fabrication — BUILD 04
- Correction structurelle de `app.js` : suppression des déclarations dupliquées qui pouvaient empêcher le JavaScript de démarrer.
- Aiguilleur local stabilisé pour conversation, urgence, préparation, débrief, challenge et simulation.
- Contrôleur de sécurité local renforcé : urgence grave et risque allergie/sécurité alimentaire passent avant le coaching normal.
- Mémoire migrée vers une structure unique `fiama-memory`, avec identifiant, date, type, langue, validation et réponses structurées.
- Préparation et débrief enregistrés séparément comme observations professionnelles.
- Le moteur refuse toujours de présenter les heuristiques locales comme une IA générative réellement branchée.
- Progression fondée sur des traces réelles enregistrées, sans score inventé.
- Cache hors-ligne versionné BUILD 04.

### Verrou avant BUILD 05
Le moteur génératif/voix complet doit respecter simultanément : usage iPhone, confidentialité, trois langues, absence d'abonnement pour Fiama et absence de facturation automatique cachée. Tant qu'une solution ne satisfait pas ces règles, le noyau local reste fonctionnel et remplaçable.


## Avancement fabrication — BUILD 05 / BUILD 06
- Ajout réel de **Mon Profil professionnel** avec stockage local contrôlé.
- Ajout réel de **Aide-moi à le dire** en trois langues. Tant qu’un moteur linguistique réel n’est pas branché, la fonction donne un cadre professionnel multilingue et refuse d’inventer une traduction libre.
- Progression renforcée : repérage de compétences uniquement lorsqu’il existe des traces enregistrées (client, équipe/leadership, anticipation, décision, communication). Aucun score artificiel.
- Ajout du contrat `BRAIN-CONNECTOR.md` pour isoler le futur cerveau conversationnel.
- Règle technique verrouillée : **aucune clé secrète dans l’iPhone ou le JavaScript client**.
- Mode courant du cerveau : `local-safe`. En panne réseau ou absence de moteur distant, le noyau local reste disponible et ne prétend pas être une IA générative.
- Cache hors-ligne versionné BUILD 06.

### Prochaine fabrication
Construire le connecteur serveur sûr et tester une option de cerveau réellement compatible avec les contraintes de coût/confidentialité, puis rendre les simulations adaptatives et la mémoire contextuelle.

## BUILD 07 — Mémoire contextuelle + sauvegarde privée
- Recherche locale de situations similaires avant certains conseils/challenges.
- Les rapprochements sont des indices, jamais des vérités automatiques.
- Export JSON privé de la mémoire professionnelle et du profil.
- Restauration avec validation du format et confirmation avant remplacement.
- Aucun envoi réseau ajouté. Aucune clé secrète côté client.
- Préparation à la mémoire contextuelle du futur cerveau conversationnel.

## BUILD 08 — frontière du cerveau verrouillée
- Schéma stable requête/réponse du futur cerveau.
- Routage local des intentions avant tout appel distant.
- Mémoire contextuelle minimisée: maximum 3 souvenirs pertinents préparés pour le futur moteur.
- Journal technique local minimal (200 événements maximum), sans clé secrète.
- Simulation renforcée sans prétendre disposer d'un moteur génératif non branché.
- Principe maintenu: aucune facturation automatique, aucun abonnement pour Fiama.


## BUILD 09 — verrou mémoire et installation
La mémoire durable exige désormais une action explicite de l’utilisatrice pour les conversations, urgences, challenges et simulations. Les flux structurés validés (préparation/débrief) conservent leur enregistrement prévu. Un diagnostic local explique l’installation iPhone et vérifie les capacités visibles du navigateur.


## BUILD 10 — mémoire corrigible + cohérence
- Correction d’un texte trompeur : le mode conversation ne dit plus qu’une situation est enregistrée avant validation explicite.
- Gestion individuelle de la mémoire : une entrée peut être corrigée ou supprimée sans effacer toute la mémoire.
- Les corrections gardent une date de modification.
- Numérotation des souvenirs pour une gestion simple sur téléphone.
- Contrats et sauvegardes versionnés BUILD 10.
- Aucun moteur IA distant ni coût caché ajouté.


## BUILD 11 — voix de sortie + accessibilité terrain
- Ajout de la lecture vocale des réponses avec la synthèse vocale du téléphone lorsqu’elle est disponible.
- Boutons simples Lire / Arrêter pour éviter de devoir lire l’écran pendant le travail.
- La voix suit la langue active FR / ES / EN.
- La réponse reste toujours visible en texte : la voix est une aide, jamais l’unique canal.
- Zone de réponse annoncée comme contenu dynamique pour améliorer l’accessibilité.
- Aucun service vocal payant ajouté : utilisation des capacités du navigateur/appareil.
- Cache et contrats versionnés BUILD 11.


## BUILD 12 — verrou fiabilité PWA
La couche d’installation iPhone et hors connexion a été auditée. Un défaut de maintenance a été corrigé : le nom du cache Service Worker était resté sur BUILD 06. BUILD 12 renouvelle explicitement ce cache afin d’éviter qu’un iPhone conserve silencieusement une ancienne version. Le diagnostic affiche désormais la build active et teste stockage local, dictée, lecture vocale, connexion et mode installé. Les métadonnées de sauvegarde et le contrat du futur cerveau sont alignés sur BUILD 12.


## BUILD 13 — contrôleur professionnel
Le contrôleur local détecte désormais plusieurs catégories sensibles avant conseil : décisions concernant des personnes, gestes commerciaux et vie privée. Il impose des rappels de faits, d’autorité et de politique d’établissement sans prétendre remplacer les procédures internes.


## BUILD 14 — audit pré-branchement
- Synchronisation complète des numéros de build (diagnostic, cache, connecteur, sauvegarde).
- Validation renforcée des sauvegardes importées pour refuser les structures anormales ou excessives.
- Cache PWA renouvelé pour empêcher une ancienne version de rester active sur iPhone.
- Frontière du cerveau maintenue fermée : pas d'endpoint, pas de secret client, pas de facturation automatique.


## BUILD 15 — frontière serveur réelle
La porte serveur du futur cerveau est désormais matérialisée dans `server/worker.js`. Elle valide le contrat, limite la taille des entrées et refuse toute génération distante tant qu’un moteur n’est pas explicitement activé côté serveur. Le paquet ne contient aucune clé et ne peut déclencher aucun coût IA à lui seul. Le mécanisme de mise à jour PWA a également été renforcé et les numéros de build ont été synchronisés.


## BUILD 16 — durcissement pré-branchement
La porte serveur refuse désormais les origines non autorisées lorsqu'une origine FIAMA est configurée, limite la taille et le rythme des requêtes, et attribue un identifiant de diagnostic. Le verrou de coût reste fermé et aucun fournisseur IA n'est configuré.


## BUILD 17
Client bout-en-bout de la porte cerveau : appel HTTPS optionnel, timeout, validation de réponse et repli local sécurisé. Aucun fournisseur IA n'est activé et aucune clé n'est placée dans l'iPhone.


## BUILD 18 — preuve de porte cerveau sans coût
Le diagnostic peut maintenant vérifier la disponibilité réelle de la passerelle via `/health` sans appeler de fournisseur IA. Il distingue passerelle absente, joignable avec moteur verrouillé, et moteur explicitement activé. Cette vérification ne déclenche aucune génération distante.

## BUILD 19 — fiabilisation voix + validation retour cerveau
- Correction importante : les fonctions de lecture/arrêt vocal sont maintenant globales et accessibles aux boutons après rendu.
- Validation stricte d'une future réponse cerveau avant affichage.
- `memoryProposal` reste une proposition : aucun enregistrement automatique.
- Validation serveur renforcée des 3 souvenirs autorisés.
- Diagnostic affiche le build et le mode cerveau.
- Cache PWA synchronisé BUILD 19.


## BUILD 20
Frontière web durcie avant déploiement : CSP client, referrer désactivé et en-têtes de sécurité passerelle. Versions client/cache/passerelle synchronisées. Aucun fournisseur IA activé.


## BUILD 23
Correction runtime de la lecture vocale : fonctions de lecture/arrêt sorties de `render()` et rendues accessibles aux contrôles. Versions client, serveur et cache synchronisées. Verrou zéro coût inchangé.


## BUILD 23
Confidentialité renforcée : connecter la porte cerveau ne partage plus automatiquement le profil ou la mémoire. Le contexte personnel reste local par défaut et la passerelle refuse un contexte envoyé sans consentement déclaré.


BUILD 23: voix automatique locale optionnelle ajoutée; aucun service vocal payant.


## BUILD 24
Base de référence après audit de cohérence voix/PWA. Diagnostic, cache, export et passerelle resynchronisés sur BUILD 24. La lecture vocale en cours est arrêtée avant changement de langue. Aucun fournisseur payant activé.

## BUILD 25
Voix renforcée : anti-chevauchement dictée/lecture, une écoute à la fois, état d’écoute visible, métadonnées client corrigées et cache synchronisé.


## BUILD 28
Voix renforcée : micro/stop clair, confirmation avant envoi, diagnostic et versions synchronisés.

## Point de reprise — BUILD 28
BUILD 28 est la base courante. Durcissement audio iPhone/PWA : voix et dictée sont stoppées lorsque l'app quitte le premier plan. Le cerveau distant reste non activé et le verrou de coût reste fermé.

## BUILD 29
Audit de cohérence avant test iPhone réel : voix/dictée plus explicite en cas d'échec, garde-fou Challenge EN aligné avec FR/ES, métadonnées client/sauvegarde corrigées et cache PWA synchronisé.

## BUILD 30
- Base : BUILD 29.
- Dictée avec aperçu progressif si disponible, sans envoi automatique.
- Diagnostic et cache PWA synchronisés BUILD 30.
- Verrou financier et confidentialité inchangés.


## BUILD 33
- Dictée vocale non destructive et conservation du brouillon existant.
- Fin de reconnaissance renforcée sur Safari/iPhone.
- Validation avant envoi maintenue.

## BUILD 33
Consolidation voix/dictée et synchronisation de version. La validation humaine avant ENVOYER reste obligatoire.


## Point de reprise — BUILD 34
La version active est BUILD 34. Le numéro de build est désormais centralisé dans les fichiers d’exécution afin d’éviter les anciennes références actives incohérentes.

## Point de reprise — BUILD 35
BUILD 35 renforce la portabilité des données personnelles : sauvegarde/restauration de la mémoire, du profil, de la langue et des préférences locales disponibles. La restauration reste rétrocompatible avec les anciennes sauvegardes.

## Point de reprise — BUILD 36
La restauration de sauvegarde est désormais réversible localement : un instantané pré-import permet d'annuler la dernière restauration. BUILD 36 est la base active de développement.

## Point de reprise — BUILD 37
BUILD 37 renforce la conservation locale des données avec une demande de stockage persistant lorsque le navigateur l'autorise. Cette protection reste best-effort : elle ne remplace pas les sauvegardes exportées. Base de reprise active : BUILD 37.


## Point de reprise — BUILD 38
Diagnostic stockage réel ajouté. Base active : BUILD 38.

## Point de reprise — BUILD 39
La restauration de sauvegarde est maintenant validée plus strictement avant mutation. Une structure de profil, langue ou préférences invalide doit être refusée sans toucher aux données locales. BUILD 39 est le point de reprise courant.

## Point de reprise — BUILD 40
BUILD 40 ajoute une empreinte SHA-256 aux nouvelles sauvegardes et la vérifie avant restauration. Les anciennes sauvegardes restent compatibles. Toute restauration invalide est refusée avant modification des données.


## Point de reprise — BUILD 41
BUILD 41 ajoute un schéma de sauvegarde explicite et un aperçu avant restauration. Base suivante : BUILD 41.

## Point de reprise — BUILD 42
La progression professionnelle couvre maintenant 9 zones utiles au passage maître d'hôtel → direction, sans score inventé. Prochaine étape : audit de fin de V1 et préparation du protocole de test réel iPhone.

## Point de reprise — BUILD 43
Pré-audit de fin de V1 réalisé. La progression ne présente plus les mémoires comme des expériences validées. Le protocole TEST-IPHONE-V1.md devient la porte obligatoire avant de déclarer la V1 testée sur iPhone. Base active : BUILD 43.


## Point de reprise — BUILD 44
Audit final de cohérence actif terminé. Prochaine étape : test réel iPhone/Safari/PWA et corrections uniquement sur faits observés.
