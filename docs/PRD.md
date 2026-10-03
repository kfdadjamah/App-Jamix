## Problème

Le musicien qui joue régulièrement en dehors d'un groupe fixe (amateur ou semi-professionnel) ne dispose d'aucune source fiable et centralisée pour savoir où jouer à Lyon un soir donné. L'information sur les jams circule de façon dispersée — bouche-à-oreille, réseaux sociaux, groupes propres à chaque bar — si bien qu'il est impossible de savoir en un coup d'œil quels bars organisent une jam à une date donnée, et l'information disponible est parfois obsolète ou concerne une jam annulée sans que cela se sache.

Côté organisateur, l'accès à son espace n'est pas évident : la page d'accueil ne propose aucun lien de connexion, les informations du bar et du compte sont réparties sur plusieurs pages, et un organisateur qui oublie son mot de passe ne peut pas récupérer son compte. Une fois sur une page de l'espace organisateur ou de connexion, il n'existe aucun moyen visible de revenir en arrière : un visiteur qui clique sur « Connexion organisateur » puis renonce, ou un organisateur qui quitte la saisie d'une annonce, doit passer par le navigateur, au risque de sortir de l'application ou de perdre sa saisie.

Un organisateur qui anime des jams dans plusieurs bars doit aujourd'hui créer un compte par bar, donc utiliser une adresse email différente pour chacun, et se déconnecter pour passer de l'un à l'autre. À chaque nouvelle annonce, il ressaisit aussi l'horaire, les styles, les instruments et les photos, même quand la jam revient à l'identique.

Où qu'il se trouve dans l'application, l'utilisateur n'a aucun moyen direct de revenir à l'accueil, c'est-à-dire à la carte et aux annonces. Le bouton « Retour » ne mène qu'à la page parente. Un organisateur sur son profil, ou un visiteur sur la page d'inscription, doit enchaîner plusieurs retours ou passer par le navigateur. Le haut des pages varie aussi d'un écran à l'autre et ne ressort pas sur le fond sombre : rien n'indique clairement où naviguer. Même une fois commun, le bandeau garde le fond sombre du corps de la page et ne s'en détache que par un filet fin : la zone de navigation ne se repère pas d'un coup d'œil.

## Solution

L'outil centralise les annonces de jams publiées par les organisateurs des bars lyonnais. Le musicien sélectionne une date et consulte les annonces disponibles ce jour-là : lieu, adresse, distance jusqu'à chez lui, horaire, style musical et instruments mis à disposition sur place. Quand aucune jam n'est publiée à la date choisie, l'outil lui suggère les prochaines dates où des jams ont lieu. À terme, l'outil s'ouvrira aussi au grand public souhaitant assister à une jam.

L'organisateur accède à son espace depuis la page d'accueil, retrouve toutes les informations de ses bars et de son compte sur une page profil unique, et peut réinitialiser son mot de passe par email. Il reçoit aussi par email les avis liés à la sécurité de son compte. Chaque page qui n'est pas un point de départ propose un bouton « Retour » vers sa page parente. Quitter la saisie d'une annonce en cours l'enregistre en brouillon, reprenable plus tard ; quitter une annonce publiée avec des modifications non enregistrées demande confirmation.

Un même compte peut gérer jusqu'à 10 bars, ajoutés, modifiés ou supprimés depuis le profil. Chaque annonce porte sur un bar choisi par l'organisateur ; « Mes annonces » affiche le nom du bar sur chaque annonce et permet de filtrer par bar. Sur une nouvelle annonce, un bouton reprend en un clic l'horaire, les styles, les instruments et les photos de la dernière annonce publiée du bar choisi ; il ne reste qu'à ajouter les dates.

Chaque page affiche en haut un même bandeau à fond cuivré, la couleur des boutons pleins, distinct du corps sombre de la page, fixé pendant le défilement et souligné d'un filet doré. À gauche, un bouton « Jamix » avec une icône de petite maison ramène à l'accueil, à la date du jour, en vue liste, sans rechargement complet. À droite, on trouve l'icône de profil de l'organisateur connecté ou, sur l'accueil, le bouton « Connexion organisateur ». Dans l'espace organisateur, « Mes annonces » et l'alerte des relances sont placées juste sous le bandeau.

## Utilisateur cible

- Musicien amateur ou semi-professionnel, tous instruments et styles confondus, qui joue régulièrement en dehors de tout groupe fixe et cherche des occasions de jouer en live sans avoir à monter un concert. Il vit à Lyon ou y passe.
- Organisateur de jam, rattaché à un ou plusieurs bars lyonnais (pas nécessairement le gérant de ces bars), qui publie et gère les annonces de jams pour ces bars.

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
US-25. En tant qu'organisateur, je veux modifier le nom et l'adresse de chacun de mes bars, afin de garder leurs fiches à jour.
US-26. En tant qu'organisateur, je veux changer mon email et mon mot de passe, afin de garder la maîtrise de mon compte.
US-27. En tant qu'organisateur, je veux supprimer définitivement mon compte, avec mes bars, mes annonces et mes photos, afin de quitter l'application sans laisser de données derrière moi.
US-28. En tant qu'organisateur non connecté, je veux trouver un bouton « Connexion organisateur » en haut à droite de la page d'accueil, afin d'accéder à mon espace sans connaître l'adresse de la page de connexion.
US-29. En tant qu'organisateur connecté, je veux voir une icône de profil en haut à droite de chaque page, afin d'accéder à mon profil depuis n'importe où.
US-30. En tant qu'organisateur, je veux retrouver sur une seule page profil les fiches de mes bars (photo, nom, adresse), mon email, mon mot de passe, la déconnexion et la suppression de mon compte, afin de gérer toutes mes informations au même endroit.
US-31. En tant qu'organisateur, je veux un en-tête réduit à « Jamix », à l'icône de profil, puis, sous le bandeau, à « Mes annonces » et à l'alerte des relances, afin de naviguer sans encombrement.
US-32. En tant qu'organisateur, je veux arriver sur « Mes annonces » après m'être connecté, afin de gérer directement mes jams.
US-33. En tant qu'organisateur, je veux arriver sur « Mes annonces » après mon inscription, afin de publier ma première annonce sans détour.
US-34. En tant qu'organisateur qui a oublié son mot de passe, je veux recevoir par email un lien de réinitialisation, afin de récupérer l'accès à mon compte.
US-35. En tant qu'organisateur, je veux que ce lien ne soit valable qu'une heure, une seule fois, et qu'il soit invalidé dès que j'en demande un nouveau, afin que mon compte reste protégé.
US-36. En tant qu'organisateur, je veux que la demande de réinitialisation affiche le même message que l'adresse soit connue ou non, afin que personne ne puisse savoir si un email est inscrit.
US-37. En tant qu'organisateur, je veux recevoir un email de bienvenue à mon inscription, afin de confirmer la création de mon compte.
US-38. En tant qu'organisateur, je veux être prévenu par email quand mon mot de passe est changé ou réinitialisé, afin de réagir si ce n'est pas moi.
US-39. En tant qu'organisateur, je veux être prévenu sur mon ancienne adresse quand l'email de mon compte est changé, afin de réagir si ce n'est pas moi.
US-40. En tant que visiteur arrivé sur la page de connexion, je veux un bouton « Retour » vers l'accueil, afin de renoncer à me connecter en tant qu'organisateur.
US-41. En tant que visiteur sur la page d'inscription, de mot de passe oublié ou de réinitialisation du mot de passe, je veux un bouton « Retour » vers la connexion, afin de revenir à l'étape précédente du parcours.
US-42. En tant qu'organisateur sur ma page profil, je veux un bouton « Retour » vers « Mes annonces », afin de retrouver mes jams.
US-43. En tant qu'organisateur qui saisit une nouvelle annonce ou modifie un brouillon, je veux que quitter la saisie depuis l'application enregistre mes changements en brouillon et m'en informe par une fenêtre, afin de savoir que je pourrai la reprendre plus tard.
US-44. En tant qu'organisateur qui quitte une annonce sans y avoir rien changé (nouvelle annonce vide ou brouillon rouvert tel quel), je veux revenir directement là où j'ai cliqué, afin de ne pas créer de brouillon vide ni voir un message inutile.
US-45. En tant qu'organisateur qui modifie une annonce déjà publiée, je veux être averti avant de quitter que mes modifications non enregistrées seront perdues, afin de ne pas les abandonner par erreur tout en gardant l'annonce publiée telle quelle.
US-46. En tant qu'organisateur dont la saisie n'a pas pu être enregistrée en brouillon, je veux en connaître la raison et choisir entre rester pour corriger ou quitter sans enregistrer, afin de ne jamais perdre ma saisie sans le savoir.
US-47. En tant qu'organisateur, je veux ajouter d'autres bars à mon compte depuis mon profil, afin de publier des annonces pour chacun sans créer un compte par bar.
US-48. En tant qu'organisateur, je veux modifier la photo, le nom et l'adresse de chacun de mes bars, afin de garder chaque fiche à jour indépendamment des autres.
US-49. En tant qu'organisateur ayant plusieurs bars, je veux choisir le bar de chaque annonce, sans choix par défaut, ce choix étant obligatoire dès l'enregistrement en brouillon, afin de ne jamais publier une jam pour le mauvais bar.
US-50. En tant qu'organisateur n'ayant qu'un bar, je veux que ce bar soit présélectionné dans le formulaire d'annonce, afin de ne pas avoir à le choisir à chaque fois.
US-51. En tant qu'organisateur, je veux pouvoir changer le bar d'une annonce tant qu'elle est en brouillon, afin de corriger une erreur avant publication.
US-52. En tant qu'organisateur, je veux que le bar d'une annonce publiée ne puisse plus être changé, afin que les musiciens ne voient jamais une jam changer de lieu.
US-53. En tant qu'organisateur qui crée une nouvelle annonce, je veux un bouton « Reprendre la dernière annonce de ce bar » qui remplit l'horaire, les styles, les instruments, les précisions « Autre » et les photos de la dernière annonce publiée du bar choisi, sans les dates, afin de ne pas tout ressaisir pour une jam qui revient.
US-54. En tant qu'organisateur dont le bar choisi n'a encore aucune annonce publiée, je ne veux pas voir le bouton de reprise, afin de ne pas proposer une action impossible.
US-55. En tant qu'organisateur ayant plusieurs bars, je veux voir le nom du bar sur chaque annonce de « Mes annonces » et pouvoir filtrer la liste par bar, afin de m'y retrouver rapidement.
US-56. En tant qu'organisateur ayant plusieurs bars, je veux que chaque relance s'affiche sur l'annonce qui nomme son bar, et que l'alerte des relances compte les relances de tous mes bars, afin de savoir quel bar doit confirmer quelle jam.
US-57. En tant qu'organisateur, je veux supprimer définitivement un de mes bars, avec ses annonces, leurs dates et leurs photos, en saisissant son nom pour confirmer, afin de retirer un lieu où je n'organise plus de jams.
US-58. En tant qu'organisateur, je veux que mon dernier bar ne puisse pas être supprimé et qu'un message m'oriente vers la suppression du compte, afin que mon compte garde toujours au moins un bar.
US-59. En tant qu'organisateur, je veux être informé quand j'atteins la limite de 10 bars, afin de comprendre pourquoi je ne peux plus en ajouter.
US-60. En tant qu'organisateur, je veux qu'un bar portant le même nom et la même adresse qu'un de mes bars soit refusé, afin de ne pas créer de doublon par erreur.
US-61. En tant que musicien ou organisateur, je veux un bouton « Jamix » avec une icône de maison en haut à gauche de chaque page, afin de revenir à la carte et aux annonces depuis n'importe où.
US-62. En tant que musicien ou organisateur, je veux que « Jamix » ouvre toujours l'accueil à la date du jour en vue liste, afin de retrouver d'un clic les jams du jour.
US-63. En tant que musicien sur l'accueil, je veux voir « Jamix » signalé comme page active, et qu'un clic remette la date à aujourd'hui et la vue en liste, afin de repartir de zéro après avoir parcouru d'autres dates.
US-64. En tant que musicien ou organisateur, je veux que le bandeau reste visible en haut de l'écran pendant que je fais défiler la page, afin d'accéder à l'accueil et au profil sans remonter.
US-65. En tant que visiteur sur la page de connexion, d'inscription, de mot de passe oublié ou de réinitialisation, je veux trouver le bandeau avec seulement « Jamix », afin de renoncer au parcours de connexion en un clic.
US-66. En tant qu'organisateur, je veux retrouver « Mes annonces » et l'alerte des relances juste sous le bandeau dans mon espace, afin de garder un bandeau épuré.
US-67. En tant qu'organisateur qui saisit ou modifie une annonce, je veux qu'un clic sur « Jamix » suive les mêmes règles que les autres sorties (brouillon enregistré et fenêtre d'information, avertissement sur une annonce publiée, sortie directe sans changement), afin de ne jamais perdre ma saisie sans le savoir.
US-68. En tant que musicien ou organisateur, je veux un bandeau d'une couleur cuivrée, distincte du fond sombre de la page, afin de repérer immédiatement la zone de navigation.

## Critères de succès

- Sur le premier mois de la bêta, au moins 5 organisateurs distincts ont publié au moins une annonce de jam.
- Sur le premier mois de la bêta, l'application enregistre au moins 50 consultations d'annonces de jams.
- Sur le premier mois de la bêta, tout organisateur ayant demandé une réinitialisation de mot de passe a pu se reconnecter sans intervention manuelle.
- Depuis chaque page dotée d'un bouton « Retour », un clic mène à la page parente prévue, sans passer par le navigateur.
- Toute sortie via l'application pendant la saisie d'une nouvelle annonce non vide produit soit un brouillon visible dans « Mes annonces », soit un message laissant le choix de rester ou de quitter : jamais de perte silencieuse.
- Un organisateur publie des annonces pour 2 bars depuis un seul compte, sans se déconnecter.
- Une annonce s'affiche côté musicien à l'adresse du bar choisi.
- Le bouton de reprise remplit l'horaire, les styles, les instruments et les photos, et laisse les dates vides.
- Après la suppression d'un bar, aucune de ses annonces n'est plus visible, ni côté musicien ni dans « Mes annonces ».
- Sur le premier mois suivant la mise en ligne, au moins un organisateur gère au moins 2 bars.
- Depuis chacune des pages de l'application, un clic sur « Jamix » ouvre l'accueil à la date du jour, en vue liste, sans rechargement complet de la page.
- Sur toutes les pages, le bandeau reste visible en haut de l'écran après défilement jusqu'en bas de page.
- Pendant la saisie d'une nouvelle annonce non vide, un clic sur « Jamix » produit un brouillon visible dans « Mes annonces » ou une fenêtre laissant le choix de rester ou de quitter : jamais de perte silencieuse.
- Sur toutes les pages, le bandeau a le fond cuivré des boutons pleins et le corps de la page garde son fond sombre.

## Hors périmètre

- Favoris de jams et notifications (annulation, modification, nouvelle publication) côté musicien.
- Compte musicien et ouverture de la consultation au grand public non-musicien.
- Inscription ou réservation de place préalable pour jouer à une jam.
- Modération ou validation manuelle des annonces avant publication.
- Historique des jams passées.
- Liste pré-remplie de bars lyonnais : chaque organisateur crée sa propre fiche bar.
- Itinéraire calculé dans l'application (le trajet est délégué à l'application de cartographie externe).
- Affichage d'un temps de trajet.
- Mémorisation de l'application de cartographie choisie par le musicien.
- Relances J-7, notifications d'annonce et tout email autre que les messages de compte (réinitialisation, bienvenue, avis de changement de mot de passe ou d'email).
- Vérification de l'adresse email à l'inscription ou au changement d'email.
- Connexion via un fournisseur tiers (Google, Apple…) et authentification à deux facteurs.
- Retour vers la page précédemment visitée (historique de navigation) : la destination du bouton « Retour » est toujours la page parente fixe.
- Enregistrement automatique en brouillon lors d'une sortie par le navigateur (bouton précédent, fermeture d'onglet, rechargement) : seule une alerte standard du navigateur prévient de la perte de saisie.
- Confirmation avant de quitter le formulaire du profil ou les pages de connexion.
- Bar partagé entre plusieurs organisateurs (droits accordés par un organisateur principal).
- Changement du bar d'une annonce publiée.
- Annonce portant sur plusieurs bars.
- Archivage d'un bar (seule la suppression définitive existe).
- Transfert d'un bar vers un autre compte.
- Reprise depuis un brouillon, depuis un autre bar que celui choisi, ou sur une annonce existante.
- Reprise des dates d'une annonce.
- Mémorisation du filtre par bar de « Mes annonces ».
- Affichage de l'organisateur côté musicien.
- Bandeau à fond plein doré.
- Changement de la couleur de fond du corps des pages.
- Bandeau d'une autre couleur que le cuivré des boutons pleins (dégradé, transparence, couleur par page).
- Mémorisation de la dernière date ou de la dernière vue consultée sur l'accueil.
- « Mes annonces » dans le bandeau lui-même, ou sur l'accueil.
- Menu déroulant ou menu « burger » dans le bandeau.
- Logo graphique ou nom de l'application séparé du bouton « Jamix » dans le bandeau.
- Bouton « Connexion organisateur » sur les pages du parcours de connexion.

## Décisions d'implémentation

- L'outil est une application web, accessible et utilisable sur mobile comme sur ordinateur (responsive), sans installation.
- Seuls les organisateurs créent un compte, pour publier des annonces ; la consultation par les musiciens est libre, sans compte.
- Un compte organisateur est rattaché à 1 à 10 bars : il crée la fiche de son premier bar (nom, adresse) au moment de son inscription, puis ajoute les suivants depuis son profil ; un compte garde toujours au moins un bar. Un bar n'appartient qu'à un seul compte.
- L'organisateur peut ajouter, remplacer ou retirer une photo ou un logo sur la fiche de chacun de ses bars, à l'inscription ou plus tard ; cette photo est optionnelle et son absence n'empêche jamais la création ou la validité de la fiche bar.
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
- L'organisateur peut modifier le nom et l'adresse de chacun de ses bars à tout moment ; une adresse modifiée est re-géocodée (en cas d'échec, la fiche reste valide mais le bar n'apparaît plus sur la carte).
- Changer l'email ou le mot de passe exige la saisie du mot de passe actuel.
- Après un changement de mot de passe depuis le profil, l'organisateur reste connecté sur l'appareil utilisé et voit la confirmation du changement, sans page d'erreur ; ses autres sessions ouvertes sont déconnectées. Après une réinitialisation par email, toutes les sessions ouvertes auparavant sont déconnectées.
- La suppression du compte est définitive (pas de corbeille) et exige une confirmation explicite ; elle supprime tous ses bars, leurs annonces, leurs occurrences et toutes les photos associées.
- Visiteur non connecté : un bouton fantôme « Connexion organisateur » à droite du bandeau de la page d'accueil. Organisateur connecté : une icône bonhomme à droite du bandeau, sur toutes les pages, qui mène à la page profil.
- Toutes les pages affichent un même bandeau horizontal en haut de l'écran, fixé pendant le défilement. Il a le fond cuivré des boutons pleins, distinct du fond sombre du corps de la page, et est souligné d'un filet doré fin sur toute sa largeur. Les éléments du bandeau (« Jamix », icône de profil, « Connexion organisateur ») restent en crème.
- À gauche du bandeau, un bouton « Jamix » associe une icône de petite maison au libellé « Jamix », nom de l'application. Il mène toujours à l'accueil, à la date du jour, en vue liste, quels que soient la page et le chemin d'arrivée. Le passage se fait sans rechargement complet de l'application.
- Sur l'accueil, « Jamix » est signalé comme page active. Un clic remet la date à aujourd'hui et la vue en liste.
- À droite du bandeau : l'icône de profil si l'organisateur est connecté, sur toutes les pages. Sinon, sur l'accueil uniquement, le bouton « Connexion organisateur ». Sur les pages de connexion, d'inscription, de mot de passe oublié et de réinitialisation, la droite du bandeau est vide.
- Dans l'espace organisateur (« Mes annonces », nouvelle annonce, modification d'annonce, profil), « Mes annonces » et l'alerte des relances s'affichent sous le bandeau.
- Pendant la saisie d'une annonce, « Jamix » est une sortie via l'application, au même titre que « Retour », « Mes annonces » et l'icône de profil, et suit les mêmes règles. Après la fenêtre, l'organisateur arrive sur l'accueil.
- Le bouton « ← Retour » existant reste en place sous le bandeau, avec les mêmes destinations.
- La page profil unique regroupe les fiches des bars (photo, nom, adresse), l'email, le mot de passe, la déconnexion et la suppression du compte ; elle remplace les pages séparées fiche bar et compte, dont les anciennes adresses redirigent vers elle.
- Le bandeau de l'espace organisateur contient « Jamix » et l'icône de profil ; « Mes annonces » et l'alerte des relances sont placées juste en dessous.
- Après la connexion comme après l'inscription, l'organisateur arrive sur « Mes annonces ».
- Mot de passe oublié : l'organisateur saisit son email et reçoit un lien valable 1 heure, à usage unique, invalidé dès qu'un nouveau lien est demandé. Le message affiché est le même que l'adresse soit connue ou non. Après réinitialisation, l'organisateur est renvoyé vers la connexion avec un message de succès.
- Emails envoyés, uniquement liés au compte : lien de réinitialisation, bienvenue à l'inscription, avis de changement ou de réinitialisation du mot de passe, avis de changement d'email envoyé à l'ancienne adresse. Un échec d'envoi d'un email d'avis ne bloque jamais l'action qui l'a déclenché.
- Un bouton « Retour » apparaît en haut à gauche, sous le bandeau et au-dessus du titre de la page, sous forme de lien texte « ← Retour », sur : connexion (→ accueil) ; inscription, mot de passe oublié et réinitialisation du mot de passe (→ connexion) ; profil, nouvelle annonce et modification d'annonce (→ « Mes annonces »). L'accueil et « Mes annonces », points de départ, n'en ont pas.
- La destination du bouton « Retour » est toujours la même pour une page donnée, quel que soit le chemin d'arrivée (lien direct, favori…). Les liens de l'en-tête gardent leur propre destination.
- Pendant la saisie d'une annonce, toute sortie via l'application (« Retour », ou « Jamix », « Mes annonces » et icône de profil) suit les règles ci-dessous ; l'organisateur arrive ensuite sur la page qu'il a demandée.
- Une modification en cours se mesure par rapport au formulaire vide (nouvelle annonce) ou à l'annonce telle qu'ouverte, puis au dernier enregistrement. Sans changement, la sortie est directe, sans brouillon ni fenêtre, quel que soit le statut de l'annonce. Le choix de portée et les actions déjà enregistrées immédiatement (confirmation, annulation d'une date, photos d'une annonce existante) ne comptent pas comme des modifications.
- Sur une nouvelle annonce ou un brouillon modifié, quitter enregistre la saisie en brouillon (même incomplète, dates et photos comprises), puis affiche une fenêtre « Annonce enregistrée en brouillon, vous pourrez la reprendre plus tard dans Mes annonces » ; après validation, l'organisateur arrive sur la page demandée.
- Si cet enregistrement échoue (photo refusée, erreur réseau…), l'organisateur reste sur le formulaire et une fenêtre en donne la raison, avec « Rester » (par défaut) et « Quitter sans enregistrer » ; aucun enregistrement partiel. Pendant l'enregistrement, le bouton est inactif.
- Sur une annonce Publiée avec des modifications non enregistrées, quitter affiche une fenêtre avertissant qu'elles seront perdues, avec « Quitter » et « Rester » ; l'annonce reste publiée telle quelle.
- Sur les formulaires d'annonce, une sortie par le navigateur avec des modifications en cours déclenche l'alerte standard du navigateur ; elle peut ne pas se déclencher sur le bouton précédent du navigateur.
- Sur le profil et les pages de connexion, « Retour » quitte immédiatement, sans confirmation ; une saisie non enregistrée y est perdue.
- Le profil contient une section « Mes bars » : une liste compacte (miniature, nom, adresse, « Modifier ») dont un seul bar est déplié à la fois pour modifier sa photo, son nom et son adresse ou le supprimer. Un bouton « Ajouter un bar » déplie un formulaire vide (nom, adresse, photo optionnelle). Un compte d'un seul bar voit sa fiche dépliée d'office. Replier une fiche perd la saisie non enregistrée, sans confirmation.
- Un bar portant le même nom et la même adresse qu'un autre bar du compte est refusé avec « Ce bar existe déjà dans votre compte », à l'ajout comme à la modification. La comparaison ignore la casse et les espaces en trop. Deux comptes différents peuvent avoir des bars identiques.
- À 10 bars, le bouton « Ajouter un bar » est inactif, avec la mention « Limite de 10 bars atteinte ».
- Quand l'adresse d'un bar ajouté ou modifié n'a pas pu être localisée, un message prévient l'organisateur que le bar n'apparaîtra pas sur la carte ; la liste « Mes bars » signale en permanence un bar absent de la carte.
- « Supprimer ce bar » ouvre une fenêtre : « Ce bar et ses N annonces (dont M dates à venir publiées) seront supprimés définitivement. Les musiciens ne les verront plus. » (ou « Ce bar sera supprimé définitivement. » sans annonce). L'organisateur saisit le nom du bar (casse et espaces en trop ignorés) pour activer « Supprimer définitivement » ; aucun mot de passe n'est demandé et aucun email n'est envoyé. La suppression est définitive et emporte les annonces, leurs occurrences et leurs photos.
- Le dernier bar d'un compte ne peut pas être supprimé : à la place du bouton, la mention « Un compte doit garder au moins un bar ; pour tout supprimer, supprimez votre compte ».
- Le formulaire d'annonce commence par un champ « Bar ». S'il n'y a qu'un bar, il est présélectionné ; sinon, aucun bar n'est choisi par défaut. Le bar est obligatoire dès l'enregistrement, brouillon compris : une sortie sans bar choisi affiche la fenêtre d'échec d'enregistrement (« Choisissez un bar pour enregistrer le brouillon »). Une annonce porte sur un seul bar.
- Le bar d'une annonce est modifiable tant qu'elle est en Brouillon et figé une fois Publiée.
- Sur une nouvelle annonce, choisir un bar ne compte pas à lui seul comme une saisie : sans autre champ rempli, la sortie est directe. Sur un brouillon rouvert, changer de bar compte comme une modification.
- Sur une nouvelle annonce uniquement, dès qu'un bar est choisi et qu'il a au moins une annonce publiée, un bouton fantôme « Reprendre la dernière annonce de ce bar » apparaît. Il remplit l'horaire, les styles, les instruments, les précisions « Autre » et les photos de l'annonce publiée le plus récemment pour ce bar, même si toutes ses dates sont passées ou annulées ; il écrase ces champs sans confirmation et ne touche jamais aux dates. Changer ensuite de bar ne modifie pas les champs repris ; le bouton suit le bar choisi. La reprise compte comme une saisie pour la sortie de la saisie d'une annonce.
- Les photos reprises sont dupliquées à l'enregistrement : les deux annonces ne partagent jamais un même fichier. Si la copie échoue, l'enregistrement échoue sans enregistrement partiel.
- « Mes annonces » affiche une seule liste, avec le nom du bar sur chaque annonce. Dès 2 bars, un filtre « Tous » / un bouton par bar (boutons fantômes, défilement horizontal sur mobile) restreint la liste ; il revient sur « Tous » à chaque visite et n'influence pas le formulaire de nouvelle annonce.
- L'alerte des relances compte les relances de tous les bars du compte ; chaque relance s'affiche sur l'annonce, qui nomme son bar.
- Rien ne change côté musicien : chaque annonce s'affiche avec le nom et l'adresse de son bar.

## Notes complémentaires

L'itinéraire dépend d'applications tierces (Google Maps, Plans, Waze, Citymapper). Sans l'application installée, Waze et Citymapper peuvent ouvrir une page web qui pousse surtout à les installer.

Les emails de compte dépendent d'un service d'envoi tiers (Resend). En mode test, Resend n'envoie qu'à l'adresse du compte Resend ; un domaine d'expédition vérifié est nécessaire pour la bêta. Les emails peuvent arriver en spam, d'où la mention « Pensez à vérifier vos spams » après une demande de réinitialisation.

Hypothèse : chaque compte existant garde son bar et ses annonces au passage à plusieurs bars, sans action de l'organisateur.

Le filet doré du bandeau est un nouvel usage du Gold elegance : un accent structurel non interactif, alors que DESIGN.md le réserve aujourd'hui aux accents éditoriaux. DESIGN.md devra être complété pour autoriser ce cas précis. Le bandeau plein doré reste exclu.

Le fond cuivré du bandeau est un nouvel usage du Brass Copper comme surface, alors que DESIGN.md le réserve au bouton plein. Les boutons pleins restent les seuls éléments cuivrés dans le corps des pages, mais leur rôle de signal d'action principale s'en trouve un peu affaibli.

Piste future : des co-organisateurs, avec des droits sur un bar accordés par un organisateur principal. Restent à cadrer l'invitation par email, le périmètre des droits, le destinataire des relances et le sort des annonces en cas de retrait d'un co-organisateur.
