"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recadrerEtUploaderPhoto } from "@/lib/image";
import { coordonneesApresModification } from "@/lib/compte";
import { schemaFicheBar, schemaPhoto } from "@/lib/validation/inscription";
import { recupererBarDeLOrganisateurConnecte } from "@/lib/organisateur";

export async function mettreAJourFicheBar(
  formData: FormData
): Promise<{ erreur: string } | { succes: true }> {
  const resultat = schemaFicheBar.safeParse({
    nomBar: formData.get("nomBar"),
    adresseBar: formData.get("adresseBar"),
  });
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { nomBar, adresseBar } = resultat.data;
  const bar = await recupererBarDeLOrganisateurConnecte();

  // Adresse modifiée : re-géocodage ; en cas d'échec, le bar sort de la carte.
  const coordonnees = await coordonneesApresModification(bar.adresse, adresseBar);

  await prisma.bar.update({
    where: { id: bar.id },
    data: { nom: nomBar, adresse: adresseBar, ...coordonnees },
  });

  revalidatePath("/mon-bar");
  revalidatePath("/");
  return { succes: true };
}

export async function mettreAJourPhotoBar(
  formData: FormData
): Promise<{ erreur: string } | { succes: true }> {
  const fichier = formData.get("photo");
  const resultat = schemaPhoto.safeParse(fichier);
  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Photo invalide." };
  }

  const bar = await recupererBarDeLOrganisateurConnecte();
  const nouvellePhotoUrl = await recadrerEtUploaderPhoto(resultat.data, "bars");

  if (bar.photoUrl) {
    await del(bar.photoUrl).catch(() => undefined);
  }

  await prisma.bar.update({
    where: { id: bar.id },
    data: { photoUrl: nouvellePhotoUrl },
  });

  revalidatePath("/mon-bar");
  return { succes: true };
}

export async function retirerPhotoBar(): Promise<{ erreur: string } | { succes: true }> {
  const bar = await recupererBarDeLOrganisateurConnecte();

  if (bar.photoUrl) {
    await del(bar.photoUrl).catch(() => undefined);
  }

  await prisma.bar.update({
    where: { id: bar.id },
    data: { photoUrl: null },
  });

  revalidatePath("/mon-bar");
  return { succes: true };
}

export async function deconnecterOrganisateur() {
  await signOut({ redirectTo: "/connexion" });
}
