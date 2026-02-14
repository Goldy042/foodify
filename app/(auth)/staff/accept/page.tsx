import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Role } from "@/app/generated/prisma/client";

import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/app/lib/auth";
import { createSession } from "@/app/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PageProps = {
  searchParams?: Promise<{ token?: string; error?: string }> | { token?: string; error?: string };
};

const errorMessages: Record<string, string> = {
  "missing-fields": "Enter your email and password.",
  "invalid-token": "Invite link is invalid or has expired.",
  "invalid-email": "Use the same email that the invite was sent to.",
  "invalid-credentials": "Password is incorrect for this existing account.",
  "account-disabled": "This account is disabled.",
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export default async function AcceptStaffInvitePage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const token = String(resolvedSearchParams.token || "").trim();

  const invite = token
    ? await prisma.restaurantStaffMember.findFirst({
        where: {
          inviteToken: token,
          status: "INVITED",
          inviteExpiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          restaurant: {
            select: {
              restaurantName: true,
            },
          },
        },
      })
    : null;

  async function acceptInvite(formData: FormData) {
    "use server";

    const inviteToken = String(formData.get("token") || "").trim();
    const emailInput = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    if (!inviteToken || !emailInput || !password) {
      redirect(`/staff/accept?token=${encodeURIComponent(inviteToken)}&error=missing-fields`);
    }

    const pendingInvite = await prisma.restaurantStaffMember.findFirst({
      where: {
        inviteToken,
        status: "INVITED",
        inviteExpiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    if (!pendingInvite) {
      redirect("/staff/accept?error=invalid-token");
    }

    const email = normalizeEmail(emailInput);
    if (email !== pendingInvite.email.toLowerCase()) {
      redirect(`/staff/accept?token=${encodeURIComponent(inviteToken)}&error=invalid-email`);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    let userId = existingUser?.id ?? null;

    if (existingUser) {
      if (existingUser.isSuspended) {
        redirect(`/staff/accept?token=${encodeURIComponent(inviteToken)}&error=account-disabled`);
      }

      if (!verifyPassword(password, existingUser.passwordHash)) {
        redirect(`/staff/accept?token=${encodeURIComponent(inviteToken)}&error=invalid-credentials`);
      }
    } else {
      const user = await prisma.user.create({
        data: {
          fullName: pendingInvite.fullName,
          email,
          passwordHash: hashPassword(password),
          role: Role.CUSTOMER,
          status: "PROFILE_COMPLETED",
        },
        select: { id: true },
      });
      userId = user.id;
    }

    await prisma.restaurantStaffMember.update({
      where: { id: pendingInvite.id },
      data: {
        userId,
        status: "ACTIVE",
        acceptedAt: new Date(),
        inviteToken: null,
        inviteExpiresAt: null,
      },
    });

    const sessionToken = await createSession(userId);
    const cookieStore = await cookies();
    cookieStore.set("foodify_session", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    redirect("/restaurant");
  }

  const errorMessage = resolvedSearchParams.error
    ? errorMessages[resolvedSearchParams.error] ?? errorMessages["invalid-token"]
    : null;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-6 py-16">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Staff invite</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Join restaurant workspace</h1>
          <p className="text-sm text-muted-foreground">
            {invite
              ? `Accept your invite to ${invite.restaurant.restaurantName} as ${invite.role.toLowerCase()}.`
              : "This invite link is no longer valid."}
          </p>
        </header>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Accept invite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorMessage ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}

            {!invite ? (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">Request a new invite link from your restaurant manager.</p>
                <Button asChild variant="outline">
                  <Link href="/login">Back to login</Link>
                </Button>
              </div>
            ) : (
              <form action={acceptInvite} className="space-y-4">
                <input type="hidden" name="token" value={token} />
                <div className="space-y-2">
                  <Label htmlFor="email">Invited email</Label>
                  <Input id="email" name="email" type="email" defaultValue={invite.email} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Use existing password or create a new one"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Accept and continue
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
