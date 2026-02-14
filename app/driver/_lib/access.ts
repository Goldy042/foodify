import { redirect } from "next/navigation";

import { Role } from "@/app/generated/prisma/client";
import { getUserFromSession } from "@/app/lib/session";
import { getDriverProfile } from "@/app/lib/db";

export async function requireDriverAccess() {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== Role.DRIVER) {
    redirect(`/onboarding/${user.role.toLowerCase()}`);
  }

  if (user.isSuspended) {
    redirect("/login?error=suspended");
  }

  if (user.status === "EMAIL_UNVERIFIED") {
    redirect(`/signup/verify?email=${encodeURIComponent(user.email)}`);
  }

  if (user.status !== "APPROVED") {
    redirect("/onboarding/driver");
  }

  const profile = await getDriverProfile(user.id);
  if (!profile) {
    redirect("/onboarding/driver");
  }

  return { user, profile };
}
