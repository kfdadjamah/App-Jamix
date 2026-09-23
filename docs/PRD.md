## Problème

Le musicien qui joue régulièrement en dehors d'un groupe fixe (amateur ou semi-professionnel) ne dispose d'aucune source fiable et centralisée pour savoir où jouer à Lyon un soir donné. L'information sur les jams circule de façon dispersée — bouche-à-oreille, réseaux sociaux, groupes propres à chaque bar — si bien qu'il est impossible de savoir en un coup d'œil quels bars organisent une jam à une date donnée, et l'information disponible est parfois obsolète ou concerne une jam annulée sans que cela se sache.

## Solution

L'outil centralise les annonces de jams publiées par les organisateurs des bars lyonnais. Le musicien sélectionne une date et consulte les annonces disponibles ce jour-là : lieu, adresse, distance jusqu'à chez lui, horaire, style musical et instruments mis à disposition sur place. Quand aucune jam n'est publiée à la date choisie, l'outil lui suggère les prochaines dates où des jams ont lieu. À terme, l'outil s'ouvrira aussi au grand public souhaitant assister à une jam.

## Utilisateur cible

- Musicien amateur ou semi-professionnel, tous instruments et styles confondus, qui joue régulièrement en dehors de tout groupe fixe et cherche des occasions de jouer en live sans avoir à monter un concert. Il vit à Lyon ou y passe.
- Organisateur de jam, rattaché à un bar lyonnais (pas nécessairement le gérant du bar), qui publie et gère les annonces de jams pour ce bar.

## User Stories

US-1. En tant qu'organisateur, je veux créer un compte et renseigner la fiche de mon bar (nom, adresse), afin de pouvoir publier des annonces de jams pour ce lieu.
US-2. En tant qu'organisateur, je veux pouvoir ajouter une photo ou un logo à la fiche de mon bar, afin de personnaliser mon profil.
US-3. En tant qu'organisateur, je veux publier une annonce de jam avec une ou plusieurs dates, un horaire, un style musical et les instruments disponibles sur place, afin d'informer les musiciens de l'événement.
US-4. En tant qu'organisateur, je veux pouvoir ajouter des photos à une annonce de jam, afin de l'illustrer pour les musiciens.
US-5. En tant qu'organisateur, je veux pouvoir enregistrer une annonce en brouillon avant de la publier, afin de pouvoir la compléter plus tard sans qu'elle soit visible des musiciens.
US-6. En tant qu'organisateur, je veux pouvoir rendre une annonce récurrente en sélectionnant plusieurs dates lors de la publication, afin de ne pas avoir à republier la même annonce chaque semaine et de simplement confirmer chaque échéance.
US-7. En tant qu'organisateur, je veux pouvoir publier une annonce sans limite de délai à l'avance, afin d'annoncer une jam dès que je connais la date.
US-8. En tant qu'organisateur ayant publié une date de jam plus de 7 jours à l'avance, je veux devoir la confirmer 7 jours avant cette date, afin de garantir aux musiciens une information à jour.
US-9. En tant qu'organisateur, je veux que chaque date de mon annonce affiche « Jam programmée, sera confirmée le [date J-7] » tant que je ne l'ai pas confirmée, afin que les musiciens sachent que l'information n'est pas encore définitive.
US-10. En tant qu'organisateur qui n'a pas confirmé une date à J-7, je veux que cette date reste affichée avec le statut « en attente de confirmation », afin de ne pas perdre la visibilité de mon annonce tant que je ne l'ai pas explicitement annulée.
US-11. En tant qu'organisateur qui n'a pas confirmé une date à J-7, je veux recevoir des relances à J-5, J-3, J-2, J-1 et le jour J tant que je n'ai pas confirmé, afin de ne pas oublier de confirmer ma jam.
US-12. En tant qu'organisateur, je veux, en modifiant les informations d'une annonce récurrente déjà publiée (horaire, style...), pouvoir choisir d'appliquer la modification uniquement à la date sélectionnée ou à toutes les dates, afin de garder la main sur la portée du changement.
US-13. En tant qu'organisateur, je veux, en annulant manuellement une annonce récurrente à tout moment, pouvoir choisir d'annuler uniquement la date sélectionnée ou toutes les dates, afin de prévenir les musiciens selon l'ampleur réelle de l'annulation.
US-14. En tant que musicien, je veux sélectionner une date, afin de voir les jams disponibles ce jour-là à Lyon.
US-15. En tant que musicien, je veux consulter les annonces de jams sans avoir à créer de compte, afin d'accéder à l'information rapidement.
US-16. En tant que musicien, je veux voir pour chaque annonce le lieu, l'adresse, l'horaire, le style musical, les instruments disponibles sur place et les éventuelles photos, afin de décider si je m'y rends.
US-17. En tant que musicien, je veux voir la distance entre ma position et le bar, afin de choisir une jam accessible facilement.
US-18. En tant que musicien qui refuse la géolocalisation, je veux tout de même consulter les annonces (sans distance affichée), afin de ne pas être bloqué dans l'usage de l'outil.
US-19. En tant que musicien, je veux, quand aucune jam n'est publiée à la date sélectionnée, voir un message clair et les prochaines dates où des jams ont lieu, afin de ne pas rester sans solution.
US-20. En tant que musicien, je veux voir clairement si une jam est confirmée, en attente de confirmation, ou annulée, afin de ne pas me déplacer pour rien.
US-21. En tant que musicien, je veux visualiser sur une carte les bars organisant une jam à la date sélectionnée, avec le statut de chaque jam (confirmée / en attente de confirmation / annulée), afin de repérer rapidement où jouer près de chez moi.
US-22. En tant que musicien, je veux voir sur la carte la distance jusqu'à chaque bar, sous le statut de sa jam, afin de repérer les jams proches sans ouvrir chaque fiche.
US-23. En tant que musicien, je veux, depuis une annonce (liste ou carte), toucher un bouton « Itinéraire » et choisir l'application de cartographie à ouvrir (Google Maps, Plans, Waze, Citymapper), afin de trouver le transport jusqu'au bar.
US-24. En tant que musicien qui n'a pas l'application choisie, je veux être redirigé vers sa version web, afin de ne jamais tomber sur une impasse.

## Critères de succès

- Sur le premier mois de la bêta, au moins 5 organisateurs distincts ont publié au moins une annonce de jam.
- Sur le premier mois de la bêta, l'application enregistre au moins 50 consultations d'annonces de jams.

## Hors périmètre

- Favoris de jams et notifications (annulation, modification, nouvelle publication) côté musicien.
- Compte musicien et ouverture de la consultation au grand public non-musicien.
- Inscription ou réservation de place préalable pour jouer à une jam.
- Modération ou validation manuelle des annonces avant publication.
- Historique des jams passées.
- Un organisateur rattaché à plusieurs bars (un compte = un bar).
- Liste pré-remplie de bars lyonnais : chaque organisateur crée sa propre fiche bar.
- Itinéraire calculé dans l'application (le trajet est délégué à l'application de cartographie externe).
- Affichage d'un temps de trajet.
- Mémorisation de l'application de cartographie choisie par le musicien.

## Décisions d'implémentation

- L'outil est une application web, accessible et utilisable sur mobile comme sur ordinateur (responsive), sans installation.
- Seuls les organisateurs créent un compte, pour publier des annonces ; la consultation par les musiciens est libre, sans compte.
- Un compte organisateur est rattaché à un seul bar ; l'organisateur crée la fiche du bar (nom, adresse) au moment de son inscription.
- L'organisateur peut ajouter, remplacer ou retirer une photo ou un logo sur la fiche de son bar, à l'inscription ou plus tard ; cette photo est optionnelle et son absence n'empêche jamais la création ou la validité de la fiche bar.
- Une annonce de jam peut être enregistrée en statut **brouillon** : elle est incomplète ou en cours de préparation, invisible en consultation musicien, et aucune de ses dates n'entre dans le cycle de confirmation J-7. L'organisateur la complète et la publie explicitement quand elle est prête, ce qui la fait basculer en statut **publiée** et démarre, pour chaque date, le cycle de statuts (confirmée / programmée / en attente de confirmation / annulée).
- Une annonce peut inclure jusqu'à 2 photos, optionnelles ; leur absence n'empêche jamais la création, le brouillon ou la publication de l'annonce.
- Toute photo importée (fiche bar ou annonce) est automatiquement ajustée/recadrée au format d'affichage prévu par l'application, sans contrôle manuel du cadrage par l'organisateur.
- Une annonce de jam peut être ponctuelle (une seule date) ou récurrente : l'organisateur ajoute une ou plusieurs dates lors de la publication, jusqu'à 12 dates maximum par annonce, via une liste de dates ajoutables/supprimables ; le caractère récurrent de l'annonce est déduit automatiquement dès que plus d'une date est renseignée (pas de bascule ponctuelle/récurrente distincte à activer). Chaque date est une occurrence à part entière, avec son propre statut et sa propre échéance de confirmation à J-7.
- Pour une annonce récurrente, l'horaire est unique et s'applique à toutes les dates de l'annonce ; il n'est pas possible de définir un horaire différent par date au moment de la publication.
- Une même annonce ne peut pas contenir deux fois la même date.
- Tant qu'une annonce est en statut Brouillon, l'organisateur peut librement ajouter ou retirer des dates. Une fois l'annonce Publiée, la liste des dates n'est plus modifiable depuis le formulaire de création ; sa modification (portée ciblée ou globale) relève du mécanisme de modification/annulation décrit ci-dessous. Les autres champs de l'annonce (horaire, style musical, instruments, photos) restent modifiables même une fois l'annonce Publiée, et s'appliquent alors uniformément à toutes ses occurrences existantes.
- Pas de limite de délai pour publier une annonce à l'avance ; le musicien ne peut consulter que les jams à venir (pas d'historique des jams passées).
- Si une date d'une annonce est publiée plus de 7 jours à l'avance, l'organisateur doit la confirmer 7 jours avant cette date (J-7) ; jusque-là, l'occurrence affiche « Jam programmée, sera confirmée le [date J-7] ». Si la date est publiée à 7 jours ou moins de son échéance (ex. publiée à J-2), l'occurrence est directement au statut confirmée dès la publication, sans cycle de confirmation ni relance. Pour une annonce récurrente publiée avec plusieurs dates en une seule fois, cette règle J-7/J-2 s'évalue indépendamment pour chaque date : une date à plus de 7 jours peut être « Programmée » tandis qu'une autre date de la même annonce, à 7 jours ou moins, est directement « Confirmée ».
- Si l'organisateur ne confirme pas une date à J-7, cette occurrence reste visible avec le statut « en attente de confirmation » (pas de suppression ni d'annulation automatique).
- Tant qu'une date n'est pas confirmée après J-7, l'organisateur reçoit des relances in-app (dans son espace organisateur, pas d'email ni de SMS) à J-5, J-3, J-2, J-1 et le jour J.
- L'organisateur peut modifier ou annuler manuellement une annonce à tout moment, indépendamment du mécanisme de confirmation à J-7. Pour une annonce récurrente, la modification comme l'annulation s'appliquent, au choix de l'organisateur, uniquement à la date sélectionnée ou à toutes les dates.
- Chaque annonce affiche : nom et adresse du bar, distance jusqu'au musicien, horaire, style musical, instruments/backline disponibles sur place, et ses éventuelles photos.
- La distance est calculée à partir de la géolocalisation du navigateur du musicien, demandée au moment de la consultation.
- Si le musicien refuse la géolocalisation, les annonces s'affichent normalement, sans la distance.
- Si aucune jam n'est publiée à la date sélectionnée, l'application affiche un message clair et propose les prochaines dates où des jams sont publiées.
- En complément de la liste, la consultation par date propose une vue carte affichant chaque bar ayant une jam à la date sélectionnée, positionné géographiquement, avec une indication visuelle du statut de sa jam (confirmée / programmée / en attente de confirmation / annulée).
- La vue carte réutilise les mêmes annonces, statuts et données de géolocalisation que la vue liste ; elle n'introduit ni nouvelle donnée ni nouveau filtre — l'heure de chaque jam reste affichée comme dans la vue liste, sans devenir un critère de filtrage supplémentaire.
- Le musicien peut basculer entre vue liste et vue carte sans perdre la date sélectionnée.
- Sur la carte, la distance jusqu'au bar s'affiche sur le marqueur, sous le statut, uniquement si la géolocalisation est acceptée ; elle est masquée sur un marqueur réduit (chevauchement).
- Chaque annonce, dans la liste comme dans la fiche ouverte depuis un marqueur, propose un bouton fantôme secondaire « Itinéraire ».
- Ce bouton ouvre un menu de 4 applications de cartographie : Google Maps, Plans (proposé uniquement sur les appareils Apple), Waze et Citymapper (proposés uniquement sur mobile). Si l'application n'est pas installée, sa version web s'ouvre.
- Le bar est la destination ; le point de départ est géré par l'application externe, donc le bouton fonctionne même sans géolocalisation.
- Toucher un marqueur ouvre toujours la fiche de l'annonce, sans changement.

## Notes complémentaires

L'itinéraire dépend d'applications tierces (Google Maps, Plans, Waze, Citymapper). Sans l'application installée, Waze et Citymapper peuvent ouvrir une page web qui pousse surtout à les installer.
