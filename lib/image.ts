import sharp from "sharp";
import { put } from "@vercel/blob";

const TAILLE_CIBLE_PX = 512;

/**
 * Recadre une image en carré 1:1 (crop centré) et l'upload vers Vercel Blob.
 * Retourne l'URL publique du fichier stocké.
 */
export async function recadrerEtUploaderPhoto(
  fichier: File,
  dossier: "bars" | "annonces"
): Promise<string> {
  const buffer = Buffer.from(await fichier.arrayBuffer());

  const image = sharp(buffer).rotate();
  const metadonnees = await image.metadata();
  const cote = Math.min(metadonnees.width ?? TAILLE_CIBLE_PX, metadonnees.height ?? TAILLE_CIBLE_PX);

  const imageRecadree = await image
    .extract({
      left: Math.floor(((metadonnees.width ?? cote) - cote) / 2),
      top: Math.floor(((metadonnees.height ?? cote) - cote) / 2),
      width: cote,
      height: cote,
    })
    .resize(TAILLE_CIBLE_PX, TAILLE_CIBLE_PX)
    .webp({ quality: 85 })
    .toBuffer();

  const nomFichier = `${dossier}/${crypto.randomUUID()}.webp`;
  const resultat = await put(nomFichier, imageRecadree, {
    access: "public",
    contentType: "image/webp",
  });

  return resultat.url;
}
