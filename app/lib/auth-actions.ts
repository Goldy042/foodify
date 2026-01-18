"use server";

import { redirect } from "next/navigation";

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
