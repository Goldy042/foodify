import { PrismaClient } from "@/app/generated/prisma/client";
import "dotenv/config";

const accelerateUrl =
  process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL || "";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    accelerateUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
