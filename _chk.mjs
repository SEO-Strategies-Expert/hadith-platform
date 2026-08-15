import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
console.log("admission_applications rows =", await p.admissionApplication.count());
await p.$disconnect();
