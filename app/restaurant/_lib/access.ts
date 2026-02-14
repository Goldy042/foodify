import { redirect } from "next/navigation";

import {
  RestaurantStaffRole,
  RestaurantStaffStatus,
  Role,
  type User,
} from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import { getUserFromSession } from "@/app/lib/session";

export type RestaurantPermission =
  | "VIEW_DASHBOARD"
  | "MANAGE_ORDERS"
  | "MANAGE_MENU"
  | "MANAGE_STAFF"
  | "MANAGE_SETTINGS";

type RestaurantAccessContext = {
  user: User;
  restaurantId: string;
  isOwner: boolean;
  staffRole: RestaurantStaffRole | null;
  staffStatus: RestaurantStaffStatus | null;
};

const permissionByStaffRole: Record<RestaurantPermission, RestaurantStaffRole[]> = {
  VIEW_DASHBOARD: ["MANAGER", "SUPERVISOR", "KITCHEN", "CASHIER"],
  MANAGE_ORDERS: ["MANAGER", "SUPERVISOR", "KITCHEN", "CASHIER"],
  MANAGE_MENU: ["MANAGER", "SUPERVISOR"],
  MANAGE_STAFF: ["MANAGER"],
  MANAGE_SETTINGS: ["MANAGER"],
};

async function getRestaurantAccessContext(user: User): Promise<RestaurantAccessContext | null> {
  const ownedRestaurant = await prisma.restaurantProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (ownedRestaurant) {
    return {
      user,
      restaurantId: ownedRestaurant.id,
      isOwner: true,
      staffRole: null,
      staffStatus: null,
    };
  }

  const staffMembership = await prisma.restaurantStaffMember.findFirst({
    where: {
      userId: user.id,
    },
    select: {
      restaurantId: true,
      role: true,
      status: true,
    },
  });

  if (!staffMembership) {
    return null;
  }

  return {
    user,
    restaurantId: staffMembership.restaurantId,
    isOwner: false,
    staffRole: staffMembership.role,
    staffStatus: staffMembership.status,
  };
}

function canStaffPerform(permission: RestaurantPermission, role: RestaurantStaffRole | null) {
  if (!role) {
    return false;
  }
  return permissionByStaffRole[permission].includes(role);
}

export async function requireRestaurantAccess(
  permission: RestaurantPermission = "VIEW_DASHBOARD"
): Promise<RestaurantAccessContext> {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }

  if (user.status === "EMAIL_UNVERIFIED") {
    redirect(`/signup/verify?email=${encodeURIComponent(user.email)}`);
  }

  const access = await getRestaurantAccessContext(user);
  if (!access) {
    if (user.role === Role.RESTAURANT) {
      if (user.status === "EMAIL_VERIFIED" || user.status === "REJECTED") {
        redirect("/onboarding/restaurant");
      }
      redirect("/onboarding/restaurant");
    }
    redirect(`/onboarding/${user.role.toLowerCase()}`);
  }

  if (!access.isOwner) {
    if (access.staffStatus === "INVITED") {
      redirect("/login?error=staff-invite-pending");
    }
    if (access.staffStatus === "DISABLED") {
      redirect("/login?error=staff-disabled");
    }

    if (!canStaffPerform(permission, access.staffRole)) {
      redirect("/restaurant?error=insufficient-permissions");
    }
  }

  return access;
}
