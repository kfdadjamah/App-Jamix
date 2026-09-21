## Problème

Le musicien qui joue régulièrement en dehors d'un groupe fixe (amateur ou semi-professionnel) ne dispose d'aucune source fiable et centralisée pour savoir où jouer à Lyon un soir donné. L'information sur les jams circule de façon dispersée — bouche-à-oreille, réseaux sociaux, groupes propres à chaque bar — si bien qu'il est impossible de savoir en un coup d'œil quels bars organisent une jam à une date donnée, et l'information disponible est parfois obsolète ou concerne une jam annulée sans que cela se sache.

## Solution

L'outil centralise les annonces de jams publiées par les organisateurs des bars lyonnais. Le musicien sélectionne une date et consulte les annonces disponibles ce jour-là : lieu, adresse, distance jusqu'à chez lui, horaire, style musical et instruments mis à disposition sur place. Quand aucune jam n'est publiée à la date choisie, l'outil lui suggère les prochaines dates où des jams ont lieu. À terme, l'outil s'ouvrira aussi au grand public souhaitant assister à une jam.

## Utilisateur cible

- Musicien amateur ou semi-professionnel, tous instruments et styles confondus, qui joue régulièrement en dehors de tout groupe fixe et cherche des occasions de jouer en live sans avoir à monter un concert. Il vit à Lyon ou y passe.
- Organisateur de jam, rattaché à un bar lyonnais (pas nécessairement le gérant du bar), qui publie et gère les annonces de jams pour ce bar.

## User Stories

US-1. En tant qu'organisateur, je veux créer un compte et renseigner la fiche de mon bar (nom, adresse), afin de pouvoir publier des annonces de jams pour ce lieu.
US-2. En tant qu'organisateur, je veux publier une annonce de jam avec une date, un horaire, un style musical et les instruments disponibles sur place, afin d'informer les musiciens de l'événement.
US-3. En tant qu'organisateur, je veux pouvoir publier une annonce sans limite de délai à l'avance, afin d'annoncer une jam dès que je connais la date.
US-4. En tant qu'organisateur ayant publié une annonce plus de 15 jours avant la date de la jam, je veux devoir la confirmer 7 jours avant, afin de garantir aux musiciens une information à jour.
US-5. En tant qu'organisateur, je veux que mon annonce affiche « Jam programmée, sera confirmée le [date J-7] » tant que je ne l'ai pas confirmée, afin que les musiciens sachent que l'information n'est pas encore définitive.
US-6. En tant qu'organisateur qui n'a pas confirmé une jam à J-7, je veux que l'annonce reste affichée avec le statut « en attente de confirmation », afin de ne pas perdre la visibilité de mon annonce tant que je ne l'ai pas explicitement annulée.
US-7. En tant qu'organisateur, je veux pouvoir modifier les informations d'une annonce déjà publiée (horaire, style...), afin de corriger ou ajuster les détails d'une jam.
US-8. En tant qu'organisateur, je veux pouvoir annuler manuellement une annonce à tout moment, afin de prévenir les musiciens si la jam n'a finalement pas lieu.
US-9. En tant que musicien, je veux sélectionner une date, afin de voir les jams disponibles ce jour-là à Lyon.
US-10. En tant que musicien, je veux consulter les annonces de jams sans avoir à créer de compte, afin d'accéder à l'information rapidement.
US-11. En tant que musicien, je veux voir pour chaque annonce le lieu, l'adresse, l'horaire, le style musical et les instruments disponibles sur place, afin de décider si je m'y rends.
US-12. En tant que musicien, je veux voir la distance entre ma position et le bar, afin de choisir une jam accessible facilement.
US-13. En tant que musicien qui refuse la géolocalisation, je veux tout de même consulter les annonces (sans distance affichée), afin de ne pas être bloqué dans l'usage de l'outil.
US-14. En tant que musicien, je veux, quand aucune jam n'est publiée à la date sélectionnée, voir un message clair et les prochaines dates où des jams ont lieu, afin de ne pas rester sans solution.
US-15. En tant que musicien, je veux voir clairement si une jam est confirmée, en attente de confirmation, ou annulée, afin de ne pas me déplacer pour rien.

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

## Décisions d'implémentation

- L'outil est une application web, accessible et utilisable sur mobile comme sur ordinateur (responsive), sans installation.
- Seuls les organisateurs créent un compte, pour publier des annonces ; la consultation par les musiciens est libre, sans compte.
- Un compte organisateur est rattaché à un seul bar ; l'organisateur crée la fiche du bar (nom, adresse) au moment de son inscription.
- Une annonce de jam est ponctuelle : chaque jam donne lieu à une publication distincte par l'organisateur (pas de récurrence automatique).
- Pas de limite de délai pour publier une annonce à l'avance ; le musicien ne peut consulter que les jams à venir (pas d'historique des jams passées).
- Si une annonce est publiée plus de 15 jours avant la date de la jam, l'organisateur doit la confirmer 7 jours avant (J-7) ; jusque-là, l'annonce affiche « Jam programmée, sera confirmée le [date J-7] ».
- Si l'organisateur ne confirme pas à J-7, l'annonce reste visible avec le statut « en attente de confirmation » (pas de suppression ni d'annulation automatique).
- L'organisateur peut modifier ou annuler manuellement une annonce à tout moment, indépendamment du mécanisme de confirmation à J-7.
- Chaque annonce affiche : nom et adresse du bar, distance jusqu'au musicien, horaire, style musical, instruments/backline disponibles sur place.
- La distance est calculée à partir de la géolocalisation du navigateur du musicien, demandée au moment de la consultation.
- Si le musicien refuse la géolocalisation, les annonces s'affichent normalement, sans la distance.
- Si aucune jam n'est publiée à la date sélectionnée, l'application affiche un message clair et propose les prochaines dates où des jams sont publiées.

## Notes complémentaires

Rien à signaler.
