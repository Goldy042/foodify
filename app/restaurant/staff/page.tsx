import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Prisma,
  RestaurantStaffRole,
  RestaurantStaffStatus,
} from "@/app/generated/prisma/client";

import prisma from "@/lib/prisma";
import { generateToken } from "@/app/lib/auth";
import { AppHeader } from "@/components/app/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  restaurantStaffRoleEnumToLabel,
  restaurantStaffRoleLabelToEnum,
  restaurantStaffStatusEnumToLabel,
} from "@/app/lib/db";
import { requireRestaurantAccess } from "@/app/restaurant/_lib/access";

type PageProps = {
  searchParams?:
    | Promise<{ role?: string; status?: string; flash?: string; error?: string }>
    | { role?: string; status?: string; flash?: string; error?: string };
};

const STAFF_ROLES: RestaurantStaffRole[] = [
  RestaurantStaffRole.MANAGER,
  RestaurantStaffRole.SUPERVISOR,
  RestaurantStaffRole.KITCHEN,
  RestaurantStaffRole.CASHIER,
];

const STAFF_STATUSES: RestaurantStaffStatus[] = [
  RestaurantStaffStatus.INVITED,
  RestaurantStaffStatus.ACTIVE,
  RestaurantStaffStatus.DISABLED,
];

const allowedStatusTransitions: Record<RestaurantStaffStatus, RestaurantStaffStatus[]> = {
  INVITED: ["DISABLED"],
  ACTIVE: ["DISABLED"],
  DISABLED: ["ACTIVE"],
};

const successMessages: Record<string, string> = {
  "staff-invited": "Staff invite created.",
  "staff-role-updated": "Staff role updated.",
  "staff-status-updated": "Staff status updated.",
};

const errorMessages: Record<string, string> = {
  "invalid-staff-name": "Enter a valid full name.",
  "invalid-staff-email": "Enter a valid email address.",
  "invalid-staff-role": "Choose a valid staff role.",
  "invalid-staff-status": "Choose a valid staff status.",
  "staff-not-found": "Staff member was not found for your restaurant.",
  "invalid-status-transition": "This status change is not allowed.",
  "staff-email-exists": "A staff member with this email already exists.",
  "staff-email-linked": "This email is already linked to an active staff account.",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isStaffRole(value: string): value is RestaurantStaffRole {
  return STAFF_ROLES.includes(value as RestaurantStaffRole);
}

function isStaffStatus(value: string): value is RestaurantStaffStatus {
  return STAFF_STATUSES.includes(value as RestaurantStaffStatus);
}

function canTransitionStatus(from: RestaurantStaffStatus, to: RestaurantStaffStatus) {
  return allowedStatusTransitions[from].includes(to);
}

export default async function RestaurantStaffPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const access = await requireRestaurantAccess("MANAGE_STAFF");
  const restaurantId = access.restaurantId;

  async function inviteStaff(formData: FormData) {
    "use server";

    const authedAccess = await requireRestaurantAccess("MANAGE_STAFF");
    const authedRestaurantId = authedAccess.restaurantId;

    const fullName = String(formData.get("fullName") || "").trim();
    const emailInput = String(formData.get("email") || "");
    const roleInput = String(formData.get("role") || "").trim();
    const role = restaurantStaffRoleLabelToEnum[roleInput as keyof typeof restaurantStaffRoleLabelToEnum];
    const email = normalizeEmail(emailInput);

    if (!fullName) {
      redirect("/restaurant/staff?error=invalid-staff-name");
    }
    if (!email || !EMAIL_PATTERN.test(email)) {
      redirect("/restaurant/staff?error=invalid-staff-email");
    }
    if (!role || !isStaffRole(role)) {
      redirect("/restaurant/staff?error=invalid-staff-role");
    }

    const inviteToken = generateToken(24);
    const inviteExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    const existingStaff = await prisma.restaurantStaffMember.findFirst({
      where: {
        restaurantId: authedRestaurantId,
        email,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (existingStaff?.userId) {
      redirect("/restaurant/staff?error=staff-email-linked");
    }

    try {
      if (existingStaff) {
        await prisma.restaurantStaffMember.update({
          where: { id: existingStaff.id },
          data: {
            fullName,
            role,
            status: "INVITED",
            inviteToken,
            inviteExpiresAt,
          },
        });
      } else {
        await prisma.restaurantStaffMember.create({
          data: {
            restaurantId: authedRestaurantId,
            fullName,
            email,
            role,
            status: RestaurantStaffStatus.INVITED,
            inviteToken,
            inviteExpiresAt,
          },
        });
      }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        redirect("/restaurant/staff?error=staff-email-exists");
      }
      throw error;
    }

    redirect("/restaurant/staff?flash=staff-invited");
  }

  async function updateStaffRole(formData: FormData) {
    "use server";

    const authedAccess = await requireRestaurantAccess("MANAGE_STAFF");
    const authedRestaurantId = authedAccess.restaurantId;

    const staffId = String(formData.get("staffId") || "").trim();
    const roleInput = String(formData.get("role") || "").trim();

    if (!staffId) {
      redirect("/restaurant/staff?error=staff-not-found");
    }

    const parsedRole = roleInput as RestaurantStaffRole;
    if (!isStaffRole(parsedRole)) {
      redirect("/restaurant/staff?error=invalid-staff-role");
    }

    const staffMember = await prisma.restaurantStaffMember.findFirst({
      where: {
        id: staffId,
        restaurantId: authedRestaurantId,
      },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!staffMember) {
      redirect("/restaurant/staff?error=staff-not-found");
    }

    if (staffMember.status === "DISABLED" && (parsedRole === "MANAGER" || parsedRole === "SUPERVISOR")) {
      redirect("/restaurant/staff?error=invalid-staff-role");
    }

    if (staffMember.role !== parsedRole) {
      await prisma.restaurantStaffMember.update({
        where: { id: staffMember.id },
        data: { role: parsedRole },
      });
    }

    redirect("/restaurant/staff?flash=staff-role-updated");
  }

  async function updateStaffStatus(formData: FormData) {
    "use server";

    const authedAccess = await requireRestaurantAccess("MANAGE_STAFF");
    const authedRestaurantId = authedAccess.restaurantId;

    const staffId = String(formData.get("staffId") || "").trim();
    const statusInput = String(formData.get("status") || "").trim();

    if (!staffId) {
      redirect("/restaurant/staff?error=staff-not-found");
    }

    const parsedStatus = statusInput as RestaurantStaffStatus;
    if (!isStaffStatus(parsedStatus)) {
      redirect("/restaurant/staff?error=invalid-staff-status");
    }

    const staffMember = await prisma.restaurantStaffMember.findFirst({
      where: {
        id: staffId,
        restaurantId: authedRestaurantId,
      },
      select: {
        id: true,
        status: true,
        userId: true,
      },
    });

    if (!staffMember) {
      redirect("/restaurant/staff?error=staff-not-found");
    }

    if (parsedStatus === "INVITED") {
      redirect("/restaurant/staff?error=invalid-status-transition");
    }

    if (parsedStatus === "ACTIVE" && !staffMember.userId) {
      redirect("/restaurant/staff?error=invalid-status-transition");
    }

    if (staffMember.status !== parsedStatus && !canTransitionStatus(staffMember.status, parsedStatus)) {
      redirect("/restaurant/staff?error=invalid-status-transition");
    }

    if (staffMember.status !== parsedStatus) {
      await prisma.restaurantStaffMember.update({
        where: { id: staffMember.id },
        data: { status: parsedStatus },
      });
    }

    redirect("/restaurant/staff?flash=staff-status-updated");
  }

  const selectedRole = isStaffRole(String(resolvedSearchParams.role || ""))
    ? (resolvedSearchParams.role as RestaurantStaffRole)
    : null;

  const selectedStatus = isStaffStatus(String(resolvedSearchParams.status || ""))
    ? (resolvedSearchParams.status as RestaurantStaffStatus)
    : null;

  const whereClause: Prisma.RestaurantStaffMemberWhereInput = {
    restaurantId,
    ...(selectedRole ? { role: selectedRole } : {}),
    ...(selectedStatus ? { status: selectedStatus } : {}),
  };

  const [staffMembers, staffCounts] = await Promise.all([
    prisma.restaurantStaffMember.findMany({
      where: whereClause,
      orderBy: [{ status: "asc" }, { invitedAt: "desc" }],
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        inviteToken: true,
        inviteExpiresAt: true,
        userId: true,
      },
    }),
    prisma.restaurantStaffMember.groupBy({
      by: ["status"],
      where: {
        restaurantId,
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const invitedCount =
    staffCounts.find((entry) => entry.status === RestaurantStaffStatus.INVITED)?._count._all ?? 0;
  const activeCount =
    staffCounts.find((entry) => entry.status === RestaurantStaffStatus.ACTIVE)?._count._all ?? 0;
  const disabledCount =
    staffCounts.find((entry) => entry.status === RestaurantStaffStatus.DISABLED)?._count._all ?? 0;
  const totalCount = invitedCount + activeCount + disabledCount;

  const statusMessage = resolvedSearchParams.flash
    ? successMessages[resolvedSearchParams.flash]
    : null;
  const errorMessage = resolvedSearchParams.error
    ? errorMessages[resolvedSearchParams.error]
    : null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Restaurant</p>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                Staff Workspace
              </h1>
              <p className="text-sm text-muted-foreground">
                Invite staff and manage role and status assignments for daily operations.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/restaurant">Back to dashboard</Link>
            </Button>
          </div>
        </header>

        {statusMessage ? (
          <div className="rounded-lg border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-4">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Total staff</p>
              <p className="text-3xl font-semibold">{totalCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-4">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Active</p>
              <p className="text-3xl font-semibold">{activeCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-4">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Invited</p>
              <p className="text-3xl font-semibold">{invitedCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-1 py-4">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Disabled</p>
              <p className="text-3xl font-semibold">{disabledCount}</p>
            </CardContent>
          </Card>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Invite staff</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={inviteStaff} className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-full-name">Full name</Label>
                  <Input id="staff-full-name" name="fullName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-email">Email</Label>
                  <Input id="staff-email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-role">Role</Label>
                  <select
                    id="staff-role"
                    name="role"
                    className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
                    defaultValue="Manager"
                  >
                    {Object.keys(restaurantStaffRoleLabelToEnum).map((label) => (
                      <option key={label} value={label}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Send invite</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Staff roster</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form method="get" className="grid gap-3 rounded-lg border border-border/70 bg-muted/20 p-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="filter-role" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Role</Label>
                  <select
                    id="filter-role"
                    name="role"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    defaultValue={selectedRole ?? ""}
                  >
                    <option value="">All roles</option>
                    {STAFF_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {restaurantStaffRoleEnumToLabel[role]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="filter-status" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</Label>
                  <select
                    id="filter-status"
                    name="status"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    defaultValue={selectedStatus ?? ""}
                  >
                    <option value="">All statuses</option>
                    {STAFF_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {restaurantStaffStatusEnumToLabel[status]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-2">
                  <Button type="submit" size="sm">Apply filters</Button>
                  <Button asChild type="button" size="sm" variant="outline">
                    <Link href="/restaurant/staff">Clear</Link>
                  </Button>
                </div>
              </form>

              {staffMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No staff records for this filter yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {staffMembers.map((staffMember) => {
                    const roleBadgeClass =
                      staffMember.role === "MANAGER"
                        ? "bg-sky-100 text-sky-800 border-sky-200"
                        : staffMember.role === "SUPERVISOR"
                          ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                          : staffMember.role === "KITCHEN"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-800 border-slate-200";

                    const statusBadgeClass =
                      staffMember.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : staffMember.status === "INVITED"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200";

                    return (
                      <div key={staffMember.id} className="rounded-lg border border-border/70 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{staffMember.fullName}</p>
                            <p className="text-xs text-muted-foreground">{staffMember.email}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-2 py-1 text-xs ${roleBadgeClass}`}>
                              {restaurantStaffRoleEnumToLabel[staffMember.role]}
                            </span>
                            <span className={`rounded-full border px-2 py-1 text-xs ${statusBadgeClass}`}>
                              {restaurantStaffStatusEnumToLabel[staffMember.status]}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <form action={updateStaffRole} className="flex items-end gap-2">
                            <input type="hidden" name="staffId" value={staffMember.id} />
                            <div className="flex-1 space-y-1">
                              <Label htmlFor={`role-${staffMember.id}`} className="text-xs text-muted-foreground">Role</Label>
                              <select
                                id={`role-${staffMember.id}`}
                                name="role"
                                defaultValue={staffMember.role}
                                className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
                              >
                                {STAFF_ROLES.map((role) => (
                                  <option key={role} value={role}>
                                    {restaurantStaffRoleEnumToLabel[role]}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <Button type="submit" size="sm" variant="outline">Update role</Button>
                          </form>

                          <form action={updateStaffStatus} className="flex items-end gap-2">
                            <input type="hidden" name="staffId" value={staffMember.id} />
                            <div className="flex-1 space-y-1">
                              <Label htmlFor={`status-${staffMember.id}`} className="text-xs text-muted-foreground">Status</Label>
                              <select
                                id={`status-${staffMember.id}`}
                                name="status"
                                defaultValue={staffMember.status}
                                className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
                              >
                                {STAFF_STATUSES.filter((status) => status !== "INVITED").map((status) => (
                                  <option key={status} value={status}>
                                    {restaurantStaffStatusEnumToLabel[status]}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <Button type="submit" size="sm" variant="outline">Update status</Button>
                          </form>
                        </div>

                        {staffMember.status === "INVITED" && staffMember.inviteToken ? (
                          <div className="mt-3 rounded-md border border-border/70 bg-muted/20 p-2 text-xs text-muted-foreground">
                            <p>
                              Invite link:{" "}
                              <Link
                                className="underline"
                                href={`/staff/accept?token=${encodeURIComponent(staffMember.inviteToken)}`}
                              >
                                /staff/accept?token={staffMember.inviteToken}
                              </Link>
                            </p>
                            {staffMember.inviteExpiresAt ? (
                              <p>Expires: {staffMember.inviteExpiresAt.toLocaleString()}</p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
