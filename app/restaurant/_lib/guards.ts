import { type User } from "@/app/generated/prisma/client";
import { requireRestaurantAccess } from "@/app/restaurant/_lib/access";

export async function requireRestaurantUser(): Promise<User> {
  const access = await requireRestaurantAccess("VIEW_DASHBOARD");
  return access.user;
}
