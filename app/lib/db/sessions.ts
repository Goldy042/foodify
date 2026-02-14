import prisma from "@/lib/prisma";
import { generateToken } from "@/app/lib/auth";

export async function createSession(userId: string) {
  const token = generateToken(24);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
  return token;
}

export async function getUserBySessionToken(token: string) {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) {
    return null;
  }
  if (session.expiresAt.getTime() < Date.now()) {
    return null;
  }
  return session.user;
}

export async function deleteSessionByToken(token: string) {
  await prisma.session.deleteMany({
    where: { token },
  });
}
