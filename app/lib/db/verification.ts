import prisma from "@/lib/prisma";
import { generateToken } from "@/app/lib/auth";

export async function createVerificationToken(userId: string) {
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await prisma.verificationToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
  return token;
}

export async function consumeVerificationToken(token: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record) {
    return null;
  }
  if (record.usedAt) {
    return null;
  }
  if (record.expiresAt.getTime() < Date.now()) {
    return null;
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return tx.user.update({
      where: { id: record.userId },
      data: { status: "EMAIL_VERIFIED" },
    });
  });

  return updated;
}
