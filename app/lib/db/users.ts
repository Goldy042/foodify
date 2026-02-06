import prisma from "@/lib/prisma";
import { Prisma, AccountStatus, Role } from "@/app/generated/prisma/client";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(input: {
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
}) {
  try {
    return await prisma.user.create({ data: input });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("EMAIL_EXISTS");
    }
    throw error;
  }
}

export async function updateUser(
  userId: string,
  updates: Partial<{
    fullName: string;
    status: AccountStatus;
  }>
) {
  return prisma.user.update({
    where: { id: userId },
    data: updates,
  });
}
