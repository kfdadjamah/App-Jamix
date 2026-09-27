## Problème

Le musicien qui joue régulièrement en dehors d'un groupe fixe (amateur ou semi-professionnel) ne dispose d'aucune source fiable et centralisée pour savoir où jouer à Lyon un soir donné. L'information sur les jams circule de façon dispersée — bouche-à-oreille, réseaux sociaux, groupes propres à chaque bar — si bien qu'il est impossible de savoir en un coup d'œil quels bars organisent une jam à une date donnée, et l'information disponible est parfois obsolète ou concerne une jam annulée sans que cela se sache.

Côté organisateur, l'accès à son espace n'est pas évident : la page d'accueil ne propose aucun lien de connexion, les informations du bar et du compte sont réparties sur plusieurs pages, et un organisateur qui oublie son mot de passe ne peut pas récupérer son compte.

## Solution

L'outil centralise les annonces de jams publiées par les organisateurs des bars lyonnais. Le musicien sélectionne une date et consulte les annonces disponibles ce jour-là : lieu, adresse, distance jusqu'à chez lui, horaire, style musical et instruments mis à disposition sur place. Quand aucune jam n'est publiée à la date choisie, l'outil lui suggère les prochaines dates où des jams ont lieu. À terme, l'outil s'ouvrira aussi au grand public souhaitant assister à une jam.

L'organisateur accède à son espace depuis la page d'accueil, retrouve toutes les informations de son bar et de son compte sur une page profil unique, et peut réinitialiser son mot de passe par email. Il reçoit aussi par email les avis liés à la sécurité de son compte.

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
US-25. En tant qu'organisateur, je veux modifier le nom et l'adresse de mon bar, afin de garder sa fiche à jour.
US-26. En tant qu'organisateur, je veux changer mon email et mon mot de passe, afin de garder la maîtrise de mon compte.
US-27. En tant qu'organisateur, je veux supprimer définitivement mon compte, avec mon bar, mes annonces et mes photos, afin de quitter l'application sans laisser de données derrière moi.
US-28. En tant qu'organisateur non connecté, je veux trouver un bouton « Connexion organisateur » en haut à droite de la page d'accueil, afin d'accéder à mon espace sans connaître l'adresse de la page de connexion.
US-29. En tant qu'organisateur connecté, je veux voir une icône de profil en haut à droite de chaque page, afin d'accéder à mon profil depuis n'importe où.
US-30. En tant qu'organisateur, je veux retrouver sur une seule page profil la fiche de mon bar (photo, nom, adresse), mon email, mon mot de passe, la déconnexion et la suppression de mon compte, afin de gérer toutes mes informations au même endroit.
US-31. En tant qu'organisateur, je veux un en-tête réduit à « Mes annonces », à l'alerte des relances et à l'icône de profil, afin de naviguer sans encombrement.
US-32. En tant qu'organisateur, je veux arriver sur « Mes annonces » après m'être connecté, afin de gérer directement mes jams.
US-33. En tant qu'organisateur, je veux arriver sur « Mes annonces » après mon inscription, afin de publier ma première annonce sans détour.
US-34. En tant qu'organisateur qui a oublié son mot de passe, je veux recevoir par email un lien de réinitialisation, afin de récupérer l'accès à mon compte.
US-35. En tant qu'organisateur, je veux que ce lien ne soit valable qu'une heure, une seule fois, et qu'il soit invalidé dès que j'en demande un nouveau, afin que mon compte reste protégé.
US-36. En tant qu'organisateur, je veux que la demande de réinitialisation affiche le même message que l'adresse soit connue ou non, afin que personne ne puisse savoir si un email est inscrit.
US-37. En tant qu'organisateur, je veux recevoir un email de bienvenue à mon inscription, afin de confirmer la création de mon compte.
US-38. En tant qu'organisateur, je veux être prévenu par email quand mon mot de passe est changé ou réinitialisé, afin de réagir si ce n'est pas moi.
US-39. En tant qu'organisateur, je veux être prévenu sur mon ancienne adresse quand l'email de mon compte est changé, afin de réagir si ce n'est pas moi.

## Critères de succès

- Sur le premier mois de la bêta, au moins 5 organisateurs distincts ont publié au moins une annonce de jam.
- Sur le premier mois de la bêta, l'application enregistre au moins 50 consultations d'annonces de jams.
- Sur le premier mois de la bêta, tout organisateur ayant demandé une réinitialisation de mot de passe a pu se reconnecter sans intervention manuelle.

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
- Relances J-7, notifications d'annonce et tout email autre que les messages de compte (réinitialisation, bienvenue, avis de changement de mot de passe ou d'email).
- Vérification de l'adresse email à l'inscription ou au changement d'email.
- Connexion via un fournisseur tiers (Google, Apple…) et authentification à deux facteurs.

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
- Tant qu'une date n'est pas confirmée après J-7, l'organisateur reçoit des relances in-app (dans son espace organisateur uniquement : les relances J-7 ne passent jamais par email ni SMS, l'email étant réservé aux messages de compte) à J-5, J-3, J-2, J-1 et le jour J.
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
- L'organisateur peut modifier le nom et l'adresse de son bar à tout moment ; une adresse modifiée est re-géocodée (en cas d'échec, la fiche reste valide mais le bar n'apparaît plus sur la carte).
- Changer l'email ou le mot de passe exige la saisie du mot de passe actuel.
- La suppression du compte est définitive (pas de corbeille) et exige une confirmation explicite ; elle supprime le bar, ses annonces, leurs occurrences et toutes les photos associées.
- Le rattachement « un compte = un bar » est conservé : l'organisateur édite son bar existant, il n'en change jamais.
- Visiteur non connecté : un bouton fantôme « Connexion organisateur » en haut à droite de la page d'accueil. Organisateur connecté : une icône bonhomme au même endroit, sur toutes les pages, qui mène à la page profil.
- La page profil unique regroupe la fiche bar (photo, nom, adresse), l'email, le mot de passe, la déconnexion et la suppression du compte ; elle remplace les pages séparées fiche bar et compte, dont les anciennes adresses redirigent vers elle.
- L'en-tête de l'espace organisateur ne contient plus que « Mes annonces », l'alerte des relances et l'icône de profil.
- Après la connexion comme après l'inscription, l'organisateur arrive sur « Mes annonces ».
- Mot de passe oublié : l'organisateur saisit son email et reçoit un lien valable 1 heure, à usage unique, invalidé dès qu'un nouveau lien est demandé. Le message affiché est le même que l'adresse soit connue ou non. Après réinitialisation, l'organisateur est renvoyé vers la connexion avec un message de succès.
- Emails envoyés, uniquement liés au compte : lien de réinitialisation, bienvenue à l'inscription, avis de changement ou de réinitialisation du mot de passe, avis de changement d'email envoyé à l'ancienne adresse. Un échec d'envoi d'un email d'avis ne bloque jamais l'action qui l'a déclenché.

## Notes complémentaires

L'itinéraire dépend d'applications tierces (Google Maps, Plans, Waze, Citymapper). Sans l'application installée, Waze et Citymapper peuvent ouvrir une page web qui pousse surtout à les installer.

Les emails de compte dépendent d'un service d'envoi tiers (Resend). En mode test, Resend n'envoie qu'à l'adresse du compte Resend ; un domaine d'expédition vérifié est nécessaire pour la bêta. Les emails peuvent arriver en spam, d'où la mention « Pensez à vérifier vos spams » après une demande de réinitialisation.
