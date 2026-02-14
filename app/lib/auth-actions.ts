"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";

import { signupRoleOptions } from "./constants";
import { hashPassword, verifyPassword } from "./auth";
import {
  createUser,
  createVerificationToken,
  createSession,
  deleteSessionByToken,
  findUserByEmail,
  roleLabelToEnum,
} from "./db";
import { sendVerificationEmail } from "./email";
import { getPostLoginRedirectPath } from "./role-routing";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const roleAliases: Record<string, (typeof signupRoleOptions)[number]> = {
  customer: "Customer",
  customers: "Customer",
  restaurant: "Restaurant",
  restaurants: "Restaurant",
  resturants: "Restaurant",
  driver: "Driver",
  drivers: "Driver",
  rider: "Driver",
  riders: "Driver",
};

function normalizeRoleInput(roleInput: string) {
  const normalized = roleInput.trim().toLowerCase();
  return (
    roleAliases[normalized] ??
    signupRoleOptions.find(
      (option) => option.toLowerCase() === normalized
    ) ??
    null
  );
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

function logSigninError(error: unknown, email: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("[signin] prisma known error", {
      code: error.code,
      message: error.message,
      email,
    });
    return;
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error("[signin] prisma init error", {
      message: error.message,
      email,
    });
    return;
  }
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    console.error("[signin] prisma unknown error", {
      message: error.message,
      email,
    });
    return;
  }
  console.error("[signin] unexpected error", { error, email });
}

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("fullName") || "").trim();
  const emailInput = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const roleInput = String(formData.get("role") || "");

  if (!fullName || !emailInput || !password) {
    redirect("/signup?error=missing-fields");
  }

  const role = normalizeRoleInput(roleInput);
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

export async function signIn(formData: FormData) {
  const emailInput = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!emailInput || !password) {
    redirect("/login?error=missing-fields");
  }

  const email = normalizeEmail(emailInput);
  let user;

  try {
    user = await findUserByEmail(email);
  } catch (error) {
    logSigninError(error, email);
    redirect("/login?error=login-failed");
  }

  if (!user || !verifyPassword(password, user.passwordHash)) {
    redirect("/login?error=invalid-credentials");
  }

  if (user.isSuspended) {
    redirect("/login?error=suspended");
  }

  const staffMembership = await prisma.restaurantStaffMember.findFirst({
    where: { userId: user.id },
    select: { id: true, status: true },
  });
  if (staffMembership?.status === "DISABLED") {
    redirect("/login?error=staff-disabled");
  }
  if (staffMembership?.status === "INVITED") {
    await prisma.restaurantStaffMember.update({
      where: { id: staffMembership.id },
      data: {
        status: "ACTIVE",
        acceptedAt: new Date(),
        inviteToken: null,
        inviteExpiresAt: null,
      },
    });
  }

  if (user.status === "EMAIL_UNVERIFIED") {
    redirect(`/signup/verify?email=${encodeURIComponent(email)}`);
  }

  let sessionToken: string;
  try {
    sessionToken = await createSession(user.id);
  } catch (error) {
    logSigninError(error, email);
    redirect("/login?error=login-failed");
  }

  const cookieStore = await cookies();
  cookieStore.set("foodify_session", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  const redirectPath = staffMembership
    ? "/restaurant"
    : getPostLoginRedirectPath({ role: user.role, status: user.status });
  redirect(redirectPath);
}

export async function signOut() {
  const cookieStore = await cookies();
  const token = cookieStore.get("foodify_session")?.value;

  if (token) {
    await deleteSessionByToken(token);
  }

  cookieStore.set("foodify_session", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  cookieStore.delete({ name: "foodify_session", path: "/" });
  redirect("/login");
}
