# Plan : App-Jamix — annonces de jams à Lyon

> PRD source : `docs/PRD.md`

## Décisions architecturales

- **Modèles clés** : `Bar` (nom, adresse, photo/logo optionnel), `Organisateur` (compte rattaché à un seul `Bar` jusqu'à la Phase 17, puis à 1 à 10 `Bar` depuis la Phase 18), `Annonce` (style musical, instruments/backline, récurrente ou non, statut Brouillon/Publiée, jusqu'à 2 photos optionnelles), `OccurrenceJam` (date, horaire, statut de confirmation, échéance J-7) — chaque date d'une annonce récurrente est une occurrence indépendante avec son propre statut.
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
- **Emails d'avis (Phase 14)** : envoyés après la réponse (`after()`), une fois l'écriture en base faite ; `envoyerEmail` journalise un échec sans remonter l'erreur, qui ne bloque donc jamais l'action. Les avis de mot de passe sont datés (heure de Paris, affichage seul) et renvoient vers `/mot-de-passe-oublie`, sans jeton créé d'office. L'avis de changement d'email part vers l'ancienne adresse, nouvelle adresse masquée, et seulement si l'email change réellement. `EMAIL_CONTACT` (optionnelle) sert de `Reply-To` à tous les emails de compte.
- **Profil et compte (Phase 11)** : aucune migration de schéma. Le géocodage d'une adresse de bar n'est relancé que si l'adresse change ; un échec remet latitude/longitude à `null` (fiche valide, bar absent de la carte, distance non affichée). Session JWT contenant uniquement l'identifiant de l'organisateur : l'email affiché est toujours relu en base, jamais depuis la session. Toute action sensible (email, mot de passe, suppression) revérifie le mot de passe actuel côté serveur. La suppression de compte efface, en une transaction, les annonces (occurrences en cascade), le bar puis le compte, faute de cascade `Organisateur → Bar → Annonce` dans le schéma ; les photos (bar et annonces) sont retirées du stockage ensuite, sans bloquer la suppression en cas d'échec.
- **Navigation retour (Phases 15 et 16)** : aucune migration de schéma. Un composant unique « ← Retour » (lien texte, destination fixe par page, jamais l'historique du navigateur) placé sous l'en-tête et au-dessus du titre. Sur les formulaires d'annonce, les sorties via l'application (Retour, « Mes annonces » et icône de profil de l'en-tête) passent par une même garde côté client qui compare l'état courant du formulaire à un état de référence (formulaire vide, annonce telle qu'ouverte, puis dernier enregistrement réussi) ; le choix de portée et les actions immédiates (confirmation, annulation d'une date, photos d'une annonce existante) sont exclus de la comparaison. L'enregistrement automatique réutilise l'action d'enregistrement en brouillon existante (même validation, pas d'enregistrement partiel). Sortie par le navigateur : alerte standard `beforeunload` uniquement, sans enregistrement.
- **Plusieurs bars par compte (Phases 18 à 21)** :
  - *Modèle* : `Organisateur` 1–N `Bar` ; on retire `@unique` sur `Bar.organisateurId` et `Organisateur.bar` devient `bars Bar[]`. Contrainte `@@unique([organisateurId, nom, adresse])` en base comme filet ; la détection des doublons se fait côté application avec comparaison normalisée (espaces en début/fin retirés, espaces multiples réduits, casse ignorée), à l'ajout comme à la modification. Nom et adresse sont stockés tels que saisis, débarrassés des espaces superflus. Limite de 10 bars vérifiée côté serveur. Migration sans perte : les données existantes sont déjà conformes.
  - *Date de publication* : nouveau champ `Annonce.publieeLe DateTime?`, écrit une seule fois au passage Brouillon → Publiée, en même temps que le calcul J-7 (Phase 6). Ajouté par la migration de la Phase 18 ; les annonces déjà publiées sont remplies avec `createdAt`.
  - *Autorisation* : toute action sur un bar ou une annonce vérifie que `bar.organisateurId` est l'organisateur connecté. `recupererBarDeLOrganisateurConnecte` (`lib/organisateur.ts`) est remplacée par une lecture des bars du compte et une vérification de propriété par `barId`.
  - *Bar d'une annonce* : `Annonce.barId` reste non nullable ; le bar est exigé dès l'enregistrement en brouillon. `barId` est modifiable tant que l'annonce est `BROUILLON` et refusé côté serveur une fois `PUBLIEE`. Dans la garde de sortie (`lib/garde-sortie.ts`), le bar est exclu de la comparaison sur une nouvelle annonce et inclus sur un brouillon ; une sortie sans bar choisi est un échec d'enregistrement (fenêtre Rester / Quitter sans enregistrer).
  - *Reprise* : la dernière annonce d'un bar est l'annonce `PUBLIEE` au `publieeLe` le plus récent, quelles que soient ses dates (passées ou annulées comprises). Les photos reprises ne sont jamais partagées entre deux annonces (`del()` casserait l'autre) : le formulaire transmet l'URL source, et à l'enregistrement le serveur vérifie qu'elle appartient à une annonce d'un des bars de l'organisateur, puis la duplique avec `copy()` de `@vercel/blob` vers un nouveau `annonces/<uuid>.webp`. Un échec de copie est un échec d'enregistrement, sans enregistrement partiel.
  - *Routes* : aucune nouvelle route. Les bars se gèrent sur `/mon-profil` (liste compacte, un bar déplié à la fois) ; le filtre par bar est un état client non persisté de `/mes-annonces`.
  - *Suppression d'un bar* : en une transaction, les annonces (occurrences en cascade) puis le bar ; les photos (bar et annonces) sont retirées du stockage ensuite, sans bloquer, sur le modèle de la suppression de compte. La suppression de compte efface tous les bars du compte.
  - *Application du schéma (Phase 18)* : `prisma db push` (pas de dossier de migrations), puis `node scripts/remplir-publiee-le.mjs` (idempotent) pour remplir `publieeLe = createdAt` sur les annonces déjà publiées.
  - *Verrou de statut (Phase 18)* : une annonce Publiée ne peut ni repasser en Brouillon ni être republiée côté serveur (seule l'action « modifier » est acceptée), ce qui empêcherait sinon de contourner le bar figé. Un `barId` différent envoyé pour une annonce Publiée est refusé avec « Le bar d'une annonce publiée ne peut pas être changé. ».
  - *Géocodage en échec (Phase 18)* : à l'ajout et à la modification d'un bar, un message prévient que l'adresse est introuvable et que le bar n'apparaîtra pas sur la carte ; la ligne compacte d'un bar sans coordonnées porte en permanence la mention « Absent de la carte ».

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

- [x] L'inscription déclenche un email de bienvenue
- [x] Un changement de mot de passe depuis `/mon-profil` déclenche un email d'avis
- [x] Une réinitialisation de mot de passe déclenche le même email d'avis
- [x] Un changement d'email déclenche un avis envoyé à l'ancienne adresse
- [x] Si l'envoi échoue, l'action réussit quand même et l'erreur est seulement journalisée

## Bloquée par

- Phase 13 (service d'envoi Resend et gabarits en place)

---

## Phase 15 : Bouton « Retour » sur les pages simples

**User stories** : US-40, US-41, US-42

### Ce qu'on livre

Un lien texte « ← Retour », sous l'en-tête et au-dessus du titre, vers une page parente fixe : connexion → accueil ; inscription, mot de passe oublié et réinitialisation du mot de passe → connexion ; profil → « Mes annonces ». Le retour est immédiat, sans confirmation. L'accueil et « Mes annonces » n'en ont pas.

### Critères d'acceptation

- [x] `/connexion` affiche « ← Retour » vers `/`
- [x] `/inscription`, `/mot-de-passe-oublie` et `/reinitialiser-mot-de-passe` affichent « ← Retour » vers `/connexion`
- [x] `/mon-profil` affiche « ← Retour » vers `/mes-annonces`, sous l'en-tête organisateur
- [x] La destination est la même quel que soit le chemin d'arrivée (lien direct, favori), sans recours à l'historique du navigateur
- [x] Le retour est immédiat, sans confirmation ; une saisie non enregistrée est perdue
- [x] `/` et `/mes-annonces` n'affichent pas de bouton « Retour »

## Bloquée par

- Phase 13 (pages mot de passe oublié et réinitialisation)

---

## Phase 16 : Sortie de la saisie d'une annonce

**User stories** : US-43, US-44, US-45, US-46

### Ce qu'on livre

« ← Retour » sur la nouvelle annonce et la modification d'annonce (→ « Mes annonces »). Pendant la saisie, toute sortie via l'application (Retour, « Mes annonces » ou icône de profil de l'en-tête) est interceptée : sur une nouvelle annonce ou un brouillon modifié, la saisie est enregistrée en brouillon puis une fenêtre l'annonce ; sur une annonce Publiée modifiée, une fenêtre Quitter/Rester avertit de la perte ; sans changement, la sortie est directe. L'organisateur arrive ensuite sur la page demandée. En cas d'échec de l'enregistrement, il reste sur le formulaire et choisit. Une sortie par le navigateur avec des modifications en cours déclenche l'alerte standard du navigateur.

### Critères d'acceptation

- [x] `/mes-annonces/nouvelle` et `/mes-annonces/[id]` affichent « ← Retour » vers `/mes-annonces`
- [x] Nouvelle annonce vide ou brouillon rouvert sans changement : Retour, « Mes annonces » et l'icône de profil mènent directement à leur destination, sans brouillon ni fenêtre
- [x] Nouvelle annonce avec une saisie (date, heure, style, instrument, précision « Autre » ou photo) : la sortie crée un brouillon, même incomplet, photos comprises, visible dans « Mes annonces »
- [x] Brouillon modifié : la sortie enregistre les changements dans ce brouillon (pas de nouveau brouillon)
- [x] Après enregistrement, une fenêtre affiche « Annonce enregistrée en brouillon, vous pourrez la reprendre plus tard dans Mes annonces » ; après validation, l'organisateur arrive sur la page demandée (Retour/« Mes annonces » → `/mes-annonces`, icône → `/mon-profil`)
- [x] Après un clic sur « Enregistrer le brouillon » ou « Enregistrer les modifications », l'état enregistré devient la référence : une sortie immédiate est directe
- [x] Si l'enregistrement échoue (photo refusée, erreur réseau), l'organisateur reste sur le formulaire ; une fenêtre donne la raison avec « Rester » (par défaut) et « Quitter sans enregistrer » ; rien n'est enregistré partiellement
- [x] Pendant l'enregistrement, les sorties sont inactives (pas de double brouillon)
- [x] Annonce Publiée avec des modifications non enregistrées : une fenêtre avertit de leur perte, avec « Quitter » et « Rester » ; l'annonce reste publiée telle quelle
- [x] Changer uniquement la portée, confirmer ou annuler une date, ou modifier les photos d'une annonce existante ne compte pas comme une modification en cours
- [x] Avec des modifications en cours, fermer l'onglet ou recharger déclenche l'alerte standard du navigateur, sans enregistrement
- [x] Les fenêtres respectent DESIGN.md (Walnut Shadow, Warm Cream, un seul bouton plein par fenêtre, sans ombre)

## Bloquée par

- Phase 15 (composant « ← Retour »)

---

## Phase 17 : Déconnexion des autres sessions après changement de mot de passe

**User stories** : aucune (dette de sécurité identifiée lors du cadrage de la Phase 13)

### Ce qu'on livre

Aujourd'hui la session est un JWT contenant uniquement l'identifiant de l'organisateur : un appareil déjà connecté le reste après un changement (Phase 11) ou une réinitialisation (Phase 13) du mot de passe, y compris celui d'un éventuel intrus. On ajoute un champ `motDePasseModifieLe` sur `Organisateur`, mis à jour à chaque changement ou réinitialisation du mot de passe ; le JWT mémorise sa date d'émission dans un champ `emisLe` écrit une seule fois à la connexion (pas `iat`, renouvelé par Auth.js à chaque rafraîchissement), et toute session émise avant `motDePasseModifieLe` est rejetée (retour à `/connexion`). La vérification se fait dans le callback `jwt`, donc à chaque appel de `auth()` (proxy, pages, server actions, en-tête de `/`) ; après un changement, une session sans `emisLe` est rejetée. Après un changement depuis `/mon-profil`, la session courante est réémise (`signIn` avec le nouveau mot de passe) pour que l'organisateur reste connecté sur l'appareil utilisé. Ce `signIn` pose un cookie, ce qui fait re-rendre `/mon-profil` par Next dans la même requête : `auth()` y lit encore l'ancien jeton via `headers()`, désormais rejeté. Les rendus de l'espace organisateur (page `/mon-profil` et `recupererBarDeLOrganisateurConnecte`, utilisé par l'en-tête et « Mes annonces ») passent donc par `sessionCourante()` (`auth.ts`), qui lit le cookie via `cookies()`, à jour après l'action, tout en passant par le même callback `jwt`. Le changement d'email ne déconnecte aucune session.

### Critères d'acceptation

- [x] Après une réinitialisation du mot de passe, toute session ouverte auparavant est déconnectée à sa prochaine requête vers une page protégée
- [x] Après un changement de mot de passe depuis `/mon-profil`, les autres sessions sont déconnectées ; la session courante reste active
- [x] Un organisateur dont le compte a été supprimé est aussi déconnecté (session rejetée si l'organisateur n'existe plus)
- [x] Après le changement, `/mon-profil` s'affiche sans erreur avec le message de succès (correctif : la page re-rendue après l'action lisait l'ancien jeton)
- [x] Les sessions existantes avant le déploiement de la phase ne sont pas déconnectées à tort (champ `null` = aucune invalidation)

## Bloquée par

- Phase 13 (réinitialisation du mot de passe)

### Suites à prévoir (hors périmètre de la phase 17)

- Session rejetée pendant une server action (formulaire de `/mon-profil` envoyé depuis un onglet resté ouvert) : aujourd'hui `recupererIdOrganisateurConnecte` lève « Non authentifié. » et Next affiche une page d'erreur. À reprendre : renvoyer une erreur propre au formulaire ou rediriger vers `/connexion`.
- Aucun message n'explique la déconnexion : l'organisateur arrive sur `/connexion` sans savoir pourquoi. À reprendre : un message du type « Votre mot de passe a été modifié, reconnectez-vous » (nécessite de transmettre la raison du rejet, le cookie de session étant déjà effacé).

---

## Phase 18 : Plusieurs bars par compte et choix du bar d'une annonce

**User stories** : US-25, US-30, US-47, US-48, US-49, US-50, US-51, US-52, US-59, US-60, US-55 (nom du bar sur chaque annonce)

### Ce qu'on livre

Un compte peut gérer jusqu'à 10 bars. Sur `/mon-profil`, la section « Mon bar » devient « Mes bars » : une liste compacte (miniature, nom, adresse, « Modifier ») dont un seul bar est déplié à la fois (photo, nom, adresse), et un bouton « Ajouter un bar » qui déplie un formulaire vide. Un compte d'un seul bar voit sa fiche dépliée d'office. Les doublons dans un même compte et un 11e bar sont refusés. Le formulaire d'annonce commence par un champ « Bar », présélectionné s'il n'y en a qu'un, obligatoire dès le brouillon, modifiable en Brouillon et figé une fois Publiée. Chaque annonce de « Mes annonces » affiche le nom de son bar (première ligne de la carte, même avec un seul bar). La suppression de `recupererBarDeLOrganisateurConnecte` impose dès cette phase que « Mes annonces » liste les annonces de tous les bars, que l'alerte de l'en-tête compte les relances de tous les bars et que la suppression du compte efface tous ses bars (critères correspondants des phases 19 et 20 livrés en avance). Migration : relation 1–N `Organisateur` → `Bar`, contrainte `@@unique([organisateurId, nom, adresse])` et champ `Annonce.publieeLe`.

### Critères d'acceptation

- [x] Les comptes existants gardent leur bar et leurs annonces après la migration, sans action de l'organisateur ; les annonces déjà publiées ont un `publieeLe` égal à leur `createdAt`
- [x] `/mon-profil` affiche une section « Mes bars » en liste compacte ; un seul bar est déplié à la fois ; un compte d'un seul bar voit sa fiche dépliée d'office
- [x] « Ajouter un bar » crée un bar (nom, adresse, photo optionnelle), géocodé comme à l'inscription ; en cas d'échec du géocodage, le bar est créé sans apparaître sur la carte
- [x] L'organisateur modifie la photo, le nom et l'adresse de chacun de ses bars, avec les mêmes règles qu'en Phase 11 (re-géocodage si l'adresse change)
- [x] Un bar de même nom et même adresse qu'un autre bar du compte (casse et espaces en trop ignorés) est refusé avec « Ce bar existe déjà dans votre compte », à l'ajout comme à la modification ; deux comptes différents peuvent avoir des bars identiques
- [x] À 10 bars, « Ajouter un bar » est inactif avec « Limite de 10 bars atteinte » ; un 11e bar est aussi refusé côté serveur
- [x] Le formulaire d'annonce commence par un champ « Bar » : présélectionné s'il n'y a qu'un bar, sans choix par défaut sinon
- [x] Le bar est obligatoire dès l'enregistrement en brouillon ; une sortie sans bar choisi affiche la fenêtre d'échec « Choisissez un bar pour enregistrer le brouillon » (Rester / Quitter sans enregistrer)
- [x] Sur une nouvelle annonce, choisir un bar ne compte pas à lui seul comme une saisie ; sur un brouillon rouvert, changer de bar compte comme une modification
- [x] Le bar d'un brouillon est modifiable ; celui d'une annonce Publiée est affiché sans pouvoir être changé, et un changement est refusé côté serveur
- [x] Le passage en Publiée écrit `publieeLe` une seule fois
- [x] Toute action sur un bar ou une annonce d'un autre compte est refusée côté serveur
- [x] Chaque annonce de « Mes annonces » affiche le nom de son bar
- [x] Côté musicien, chaque annonce s'affiche à l'adresse de son bar, sans autre changement
- [x] Une annonce Publiée ne peut ni repasser en Brouillon ni être republiée côté serveur
- [x] Un bar dont l'adresse n'a pas pu être géocodée est signalé à l'ajout et à la modification, et porte la mention « Absent de la carte » dans « Mes bars »

## Bloquée par

- Phase 12 (page profil unifiée) et Phase 16 (garde de sortie du formulaire d'annonce)

---

## Phase 19 : Filtre par bar et relances de tous les bars

**User stories** : US-55 (filtre), US-56

### Ce qu'on livre

Dès 2 bars, « Mes annonces » propose un filtre « Tous » / un bouton par bar, qui restreint la liste aux annonces (brouillons compris) du bar choisi. L'alerte des relances de l'en-tête compte les dates en attente de confirmation de tous les bars du compte ; chaque relance s'affiche sur l'annonce, qui nomme son bar.

### Critères d'acceptation

- [x] Avec un seul bar, aucun filtre n'est affiché
- [x] Dès 2 bars, un filtre « Tous » / un bouton par bar s'affiche au-dessus de la liste : boutons fantômes compacts, défilement horizontal sur mobile, bouton actif souligné, sans liste déroulante (DESIGN.md)
- [x] Choisir un bar restreint la liste à ses annonces, brouillons compris ; « Tous » affiche toutes les annonces
- [x] Le filtre revient sur « Tous » à chaque visite de « Mes annonces » et n'influence pas le formulaire de nouvelle annonce
- [x] L'alerte de l'en-tête compte les relances de tous les bars du compte
- [x] Chaque relance s'affiche sur l'annonce, qui porte le nom de son bar

## Bloquée par

- Phase 18 (plusieurs bars et nom du bar sur chaque annonce)

---

## Phase 20 : Suppression d'un bar

**User stories** : US-57, US-58, US-27 (suppression du compte avec plusieurs bars)

### Ce qu'on livre

Dans la fiche dépliée d'un bar, « Supprimer ce bar » ouvre une fenêtre qui annonce ce qui sera supprimé et demande de saisir le nom du bar. La suppression est définitive et emporte les annonces du bar, leurs occurrences et toutes les photos. Le dernier bar d'un compte ne peut pas être supprimé. La suppression du compte emporte tous ses bars.

### Décisions de cadrage

- **N et M** : N compte toutes les annonces du bar, brouillons compris. M compte les occurrences des annonces `PUBLIEE` dont la date est aujourd'hui ou plus tard (UTC, `aujourdHuiUTC()`), **annulées comprises** (visibles côté musicien, elles vont disparaître). N et M sont calculés au chargement de `/mon-profil` (une requête, 10 bars maximum) et transmis à `MesBars`.
- **Accords du message** : N = 0 → « Ce bar sera supprimé définitivement. » ; singulier → « Ce bar et son annonce (dont 1 date à venir publiée) seront supprimés définitivement. » ; M = 0 → sans parenthèse **et sans** « Les musiciens ne les verront plus. » (rien n'est visible côté musicien).
- **Fenêtre dédiée** (`FenetreSuppressionBar`, pas `FenetreSortie`) : même aspect (Walnut Shadow, bordure Cork Border, rayon 12px, sans ombre). Focus d'office dans le champ du nom ; Échap et clic hors fenêtre = « Annuler » (jamais la suppression) ; pendant la suppression, boutons inactifs et Échap sans effet ; une erreur serveur s'affiche dans la fenêtre, qui reste ouverte. `FenetreSortie` reste inchangée.
- **Placement** : « Supprimer ce bar » est un bouton fantôme à droite, sur la même ligne qu'« Enregistrer » (formulaire de la fiche dépliée, `justify-between`). Dernier bar : « Enregistrer » seul sur sa ligne, la mention « Un compte doit garder au moins un bar ; pour tout supprimer, supprimez votre compte » juste en dessous (12px, majuscules, Driftwood).
- **Après la suppression** : la fenêtre se ferme, l'organisateur reste sur `/mon-profil`, message « Bar supprimé. » à l'emplacement de « Bar ajouté. ». Toutes les fiches sont repliées, sauf s'il ne reste qu'un bar : sa fiche est dépliée d'office (la règle s'applique aussi après suppression, pas seulement au chargement).
- **Serveur** : action `supprimerBar(barId, nomSaisi)` dans `app/mon-profil/actions.ts`. Propriété vérifiée (`recupererBarDuCompte`), nom saisi revérifié (même comparaison normalisée), dernier bar refusé. Transaction : annonces du bar (occurrences en cascade) puis bar ; photos du bar et des annonces retirées ensuite avec `del`, sans bloquer. `revalidatePath` sur `/`, `/mes-annonces`, `/mon-profil`. Aucun email.
- **Logique pure** dans `lib/bars.ts` avec tests Vitest : construction du message (N/M, accords, M = 0), comparaison du nom saisi, photos d'un bar (réutilise `urlsPhotosDuCompte`).
- **Texte de « Supprimer mon compte »** : « Vos bars, vos annonces, leurs dates et leurs photos seront supprimés définitivement. » (au lieu de « Votre bar… »).

### Critères d'acceptation

- [x] « Supprimer ce bar » ouvre une fenêtre : « Ce bar et ses N annonces (dont M dates à venir publiées) seront supprimés définitivement. Les musiciens ne les verront plus. », ou « Ce bar sera supprimé définitivement. » s'il n'a aucune annonce
- [x] « Supprimer définitivement » reste inactif tant que le nom saisi ne correspond pas au nom du bar (casse et espaces en trop ignorés) ; aucun mot de passe n'est demandé
- [x] La fenêtre respecte DESIGN.md (Walnut Shadow, Warm Cream, un seul bouton plein Brass Copper pour « Supprimer définitivement », « Annuler » en fantôme, sans ombre)
- [ ] La suppression retire, en une transaction, les annonces du bar (occurrences en cascade) puis le bar ; les photos du bar et des annonces sont ensuite retirées du stockage, sans bloquer en cas d'échec
- [x] Après la suppression, aucune annonce du bar n'est visible, ni côté musicien (liste et carte) ni dans « Mes annonces »
- [x] Aucun email n'est envoyé
- [x] Le dernier bar d'un compte n'a pas de bouton de suppression, mais la mention « Un compte doit garder au moins un bar ; pour tout supprimer, supprimez votre compte » ; une suppression du dernier bar est aussi refusée côté serveur
- [x] La suppression du compte efface tous ses bars, leurs annonces, leurs occurrences et leurs photos

## Bloquée par

- Phase 18 (plusieurs bars par compte)

---

## Phase 21 : Reprise de la dernière annonce du bar

**User stories** : US-53, US-54

### Ce qu'on livre

Sur une nouvelle annonce, dès qu'un bar est choisi et qu'il a au moins une annonce publiée, un bouton fantôme « Reprendre la dernière annonce de ce bar » remplit l'horaire, les styles, les instruments, les précisions « Autre » et les photos de son annonce publiée le plus récemment. Les dates restent vides. Les photos reprises sont dupliquées à l'enregistrement.

### Décisions de cadrage

- **Horaire repris** : celui de la première occurrence (date la plus ancienne) de l'annonce source, annulées comprises — même règle que la page de modification (`premiereOccurrence`). `heureFin` absente → champ vide.
- **Chargement** : préchargé au rendu de `/mes-annonces/nouvelle`, une requête pour les bars du compte (10 max) ; le formulaire reçoit une table `barId → valeurs reprises` (styles, styleAutre, instruments, instrumentAutre, photoUrl1/2, heureDebut/heureFin, publieeLe), limitée aux bars ayant une annonce `PUBLIEE`. Bouton masqué si le bar n'est pas dans la table. Pas de server action au clic. Sélection de la dernière annonce (tri `publieeLe`, brouillons ignorés, première occurrence) en fonction pure dans `lib/annonces.ts`, testée avec Vitest.
- **Photos reprises** : par emplacement, miniature de la photo source (carrée, sans ombre) + champ caché `photoReprise1` / `photoReprise2` (URL source) + liens texte « Remplacer » (ouvre le sélecteur de fichier) et « Retirer » (vide l'emplacement). Choisir un fichier remplace la photo reprise de cet emplacement (URL cachée retirée).
- **Écrasement total** : la reprise écrase horaire, styles, instruments, précisions « Autre » et photos, y compris par du vide (un emplacement sans photo dans la source est vidé, même si un fichier y était choisi). Les dates ne sont jamais touchées.
- **Garde de sortie** : `photoReprise1/2` sont des chaînes du `FormData`, donc comparées par `instantane()` ; la reprise compte comme une saisie sans code dédié.
- **Bouton** : juste sous le champ « Bar », bouton fantôme (bordure Warm Cream, rayon 22.5px, 12px majuscules, 500). Après le clic, ligne 12px majuscules Driftwood sous le bouton : « Repris de l'annonce publiée le [publieeLe] — dates à ajouter » ; elle disparaît au changement de bar. Le bouton reste actif : recliquer réécrase.
- **Formulaire** : les champs repris sont non contrôlés (`defaultValue`) ; la reprise les remonte via une `key` incrémentée avec les nouvelles valeurs. L'état des dates n'est pas touché. Changer de bar après reprise ne modifie pas les champs.
- **Serveur** (`creerAnnonce` seulement) : chaque URL reprise doit être exactement `photoUrl1` ou `photoUrl2` d'une annonce (tout statut) dont le bar appartient au compte connecté, sinon refus « Photo reprise introuvable. ». Copie par `copy(url, "annonces/<uuid>.webp", { access: "public", contentType: "image/webp" })` de `@vercel/blob`. Les copies rejoignent les uploads : en cas d'échec d'une copie ou de la transaction, tout est retiré du stockage, erreur « La photo reprise n'a pas pu être copiée. », sans enregistrement partiel.

### Critères d'acceptation

- [x] Le bouton n'apparaît que sur une nouvelle annonce, avec un bar choisi qui a au moins une annonce publiée
- [x] La dernière annonce est celle au `publieeLe` le plus récent pour ce bar, même si toutes ses dates sont passées ou annulées ; les brouillons sont ignorés
- [x] Le bouton remplit l'horaire, les styles, les instruments, les précisions « Autre » et les photos, en écrasant ces champs sans confirmation ; les dates ne sont jamais touchées
- [x] Changer ensuite de bar ne modifie pas les champs repris ; le bouton suit le bar choisi (dernière annonce du nouveau bar, ou masqué)
- [x] La reprise compte comme une saisie : quitter ensuite le formulaire crée un brouillon (Phase 16)
- [x] À l'enregistrement (brouillon ou publication), chaque photo reprise est dupliquée dans un nouveau fichier, après vérification côté serveur qu'elle appartient à une annonce d'un des bars de l'organisateur ; supprimer ou modifier l'annonce source ne touche jamais les photos de la nouvelle
- [x] Si la copie d'une photo échoue, l'enregistrement échoue sans enregistrement partiel (fenêtre d'échec de la Phase 16 en cas de sortie)
- [x] Une URL de photo qui n'appartient pas à l'organisateur est refusée

## Bloquée par

- Phase 18 (choix du bar et champ `publieeLe`)

Les phases 19, 20 et 21 sont indépendantes entre elles.
