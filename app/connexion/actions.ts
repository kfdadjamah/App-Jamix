"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { schemaConnexion } from "@/lib/validation/inscription";
import { signIn } from "@/auth";

export async function connecterOrganisateur(
  formData: FormData
): Promise<{ erreur: string } | never> {
  const resultat = schemaConnexion.safeParse({
    email: formData.get("email"),
    motDePasse: formData.get("motDePasse"),
  });

  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  try {
    await signIn("credentials", {
      email: resultat.data.email,
      motDePasse: resultat.data.motDePasse,
      redirect: false,
    });
  } catch (erreur) {
    if (erreur instanceof AuthError) {
      return { erreur: "Email ou mot de passe incorrect." };
    }
    throw erreur;
  }

  redirect("/mon-bar");
}
