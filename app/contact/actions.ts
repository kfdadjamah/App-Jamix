"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { CHAMP_PIEGE_CONTACT, schemaContact } from "@/lib/validation/contact";
import { adresseContact, emailMessageContact, envoyerEmail } from "@/lib/email";
import {
  DUREE_CONSERVATION_ENVOIS_MS,
  FENETRE_LIMITE_MS,
  empreinteIp,
  ipDuClient,
  limiteEnvoisAtteinte,
} from "@/lib/contact";

const ERREUR_ENVOI = "L'envoi a échoué, réessayez plus tard.";
const ERREUR_LIMITE = "Trop de messages envoyés, réessayez plus tard.";

/**
 * Envoi attendu (pas d'`after()`) pour afficher le succès ou l'échec. Seuls les
 * envois réussis sont enregistrés et comptent dans la limite.
 */
export async function envoyerMessageContact(
  formData: FormData
): Promise<{ erreur: string } | { succes: true }> {
  // Champ piège rempli : faux succès, rien n'est envoyé ni enregistré.
  const piege = formData.get(CHAMP_PIEGE_CONTACT);
  if (typeof piege === "string" && piege !== "") return { succes: true };

  const resultat = schemaContact.safeParse({
    nom: formData.get("nom"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const destinataire = adresseContact();
  if (!destinataire) {
    console.error("[contact] EMAIL_CONTACT absente : message non envoyé.");
    return { erreur: ERREUR_ENVOI };
  }

  let empreinte: string;
  try {
    empreinte = empreinteIp(ipDuClient(await headers()), process.env.AUTH_SECRET ?? "");
    const maintenant = new Date();

    await prisma.envoiContact.deleteMany({
      where: { creeLe: { lt: new Date(maintenant.getTime() - DUREE_CONSERVATION_ENVOIS_MS) } },
    });
    const envois = await prisma.envoiContact.findMany({
      where: {
        empreinteIp: empreinte,
        creeLe: { gt: new Date(maintenant.getTime() - FENETRE_LIMITE_MS) },
      },
      select: { creeLe: true },
    });
    if (limiteEnvoisAtteinte(envois.map((envoi) => envoi.creeLe), maintenant)) {
      return { erreur: ERREUR_LIMITE };
    }
  } catch (erreur) {
    console.error("[contact] Échec de la vérification de la limite :", erreur);
    return { erreur: ERREUR_ENVOI };
  }

  if (!(await envoyerEmail(emailMessageContact(destinataire, resultat.data)))) {
    return { erreur: ERREUR_ENVOI };
  }

  // Le message est parti : un échec d'enregistrement est journalisé sans être affiché.
  await prisma.envoiContact
    .create({ data: { empreinteIp: empreinte } })
    .catch((erreur) => console.error("[contact] Envoi non enregistré :", erreur));
  return { succes: true };
}
