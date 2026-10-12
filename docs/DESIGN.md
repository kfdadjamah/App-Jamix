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
| Alerte | `#B7791F` | Statut « en attente de confirmation », relances |
| Erreur | `#B3261E` | Erreurs de saisie et d'envoi |
| Annulée | `#6B7C8C` | Statut « annulée » : carte à 60 % d'opacité, nom barré |

**Statuts d'occurrence (liste, carte, Mes annonces)** : confirmée `#17807E`, programmée `#2B78BE`, en attente `#B7791F`, annulée `#6B7C8C`. Table `COULEURS_STATUT_OCCURRENCE` dans `lib/annonce-constantes.ts`. Le statut d'annonce (Brouillon/Publiée) et celui d'occurrence restent distincts.

## Typographie

- **Plus Jakarta Sans** — titres (700/800, interlettrage −0,025 em) et corps (400/600/700). Corps 16 px, interligne 1,55.
- **Geist** — données (horaires, distances, dates), classe `.donnees`, `font-variant-numeric: tabular-nums`.
- **JetBrains Mono** — code et kickers en capitales (classe `.kicker` : 12 px, 500, interlettrage 0,1 em).
- Chargées via `next/font/google` en variables CSS (`app/layout.tsx`).
- Titre d'accueil « Jammix » : 40 px, 800. Accroche : 16 px, 600, Marine 2.
- **Titre de page** (`h1`, classe `.titre-page`) : 24 px, 700, interlettrage −0,03 em, Marine, retour à la ligne équilibré. Jamais tronqué.
- Libellé de champ : 13 px, 700. Texte d'aide ou secondaire : 12–13 px, Marine 2. Pas de majuscules typographiques, sauf les kickers.

## Espacement, formes, ombres, mouvement

- Base 4 px. Rayons : 6 (petits badges), 12 (boutons, champs, menus, fenêtres), 16 (cartes), pastille complète (chips, étiquettes de carte, icône de profil).
- Ombres teintées marine : `0 12px 48px rgba(11,54,88,.08)` (cartes), `0 4px 24px rgba(11,54,88,.08)` (menus, éléments flottants). Pas d'autre ombre.
- Mouvement minimal : transitions de couleur et de fond de 120 ms ; aucune animation décorative.
- Colonne unique de 448 px au plus (`max-w-md`), marges de 24 px. Séparateurs : trait plein 1 px Trait. Le pointillé Trait est réservé aux états vides et aux emplacements de photo vides.
- Focus clavier : contour 2 px Bleu signal, décalage 2 px.

## Composants

- **Entête** (toutes les pages) : fond Marine, 56 px, sticky, filet inférieur 3 px Bleu clair, sans ombre. Accueil : pas de logo (le grand titre « Jammix » en tient lieu) ; à droite, « Connexion organisateur » en pastille (`rgba(255,255,255,.12)`, texte blanc, 12 px, 600) ou l'icône de profil. Autres pages : à gauche icône maison 18 px et « Jammix » en blanc (16 px, 800), lien vers `/` ; à droite l'icône de profil si l'organisateur est connecté (cercle 32 px, `rgba(255,255,255,.12)`, plein blanc quand `/mon-profil` est active). Ni menu déroulant ni « burger ».
- **Bouton principal** : fond Bleu signal, texte blanc 14 px 700, rayon 12, survol Marine. Un seul bouton principal par section.
- **Bouton secondaire** : fond blanc, bordure Trait, texte Marine 13 px 700, rayon 12, survol Voile. Sur l'accueil, « Accéder à mes annonces » est un bouton Voile pleine largeur.
- **« ← Retour »** : bouton secondaire, `self-start`.
- **Champ de formulaire** (classe `.champ-input`) : fond blanc, bordure 1 px Trait, rayon 12, remplissage 10×12, texte 15 px ; au focus bordure Bleu signal et halo Voile 2 px. Libellé au-dessus (13 px 700), erreur dessous (13 px 600 Erreur).
- **Lien texte** : Marine souligné, ou Bleu signal dans les menus.
- **Ligne « Accéder à mes annonces » / « À confirmer · N »** (espace organisateur, sous l'entête) : 12 px 600 Marine, filet inférieur 1 px Trait, 12 px sous le texte. Profil et formulaires : « 🔔 Accéder à mes annonces » sans chiffre, lien vers Mes annonces (nombre dans le libellé accessible). Mes annonces : « 🔔 À confirmer · N » en simple texte, affiché même à 0.
- **Bascule Liste/Carte** : segmentée, fond Voile, rayon 12, segment actif blanc avec ombre légère, texte 13 px 700.
- **Bandeau de 7 jours** : ligne « ‹ · Aujourd'hui · › » puis sept jours (abréviation en capitales 11 px Geist, numéro 17 px 700). Jour sélectionné en pastille Bleu signal, texte blanc. Point de 4 px Bleu signal (blanc sur le jour sélectionné) sous les jours qui ont au moins une occurrence d'annonce publiée, annulée comprise. Icône calendrier qui ouvre un sélecteur de date natif. Borne basse : aujourd'hui.
- **Carte d'annonce** (accueil, Mes annonces) : fond blanc, rayon 16, bordure Trait, ombre légère. Ligne 1 : nom du bar (20 px, 800, ellipsis) et statut. Ligne 2 : adresse à gauche, distance à droite (Geist, 600). Ligne 3 : horaires (Geist, 600). Lignes « Styles » et « Instruments » : libellé en kicker 11 px, valeurs sur une ligne avec ellipsis. « Sera confirmée le … » conservé. Annulée : 60 % d'opacité, nom barré. Bouton Itinéraire secondaire ; son menu est une carte blanche, rayon 12.
- **Menu « ⋯ » des cartes d'annonces** : bouton sans bordure ni fond en haut à droite de la carte (zone tactile 44×44 px, libellé accessible « Actions de l'annonce », `aria-haspopup="menu"`, `aria-expanded`), frère du lien de la carte. Le texte de la carte réserve 48 px à droite. Menu : carte blanche, rayon 12, bordure Trait, ombre menu, deux entrées au plus (« Modifier », « Annuler ») en 13 px 600 Marine, survol Voile. Échap ou clic extérieur le ferme.
- **Fenêtre modale** (`<dialog>` natif : annulation d'annonce, sortie d'un formulaire, suppression) : fond blanc, bordure Trait, rayon 12, marge intérieure 24 px, 384 px au plus, voile Marine à 50 % derrière, sans flou. Titre 18 px 800, boutons secondaires, un seul principal au plus. Erreur 13 px 600 Erreur.
- **Étiquette de carte (pill)** : fond Marine à 96 %, bordure et pointe de la couleur du statut, nom en capitales 12 px blanc, sous-ligne statut/distance blanc à 75 %. Version compacte (point seul) en cas de chevauchement. Fond de carte OpenFreeMap `positron`. Attribution OSM en pastille blanche à 80 %, sans chevauchement avec les étiquettes.
- **Feuille de bar** (bottom sheet) : fond blanc, bordure Trait, coins supérieurs 16, bouton de fermeture rond Voile.
- **États vides** : bloc à bordure pointillée Trait ; chips de prochaines dates en Voile, rayon complet.
- **Pied de page** (toutes les pages) : placé après le contenu, jamais fixé. Filet supérieur 1 px Trait, puis deux lignes centrées Geist 12 px Marine 3 : « CGU · Mentions légales · Contact » et « © <année> Jammix · Tous droits réservés · v<version> ». Liens soulignés au survol, au focus et sur leur page active. Sur les formulaires d'annonce, ses liens sont des sorties gardées.
- **E-mails** (`lib/email.ts`) : fond Brume, texte Marine, bouton Bleu signal texte blanc rayon 12, liens Bleu signal.

## À faire / à ne pas faire

- Utiliser uniquement les tokens `--harbor-*` ; pas de couleur de statut hors de la palette ci-dessus.
- Pas de noir pur ni de fond sombre ; pas de majuscules typographiques hors kickers ; pas de rayon inférieur à 12 px sur un conteneur ni sur un champ.
- Texte secondaire en Marine 2, jamais en gris neutre. Contraste AA minimal sur toutes les paires texte/fond.
- Aucun nom de personne dans l'interface.
- Ne pas modifier les règles métier en touchant au visuel (statuts d'annonce vs d'occurrence, J-7).
