# Harbor — système de design de Jammix

> Clair, marine et bleu. Une interface nette, sérieuse sans être froide, pensée pour consulter vite en mobile.

Harbor est le seul système de design de l'application (accueil, connexion, espace organisateur, pages légales, e-mails). Il remplace l'ancien système ORYZO (sombre, cuivre). **Thème clair uniquement** : un mode sombre est prévu plus tard, sans date. Les tokens vivent dans `:root` (`app/globals.css`, variables `--harbor-*`). Référence visuelle de l'accueil : `design-harbor-preview.html` (dossier mémoire du projet).

## Couleurs

| Nom | Valeur | Rôle |
|-----|--------|------|
| Brume | `#F7FAFC` | Fond de page |
| Carte | `#FFFFFF` | Fond des cartes, champs, menus, fenêtres |
| Marine | `#0B3658` | Texte principal, entête, étiquettes de carte |
| Marine 2 | `#486984` | Texte secondaire |
| Marine 3 | `#688DAC` | Texte discret, pied de page, kickers |
| Bleu signal | `#2B78BE` | Action principale, jour sélectionné, statut « programmée » |
| Bleu clair | `#4E9AD9` | Filet sous l'entête, accents sur marine |
| Voile | `#E6F1FA` | Fonds teintés : bascule, boutons discrets, survols, chips |
| Trait | `#DDE7EE` | Bordures et séparateurs |
| Succès | `#17807E` | Statut « confirmée » |
| Alerte | `#946010` | Statut « en attente de confirmation », relances |
| Erreur | `#B3261E` | Erreurs de saisie et d'envoi |
| Annulée | `#6B7C8C` | Statut « annulée » : carte à 60 % d'opacité, nom barré |

**Statuts d'occurrence (liste, carte, Mes annonces)** : confirmée `#17807E`, programmée `#2B78BE`, en attente `#946010`, annulée `#6B7C8C`. Table `COULEURS_STATUT_OCCURRENCE` dans `lib/annonce-constantes.ts`. Le statut d'annonce (Brouillon/Publiée) et celui d'occurrence restent distincts. L'Alerte a été assombrie (`#B7791F` → `#946010`, blanc dessus à 5,3:1) pour que la pastille en fond plein à texte blanc reste AA.

## Typographie

- **Figtree**, police unique (inspirée du style Refero) : les rôles passent par la graisse et la taille, 400 corps, 600 emphase, 700 sous-titres, 800 titres. Corps 16 px, interligne 1,5, interlettrage −0,005 em.
- Données (horaires, distances, dates) : classe `.donnees`, Figtree avec `font-variant-numeric: tabular-nums`.
- Kickers : classe `.kicker`, Figtree 12 px, 700, capitales, interlettrage 0,1 em.
- Chargée via `next/font/google` en variable CSS `--font-figtree` (`app/layout.tsx`). JetBrains Mono n'est plus utilisée.
- **Exception : la carte d'annonce** reprend les polices du preview : **Plus Jakarta Sans** (nom du bar, 800) et **Geist** (adresse, distance, horaires, « Sera confirmée le … », en `tabular-nums`), chargées via `next/font/google` en variables `--font-jakarta` et `--font-geist`. Statut et pastilles restent en Figtree. Ailleurs, Figtree seule.
- Mot-symbole « Jammix » (sous l'entête, toutes pages) : Plus Jakarta Sans 800, fluide `clamp(44px, 13vw, 56px)`, « Jam » Marine, « mix » Bleu, avec dessous « Les Jams à Lyon, ce soir ». Plus de « Jammix » dans l'entête.
- **Titre de page** (`h1`, classe `.titre-page`) : 24 px, 700, interlettrage −0,03 em, Marine, retour à la ligne équilibré. Jamais tronqué.
- Libellé de champ : 13 px, 700. Texte d'aide ou secondaire : 12–13 px, Marine 2. Pas de majuscules typographiques, sauf les kickers.

## Espacement, formes, ombres, mouvement

- Base 4 px. Rayons : 6 (petits badges), 12 (boutons, champs, menus, fenêtres), 16 (cartes), pastille complète (chips, étiquettes de carte, icône de profil).
- Ombres teintées marine : `0 12px 48px rgba(11,54,88,.08)` (cartes), `0 4px 24px rgba(11,54,88,.08)` (menus, éléments flottants). Pas d'autre ombre.
- Mouvement minimal : transitions de couleur et de fond de 120 ms ; aucune animation décorative.
- Colonne unique de 448 px au plus (`max-w-md`), marges de 24 px. Séparateurs : trait plein 1 px Trait. Le pointillé Trait est réservé aux états vides et aux emplacements de photo vides.
- Focus clavier : contour 2 px Bleu signal, décalage 2 px.

## Composants

- **Entête** (toutes les pages) : fond Marine, 48 px, sticky, filet inférieur 3 px Bleu clair, sans ombre. Hors accueil, à gauche, icône maison seule (22 px, blanche, libellé accessible « Accueil », lien vers `/`), sans texte « Jammix » (aucun lien à gauche sur l'accueil) ; à droite, sur l'accueil, « Connexion organisateur » en pastille (`rgba(255,255,255,.12)`, texte blanc, 12 px, 600) ou, si l'organisateur est connecté, l'icône de profil (cercle 32 px, `rgba(255,255,255,.12)`, plein blanc quand `/mon-profil` est active). Sous l'entête, sur toutes les pages : mot-symbole et accroche (le mot-symbole est le `h1` de l'accueil, décor `aria-hidden` ailleurs). Ni menu déroulant ni « burger ».
- **Bouton principal** : fond Bleu signal, texte blanc 14 px 700, rayon 12, survol Marine. Un seul bouton principal par section.
- **Bouton secondaire** : fond blanc, bordure Trait, texte Marine 13 px 700, rayon 12, survol Voile. Sur l'accueil, « Accéder à mes annonces » est un bouton Voile pleine largeur.
- **« ← Retour »** : bouton secondaire, `self-start`.
- **Champ de formulaire** (classe `.champ-input`) : fond blanc, bordure 1 px Trait, rayon 12, remplissage 10×12, texte 15 px ; au focus bordure Bleu signal et halo Voile 2 px. Libellé au-dessus (13 px 700), erreur dessous (13 px 600 Erreur). **Placeholder = libellé du champ** (« Prénom », « Nom du bar », « Code postal »…), jamais un exemple de valeur. Les formulaires de bar ont un champ « Code postal » dédié (5 chiffres, clavier numérique) sous « Adresse du bar ».
- **Lien texte** : Marine souligné, ou Bleu signal dans les menus.
- **Ligne « Accéder à mes annonces » / « À confirmer · N »** (espace organisateur, sous l'entête) : 12 px 600 Marine, filet inférieur 1 px Trait, 12 px sous le texte. Profil et formulaires : « 🔔 Accéder à mes annonces » sans chiffre, lien vers Mes annonces (nombre dans le libellé accessible). Mes annonces : « 🔔 À confirmer · N » en simple texte, affiché même à 0.
- **Bascule Liste/Carte** : segmentée, fond Voile, rayon 12, segment actif blanc avec ombre légère, texte 13 px 700, rayon 12.
- **Accueil, ordre des blocs** : bloc d'accroche (commun à toutes les pages, rendu sous l'entête) : mot-symbole « Jammix » (interlettrage −0,045 em) et dessous « Les Jams à Lyon, ce soir » (Figtree 600 18 px, Marine 2), bascule Liste/Carte (pleine largeur), ligne « ‹ [Aujourd'hui] [calendrier] › » (« Aujourd'hui » et le bouton calendrier 40×40 centrés ensemble, flèches aux extrémités, sans libellé de semaine), bandeau de 7 jours, cartes d'annonce, pied de page.
- **Bandeau de 7 jours** : boutons ‹ › bordés (rayon 14), libellé de semaine 14 px 700, « Aujourd'hui » en pastille Voile. Sept jours en cartes blanches bordées Trait, rayon 16 (abréviation minuscule 13 px, numéro 20 px 800). Jour sélectionné plein Bleu signal, texte blanc. Point de 4 px Bleu signal (blanc sur le jour sélectionné) sous les jours qui ont au moins une occurrence d'annonce publiée, annulée comprise. Borne basse : aujourd'hui.
- **Carte d'annonce** (accueil, Mes annonces) : fond blanc, rayon 16, bordure Trait, ombre menu (`0 4px 24px`), marge 16, 6 px entre les lignes. Dans l'ordre : **ligne 1** nom du bar (Plus Jakarta Sans 800, 20 px, interlettrage −0,025 em) à gauche et pastille de statut à droite (Figtree 12 px, remplissage 3×8, fond plein de la couleur du statut, texte blanc, graisse 700, rayon 6 ; elle peut passer sur deux lignes, 42 % de largeur au plus) ; adresse (Geist 400 13 px, Marine 2) avec la distance à droite sur la même ligne (Geist 600) ; horaires « début → fin » (Geist 600 13 px) ; **ligne « Styles »** : libellé 12 px 600 Marine 3 suivi des puces sur la même ligne ; **ligne « Instruments »** idem (retour à la ligne des puces si trop nombreuses). Puces : bordure Trait, rayon complet, 12 px 600, remplissage 3×10, Marine 2. « Sera confirmée le … » conservé. Annulée : 60 % d'opacité, nom barré. Bouton Itinéraire secondaire ; son menu est une carte blanche, rayon 12.
- **Menu « ⋯ » des cartes d'annonces** : bouton sans bordure ni fond en haut à droite de la carte (zone tactile 44×44 px, libellé accessible « Actions de l'annonce », `aria-haspopup="menu"`, `aria-expanded`), frère du lien de la carte. Le texte de la carte réserve 48 px à droite. Menu : carte blanche, rayon 12, bordure Trait, ombre menu, trois entrées au plus (« Modifier », « Annuler », « Supprimer ») en 13 px 600 Marine, survol Voile ; « Supprimer » en Erreur. Échap ou clic extérieur le ferme.
- **Filtre par bar** (Mes annonces) : boutons en pastille ; le bouton actif est plein Bleu signal (`--harbor-bleu`), texte blanc, bordure Bleu signal (contraste AA) ; les inactifs gardent fond blanc et bordure Trait. `aria-pressed` indique l'état ; « Tous » est actif à l'arrivée.
- **Carte glissable** (Mes annonces) : la carte se translate horizontalement avec le doigt ou la souris (`touch-action: pan-y`, seuil d'environ 72 px pour rester ouverte). Glissé à gauche : colonne « Supprimer » (fond Erreur, texte blanc) ; à droite : colonne « Modifier » (fond Bleu signal, texte blanc). Un seul côté à la fois, mêmes rayons que la carte (16, 12), transition de translation 120 ms sans ressort, aucune autre animation. Boutons fermés `aria-hidden` et `tabIndex=-1` ; le menu « ⋯ » reste l'accès clavier.
- **Liserés de la carte glissable** : sur la carte de Mes annonces, liseré de 4 px épousant les coins arrondis de la carte (bord coloré, comme les alertes), Bleu signal à gauche (annonce « Modifier ») et Erreur à droite (annonce « Supprimer »), qui suit la carte au glissé. Opacité toujours à 100 % (les cartes de Mes annonces ne sont jamais estompées).
- **Bouton calendrier** : bouton 40×40 portant un `<input type="date">` transparent posé dessus (`absolute inset-0`, `min` = aujourd'hui), sans dépendre de `showPicker()` (non fiable sur iOS).
- **Espacement des formulaires d'annonce** : 20 px (`gap-5`) entre sections ; heures de début et de fin sur deux colonnes égales (`gap-3`, `min-w-0`), jamais de débordement à 360 px.
- **État pressé (`:active`)** : principal Bleu signal → Marine ; secondaire fond Voile et bordure Bleu clair ; discret Voile → Trait ; danger fond Erreur teinté, texte Erreur. Vaut aussi pour pastilles, flèches, jours, bascule, filtres, entrées de menu, boutons de fenêtre et chips. Transition de 120 ms.
- **Profil (`/mon-profil`)** : titre « Mon profil » (24 px) à gauche et « Déconnexion » (bouton secondaire) à droite sur la même ligne. Toutes les sections déroulables sont repliées à l'arrivée ; email actuel masqué. Lignes de bars resserrées (séparateur Trait, 8 px de marge verticale), photo affichée seulement si elle existe : aucun carré vide.
- **Fenêtre modale** (`<dialog>` natif : annulation d'annonce, sortie d'un formulaire, suppression) : fond blanc, bordure Trait, rayon 12, marge intérieure 24 px, 384 px au plus, voile Marine à 50 % derrière, sans flou. Titre 18 px 800, boutons secondaires, un seul principal au plus. Erreur 13 px 600 Erreur.
- **Étiquette de carte (pill)** : fond Marine à 96 %, bordure et pointe de la couleur du statut, nom en capitales 12 px blanc, sous-ligne statut/distance blanc à 75 %. Version compacte (point seul) en cas de chevauchement. Fond de carte OpenFreeMap `positron`. Attribution OSM en pastille blanche à 80 %, sans chevauchement avec les étiquettes.
- **Feuille de bar** (bottom sheet) : fond blanc, bordure Trait, coins supérieurs 16, bouton de fermeture rond Voile.
- **États vides** : bloc à bordure pointillée Trait ; chips de prochaines dates en Voile, rayon complet.
- **Pied de page** (toutes les pages) : placé après le contenu, jamais fixé. Filet supérieur 1 px Trait, puis deux lignes centrées 12 px Marine 3 : « CGU · Mentions légales · Contact » et « © <année> Jammix · Tous droits réservés · v<version> ». Liens soulignés au survol, au focus et sur leur page active. Sur les formulaires d'annonce, ses liens sont des sorties gardées.
- **E-mails** (`lib/email.ts`) : fond Brume, texte Marine, bouton Bleu signal texte blanc rayon 12, liens Bleu signal.

## À faire / à ne pas faire

- Utiliser uniquement les tokens `--harbor-*` ; pas de couleur de statut hors de la palette ci-dessus.
- Pas de noir pur ni de fond sombre ; pas de majuscules typographiques hors kickers ; pas de rayon inférieur à 12 px sur un conteneur ni sur un champ.
- Texte secondaire en Marine 2, jamais en gris neutre. Contraste AA minimal sur toutes les paires texte/fond.
- Aucun nom de personne dans l'interface.
- Ne pas modifier les règles métier en touchant au visuel (statuts d'annonce vs d'occurrence, J-7).
