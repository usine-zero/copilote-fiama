# Contrat du connecteur cerveau — BUILD 08

Le connecteur est maintenant défini par deux enveloppes stables.

## Requête `fiama.brain.request.v1`
- `language`: fr / es / en
- `intent`: conversation / urgent / challenge / simulation / language / safety
- `message`: message de Fiama
- `profile`: profil professionnel local, limité
- `authorizedMemory`: au maximum 3 souvenirs rapprochés localement
- `client`: application + build

## Réponse `fiama.brain.response.v1`
- `reply`: réponse du moteur
- `uncertainty`: niveau d'incertitude
- `safetyFlag`: drapeau sécurité
- `memoryProposal`: proposition éventuelle, jamais mémoire imposée

## Sécurité
- BUILD 08 reste volontairement `local-safe` : aucun endpoint distant configuré.
- Aucune clé/API secrète dans l'iPhone, JavaScript, manifest ou localStorage.
- Un futur serveur devra garder les secrets côté serveur et appliquer limites de coût, authentification et journalisation.
- En panne réseau/moteur, retour local explicite ; aucune fausse réponse IA.
- Seuls les souvenirs rapprochés et autorisés sont préparés pour un futur envoi, pas toute la mémoire.


## BUILD 14 — préparation de branchement
- Contrat client aligné BUILD 14.
- Le client reste en mode local-safe tant qu'aucun endpoint serveur sécurisé n'est explicitement configuré.
- Une réponse distante future devra être validée contre le schéma de réponse avant affichage.
- Aucune clé API ne doit être présente dans l'application iPhone.

## BUILD 19 — validation de retour
- Le client refuse une réponse distante qui ne respecte pas `fiama.brain.response.v1`.
- `memoryProposal` n'est jamais appliqué automatiquement.
- Le serveur valide aussi chaque souvenir autorisé (maximum 3, texte borné).


BUILD 23: voix automatique locale optionnelle ajoutée; aucun service vocal payant.


BUILD 24: versions client/passerelle/cache resynchronisées; lecture vocale annulée lors d’un changement de langue; erreurs vocales journalisées localement.
