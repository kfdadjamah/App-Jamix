import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const p = new PrismaClient();

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

function dansNJours(n) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return new Date(d.getTime() + n * MS_PAR_JOUR);
}

function calculerStatutInitial(date) {
  const aujourdHui = dansNJours(0);
  const ecartJours = Math.round((date.getTime() - aujourdHui.getTime()) / MS_PAR_JOUR);
  if (ecartJours > 7) {
    const confirmationJ7 = new Date(date.getTime() - 7 * MS_PAR_JOUR);
    return { statut: "PROGRAMMEE", confirmationJ7 };
  }
  return { statut: "CONFIRMEE", confirmationJ7: null };
}

async function creerOrganisateurAvecBar({ email, motDePasse, nomBar, adresse, latitude, longitude }) {
  const motDePasseHash = await bcrypt.hash(motDePasse, 12);
  const organisateur = await p.organisateur.upsert({
    where: { email },
    update: { motDePasseHash },
    create: { email, motDePasseHash },
  });
  const bar = await p.bar.upsert({
    where: { organisateurId: organisateur.id },
    update: { nom: nomBar, adresse, latitude, longitude },
    create: { nom: nomBar, adresse, latitude, longitude, organisateurId: organisateur.id },
  });
  return { organisateur, bar };
}

async function creerAnnonce({ barId, statut, styles, instruments, heureDebut, heureFin, dates, forcerAnnuleeSurPremiere = false }) {
  const annonce = await p.annonce.create({
    data: {
      barId,
      statut,
      estRecurrente: dates.length > 1,
      styles,
      instruments,
    },
  });

  if (statut === "PUBLIEE" && dates.length > 0) {
    await p.occurrenceJam.createMany({
      data: dates.map((date, index) => {
        const initial = calculerStatutInitial(date);
        if (forcerAnnuleeSurPremiere && index === 0) {
          return {
            annonceId: annonce.id,
            date,
            heureDebut,
            heureFin,
            statut: "ANNULEE",
            confirmationJ7: null,
          };
        }
        return {
          annonceId: annonce.id,
          date,
          heureDebut,
          heureFin,
          ...initial,
        };
      }),
    });
  }

  return annonce;
}

async function main() {
  // Réinitialise le mot de passe du compte de test existant pour la démo
  const { bar: sousSol } = await creerOrganisateurAvecBar({
    email: "test-organisateur@jamix.fr",
    motDePasse: "test1234",
    nomBar: "Le Sous-Sol",
    adresse: "18 rue Sainte-Hélène, Lyon",
    latitude: 45.754825,
    longitude: 4.829521,
  });

  const { bar: chezMimi } = await creerOrganisateurAvecBar({
    email: "chezmimi@jamix.fr",
    motDePasse: "test1234",
    nomBar: "Chez Mimi",
    adresse: "5 rue Burdeau, Lyon",
    latitude: 45.769,
    longitude: 4.831,
  });

  const { bar: croixRousse } = await creerOrganisateurAvecBar({
    email: "croixrousse@jamix.fr",
    motDePasse: "test1234",
    nomBar: "Jam Session Croix-Rousse",
    adresse: "12 boulevard de la Croix-Rousse, Lyon",
    latitude: 45.775,
    longitude: 4.827,
  });

  // Nettoyage des annonces précédemment seedées pour ces bars (idempotence)
  await p.annonce.deleteMany({ where: { barId: { in: [sousSol.id, chezMimi.id, croixRousse.id] } } });

  // Le Sous-Sol : annonce ponctuelle confirmée directement (publiée à J-3)
  await creerAnnonce({
    barId: sousSol.id,
    statut: "PUBLIEE",
    styles: ["Jazz", "Impro"],
    instruments: ["Batterie complète", "Ampli basse", "Micros + sono"],
    heureDebut: "20:00",
    heureFin: "23:00",
    dates: [dansNJours(3)],
  });

  // Le Sous-Sol : annonce récurrente mêlant Programmée et Confirmée
  await creerAnnonce({
    barId: sousSol.id,
    statut: "PUBLIEE",
    styles: ["Funk", "Soul"],
    instruments: ["Clavier/piano", "Ampli guitare"],
    heureDebut: "19:30",
    heureFin: "22:30",
    dates: [dansNJours(5), dansNJours(10), dansNJours(20)],
  });

  // Le Sous-Sol : brouillon (ne doit jamais apparaître côté musicien)
  await creerAnnonce({
    barId: sousSol.id,
    statut: "BROUILLON",
    styles: ["Rock"],
    instruments: [],
    heureDebut: "21:00",
    heureFin: null,
    dates: [],
  });

  // Chez Mimi : occurrence "en attente de confirmation" (J-7 dépassé, non confirmée)
  await p.$transaction(async (tx) => {
    const annonce = await tx.annonce.create({
      data: {
        barId: chezMimi.id,
        statut: "PUBLIEE",
        estRecurrente: false,
        styles: ["Blues"],
        instruments: ["Ampli guitare", "Micros + sono"],
      },
    });
    await tx.occurrenceJam.create({
      data: {
        annonceId: annonce.id,
        date: dansNJours(5),
        heureDebut: "20:30",
        heureFin: "23:30",
        statut: "PROGRAMMEE",
        confirmationJ7: dansNJours(-2), // échéance J-7 déjà dépassée, jamais confirmée
      },
    });
  });

  // Croix-Rousse : jam confirmée imminente + une date annulée dans la même annonce récurrente
  await creerAnnonce({
    barId: croixRousse.id,
    statut: "PUBLIEE",
    styles: ["Reggae", "Latin"],
    instruments: ["Cajón", "Micros + sono"],
    heureDebut: "19:00",
    heureFin: "22:00",
    dates: [dansNJours(1), dansNJours(8)],
    forcerAnnuleeSurPremiere: false,
  });

  await p.$transaction(async (tx) => {
    const annonce = await tx.annonce.create({
      data: {
        barId: croixRousse.id,
        statut: "PUBLIEE",
        estRecurrente: false,
        styles: ["Pop"],
        instruments: [],
      },
    });
    await tx.occurrenceJam.create({
      data: {
        annonceId: annonce.id,
        date: dansNJours(6),
        heureDebut: "18:00",
        heureFin: "20:00",
        statut: "ANNULEE",
        confirmationJ7: null,
      },
    });
  });

  console.log("Données de test créées.");
  console.log("Comptes organisateurs (mot de passe: test1234) :");
  console.log("  - test-organisateur@jamix.fr (Le Sous-Sol)");
  console.log("  - chezmimi@jamix.fr (Chez Mimi)");
  console.log("  - croixrousse@jamix.fr (Jam Session Croix-Rousse)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
