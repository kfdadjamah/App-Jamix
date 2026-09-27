import { Resend } from "resend";

const EXPEDITEUR_PAR_DEFAUT = "Jamix <onboarding@resend.dev>";
const EN_DEVELOPPEMENT = process.env.NODE_ENV !== "production";

type Email = {
  destinataire: string;
  sujet: string;
  html: string;
  texte: string;
};

/**
 * Envoie un email de compte via Resend. Ne lève jamais : un échec est
 * journalisé et signalé par `false`. En développement, le texte de l'email
 * est écrit dans le terminal quand l'envoi n'a pas lieu (clé absente, ou
 * destinataire refusé par Resend en mode test).
 */
export async function envoyerEmail(email: Email): Promise<boolean> {
  const cle = process.env.RESEND_API_KEY;

  try {
    if (!cle) throw new Error("RESEND_API_KEY absente.");

    const { error } = await new Resend(cle).emails.send({
      from: process.env.EMAIL_EXPEDITEUR ?? EXPEDITEUR_PAR_DEFAUT,
      to: email.destinataire,
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

function echapperHtml(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Gabarit commun des emails de compte : HTML sobre sur fond clair (les thèmes
 * sombres cassent dans les clients mail) et version texte brut.
 */
export function gabaritEmail({
  paragraphes,
  bouton,
  finale,
}: {
  paragraphes: string[];
  bouton?: { libelle: string; url: string };
  finale?: string[];
}): { html: string; texte: string } {
  const blocParagraphes = (lignes: string[]) =>
    lignes
      .map((ligne) => `<p style="margin:0 0 16px">${echapperHtml(ligne)}</p>`)
      .join("");

  const blocBouton = bouton
    ? `<p style="margin:24px 0"><a href="${echapperHtml(bouton.url)}" style="display:inline-block;background:#a8451f;color:#ffedd7;text-decoration:none;padding:14px 24px;border-radius:36px;font-weight:500;text-transform:uppercase;font-size:13px">${echapperHtml(bouton.libelle)}</a></p>`
    : "";

  const html = `<!doctype html><html lang="fr"><body style="margin:0;padding:24px;background:#ffffff;color:#1c1917;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.5"><div style="max-width:520px">${blocParagraphes(paragraphes)}${blocBouton}${blocParagraphes(finale ?? [])}<p style="margin:32px 0 0;color:#6c5f51;font-size:13px">Jamix — les jams à Lyon</p></div></body></html>`;

  const texte = [
    ...paragraphes,
    ...(bouton ? [`${bouton.libelle} : ${bouton.url}`] : []),
    ...(finale ?? []),
    "Jamix — les jams à Lyon",
  ].join("\n\n");

  return { html, texte };
}

export function emailReinitialisationMotDePasse(destinataire: string, lien: string): Email {
  return {
    destinataire,
    sujet: "Réinitialisation de votre mot de passe Jamix",
    ...gabaritEmail({
      paragraphes: [
        "Bonjour,",
        "Vous avez demandé à réinitialiser le mot de passe de votre compte organisateur Jamix.",
      ],
      bouton: { libelle: "Choisir un nouveau mot de passe", url: lien },
      finale: [
        "Ce lien est valable 1 heure et ne peut servir qu'une fois.",
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email : votre mot de passe reste inchangé.",
      ],
    }),
  };
}
