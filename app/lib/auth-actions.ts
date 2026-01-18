"use server";

import { redirect } from "next/navigation";

import { Prisma } from "@/app/generated/prisma/client";

import { signupRoleOptions } from "./constants";
import { hashPassword } from "./auth";
import {
  createUser,
  createVerificationToken,
  findUserByEmail,
  roleLabelToEnum,
} from "./db";
import { sendVerificationEmail } from "./email";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function logSignupError(error: unknown, email: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("[signup] prisma known error", {
      code: error.code,
      message: error.message,
      email,
    });
    return;
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("[signup] prisma init error", {
      message: error.message,
      email,
    });
    return;
  }
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    console.error("[signup] prisma unknown error", {
      message: error.message,
      email,
    });
    return;
  }
  console.error("[signup] unexpected error", { error, email });
}

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("fullName") || "").trim();
  const emailInput = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const roleInput = String(formData.get("role") || "");

  if (!fullName || !emailInput || !password) {
    redirect("/signup?error=missing-fields");
  }

  const role = signupRoleOptions.find((option) => option === roleInput);
  if (!role) {
    redirect("/signup?error=invalid-role");
  }

  const email = normalizeEmail(emailInput);

  try {
    const user = await createUser({
      fullName,
      email,
      passwordHash: hashPassword(password),
      role: roleLabelToEnum[role],
    });
    const token = await createVerificationToken(user.id);
    await sendVerificationEmail({ to: email, token });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_EXISTS") {
      redirect("/signup?error=email-exists");
    }
    logSignupError(error, email);
    redirect("/signup?error=signup-failed");
  }

  redirect(`/signup/verify?email=${encodeURIComponent(email)}`);
}

export async function resendVerification(formData: FormData) {
  const emailInput = String(formData.get("email") || "").trim();
  if (!emailInput) {
    redirect("/signup?error=missing-email");
  }

  const email = normalizeEmail(emailInput);
  const user = await findUserByEmail(email);
  if (!user) {
    redirect("/signup?error=not-found");
  }
  if (user.status !== "EMAIL_UNVERIFIED") {
    redirect("/signup?error=already-verified");
  }

  const token = await createVerificationToken(user.id);
  await sendVerificationEmail({ to: email, token });

  redirect(`/signup/verify?email=${encodeURIComponent(email)}&status=resent`);
}
