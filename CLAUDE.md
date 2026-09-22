# App-Jamix

## Stack
Next.js (TypeScript), Postgres.

## Documents projet
Toujours lire ces documents avant de coder :
- @docs/PRD.md — pourquoi et quoi du produit
- @docs/PLAN.md — phases d'implémentation et user stories
- @docs/DESIGN.md — système design et direction visuelle

## Système design
Toujours lire DESIGN.md avant toute décision visuelle ou UI. Polices, couleurs, espacements et direction esthétique y sont définis. Ne pas dévier sans validation explicite. En mode QA, signaler tout code qui ne respecte pas DESIGN.md.

## Conventions
- Une annonce a deux statuts indépendants : Brouillon/Publiée (annonce) et confirmée/programmée/en attente/annulée (par occurrence) — ne pas les confondre.
- Chaque date d'une annonce récurrente est une OccurrenceJam à part entière, avec son propre cycle de confirmation J-7.
- Confirmation J-7 : relances in-app uniquement (jamais email/SMS), à J-5/J-3/J-2/J-1/J0, seulement après dépassement de J-7 sans confirmation.
- Modification/annulation d'une annonce récurrente : l'organisateur choisit explicitement la portée (date seule vs toutes les dates).
- Un compte organisateur est rattaché à un seul bar ; pas de multi-bar.

## Jargon métier
- Occurrence : une date précise d'une annonce, avec son propre statut, distincte de l'annonce elle-même.
- J-7 : échéance de confirmation, 7 jours avant une date d'occurrence.
- Portée (ciblée/globale) : appliquer une modif/annulation à une occurrence seule ou à toutes celles de l'annonce récurrente.
