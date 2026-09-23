# Plan : App-Jamix — annonces de jams à Lyon

> PRD source : `docs/PRD.md`

## Décisions architecturales

- **Modèles clés** : `Bar` (nom, adresse, photo/logo optionnel), `CompteOrganisateur` (rattaché à un seul `Bar`), `Annonce` (style musical, instruments/backline, récurrente ou non, statut Brouillon/Publiée, jusqu'à 2 photos optionnelles), `OccurrenceJam` (date, horaire, statut de confirmation, échéance J-7) — chaque date d'une annonce récurrente est une occurrence indépendante avec son propre statut.
- **Deux axes de statut distincts** : (1) statut de l'annonce — `Brouillon` (invisible côté musicien, aucune occurrence n'entre dans le cycle J-7) → `Publiée` ; (2) statut de chaque occurrence — `confirmée` / `programmée (sera confirmée le J-7)` / `en attente de confirmation` / `annulée`, qui ne démarre qu'à la publication de l'annonce.
- **Gestion des photos** : upload optionnel côté fiche bar (photo/logo) et côté annonce (jusqu'à 2 photos maximum) ; toute image importée est automatiquement ajustée/recadrée au format d'affichage de l'application (pas de cadrage manuel), sans jamais bloquer la création/publication si aucune photo n'est fournie.
- **Authentification / autorisation** : seuls les organisateurs ont un compte (email/mot de passe) ; la consultation musicien est publique, sans compte, sans autorisation.
- **Statuts d'occurrence** : `confirmée`, `programmée (en attente de confirmation, sera confirmée le J-7)`, `en attente de confirmation (J-7 dépassé)`, `annulée`. Ce cycle de statuts est fixé dès la Phase 6 et réutilisé jusqu'à la Phase 8.
- **Déclenchement du cycle J-7 (Phase 6)** : la décision « cycle de confirmation requis ou non » est figée une seule fois, au moment de la publication de l'annonce (création directement publiée, ou passage Brouillon → Publiée) — jamais recalculée ensuite. Pour chaque occurrence, si sa date est à plus de 7 jours de l'instant de publication, on écrit `statut = PROGRAMMEE` et `confirmationJ7 = date - 7j` ; sinon (publiée à 7 jours ou moins de son échéance, ex. J-2), on écrit directement `statut = CONFIRMEE` et `confirmationJ7 = null`, sans cycle ni relance. Cette règle s'applique indépendamment à chaque occurrence, y compris pour une annonce récurrente publiée en une fois avec plusieurs dates. Le calcul des écarts de jours se fait en UTC, date seule (`new Date(new Date().toISOString().slice(0,10))`), cohérent avec le reste de l'app — pas de gestion de fuseau Europe/Paris. Le statut « en attente de confirmation » n'est jamais persisté : il est calculé à la volée à chaque lecture (statut = PROGRAMMEE et confirmationJ7 <= aujourd'hui), sans tâche planifiée (pas d'infra cron dans le projet).
- **Relances de confirmation** : canal in-app uniquement (pas d'email/SMS) — pour ne pas introduire de dépendance à un service d'email tiers.
- **Géolocalisation** : basée sur l'API de géolocalisation du navigateur, demandée à la consultation ; dégradation gracieuse (pas de distance affichée) si refusée.
- **Frontière tierce** : aucune dépendance externe obligatoire hors géolocalisation navigateur (pas d'email, pas de carte tierce imposée par le PRD).
- **Récurrence (Phase 5)** : le champ `estRecurrente` est dérivé automatiquement du nombre d'occurrences (`occurrences.length > 1`), pas de toggle dédié dans l'UI ; l'horaire (`heureDebut`/`heureFin`) est unique par annonce et s'applique à toutes ses occurrences ; jusqu'à 12 dates maximum par annonce, sans doublon (contrainte `@@unique([annonceId, date])` en base + validation applicative) ; les dates ne sont librement modifiables (ajout/retrait) que tant que l'annonce est en Brouillon — une fois Publiée, la modification des dates relève de la Phase 8 (portée ciblée/globale). Tant que l'annonce est en Brouillon, chaque sauvegarde resynchronise ses occurrences par remplacement complet (suppression puis recréation à partir des dates soumises), sans diff fin — aucune donnée par occurrence n'a encore d'état à préserver à ce stade. Une fois Publiée, les autres champs (horaire, style, instruments, photos) restent modifiables et s'appliquent alors à toutes les occurrences existantes.

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
