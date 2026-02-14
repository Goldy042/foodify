import { AccountStatus, Role } from "@/app/generated/prisma/client";

type RoleRedirectInput = {
  role: Role;
  status: AccountStatus;
};

export function getPostLoginRedirectPath(input: RoleRedirectInput) {
  if (input.role === Role.CUSTOMER) {
    if (input.status === "PROFILE_COMPLETED") {
      return "/app";
    }
    return "/onboarding/customer";
  }

  if (input.role === Role.RESTAURANT) {
    if (
      input.status === "PROFILE_COMPLETED" ||
      input.status === "PENDING_APPROVAL" ||
      input.status === "APPROVED"
    ) {
      return "/restaurant";
    }
    return "/onboarding/restaurant";
  }

  if (input.role === Role.DRIVER) {
    if (input.status === "APPROVED") {
      return "/driver";
    }
    return "/onboarding/driver";
  }

  return "/";
}


