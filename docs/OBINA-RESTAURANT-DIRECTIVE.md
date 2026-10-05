# DIRECTIVE MAÎTRE — OBINA RESTAURANT

Date : 2026-10-05
Statut : DÉCISION UTILISATEUR — À APPLIQUER AU CHANTIER EN COURS

## 1. Nom officiel
Le produit ne s'appelle plus « Fiama Cockpit », « Copilote Fiama » ou « Fiama Restaurant ».

**Nom officiel : OBINA Restaurant**

Toute nouvelle interface, documentation, écran utilisateur, titre d'installation, texte de présentation et nouveau module doit utiliser **OBINA Restaurant**.

Les anciens noms présents dans l'historique Git ou dans des clés techniques peuvent rester temporairement uniquement si leur changement risque de casser la compatibilité. Ils ne doivent plus être présentés comme le nom du produit.

> La branche actuelle `sol/fiama-restaurant-v1-20261005` conserve son nom pour ne pas casser le travail en cours des autres workers. C'est un identifiant Git historique, pas le nom du produit.

## 2. Règle multi-appareils — VERROUILLÉE
OBINA Restaurant ne doit **jamais** être conçu comme une application téléphone uniquement.

Le même produit doit être utilisable et synchronisable sur :
- téléphone ;
- tablette ;
- ordinateur portable ;
- ordinateur de bureau.

### Téléphone
Interface la plus simple et compacte possible :
- grosses actions principales ;
- navigation courte ;
- voix prioritaire ;
- informations essentielles visibles immédiatement ;
- détails secondaires repliés ou accessibles en second niveau.

### Tablette
Profiter de l'espace supplémentaire :
- plan de salle plus large ;
- cuisine et commandes côte à côte quand utile ;
- stocks, réservations et détails visibles sans multiplier les écrans.

### Ordinateur
Mode de travail complet :
- tableaux plus larges ;
- vue multi-colonnes ;
- gestion, statistiques, stocks, planning, formation et administration plus riches ;
- raccourcis clavier possibles ;
- aucun besoin de réduire artificiellement l'interface au format téléphone.

## 3. Même données, même restaurant
Le téléphone, la tablette et l'ordinateur ne sont pas trois applications différentes.

Ils doivent représenter **le même restaurant et les mêmes données**, avec une présentation adaptée à la taille de l'écran.

Exemple :
- une réservation saisie sur ordinateur apparaît sur téléphone ;
- une rupture déclarée vocalement sur téléphone apparaît en cuisine/tablette ;
- une table ouverte sur tablette est visible dans la direction sur ordinateur.

La synchronisation et les droits d'accès devront être conçus en conséquence.

## 4. Principe d'interface
**Une fonction métier importante ne doit jamais exister uniquement sur un type d'appareil.**

On peut simplifier l'affichage sur téléphone, mais pas supprimer la capacité métier.

Responsive obligatoire :
- mobile-first pour la simplicité ;
- tablet-aware ;
- desktop-aware ;
- composants capables de se réorganiser selon la largeur ;
- pas de tailles fixes qui rendent l'application inutilisable sur grand écran.

## 5. Modules cibles d'OBINA Restaurant
Le chantier doit évoluer vers un restaurant complet et connecté :
- Aujourd'hui / cockpit opérationnel ;
- Salle et plan de tables ;
- Commandes ;
- Cuisine ;
- Réservations ;
- Clients ;
- Stocks et ruptures ;
- Recettes, fiches techniques et dressage ;
- Équipe et planning ;
- Caisse / clôture / rapports ;
- Direction / indicateurs ;
- Formation ;
- Studio photo des plats, tables et salle ;
- commande vocale contextuelle intelligente.

## 6. Voix
La voix doit être un **mode de pilotage transversal** et pas un simple bouton dictée.

Exemples :
- « Table 12, deux eaux. »
- « Rupture saumon. »
- « Fatou absente aujourd'hui. »
- « Réserve quatre personnes à 20 heures. »
- « Table 7 demande l'addition. »
- « Fais-moi le point sur le service. »

Le moteur doit comprendre le contexte restaurant, router vers le bon module et demander confirmation avant une action sensible ou difficile à annuler.

## 7. Protection du chantier
Ne pas casser la base stable pour un renommage cosmétique.

Le changement de nom et la règle multi-appareils doivent être appliqués progressivement, avec tests, en préservant :
- les données existantes ;
- la compatibilité ;
- la branche de travail actuelle ;
- les clés techniques historiques si leur migration n'est pas encore sûre.

## Décision finale
À partir de maintenant, toute personne/agent qui travaille sur ce chantier doit parler et construire **OBINA Restaurant**, responsive téléphone + tablette + ordinateur, avec téléphone simplifié mais jamais exclusif.
