import { Resend } from "resend";

const EXPEDITEUR_PAR_DEFAUT = "Jammix <onboarding@resend.dev>";
const EN_DEVELOPPEMENT = process.env.NODE_ENV !== "production";

type Email = {
  destinataire: string;
  sujet: string;
  html: string;
  texte: string;
  /** Adresse de réponse ; par défaut l'adresse de contact de l'équipe. */
  replyTo?: string;
};

/**
 * Envoie un email (compte ou message Contact) via Resend. Ne lève jamais : un échec est
 * journalisé et signalé par `false`. En développement, le texte de l'email
 * est écrit dans le terminal quand l'envoi n'a pas lieu (clé absente, ou
 * destinataire refusé par Resend en mode test).
 */
export async function envoyerEmail(email: Email): Promise<boolean> {
  const cle = process.env.RESEND_API_KEY;

  try {
    if (!cle) throw new Error("RESEND_API_KEY absente.");

    const replyTo = email.replyTo ?? adresseContact();
    const { error } = await new Resend(cle).emails.send({
      from: process.env.EMAIL_EXPEDITEUR ?? EXPEDITEUR_PAR_DEFAUT,
      to: email.destinataire,
      ...(replyTo ? { replyTo } : {}),
      subject: email.sujet,
      html: email.html,
      text: email.texte,
    });
    if (error) throw new Error(error.message);
    return true;
  } catch (erreur) {
    console.error(`[email] Échec de l'envoi à ${email.destinataire} :`, erreur);
    if (EN_DEVELOPPEMENT) {
      console.info(`[email] Contenu non envoyé (dev) :\n${email.texte}`);
    }
    return false;
  }
}

/** URL publique de l'application, pour les liens contenus dans les emails. */
export function urlApplication(): string {
  return process.env.URL_APP ?? "http://localhost:3000";
}

/**
 * Adresse de contact de l'équipe (Reply-To des emails de compte), ou `null`
 * tant que `EMAIL_CONTACT` n'est pas renseignée.
 */
export function adresseContact(): string | null {
  return process.env.EMAIL_CONTACT?.trim() || null;
}

/** Masque la partie locale d'un email : "kfd@gmail.com" → "k•••@gmail.com". */
export function masquerEmail(email: string): string {
  const arobase = email.lastIndexOf("@");
  if (arobase <= 0) return "•••";
  return `${email[0]}•••${email.slice(arobase)}`;
}

/** Date et heure d'un événement de compte, à l'heure de Paris (affichage seul). */
export function formaterDateHeure(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(date);
}

function echapperHtml(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Paragraphe de texte, ou lien texte souligné sur sa propre ligne. */
type Paragraphe = string | { lien: { libelle: string; url: string } };

/**
 * Gabarit commun des emails de compte : HTML sobre sur fond clair (les thèmes
 * sombres cassent dans les clients mail) et version texte brut.
 */
export function gabaritEmail({
  paragraphes,
  bouton,
  finale,
}: {
  paragraphes: Paragraphe[];
  bouton?: { libelle: string; url: string };
  finale?: Paragraphe[];
}): { html: string; texte: string } {
  const blocParagraphes = (lignes: Paragraphe[]) =>
    lignes
      .map((ligne) =>
        typeof ligne === "string"
          ? `<p style="margin:0 0 16px">${echapperHtml(ligne)}</p>`
          : `<p style="margin:0 0 16px"><a href="${echapperHtml(ligne.lien.url)}" style="color:#a8451f;text-decoration:underline">${echapperHtml(ligne.lien.libelle)}</a></p>`
      )
      .join("");
  const texteParagraphe = (ligne: Paragraphe) =>
    typeof ligne === "string" ? ligne : `${ligne.lien.libelle} : ${ligne.lien.url}`;

  const blocBouton = bouton
    ? `<p style="margin:24px 0"><a href="${echapperHtml(bouton.url)}" style="display:inline-block;background:#a8451f;color:#ffedd7;text-decoration:none;padding:14px 24px;border-radius:36px;font-weight:500;text-transform:uppercase;font-size:13px">${echapperHtml(bouton.libelle)}</a></p>`
    : "";

  const html = `<!doctype html><html lang="fr"><body style="margin:0;padding:24px;background:#ffffff;color:#1c1917;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.5"><div style="max-width:520px">${blocParagraphes(paragraphes)}${blocBouton}${blocParagraphes(finale ?? [])}<p style="margin:32px 0 0;color:#6c5f51;font-size:13px">Jammix — les jams à Lyon</p></div></body></html>`;

  const texte = [
    ...paragraphes.map(texteParagraphe),
    ...(bouton ? [`${bouton.libelle} : ${bouton.url}`] : []),
    ...(finale ?? []).map(texteParagraphe),
    "Jammix — les jams à Lyon",
  ].join("\n\n");

  return { html, texte };
}

export function emailReinitialisationMotDePasse(destinataire: string, lien: string): Email {
  return {
    destinataire,
    sujet: "Réinitialisation de votre mot de passe Jammix",
    ...gabaritEmail({
      paragraphes: [
        "Bonjour,",
        "Vous avez demandé à réinitialiser le mot de passe de votre compte organisateur Jammix.",
      ],
      bouton: { libelle: "Choisir un nouveau mot de passe", url: lien },
      finale: [
        "Ce lien est valable 1 heure et ne peut servir qu'une fois.",
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.",
      ],
    }),
  };
}

export function emailBienvenue(destinataire: string, nomBar: string): Email {
  const url = urlApplication();
  return {
    destinataire,
    sujet: "Bienvenue sur Jammix",
    ...gabaritEmail({
      paragraphes: [
        "Bonjour,",
        `Votre compte organisateur pour ${nomBar} est créé. Vous pouvez dès maintenant publier les jams de votre bar : elles seront visibles par les musiciens lyonnais.`,
      ],
      bouton: { libelle: "Publier une jam", url: `${url}/mes-annonces/nouvelle` },
      finale: [
        "Si vous n'êtes pas à l'origine de cette inscription, vous pouvez reprendre la main sur ce compte via « Mot de passe oublié », puis le supprimer depuis votre profil.",
        { lien: { libelle: "Mot de passe oublié", url: `${url}/mot-de-passe-oublie` } },
      ],
    }),
  };
}

/** Avis commun au changement (depuis le profil) et à la réinitialisation du mot de passe. */
export function emailAvisMotDePasse(
  destinataire: string,
  origine: "modifie" | "reinitialise",
  date: Date
): Email {
  const action = origine === "modifie" ? "modifié" : "réinitialisé";
  return {
    destinataire,
    sujet: `Votre mot de passe Jammix a été ${action}`,
    ...gabaritEmail({
      paragraphes: [
        "Bonjour,",
        `Le mot de passe de votre compte organisateur Jammix a été ${action} le ${formaterDateHeure(date)}.`,
        "Si vous êtes à l'origine de ce changement, vous n'avez rien à faire. Sinon, réinitialisez votre mot de passe sans attendre.",
      ],
      bouton: {
        libelle: "Réinitialiser mon mot de passe",
        url: `${urlApplication()}/mot-de-passe-oublie`,
      },
    }),
  };
}

/** Avis envoyé à l'ancienne adresse quand l'email du compte change. */
export function emailAvisChangementEmail(
  ancienneAdresse: string,
  nouvelleAdresse: string,
  date: Date
): Email {
  const recours = adresseContact()
    ? "Si vous n'êtes pas à l'origine de ce changement, répondez à cet email."
    : "Si vous n'êtes pas à l'origine de ce changement, contactez l'équipe Jammix.";
  return {
    destinataire: ancienneAdresse,
    sujet: "L'email de votre compte Jammix a été modifié",
    ...gabaritEmail({
      paragraphes: [
        "Bonjour,",
        `L'adresse email de votre compte organisateur Jammix a été remplacée par ${masquerEmail(nouvelleAdresse)} le ${formaterDateHeure(date)}. Cette adresse-ci ne recevra plus les messages du compte.`,
        recours,
      ],
    }),
  };
}

/**
 * Message du formulaire Contact, envoyé à l'équipe (jamais à l'expéditeur) :
 * « Répondre » vise l'email saisi par l'expéditeur.
 */
export function emailMessageContact(
  destinataire: string,
  message: { nom: string; email: string; message: string }
): Email {
  return {
    destinataire,
    replyTo: message.email,
    sujet: `Message Contact Jammix — ${message.nom}`,
    ...gabaritEmail({
      paragraphes: [
        `Nom : ${message.nom}`,
        `Email : ${message.email}`,
        "Message :",
        ...message.message.split("\n").filter((ligne) => ligne.trim() !== ""),
      ],
    }),
  };
}
