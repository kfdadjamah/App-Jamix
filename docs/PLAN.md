# Plan : App-Jamix — annonces de jams à Lyon

> PRD source : `docs/PRD.md`

## Décisions architecturales

- **Modèles clés** : `Bar` (nom, adresse, photo/logo optionnel), `Organisateur` (compte rattaché à un seul `Bar`), `Annonce` (style musical, instruments/backline, récurrente ou non, statut Brouillon/Publiée, jusqu'à 2 photos optionnelles), `OccurrenceJam` (date, horaire, statut de confirmation, échéance J-7) — chaque date d'une annonce récurrente est une occurrence indépendante avec son propre statut.
- **Deux axes de statut distincts** : (1) statut de l'annonce — `Brouillon` (invisible côté musicien, aucune occurrence n'entre dans le cycle J-7) → `Publiée` ; (2) statut de chaque occurrence — `confirmée` / `programmée (sera confirmée le J-7)` / `en attente de confirmation` / `annulée`, qui ne démarre qu'à la publication de l'annonce.
- **Gestion des photos** : upload optionnel côté fiche bar (photo/logo) et côté annonce (jusqu'à 2 photos maximum) ; toute image importée est automatiquement ajustée/recadrée au format d'affichage de l'application (pas de cadrage manuel), sans jamais bloquer la création/publication si aucune photo n'est fournie.
- **Authentification / autorisation** : seuls les organisateurs ont un compte (email/mot de passe) ; la consultation musicien est publique, sans compte, sans autorisation.
- **Statuts d'occurrence** : `confirmée`, `programmée (en attente de confirmation, sera confirmée le J-7)`, `en attente de confirmation (J-7 dépassé)`, `annulée`. Ce cycle de statuts est fixé dès la Phase 6 et réutilisé jusqu'à la Phase 8.
- **Déclenchement du cycle J-7 (Phase 6)** : la décision « cycle de confirmation requis ou non » est figée une seule fois, au moment de la publication de l'annonce (création directement publiée, ou passage Brouillon → Publiée) — jamais recalculée ensuite. Pour chaque occurrence, si sa date est à plus de 7 jours de l'instant de publication, on écrit `statut = PROGRAMMEE` et `confirmationJ7 = date - 7j` ; sinon (publiée à 7 jours ou moins de son échéance, ex. J-2), on écrit directement `statut = CONFIRMEE` et `confirmationJ7 = null`, sans cycle ni relance. Cette règle s'applique indépendamment à chaque occurrence, y compris pour une annonce récurrente publiée en une fois avec plusieurs dates. Le calcul des écarts de jours se fait en UTC, date seule (`new Date(new Date().toISOString().slice(0,10))`), cohérent avec le reste de l'app — pas de gestion de fuseau Europe/Paris. Le statut « en attente de confirmation » n'est jamais persisté : il est calculé à la volée à chaque lecture (statut = PROGRAMMEE et confirmationJ7 <= aujourd'hui), sans tâche planifiée (pas d'infra cron dans le projet).
- **Relances de confirmation** : canal in-app uniquement (jamais d'email ni de SMS pour les relances J-7) ; l'email est réservé aux messages de compte (Phases 13 et 14).
- **Géolocalisation** : basée sur l'API de géolocalisation du navigateur, demandée à la consultation ; dégradation gracieuse (pas de distance affichée) si refusée.
- **Frontière tierce** : pas de SMS ; email uniquement pour les messages de compte, via **Resend** (réinitialisation du mot de passe, bienvenue, avis de changement de mot de passe ou d'email — Phases 13 et 14), jamais pour les relances J-7. Dépendances externes limitées à : Resend (clé `RESEND_API_KEY`), géolocalisation navigateur, géocodage des adresses de bar (API Adresse data.gouv.fr), fond de carte vectoriel gratuit et sans clé API (Phase 9), et applications de cartographie externes (Google Maps, Plans, Waze, Citymapper) ouvertes par simple lien universel avec le bar comme destination — aucun calcul d'itinéraire ni clé API côté application (Phase 10).
- **Récurrence (Phase 5)** : le champ `estRecurrente` est dérivé automatiquement du nombre d'occurrences (`occurrences.length > 1`), pas de toggle dédié dans l'UI ; l'horaire (`heureDebut`/`heureFin`) est unique par annonce et s'applique à toutes ses occurrences ; jusqu'à 12 dates maximum par annonce, sans doublon (contrainte `@@unique([annonceId, date])` en base + validation applicative) ; les dates ne sont librement modifiables (ajout/retrait) que tant que l'annonce est en Brouillon — une fois Publiée, la modification des dates relève de la Phase 8 (portée ciblée/globale). Tant que l'annonce est en Brouillon, chaque sauvegarde resynchronise ses occurrences par remplacement complet (suppression puis recréation à partir des dates soumises), sans diff fin — aucune donnée par occurrence n'a encore d'état à préserver à ce stade. Une fois Publiée, les autres champs (horaire, style, instruments, photos) restent modifiables et s'appliquent alors à toutes les occurrences existantes.
- **Routes** : consultation musicien publique sur `/` ; `/inscription`, `/connexion`, `/mot-de-passe-oublie` et `/reinitialiser-mot-de-passe` publiques ; espace organisateur protégé (redirection vers `/connexion` si non connecté) sur `/mes-annonces` (annonces, confirmations, relances) et `/mon-profil` (fiche bar, email, mot de passe, déconnexion, suppression). Depuis la Phase 12, `/mon-profil` remplace `/mon-bar` et `/mon-compte`, qui redirigent vers lui. Après connexion ou inscription, l'organisateur arrive sur `/mes-annonces`.
- **Réinitialisation du mot de passe (Phase 13)** : modèle `JetonReinitialisation` (cascade à la suppression de l'organisateur) ; seul le hash SHA-256 du jeton est stocké, jamais le jeton brut ; validité 1 h ; une nouvelle demande supprime les jetons existants ; une réinitialisation réussie supprime tous les jetons de l'organisateur (usage unique). Message de retour identique que l'email soit connu ou non.
- **Emails d'avis (Phase 14)** : envoyés après l'écriture en base, dans un `try/catch` qui journalise sans remonter l'erreur ; un échec d'envoi ne bloque jamais l'action.
- **Profil et compte (Phase 11)** : aucune migration de schéma. Le géocodage d'une adresse de bar n'est relancé que si l'adresse change ; un échec remet latitude/longitude à `null` (fiche valide, bar absent de la carte, distance non affichée). Session JWT contenant uniquement l'identifiant de l'organisateur : l'email affiché est toujours relu en base, jamais depuis la session. Toute action sensible (email, mot de passe, suppression) revérifie le mot de passe actuel côté serveur. La suppression de compte efface, en une transaction, les annonces (occurrences en cascade), le bar puis le compte, faute de cascade `Organisateur → Bar → Annonce` dans le schéma ; les photos (bar et annonces) sont retirées du stockage ensuite, sans bloquer la suppression en cas d'échec.
- **Navigation retour (Phases 15 et 16)** : aucune migration de schéma. Un composant unique « ← Retour » (lien texte, destination fixe par page, jamais l'historique du navigateur) placé sous l'en-tête et au-dessus du titre. Sur les formulaires d'annonce, les sorties via l'application (Retour, « Mes annonces » et icône de profil de l'en-tête) passent par une même garde côté client qui compare l'état courant du formulaire à un état de référence (formulaire vide, annonce telle qu'ouverte, puis dernier enregistrement réussi) ; le choix de portée et les actions immédiates (confirmation, annulation d'une date, photos d'une annonce existante) sont exclus de la comparaison. L'enregistrement automatique réutilise l'action d'enregistrement en brouillon existante (même validation, pas d'enregistrement partiel). Sortie par le navigateur : alerte standard `beforeunload` uniquement, sans enregistrement.

---

## Phase 1 : Compte organisateur et fiche bar

**User stories** : US-1, US-2

### Ce qu'on livre

Un organisateur peut créer un compte et renseigner la fiche de son bar (nom, adresse, photo/logo optionnel) en une seule séquence d'inscription, ou ajouter/modifier la photo plus tard. Un compte est rattaché à un seul bar.

### Critères d'acceptation

- [x] Un visiteur peut créer un compte organisateur (email/mot de passe ou équivalent)
- [x] Lors de l'inscription, l'organisateur renseigne nom et adresse de son bar
- [x] L'organisateur peut ajouter, remplacer ou retirer une photo/logo sur la fiche bar, à l'inscription ou plus tard
- [x] Une photo importée est automatiquement ajustée au format d'affichage de l'application
- [x] L'absence de photo n'empêche jamais la création ou la validité de la fiche bar
- [x] Le compte créé est rattaché à cette fiche bar de façon permanente

## Bloquée par

Aucune — démarrable immédiatement

---

## Phase 2 : Publication d'une annonce ponctuelle (avec brouillon et photos) et consultation publique par date

**User stories** : US-3, US-4, US-5, US-7, US-14, US-15, US-16

### Ce qu'on livre

Tranche verticale bout-en-bout minimale : un organisateur connecté crée une annonce de jam ponctuelle (date, horaire, style musical, instruments disponibles, jusqu'à 2 photos optionnelles), qu'il peut enregistrer en Brouillon pour la compléter plus tard ou publier directement, sans limite de délai à l'avance. Un musicien, sans compte, sélectionne une date et voit uniquement les annonces publiées disponibles ce jour-là, avec lieu, adresse, horaire, style, instruments et photos.

### Critères d'acceptation

- [x] Un organisateur connecté crée une annonce avec date, horaire, style musical, instruments disponibles
- [x] L'organisateur peut ajouter jusqu'à 2 photos à l'annonce, importées et automatiquement ajustées au format d'affichage de l'application
- [x] Une tentative d'ajout d'une 3e photo est bloquée/empêchée
- [x] L'annonce reste créable et publiable sans aucune photo
- [x] L'organisateur peut enregistrer l'annonce en statut Brouillon (incomplète ou non), la retrouver plus tard et la compléter
- [x] L'organisateur publie explicitement une annonce (depuis un brouillon ou directement) pour la rendre visible
- [x] Une annonce en Brouillon n'apparaît jamais dans la consultation musicien
- [x] Aucune contrainte de délai minimum/maximum n'empêche la publication à l'avance
- [x] Un visiteur sans compte sélectionne une date et voit la liste des annonces publiées ce jour-là
- [x] Chaque annonce affiche lieu, adresse, horaire, style musical, instruments disponibles et ses éventuelles photos

## Bloquée par

- Phase 1 (un compte organisateur et un bar doivent exister pour publier)

---

## Phase 3 : Distance jusqu'au bar via géolocalisation

**User stories** : US-17, US-18

### Ce qu'on livre

À la consultation, l'application demande la géolocalisation du navigateur du musicien et affiche la distance jusqu'à chaque bar. Si la géolocalisation est refusée, les annonces restent consultables normalement, sans distance affichée.

### Critères d'acceptation

- [x] La géolocalisation est demandée au moment de la consultation des annonces
- [x] Si acceptée, chaque annonce affiche la distance jusqu'au bar
- [x] Si refusée, les annonces s'affichent sans distance, sans blocage de la consultation

## Bloquée par

- Phase 2 (nécessite déjà la liste d'annonces affichée)

---

## Phase 4 : Suggestion des prochaines dates disponibles

**User stories** : US-19

### Ce qu'on livre

Quand aucune jam n'est publiée à la date sélectionnée par le musicien, l'application affiche un message clair et propose les prochaines dates où des jams sont publiées à Lyon.

### Critères d'acceptation

- [x] Une date sans annonce publiée affiche un message explicite (pas une liste vide silencieuse)
- [x] Les prochaines dates avec au moins une jam publiée sont proposées, sélectionnables

## Bloquée par

- Phase 2 (nécessite déjà le flux de sélection de date et d'affichage des annonces)

---

## Phase 5 : Annonces récurrentes — publication multi-dates

**User stories** : US-6

### Ce qu'on livre

Lors de la création ou de l'édition d'une annonce en Brouillon, l'organisateur ajoute une ou plusieurs dates (jusqu'à 12) via une liste de dates ajoutables/supprimables, avec un horaire unique partagé par toutes les dates de l'annonce. Le caractère récurrent de l'annonce (`estRecurrente`) est déduit automatiquement dès que plus d'une date est renseignée, sans bascule ponctuelle/récurrente distincte. Chaque date devient une occurrence à part entière, visible et consultable indépendamment côté musicien (via le flux de la Phase 2). Le statut Brouillon introduit en Phase 2 s'applique sans changement à une annonce récurrente : elle peut rester en brouillon tant que les dates ne sont pas finalisées, et ses dates restent librement modifiables tant qu'elle n'est pas Publiée. Une fois Publiée, la liste des dates n'est plus modifiable depuis ce formulaire (modification déléguée à la Phase 8).

### Critères d'acceptation

- [x] L'organisateur ajoute une ou plusieurs dates (jusqu'à 12) à une annonce via une liste de dates ajoutables/supprimables, sans bascule ponctuelle/récurrente distincte
- [x] Le caractère récurrent de l'annonce est déduit automatiquement dès que plus d'une date est renseignée
- [x] Un horaire unique s'applique à toutes les dates d'une même annonce
- [x] Une tentative d'ajout d'une date déjà présente dans la liste est bloquée/ignorée
- [x] Une tentative d'ajout d'une 13e date est bloquée/empêchée
- [x] Chaque date sélectionnée apparaît comme une occurrence indépendante dans la consultation musicien
- [x] Tant que l'annonce est en Brouillon, l'organisateur peut librement ajouter ou retirer des dates
- [x] Une fois l'annonce Publiée, la liste des dates n'est plus modifiable depuis le formulaire (modification déléguée à la Phase 8), mais horaire/style/instruments/photos restent modifiables et s'appliquent à toutes les occurrences existantes
- [x] Dans « Mes annonces », une annonce récurrente s'affiche comme une seule carte listant toutes ses dates, avec un badge « Récurrente »

## Bloquée par

- Phase 2 (réutilise le modèle d'annonce et le flux de consultation)

---

## Phase 6 : Confirmation à J-7 et statuts d'occurrence

**User stories** : US-8, US-9, US-10, US-20 (statuts confirmée / en attente)

### Ce qu'on livre

Toute occurrence publiée plus de 7 jours à l'avance affiche « Jam programmée, sera confirmée le [date J-7] » tant qu'elle n'est pas confirmée. L'organisateur peut la confirmer avant J-7. Si elle n'est pas confirmée à J-7, elle reste visible avec le statut « en attente de confirmation » (jamais supprimée ni annulée automatiquement). Le musicien voit ce statut sur chaque annonce.

### Critères d'acceptation

- [x] Une occurrence à plus de J-7 affiche « sera confirmée le [date J-7] »
- [x] L'organisateur peut confirmer une occurrence avant son échéance J-7
- [x] Une occurrence non confirmée après J-7 passe au statut « en attente de confirmation » et reste visible
- [x] Le musicien voit distinctement le statut (confirmée / en attente) sur chaque annonce

## Bloquée par

- Phase 2 (occurrences ponctuelles) et Phase 5 (occurrences récurrentes), car le mécanisme s'applique à toute occurrence quel que soit son origine

---

## Phase 7 : Relances de confirmation in-app

**User stories** : US-11

### Ce qu'on livre

Tant qu'une occurrence n'est pas confirmée après son échéance J-7, l'organisateur reçoit des relances in-app à J-5, J-3, J-2, J-1 et le jour J, visibles dans son espace organisateur.

### Critères d'acceptation

- [x] Une occurrence non confirmée après J-7 génère une relance in-app à J-5, J-3, J-2, J-1 et J0
- [x] Les relances s'arrêtent dès que l'organisateur confirme l'occurrence
- [x] Les relances sont visibles dans l'espace organisateur (pas de canal externe)

## Bloquée par

- Phase 6 (le statut « en attente de confirmation » doit exister avant de déclencher des relances)

---

## Phase 8 : Modification et annulation ciblée ou globale

**User stories** : US-12, US-13, US-20 (statut annulée)

### Ce qu'on livre

L'organisateur peut modifier (horaire, style, etc.) ou annuler manuellement une annonce à tout moment. Pour une annonce récurrente, il choisit à chaque action si elle s'applique uniquement à la date sélectionnée ou à toutes les dates. Le musicien voit le statut « annulée » sur les occurrences concernées.

### Critères d'acceptation

- [x] L'organisateur modifie une occurrence et choisit portée « cette date seule » ou « toutes les dates » pour une annonce récurrente
- [x] L'organisateur annule une occurrence et choisit la même portée
- [x] Une occurrence annulée affiche le statut « annulée » côté musicien, sans être supprimée de la vue

## Bloquée par

- Phase 5 (récurrence) et Phase 6 (cycle de statuts) doivent exister pour gérer portée et statut annulée

---

## Phase 9 : Vue carte des jams par statut

**User stories** : US-21

### Ce qu'on livre

En complément de la vue liste (Phase 2/4), le musicien peut basculer vers une vue carte affichant, pour la date sélectionnée, un marqueur par bar ayant une jam publiée, avec une indication visuelle du statut de chaque jam (confirmée / programmée / en attente de confirmation / annulée). La carte réutilise la géolocalisation de la Phase 3 pour se centrer sur la position du musicien quand elle est disponible.

### Critères d'acceptation

- [x] Le musicien peut basculer entre vue liste et vue carte pour une même date sélectionnée
- [x] Chaque bar ayant une jam à la date sélectionnée apparaît comme marqueur sur la carte
- [x] Le statut de chaque jam (confirmée / programmée / en attente de confirmation / annulée) est visuellement distinguable sur la carte
- [x] Cliquer/toucher un marqueur affiche les informations de l'annonce (lieu, adresse, horaire, style, instruments, photos) comme dans la vue liste
- [x] Sans géolocalisation acceptée, la carte reste consultable (dégradation gracieuse, sans centrage sur la position du musicien)

## Bloquée par

- Phase 2 (annonces et consultation par date), Phase 3 (géolocalisation), Phase 6 et Phase 8 (cycle complet des statuts d'occurrence, y compris annulation)

---

## Phase 10 : Distance sur la carte et itinéraire

**User stories** : US-22, US-23, US-24

### Ce qu'on livre

Sur la vue carte, chaque marqueur affiche sous le statut de la jam la distance jusqu'au bar, quand la géolocalisation est acceptée (masquée sur un marqueur réduit). Chaque annonce, dans la liste comme dans la fiche ouverte depuis un marqueur, propose un bouton fantôme « Itinéraire » qui ouvre un menu de choix de l'application de cartographie (Google Maps, Plans, Waze, Citymapper), avec le bar comme destination. Si l'application n'est pas installée, sa version web s'ouvre.

### Critères d'acceptation

- [x] Avec géolocalisation acceptée, chaque marqueur de la carte affiche la distance jusqu'au bar sous le statut
- [x] Sans géolocalisation, aucune distance n'est affichée sur les marqueurs
- [x] La distance est masquée sur un marqueur réduit (chevauchement)
- [x] Chaque annonce (liste et fiche de la carte) affiche un bouton fantôme « Itinéraire »
- [x] Le bouton ouvre un menu proposant Google Maps, Plans (appareils Apple uniquement), Waze et Citymapper (mobile uniquement)
- [x] Chaque lien ouvre l'application ou sa version web avec le bar comme destination
- [x] Le bouton fonctionne même sans géolocalisation acceptée

## Bloquée par

- Phase 3 (géolocalisation et distance) et Phase 9 (vue carte)

---

## Phase 11 : Profil organisateur et gestion du compte

**User stories** : US-25, US-26, US-27

### Ce qu'on livre

La fiche bar (`/mon-bar`) devient éditable : nom, adresse (re-géocodée si elle change) et photo. Une nouvelle page `/mon-compte` permet à l'organisateur de changer son email et son mot de passe (mot de passe actuel exigé) et de supprimer définitivement son compte, avec son bar, ses annonces, leurs occurrences et leurs photos. Le rattachement « un compte = un bar » est conservé.

### Critères d'acceptation

- [x] L'organisateur modifie le nom et l'adresse de son bar depuis `/mon-bar`
- [x] Une adresse modifiée est re-géocodée ; en cas d'échec, la fiche reste valide mais le bar disparaît de la carte
- [x] Les modifications de la fiche bar sont visibles côté musicien (liste et carte)
- [x] L'organisateur change son email en saisissant son mot de passe actuel ; un email déjà utilisé est refusé
- [x] L'organisateur change son mot de passe en saisissant son mot de passe actuel et une confirmation identique
- [x] Un mot de passe actuel erroné est refusé pour toute action sensible
- [x] L'organisateur supprime définitivement son compte après saisie de son mot de passe et du mot « SUPPRIMER »
- [x] La suppression retire le bar, ses annonces, leurs occurrences et leurs photos, puis déconnecte l'organisateur
- [x] `/mon-compte` n'est accessible qu'à un organisateur connecté

## Bloquée par

- Phase 1 (compte organisateur et fiche bar)

---

## Phase 12 : Accès organisateur et page profil unifiée

**User stories** : US-28, US-29, US-30, US-31, US-32, US-33

### Ce qu'on livre

La page d'accueil propose un bouton fantôme « Connexion organisateur » en haut à droite ; une fois connecté, l'organisateur voit à la place une icône de profil, sur toutes les pages. Cette icône mène à une nouvelle page `/mon-profil` qui regroupe la fiche bar (photo, nom, adresse), l'email, le mot de passe, la déconnexion et la suppression du compte. `/mon-bar` et `/mon-compte` redirigent vers `/mon-profil`. L'en-tête organisateur est réduit à « Mes annonces », l'alerte des relances et l'icône. Après connexion ou inscription, l'organisateur arrive sur `/mes-annonces`. Aucune migration de schéma.

### Critères d'acceptation

- [x] Un visiteur non connecté voit un bouton fantôme « Connexion organisateur » en haut à droite de `/`, qui mène à `/connexion`
- [x] Un organisateur connecté voit une icône de profil au même endroit, sur `/` comme dans son espace, qui mène à `/mon-profil`
- [x] `/mon-profil` affiche photo, nom et adresse du bar, email, changement de mot de passe, déconnexion et suppression du compte, avec les mêmes règles qu'en Phase 11
- [x] `/mon-profil` n'est accessible qu'à un organisateur connecté
- [x] `/mon-bar` et `/mon-compte` redirigent vers `/mon-profil`
- [x] L'en-tête organisateur ne contient que « Mes annonces », l'alerte des relances et l'icône de profil
- [x] Après connexion comme après inscription, l'organisateur arrive sur `/mes-annonces`

## Bloquée par

- Phase 11 (fiche bar éditable et gestion du compte)

---

## Phase 13 : Mot de passe oublié par email

**User stories** : US-34, US-35, US-36

### Ce qu'on livre

Depuis la page de connexion, un lien « Mot de passe oublié » mène à `/mot-de-passe-oublie`, où l'organisateur saisit son email. S'il existe un compte, un email Resend lui envoie un lien vers `/reinitialiser-mot-de-passe`, valable 1 h et à usage unique, où il choisit un nouveau mot de passe. Il est ensuite renvoyé vers la connexion avec un message de succès. Nouveau modèle `JetonReinitialisation` (migration).

### Critères d'acceptation

- [x] La page de connexion propose un lien « Mot de passe oublié »
- [x] La demande affiche toujours le même message, que l'email soit connu ou non
- [ ] Un email contenant le lien de réinitialisation est envoyé si le compte existe
- [ ] Le lien expire au bout d'1 h
- [x] Le lien ne fonctionne qu'une fois ; un lien déjà utilisé, expiré ou remplacé affiche un message clair et propose d'en demander un nouveau
- [ ] Une nouvelle demande invalide le lien précédent
- [x] Le nouveau mot de passe respecte les règles existantes (8 caractères minimum, confirmation identique)
- [x] Après réinitialisation, l'organisateur est renvoyé vers `/connexion` avec un message de succès et peut se connecter avec son nouveau mot de passe
- [x] Seul le hash du jeton est stocké en base ; les jetons sont supprimés avec le compte

## Bloquée par

- Phase 12 (routes et redirections organisateur à jour)

---

## Phase 14 : Emails d'avis de compte

**User stories** : US-37, US-38, US-39

### Ce qu'on livre

L'organisateur reçoit un email de bienvenue à son inscription, un avis quand son mot de passe est changé ou réinitialisé, et un avis envoyé à son ancienne adresse quand l'email du compte est changé. Un échec d'envoi ne bloque jamais l'action.

### Critères d'acceptation

- [ ] L'inscription déclenche un email de bienvenue
- [ ] Un changement de mot de passe depuis `/mon-profil` déclenche un email d'avis
- [ ] Une réinitialisation de mot de passe déclenche le même email d'avis
- [ ] Un changement d'email déclenche un avis envoyé à l'ancienne adresse
- [ ] Si l'envoi échoue, l'action réussit quand même et l'erreur est seulement journalisée

## Bloquée par

- Phase 13 (service d'envoi Resend et gabarits en place)

---

## Phase 15 : Bouton « Retour » sur les pages simples

**User stories** : US-40, US-41, US-42

### Ce qu'on livre

Un lien texte « ← Retour », sous l'en-tête et au-dessus du titre, vers une page parente fixe : connexion → accueil ; inscription, mot de passe oublié et réinitialisation du mot de passe → connexion ; profil → « Mes annonces ». Le retour est immédiat, sans confirmation. L'accueil et « Mes annonces » n'en ont pas.

### Critères d'acceptation

- [ ] `/connexion` affiche « ← Retour » vers `/`
- [ ] `/inscription`, `/mot-de-passe-oublie` et `/reinitialiser-mot-de-passe` affichent « ← Retour » vers `/connexion`
- [ ] `/mon-profil` affiche « ← Retour » vers `/mes-annonces`, sous l'en-tête organisateur
- [ ] La destination est la même quel que soit le chemin d'arrivée (lien direct, favori), sans recours à l'historique du navigateur
- [ ] Le retour est immédiat, sans confirmation ; une saisie non enregistrée est perdue
- [ ] `/` et `/mes-annonces` n'affichent pas de bouton « Retour »

## Bloquée par

- Phase 13 (pages mot de passe oublié et réinitialisation)

---

## Phase 16 : Sortie de la saisie d'une annonce

**User stories** : US-43, US-44, US-45, US-46

### Ce qu'on livre

« ← Retour » sur la nouvelle annonce et la modification d'annonce (→ « Mes annonces »). Pendant la saisie, toute sortie via l'application (Retour, « Mes annonces » ou icône de profil de l'en-tête) est interceptée : sur une nouvelle annonce ou un brouillon modifié, la saisie est enregistrée en brouillon puis une fenêtre l'annonce ; sur une annonce Publiée modifiée, une fenêtre Quitter/Rester avertit de la perte ; sans changement, la sortie est directe. L'organisateur arrive ensuite sur la page demandée. En cas d'échec de l'enregistrement, il reste sur le formulaire et choisit. Une sortie par le navigateur avec des modifications en cours déclenche l'alerte standard du navigateur.

### Critères d'acceptation

- [ ] `/mes-annonces/nouvelle` et `/mes-annonces/[id]` affichent « ← Retour » vers `/mes-annonces`
- [ ] Nouvelle annonce vide ou brouillon rouvert sans changement : Retour, « Mes annonces » et l'icône de profil mènent directement à leur destination, sans brouillon ni fenêtre
- [ ] Nouvelle annonce avec une saisie (date, heure, style, instrument, précision « Autre » ou photo) : la sortie crée un brouillon, même incomplet, photos comprises, visible dans « Mes annonces »
- [ ] Brouillon modifié : la sortie enregistre les changements dans ce brouillon (pas de nouveau brouillon)
- [ ] Après enregistrement, une fenêtre affiche « Annonce enregistrée en brouillon, vous pourrez la reprendre plus tard dans Mes annonces » ; après validation, l'organisateur arrive sur la page demandée (Retour/« Mes annonces » → `/mes-annonces`, icône → `/mon-profil`)
- [ ] Après un clic sur « Enregistrer le brouillon » ou « Enregistrer les modifications », l'état enregistré devient la référence : une sortie immédiate est directe
- [ ] Si l'enregistrement échoue (photo refusée, erreur réseau), l'organisateur reste sur le formulaire ; une fenêtre donne la raison avec « Rester » (par défaut) et « Quitter sans enregistrer » ; rien n'est enregistré partiellement
- [ ] Pendant l'enregistrement, les sorties sont inactives (pas de double brouillon)
- [ ] Annonce Publiée avec des modifications non enregistrées : une fenêtre avertit de leur perte, avec « Quitter » et « Rester » ; l'annonce reste publiée telle quelle
- [ ] Changer uniquement la portée, confirmer ou annuler une date, ou modifier les photos d'une annonce existante ne compte pas comme une modification en cours
- [ ] Avec des modifications en cours, fermer l'onglet ou recharger déclenche l'alerte standard du navigateur, sans enregistrement
- [ ] Les fenêtres respectent DESIGN.md (Walnut Shadow, Warm Cream, un seul bouton plein par fenêtre, sans ombre)

## Bloquée par

- Phase 15 (composant « ← Retour »)

---

## Phase 17 : Déconnexion des autres sessions après changement de mot de passe

**User stories** : aucune (dette de sécurité identifiée lors du cadrage de la Phase 13)

### Ce qu'on livre

Aujourd'hui la session est un JWT contenant uniquement l'identifiant de l'organisateur : un appareil déjà connecté le reste après un changement (Phase 11) ou une réinitialisation (Phase 13) du mot de passe, y compris celui d'un éventuel intrus. On ajoute un champ `motDePasseModifieLe` sur `Organisateur`, mis à jour à chaque changement ou réinitialisation du mot de passe ; le JWT mémorise sa date d'émission, et toute session émise avant `motDePasseModifieLe` est rejetée (retour à `/connexion`). Après un changement depuis `/mon-profil`, la session courante est réémise pour que l'organisateur reste connecté sur l'appareil utilisé.

### Critères d'acceptation

- [ ] Après une réinitialisation du mot de passe, toute session ouverte auparavant est déconnectée à sa prochaine requête vers une page protégée
- [ ] Après un changement de mot de passe depuis `/mon-profil`, les autres sessions sont déconnectées ; la session courante reste active
- [ ] Un organisateur dont le compte a été supprimé est aussi déconnecté (session rejetée si l'organisateur n'existe plus)
- [ ] Les sessions existantes avant le déploiement de la phase ne sont pas déconnectées à tort (champ `null` = aucune invalidation)

## Bloquée par

- Phase 13 (réinitialisation du mot de passe)
