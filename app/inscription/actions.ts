"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { geocoderAdresse } from "@/lib/geocode";
import { recadrerEtUploaderPhoto } from "@/lib/image";
import { schemaInscription } from "@/lib/validation/inscription";
import { signIn } from "@/auth";
import { TOURS_HASHING } from "@/lib/auth-constantes";

export async function inscrireOrganisateur(
  formData: FormData
): Promise<{ erreur: string } | never> {
  const photoBrute = formData.get("photo");
  const photo = photoBrute instanceof File && photoBrute.size > 0 ? photoBrute : null;

  const resultat = schemaInscription.safeParse({
    email: formData.get("email"),
    motDePasse: formData.get("motDePasse"),
    nomBar: formData.get("nomBar"),
    adresseBar: formData.get("adresseBar"),
    photo,
  });

  if (!resultat.success) {
    return { erreur: resultat.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { email, motDePasse, nomBar, adresseBar } = resultat.data;

  const organisateurExistant = await prisma.organisateur.findUnique({
    where: { email },
  });
  if (organisateurExistant) {
    return { erreur: "Un compte existe déjà avec cet email." };
  }

  const [motDePasseHash, coordonnees, photoUrl] = await Promise.all([
    bcrypt.hash(motDePasse, TOURS_HASHING),
    geocoderAdresse(adresseBar),
    photo ? recadrerEtUploaderPhoto(photo, "bars") : Promise.resolve(null),
  ]);

  await prisma.organisateur.create({
    data: {
      email,
      motDePasseHash,
      bar: {
        create: {
          nom: nomBar,
          adresse: adresseBar,
          latitude: coordonnees?.latitude,
          longitude: coordonnees?.longitude,
          photoUrl,
        },
      },
    },
  });

  await signIn("credentials", { email, motDePasse, redirect: false });
  redirect("/mon-bar");
}
