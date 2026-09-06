# BUILD 19 — fiabilité avant branchement réel

Correction d'un défaut de portée JavaScript de la lecture vocale hérité de BUILD 11 et encore présent en BUILD 18. La lecture et l'arrêt vocal sont désormais appelables de façon stable depuis les boutons.

La frontière cerveau valide maintenant strictement la forme d'une réponse distante avant de l'afficher. Les propositions de mémoire ne sont jamais enregistrées automatiquement. La passerelle contrôle aussi le contenu des trois souvenirs autorisés.

Aucun fournisseur IA, secret client ou dépense distante n'est activé.
