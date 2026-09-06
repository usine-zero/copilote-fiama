# BUILD 22 — confidentialité du contexte

- Le branchement d’une passerelle ne vaut plus autorisation d’envoyer la mémoire personnelle.
- Profil et souvenirs restent sur l’iPhone par défaut.
- Le contexte personnel n’est inclus dans une requête distante que si `fiama-share-context=yes` a été explicitement activé.
- Même dans ce cas, maximum 3 souvenirs pertinents et 500 caractères par souvenir.
- La passerelle vérifie la cohérence du consentement déclaré et refuse un profil/mémoire transmis sans `contextSharing=true`.
- Le diagnostic indique si le contexte personnel peut être envoyé.
- Aucun fournisseur IA ni secret client n’est ajouté.
