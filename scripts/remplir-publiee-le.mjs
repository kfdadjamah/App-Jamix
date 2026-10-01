// Phase 18 : les annonces publiées avant l'ajout de `publieeLe` reçoivent leur `createdAt`.
// Idempotent : seules les annonces publiées sans `publieeLe` sont mises à jour.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const nombre = await prisma.$executeRaw`
  UPDATE "Annonce" SET "publieeLe" = "createdAt"
  WHERE "statut" = 'PUBLIEE' AND "publieeLe" IS NULL`;
console.log(`Annonces mises à jour : ${nombre}`);
await prisma.$disconnect();
