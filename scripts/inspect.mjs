import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const orgs = await p.organisateur.findMany({ include: { bar: true } });
console.log(JSON.stringify(orgs, null, 2));
await p.$disconnect();
