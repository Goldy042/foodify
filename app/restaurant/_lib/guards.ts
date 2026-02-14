import { redirect } from "next/navigation";

import { Role, type User } from "@/app/generated/prisma/client";
import { getUserFromSession } from "@/app/lib/session";

export async function requireRestaurantUser(): Promise<User> {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== Role.RESTAURANT) {
    redirect(`/onboarding/${user.role.toLowerCase()}`);
  }

  if (user.status === "EMAIL_UNVERIFIED") {
    redirect(`/signup/verify?email=${encodeURIComponent(user.email)}`);
  }

  if (user.status === "EMAIL_VERIFIED" || user.status === "REJECTED") {
    redirect("/onboarding/restaurant");
  }

  return user;
}

