"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recadrerEtUploaderPhoto } from "@/lib/image";
import { schemaPhoto } from "@/lib/validation/inscription";
import { recupererBarDeLOrganisateurConnecte } from "@/lib/organisateur";

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
