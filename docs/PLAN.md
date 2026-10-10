# Plan : App-Jammix — annonces de jams à Lyon

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
- **Bandeau commun « Jammix » (Phase 22)** : aucune migration de schéma. Un composant unique de bandeau, rendu par chaque page (pas dans `app/layout.tsx`) pour rester à l'intérieur de `FournisseurGardeSortie` sur les formulaires d'annonce ; il remplace `HeaderPublic` et la ligne haute de `HeaderOrganisateur`. Bandeau `position: sticky` en haut, fond Walnut Shadow (Brass Copper depuis la Phase 23), filet inférieur 1px Gold elegance (nouvel usage structurel, ajouté à DESIGN.md dans la phase). « Jammix » est un `LienGarde` vers `/` sans paramètre : la date et la vue de l'accueil vivant dans l'URL (`?date=&vue=`), ce lien suffit à revenir à aujourd'hui en vue liste, en navigation client. La partie droite est choisie par une prop de variante (accueil / organisateur / parcours de connexion) et la session. « Mes annonces » et l'alerte des relances restent dans `HeaderOrganisateur`, affiché sous le bandeau (remplacés par la ligne « À confirmer » en Phase 25).
- **Bandeau cuivré (Phase 23)** : aucune migration de schéma. Seul le fond du composant de bandeau commun change (Walnut Shadow → Brass Copper). Le filet Gold elegance, la hauteur, le sticky et le contenu restent inchangés. DESIGN.md autorise le Brass Copper comme fond du bandeau uniquement.
- **Accès aux annonces (Phases 24 et 25)** : aucune migration de schéma. Le bouton « Accéder à mes annonces » de l'accueil est rendu côté serveur selon `sessionCourante()`, comme la partie droite de `components/bandeau.tsx`. `HeaderOrganisateur` (`components/header-organisateur.tsx`) est réduit à une ligne « À confirmer » ; le nombre vient de `compterRelancesActives` (`lib/relances.ts`), déjà utilisé pour l'alerte. Il reçoit une variante distincte pour « Mes annonces » (ligne non cliquable), les formulaires d'annonce et le profil (lien vers `/mes-annonces`) ; aujourd'hui les formulaires passent `page="mes-annonces"`. Sur les formulaires, le lien passe par `LienGarde` (`components/garde-sortie.tsx`) pour suivre la garde de sortie.
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
- **Filtre par bar sur plusieurs lignes (Phase 26)** : aucune migration de schéma. Seul le rendu de `app/mes-annonces/filtre-annonces.tsx` change : conteneur `flex-wrap` au lieu du défilement horizontal, bouton actif à fond Warm Cream léger transparent (~15 %) au lieu du soulignement, nom tronqué (`truncate`) dans un bouton limité à la largeur de la colonne. `aria-pressed` conservé. DESIGN.md consigne l'exception de remplissage pour ce seul filtre.
- **Sections déroulables du profil (Phase 27)** : aucune migration de schéma ni nouvelle route. Un composant client unique de section déroulable (`components/section-deroulable.tsx`) : toute la ligne de titre est un bouton (`aria-expanded`, `aria-controls`) avec un chevron `ChevronDown` de `lucide-react` qui pivote quand la section est déroulée, et un sous-titre optionnel toujours visible (email actuel). Aucun état mémorisé : « Mes bars » ouverte et les autres repliées à chaque visite. Le contenu replié reste monté mais masqué (`hidden`), si bien que la saisie et l'état interne de « Mes bars » sont conservés, y compris au re-rendu de `/mon-profil` après un changement de mot de passe (Phase 17). Les titres internes de `MesBars`, `FormulaireEmail`, `FormulaireMotDePasse` et `SuppressionCompte` passent dans la section ; `SuppressionCompte` perd son état d'ouverture, son bouton intermédiaire et « Annuler ».
- **Libellé des instruments et titres du formulaire (Phase 28)** : aucune migration de schéma. Le titre d'un brouillon devient « Modifier le brouillon » (« Compléter le brouillon » mesurait 325px en 24px, pour une colonne de 312px à 360px). Seuls les libellés changent (« Instruments disponibles » dans le formulaire, « Instruments : » dans `app/carte-annonce.tsx`) ; la valeur stockée `Annonce.instruments` et la liste `INSTRUMENTS_BACKLINE` (`lib/annonce-constantes.ts`) restent inchangées.
- **Description d'une annonce (Phase 29)** : nouveau champ `Annonce.description String?` (texte brut, 500 caractères maximum, validé côté serveur dans le schéma zod de l'annonce, brouillon comme publication ; chaîne vide → `null`). Appliqué par `prisma db push` (pas de dossier de migrations) ; les annonces existantes restent à `null`, aucun script. Champ de l'annonce, donc commun à toutes ses occurrences : la portée ciblée/globale ne concerne que l'horaire (`synchroniserOccurrences`, `app/mes-annonces/actions.ts`). Ajouté à `ValeursReprises` / `valeursReprisesParBar` (`lib/annonces.ts`). Garde de sortie : le `<textarea name="description">` est lu par `instantane()` via le `FormData`, sans code dédié. Le navigateur envoie les retours à la ligne en `\r\n` alors que `maxLength` les compte pour 1 : le schéma les normalise en `\n` et retire les espaces de début et de fin avant de compter. Côté musicien, un seul composant de carte (`app/carte-annonce.tsx`) avec une prop `mode` : `"liste"` (extrait `line-clamp-3`, nom du bar en lien étendu à toute la carte par un pseudo-élément, « Itinéraire » au-dessus en `relative z-10`) et `"fiche"` (marqueur de la carte : description complète, sans lien). Description en `whitespace-pre-line`, 15px, 400, casse mixte, Warm Cream. Dans « Mes annonces », extrait `line-clamp-2` en 12px Driftwood.
- **Page d'une jam (Phase 29)** : nouvelle route publique `/jams/[id]`, une page par occurrence (hors `matcher` du proxy). Lecture par `recupererOccurrencePubliee` (`lib/annonces.ts`) : annonce `PUBLIEE`, date ≥ `aujourdHuiUTC()`, annulées comprises ; sinon `notFound()` et `app/jams/[id]/not-found.tsx` (« Cette jam n'est plus disponible », code 404). « ← Retour » vers `/?date=<date de l'occurrence>`. Distance calculée côté client par le hook `usePositionMusicien` (`lib/position-musicien.ts`), extrait de `app/consultation-musicien.tsx` et partagé ; jamais de position dans l'URL. Variante `"jam"` du bandeau (droite : icône de profil si connecté, sinon vide).
- **« Tous les styles » (Phase 30)** : aucune migration de schéma. Valeur `"Tous les styles"` ajoutée en tête de `STYLES_MUSICAUX` (`lib/annonce-constantes.ts`) et stockée dans `Annonce.styles`. Exclusivité vérifiée côté serveur (refine zod : « Tous les styles » seule, sans autre style ni précision « Autre ») et côté client (autres cases décochées et désactivées). Compte pour le `min(1)` de la publication. Affichée « Tous styles » côté musicien et dans « Mes annonces » via `libelleStyles` (`lib/annonce-constantes.ts`). Conversion des données existantes : `node scripts/convertir-tous-styles.mjs` (idempotent), qui passe toute annonce (brouillons compris) cochant les 11 styles nommés à `["Tous les styles"]`, « Autre » et sa précision retirés.
- **Pied de page, CGU et Contact (Phases 31 et 32)** :
  - *Routes* : `/cgu` et `/contact`, publiques, hors du `matcher` de `proxy.ts`. « ← Retour » vers `/` sur les deux.
  - *Pied de page* : un composant unique `components/pied-de-page.tsx`, rendu par chaque page à la suite du contenu, comme `components/bandeau.tsx` (pas dans `app/layout.tsx`), pour rester dans `FournisseurGardeSortie` : sur les formulaires d'annonce, ses liens sont des `LienGarde` (`components/garde-sortie.tsx`). Version lue depuis `package.json` au build ; année calculée à l'affichage. DESIGN.md autorise le pied de page (fond Walnut Shadow, filet pointillé Cork Border, texte Warm Cream atténué 12px).
  - *Email de contact* : seule exception à la règle « email = messages de compte ». Envoi par `envoyerEmail` (`lib/email.ts`), étendu d'un `replyTo` optionnel qui remplace `adresseContact()` ; destinataire `adresseContact()` (`EMAIL_CONTACT`), `replyTo` = email saisi. Sans `EMAIL_CONTACT`, l'envoi est refusé avec l'erreur générique. Contrairement aux avis de compte, l'envoi est attendu (pas d'`after()`) pour afficher le succès ou l'échec. Jamais d'accusé de réception à l'expéditeur.
  - *Limite d'envois* : nouveau modèle `EnvoiContact` (`id`, `empreinteIp` = HMAC-SHA-256 de l'IP avec `AUTH_SECRET`, jamais l'IP brute ni un hash simple réversible par force brute, `creeLe`), appliqué par `prisma db push`. Seuls les envois réussis sont enregistrés ; au plus 5 envois par empreinte sur une heure glissante ; les lignes de plus de 24 h sont purgées à chaque envoi. Champ piège invisible : rempli, il renvoie un faux succès sans rien envoyer ni enregistrer.
  - *Validation* : schéma zod `lib/validation/contact.ts`, sur le modèle de `lib/validation/inscription.ts` (nom 1–100, email valide, message 10–2000 après normalisation `\r\n` → `\n` et trim, comme la description de la Phase 29).
  - *Anonymat* : aucun nom de personne dans `/cgu` ni ailleurs ; l'éditeur est « un particulier non professionnel », joignable via `/contact`.
- **Nom et prénom de l'organisateur (Phase 35)** : nouveau champ `Organisateur.nom String?` (nullable : les comptes existants restent intacts, sans script), appliqué par `prisma db push` (pas de dossier de migrations). Champ `nomComplet` ajouté aux schémas client et serveur de `lib/validation/inscription.ts` (espaces de début et de fin retirés, 1 à 80 caractères), réutilisé par le formulaire et l'action d'inscription. Au profil, une section déroulable sur le modèle de `formulaire-email.tsx`, avec son action dans `app/mon-profil/actions.ts` ; le nom vide n'y est accepté que pour un compte sans nom. Mention de la donnée dans `/cgu`. La convention « éditeur anonyme » ne concerne pas les organisateurs. L'affichage sur les cartes est hors périmètre.

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
- [x] Dès 2 bars, un filtre « Tous » / un bouton par bar s'affiche au-dessus de la liste : boutons fantômes compacts, défilement horizontal sur mobile, bouton actif souligné, sans liste déroulante (DESIGN.md) — remplacé par la Phase 26 : passage à la ligne et fond crème léger sur le bouton actif
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

---

## Phase 22 : Bandeau d'en-tête commun « Jammix »

**User stories** : US-61, US-62, US-63, US-64, US-65, US-66, US-67, US-31 (modifiée)

### Ce qu'on livre

Toutes les pages affichent un même bandeau fixé en haut, fond Walnut Shadow et filet doré fin sur toute la largeur. À gauche, « ⌂ Jammix » ramène à l'accueil à la date du jour, en vue liste, sans rechargement complet. À droite : l'icône de profil si l'organisateur est connecté (toutes les pages), sinon « Connexion organisateur » sur l'accueil uniquement ; rien sur les pages du parcours de connexion. Dans l'espace organisateur, « Mes annonces » et l'alerte des relances passent juste sous le bandeau. Sur les formulaires d'annonce, « Jammix » est une sortie gardée comme les autres (Phase 16). DESIGN.md est complété pour autoriser le filet doré structurel.

### Critères d'acceptation

- [x] Le bandeau s'affiche sur `/`, `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe`, `/mes-annonces`, `/mes-annonces/nouvelle`, `/mes-annonces/[id]` et `/mon-profil`
- [x] Le bandeau reste visible en haut de l'écran après défilement jusqu'en bas de page, sans masquer le contenu
- [x] Le bandeau a le fond Walnut Shadow et un filet inférieur doré fin sur toute la largeur, sans ombre ni fond plein doré
- [x] « Jammix » (icône de maison + libellé) est à gauche du bandeau et mène à `/` à la date du jour en vue liste, depuis toutes les pages, sans rechargement complet
- [x] Sur `/` avec une autre date ou la vue carte, un clic sur « Jammix » remet la date à aujourd'hui et la vue en liste ; « Jammix » est signalé comme page active sur `/`
- [x] Organisateur connecté : icône de profil à droite du bandeau sur toutes les pages, y compris `/` et les pages de connexion
- [x] Visiteur non connecté : « Connexion organisateur » à droite du bandeau sur `/` uniquement ; droite vide sur `/connexion`, `/inscription`, `/mot-de-passe-oublie` et `/reinitialiser-mot-de-passe`
- [x] Dans l'espace organisateur, « Mes annonces » et l'alerte des relances s'affichent sous le bandeau, plus dans le bandeau
- [x] Le bouton « ← Retour » reste sous le bandeau, avec les mêmes destinations (Phase 15)
- [x] Sur une nouvelle annonce ou un brouillon modifié, « Jammix » enregistre en brouillon puis affiche la fenêtre ; après validation, l'organisateur arrive sur `/`
- [x] Sur une annonce Publiée modifiée, « Jammix » affiche la fenêtre Quitter/Rester ; sans changement, la sortie est directe ; pendant l'enregistrement, « Jammix » est inactif
- [x] DESIGN.md autorise le filet doré du bandeau comme seul usage structurel du Gold elegance
- [x] Le bandeau tient sur mobile (360px) sans débordement horizontal

## Bloquée par

- Phase 16 (garde de sortie) et Phase 12 (icône de profil et en-tête organisateur)

---

## Phase 23 : Bandeau cuivré

**User stories** : US-68

### Ce qu'on livre

Le bandeau commun « Jammix » prend le fond Brass Copper des boutons pleins, pour se détacher du corps des pages, qui garde son fond Walnut Shadow. Le filet doré, la hauteur, le comportement sticky et le contenu du bandeau (« Jammix », icône de profil, « Connexion organisateur », en Warm Cream) ne changent pas. DESIGN.md est complété pour autoriser ce seul usage du Brass Copper comme surface. Aucune migration de schéma.

### Critères d'acceptation

- [x] Le bandeau a un fond Brass Copper opaque sur `/`, les 4 pages du parcours de connexion, `/mes-annonces`, `/mes-annonces/nouvelle`, `/mes-annonces/[id]` et `/mon-profil`
- [x] Le corps des pages garde le fond Walnut Shadow, y compris la zone « Mes annonces » / relances sous le bandeau
- [x] Le filet inférieur 1px Gold elegance reste en place, sans ombre
- [x] « Jammix », l'icône de profil (active ou non) et « Connexion organisateur » restent en Warm Cream et lisibles
- [x] Pendant le défilement, le contenu ne transparaît pas sous le bandeau
- [x] DESIGN.md autorise le Brass Copper comme fond du bandeau, seul usage de surface en dehors du bouton plein
- [x] Le bandeau tient sur mobile (360px) sans débordement

## Bloquée par

- Phase 22 (bandeau commun « Jammix »)

---

## Phase 24 : Bouton « Accéder à mes annonces » sur l'accueil

**User stories** : US-69, US-70

### Ce qu'on livre

Sur l'accueil, un organisateur connecté voit un bouton plein « Accéder à mes annonces », sur toute la largeur de la colonne, entre le sous-titre et le champ « Date ». Il mène à `/mes-annonces` en un clic. Un visiteur non connecté ne le voit pas. Aucune migration de schéma.

### Critères d'acceptation

- [x] Organisateur connecté : bouton plein Brass Copper, texte Warm Cream, rayon 36px, pleine largeur de colonne, entre le sous-titre et « Date », sur `/`
- [x] Un clic mène à `/mes-annonces`
- [x] Visiteur non connecté : aucun bouton
- [x] Seul bouton d'action plein de l'accueil (le toggle Liste/Carte actif reste plein) ; tient à 360px sans débordement

## Bloquée par

- Phase 23 (bandeau cuivré)

---

## Phase 25 : Ligne « À confirmer » et titre « Mes annonces » sur une ligne

**User stories** : US-31, US-66, US-67 (modifiées), US-71, US-72, US-73, US-74

### Ce qu'on livre

Dans l'espace organisateur, la ligne sous le bandeau ne contient plus que « 🔔 À CONFIRMER » en gras suivi du nombre de jams à confirmer de tous les bars, affiché même à 0, puis un trait pointillé. Elle mène à « Mes annonces » depuis le profil et les formulaires d'annonce, où elle suit la garde de sortie. Le titre « Mes annonces » est réduit pour tenir sur une ligne avec « Nouvelle » sur mobile. DESIGN.md consigne l'exception de graisse. Aucune migration de schéma.

### Décisions de cadrage

- **Cloche** : emoji « 🔔 » (choix validé, plutôt qu'une icône lucide), masqué aux lecteurs d'écran ; chiffre seul après « · », étiquette accessible « N jams à confirmer » / « Aucune jam à confirmer ».
- **Rendu** : identique sur les 4 pages (Warm Cream). Sur le profil et les formulaires, la ligne est un `LienGarde` souligné au survol et au focus ; seul le texte est cliquable.
- **Trait** : bordure pointillée du bloc de la ligne, 12px sous le texte ; l'écart de 32px avec la suite de la page est inchangé.
- **Variante** : `HeaderOrganisateur` prend `page: "mes-annonces" | "formulaire" | "mon-profil"` ; les formulaires passent `"formulaire"`.
- **Dates passées** : `compterRelancesActives` et `messageRelance` ignorent les occurrences antérieures à aujourd'hui (UTC, J0 compris) ; sans cela, une jam passée non confirmée resterait comptée indéfiniment. La requête de l'en-tête filtre aussi `date >= aujourdHuiUTC()` et les annonces `PUBLIEE`.

### Critères d'acceptation

- [x] Sous le bandeau de `/mes-annonces`, `/mes-annonces/nouvelle`, `/mes-annonces/[id]` et `/mon-profil` : une seule ligne « 🔔 À CONFIRMER · N » (cloche, libellé en gras 700, Warm Cream), plus de lien « Mes annonces » ni de ligne « ⚠ … en attente »
- [x] N = jams en attente de confirmation de tous les bars du compte, dates passées exclues ; affiché à 0
- [x] Lien vers `/mes-annonces` sur le profil et les formulaires, non cliquable sur `/mes-annonces`
- [x] Sur les formulaires, « À confirmer » suit la garde de sortie (brouillon et fenêtre, avertissement si Publiée, sortie directe sans changement)
- [x] Trait 1px pointillé Cork Border sur toute la largeur de la colonne sous la ligne
- [x] Titre « Mes annonces » en 24px, sur une ligne avec « Nouvelle » (inchangé) à 360px
- [x] DESIGN.md consigne l'exception gras pour ce seul libellé

## Bloquée par

- Phase 22 (bandeau commun et `HeaderOrganisateur` sous le bandeau)

Les phases 24 et 25 sont indépendantes entre elles.

---

## Phase 26 : Filtre par bar sur plusieurs lignes

**User stories** : US-75, US-76, US-77

### Ce qu'on livre

Dans « Mes annonces », dès 2 bars, les boutons du filtre « Tous » / un bouton par bar passent à la ligne quand la largeur de la colonne manque, au lieu de défiler horizontalement. Le bouton actif a un fond Warm Cream léger transparent, sans soulignement. Un nom de bar trop long est tronqué par « … » sans dépasser la colonne. Le comportement du filtre (Phase 19) ne change pas. DESIGN.md consigne l'exception de remplissage. Aucune migration de schéma.

### Critères d'acceptation

- [x] Dès 2 bars, les boutons du filtre passent à la ligne quand la largeur manque ; aucun défilement horizontal, à 360px comme sur ordinateur
- [x] À 360px, avec 10 bars, tous les boutons sont visibles sans défilement horizontal
- [x] Le bouton actif (« Tous » ou un bar) a un fond Warm Cream léger transparent (~15 %), sans soulignement ; un seul bouton est actif à la fois
- [x] Les boutons gardent leur forme de bouton fantôme (bordure Warm Cream, rayon 22.5px, 12px majuscules, 500), sans fond plein cuivré ni crème
- [x] Un nom de bar plus long que la colonne est tronqué par « … » sur une ligne ; aucun bouton n'est plus large que la colonne ; pas d'infobulle
- [x] Avec un seul bar, aucun filtre n'est affiché ; le filtre revient sur « Tous » à chaque visite (inchangé)
- [x] `aria-pressed` reste porté par le bouton actif
- [x] DESIGN.md consigne le fond crème léger du bouton actif du filtre comme seule exception de remplissage d'un bouton fantôme

## Bloquée par

- Phase 19 (filtre par bar)

---

## Phase 27 : Sections déroulables du profil

**User stories** : US-78, US-79, US-80, US-81, US-82, US-83, US-84, US-85, US-86

### Ce qu'on livre

Sur `/mon-profil`, « Mes bars », « Email », « Mot de passe » et « Supprimer mon compte » deviennent des sections déroulables : un clic sur la ligne de titre, qui porte un chevron, déroule ou replie la section, indépendamment des autres. À chaque visite, seule « Mes bars » est déroulée. L'email actuel reste visible sous « Email ». Replier une section n'efface pas la saisie. « Supprimer mon compte » déroulé montre directement le formulaire de suppression. « Déconnexion » ne change pas. Le titre « Mon profil » passe à la taille de « Mes annonces » (24px). Aucune migration de schéma.

### Critères d'acceptation

- [x] À l'arrivée sur `/mon-profil`, « Mes bars » est déroulée ; les formulaires d'email, de mot de passe et de suppression sont masqués ; l'email actuel et « Déconnexion » sont visibles
- [x] Les quatre titres de section portent un chevron fin à droite, vers le bas quand la section est repliée, vers le haut quand elle est déroulée ; les titres gardent leur taille actuelle (24px)
- [x] Toute la ligne de titre est cliquable : un clic affiche le contenu, un second le masque, « Mes bars » comprise
- [x] Plusieurs sections peuvent être ouvertes en même temps ; aucune n'en referme une autre
- [x] Replier « Mes bars » masque la liste, « Ajouter un bar » et les messages ; son comportement interne (un seul bar déplié, fiche dépliée d'office avec un seul bar) est inchangé
- [x] Une saisie faite dans une section reste présente après l'avoir refermée puis rouverte ; elle n'est perdue qu'en quittant la page
- [x] Après un changement d'email ou de mot de passe (succès ou erreur), la section reste ouverte et affiche le message
- [x] « Supprimer mon compte » déroulé montre l'avertissement puis directement le formulaire (mot de passe actuel, mot SUPPRIMER, « Supprimer définitivement ») ; plus de bouton intermédiaire ni de lien « Annuler »
- [x] Le titre « Mon profil » a la même taille que « Mes annonces » ; « Compte créé le… » reste en dessous
- [x] La page tient à 360px sans débordement horizontal ; pas d'animation de dépliage
- [x] Le titre de section est un bouton portant `aria-expanded` et `aria-controls` ; le chevron est masqué aux lecteurs d'écran

## Bloquée par

- Phase 20 (suppression d'un bar, contenu de « Mes bars ») et Phase 25 (titre « Mes annonces » à 24px)

---

## Phase 28 : Titres du formulaire d'annonce et libellé « Instruments disponibles »

**User stories** : US-87, US-98

### Ce qu'on livre

Les titres du formulaire d'annonce (« Nouvelle annonce », « Modifier l'annonce », « Compléter le brouillon », renommé « Modifier le brouillon » pour tenir à 360px) passent à la taille du titre « Mes annonces » et tiennent sur une ligne sur mobile. Le champ des instruments s'intitule « Instruments disponibles » et la ligne côté musicien « Instruments : » au lieu de « Backline : ». Le mot « backline » disparaît de l'écran. Aucune migration de schéma.

### Critères d'acceptation

- [x] Les titres de `/mes-annonces/nouvelle` et `/mes-annonces/[id]` (« Nouvelle annonce », « Modifier l'annonce », « Modifier le brouillon ») sont en 24px, leading 1.09, comme « Mes annonces »
- [x] À 360px, chacun de ces titres tient sur une ligne, sans débordement horizontal
- [x] Le champ des instruments du formulaire s'intitule « Instruments disponibles »
- [x] Côté musicien (liste et fiche de la carte), la ligne des instruments commence par « Instruments : »
- [x] Le mot « backline » n'apparaît plus nulle part à l'écran ; la liste des instruments proposés et les annonces existantes sont inchangées

## Bloquée par

Aucune — démarrable immédiatement

---

## Phase 29 : Description d'une annonce

**User stories** : US-88, US-89, US-90, US-91, US-92, US-93, US-94, US-99, US-100, US-101, US-102

### Ce qu'on livre

Le formulaire d'annonce propose un champ « Description (optionnel) », texte brut de 500 caractères maximum avec compteur, placé après les instruments et avant les photos. La description s'affiche côté musicien sous les instruments, avec ses retours à la ligne : ses 3 premières lignes dans la liste, en entier dans la fiche de la carte. Un clic sur une carte de la liste ouvre la nouvelle page publique de la jam (`/jams/[id]`), qui montre toute l'annonce. « Mes annonces » affiche les 2 premières lignes de la description. Elle est modifiable sur un brouillon comme sur une annonce publiée (toutes les dates), reprise par « Reprendre la dernière annonce de ce bar » et suivie par la garde de sortie. Migration : champ `Annonce.description String?`.

### Critères d'acceptation

- [x] Le formulaire affiche « Description (optionnel) » après les instruments et avant les photos : zone de texte de 4 lignes, soulignée sans cadre (DESIGN.md), `maxLength` 500
- [x] Un compteur « N/500 » en 12px Driftwood s'affiche à droite, sous la zone de texte, et suit la saisie
- [x] Une description de plus de 500 caractères est refusée côté serveur, brouillon comme publication ; une description vide est enregistrée comme absente
- [x] Une annonce sans description s'enregistre en brouillon et se publie
- [x] Côté musicien, la description s'affiche sous les instruments et au-dessus des photos, retours à la ligne conservés, en 15px casse mixte Warm Cream ; rien ne s'affiche sans description
- [x] Dans la liste, la description est limitée à 3 lignes coupées par « … » ; dans la fiche de la carte, elle est complète et la fiche ne mène pas à la page de la jam
- [x] Dans la liste, un clic n'importe où sur la carte ouvre `/jams/[id]`, sauf sur « Itinéraire » et son menu ; le lien est accessible au clavier
- [x] `/jams/[id]` affiche le bandeau, « ← Retour » vers `/?date=<date de la jam>`, le nom du bar en titre (24px), la date en clair, le statut, l'échéance J-7 le cas échéant, l'adresse, la distance si la géolocalisation est acceptée, l'horaire, les styles, les instruments, la description complète, les photos en pleine largeur et « Itinéraire »
- [x] Une jam annulée à venir reste consultable ; une jam passée, en brouillon ou inexistante affiche « Cette jam n'est plus disponible » et « Voir les jams du jour », avec un code 404
- [x] Dans « Mes annonces », chaque annonce affiche les 2 premières lignes de sa description, en 12px Driftwood
- [x] La page tient à 360px sans débordement horizontal
- [x] La description est modifiable sur un brouillon et sur une annonce publiée ; sur une annonce publiée, elle s'applique à toutes ses dates, quelle que soit la portée choisie
- [x] « Reprendre la dernière annonce de ce bar » remplit la description, en écrasant celle en cours, y compris par du vide
- [x] Saisir ou modifier une description compte comme une saisie pour la garde de sortie (Phase 16)
- [x] Les annonces existantes n'ont pas de description et s'affichent comme avant
- [x] Tests Vitest : validation (500 caractères, chaîne vide → absente) et reprise de la description

## Bloquée par

Aucune — démarrable immédiatement

---

## Phase 30 : Case « Tous les styles »

**User stories** : US-95, US-96, US-97

### Ce qu'on livre

La liste des styles du formulaire d'annonce commence par une case « Tous les styles », sur sa propre ligne. Cochée, elle décoche et désactive les autres styles et « Autre » ; décochée, elle les réactive. Elle suffit pour publier. Une annonce « Tous les styles » affiche « Tous styles » côté musicien et dans « Mes annonces ». Aucune migration de schéma ; un script convertit les annonces existantes qui cochaient les 11 styles.

### Critères d'acceptation

- [x] « Tous les styles » est la première case des styles, seule sur sa ligne
- [x] La cocher décoche et désactive les autres styles et « Autre », précision comprise ; la décocher les réactive, vides
- [x] Une annonce portant « Tous les styles » avec un autre style ou une précision « Autre » est refusée côté serveur
- [x] « Tous les styles » seule suffit pour publier ; un brouillon peut toujours n'avoir aucun style
- [x] Une annonce « Tous les styles » affiche « TOUS STYLES » à la place de la liste des styles, côté musicien (liste et fiche de la carte) et dans « Mes annonces »
- [x] La reprise et la modification d'une annonce (brouillon ou publiée) traitent « Tous les styles » comme un style ordinaire ; à la réouverture, la case est cochée et les autres désactivées
- [x] Les annonces existantes cochant les 11 styles nommés sont converties en « Tous les styles » par `scripts/convertir-tous-styles.mjs`
- [x] Tests Vitest de la validation (exclusivité, publication avec « Tous les styles » seule)

## Bloquée par

Aucune — démarrable immédiatement

Les phases 28, 29 et 30 sont indépendantes entre elles.

---

## Phase 31 : Pied de page commun et page CGU

**User stories** : US-103, US-104, US-105, US-111

### Ce qu'on livre

Toutes les pages se terminent par un pied de page discret : un filet pointillé, une ligne « CGU · Contact », puis « © <année en cours> Jammix · Tous droits réservés · v<version> ». « CGU » mène à la page publique `/cgu`, courte et structurée en sections (éditeur anonyme, hébergeur, objet et gratuité, accès, responsabilités, propriété des contenus, données personnelles et droits, cookies, droit applicable, date de mise à jour). Le lien « Contact » est masqué jusqu'à la Phase 32. Sur les formulaires d'annonce, les liens du pied de page sont des sorties gardées. DESIGN.md est complété pour autoriser le pied de page.

### Critères d'acceptation

- [x] Le pied de page s'affiche après le contenu sur `/`, `/jams/[id]`, `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe`, `/mes-annonces`, `/mes-annonces/nouvelle`, `/mes-annonces/[id]`, `/mon-profil` et `/cgu`
- [x] Il affiche « © <année en cours> Jammix · Tous droits réservés · v<version de l'application> »
- [x] `/cgu` est accessible sans compte, avec « ← Retour » vers `/`, et présente les sections dans l'ordre du PRD
- [x] Aucun nom de personne n'apparaît sur `/cgu` ; l'éditeur y est un particulier non professionnel joignable via le formulaire Contact
- [x] Sur une nouvelle annonce ou un brouillon modifié, « CGU » enregistre en brouillon puis affiche la fenêtre ; sur une annonce Publiée modifiée, la fenêtre Quitter/Rester ; sans changement, sortie directe
- [x] Le pied de page tient à 360px sans débordement horizontal
- [x] DESIGN.md autorise le pied de page (fond Walnut Shadow, filet pointillé Cork Border, texte Warm Cream atténué)
- [x] Tests Playwright : pied de page présent sur chaque page, navigation vers `/cgu`, sortie gardée depuis un formulaire d'annonce

## Bloquée par

Aucune — démarrable immédiatement

---

## Phase 32 : Formulaire Contact

**User stories** : US-106, US-107, US-108, US-109, US-110

### Ce qu'on livre

Le lien « Contact » du pied de page apparaît et mène à la page publique `/contact` : un formulaire nom, adresse mail, message. Un envoi valide part par email vers l'adresse de contact de l'équipe, avec la réponse dirigée vers l'expéditeur. L'organisateur connecté trouve son email prérempli. Les envois sont limités à 5 par heure depuis une même connexion, et un champ piège écarte les robots.

### Critères d'acceptation

- [x] « Contact » s'affiche dans le pied de page de toutes les pages et mène à `/contact`, avec « ← Retour » vers `/`
- [x] Nom (1 à 100 caractères), adresse mail (format valide) et message (10 à 2000 caractères, compteur « N/2000 ») sont obligatoires ; une erreur s'affiche sous le champ concerné, la saisie conservée
- [x] Un organisateur connecté trouve son email prérempli et modifiable ; un visiteur trouve le champ vide
- [x] Un envoi réussi affiche « Message envoyé, nous vous répondrons par email. » et vide le formulaire
- [x] L'email reçu à l'adresse de contact contient le nom, l'email et le message ; « Répondre » vise l'email de l'expéditeur ; aucun email n'est envoyé à l'expéditeur
- [x] Un échec d'envoi, ou une adresse de contact absente, affiche un message d'erreur et conserve la saisie
- [x] Le 6ᵉ envoi en moins d'une heure depuis une même connexion affiche « Trop de messages envoyés, réessayez plus tard. » ; l'IP n'est jamais stockée en clair
- [x] Un envoi avec le champ piège rempli n'envoie rien et n'est pas enregistré
- [x] Une phrase sous le bouton explique l'usage des données, avec un lien vers `/cgu`
- [x] Sur un formulaire d'annonce, « Contact » suit les mêmes règles de sortie que « CGU »
- [x] Tests Vitest de la validation, de la limite d'envois et du `replyTo` d'`envoyerEmail` ; test Playwright de l'envoi, des erreurs et du préremplissage

## Bloquée par

- Phase 31 (pied de page commun)

---

## Phase 33 : Mise en production

### Ce qu'on livre

jammix.fr tourne sur Vercel avec sa propre base Neon (branche `production`), séparée de la base de développement (branche `developpement`). Les secrets de production ne vivent que dans Vercel ; le `.env` local pointe sur la base de développement. Les opérations ponctuelles sur la production (schéma, scripts) reçoivent l'URL de la base en ligne de commande.

### Critères d'acceptation

- [x] Variables Production dans Vercel : `DATABASE_URL` (chaîne pooled de la branche `production`), `AUTH_SECRET` (valeur dédiée), `RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `URL_APP`, `EMAIL_CONTACT`, `EMAIL_EXPEDITEUR`
- [x] Le `.env` local pointe sur la branche Neon `developpement`, jamais sur `production`
- [x] Le schéma de la base de production est synchronisé avec `prisma/schema.prisma`
- [x] `main` est poussé et déployé sur jammix.fr ; `/`, `/contact`, `/cgu` et `/connexion` répondent 200
- [ ] Parcours vérifiés en production avec de vrais emails : bienvenue, réinitialisation du mot de passe, message Contact reçu par l'équipe
- [ ] Suppression d'un bar vérifiée en production (annonces et photos retirées)

## Bloquée par

- Phase 32 (formulaire Contact)

---

## Phase 34 : Mentions légales

**User stories** : US-103, US-104, US-111, US-112, US-113, US-114, US-115

### Ce qu'on livre

Le pied de page affiche « CGU · Mentions légales · Contact ». « Mentions légales » mène à la page publique `/mentions-legales`, en sections courtes : éditeur (particulier non professionnel anonyme), directeur de la publication (sans nom), hébergeurs (Vercel, Neon, avec nom et adresse), contact et signalement d'un contenu illicite, propriété intellectuelle, date de mise à jour. Les sections Éditeur, Hébergeur et Propriété des contenus quittent `/cgu`, qui renvoie vers les mentions légales. Sur les formulaires d'annonce, le lien est une sortie gardée.

### Critères d'acceptation

- [ ] Le pied de page affiche « CGU · Mentions légales · Contact » sur toutes les pages, sans débordement horizontal à 360px
- [ ] `/mentions-legales` est accessible sans compte, avec « ← Retour » vers `/`, et présente les sections dans l'ordre du PRD
- [ ] Aucun nom de personne n'apparaît sur `/mentions-legales` ; l'éditeur et le directeur de la publication y sont un particulier non professionnel anonyme
- [ ] Les hébergeurs (Vercel, Neon) sont indiqués avec leur nom et leur adresse
- [ ] La page explique comment joindre l'équipe (lien vers `/contact`) et signaler un contenu illicite
- [ ] `/cgu` ne contient plus Éditeur, Hébergeur ni Propriété des contenus, et renvoie vers `/mentions-legales`
- [ ] Sur une nouvelle annonce ou un brouillon modifié, « Mentions légales » enregistre en brouillon puis affiche la fenêtre ; sur une annonce Publiée modifiée, la fenêtre Quitter/Rester ; sans changement, sortie directe
- [ ] Tests Playwright : lien présent dans le pied de page, navigation vers `/mentions-legales`, absence de nom de personne, sortie gardée depuis un formulaire d'annonce

## Bloquée par

- Phase 31 (pied de page commun et page CGU)

---

## Phase 35 : Nom et prénom de l'organisateur

**User stories** : US-116, US-117, US-118, US-119

### Ce qu'on livre

L'inscription demande « Nom et prénom » en premier champ (obligatoire, 1 à 80 caractères), avant l'email, le mot de passe, le nom et l'adresse du bar. Le nom est enregistré avec le compte et modifiable depuis `/mon-profil`, dans une section repliée « Nom et prénom ». Les comptes existants n'ont pas de nom et ne sont jamais contraints d'en saisir un. La page `/cgu` mentionne le nom parmi les données collectées. L'affichage du nom sur les cartes d'organisateur est une phase future.

### Critères d'acceptation

- [x] Le formulaire d'inscription affiche « Nom et prénom » en premier champ ; un nom vide ou de plus de 80 caractères (espaces de début et de fin ignorés) est refusé avec un message sous le champ, la saisie conservée
- [x] Un compte créé avec un nom le retrouve prérempli dans la section « Nom et prénom » du profil
- [x] La section « Nom et prénom » du profil se comporte comme les autres sections (repliée par défaut) ; la modification est enregistrée et confirmée, les mêmes règles de validation s'appliquent
- [x] Un compte existant sans nom se connecte, utilise « Mes annonces » et son profil normalement, et peut renseigner son nom sans y être contraint
- [x] `/cgu` mentionne le nom et prénom parmi les données collectées
- [x] Aucune migration destructive : `Organisateur.nom` est nullable, les comptes existants sont intacts
- [x] Tests Vitest de la validation `nomComplet` ; tests Playwright : inscription avec et sans nom (message d'erreur), nom prérempli au profil, modification du nom, connexion d'un compte sans nom

## Bloquée par

- Phase 34 (mentions légales)
