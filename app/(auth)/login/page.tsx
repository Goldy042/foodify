import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/app/lib/auth-actions";
import { getPostLoginRedirectPath } from "@/app/lib/role-routing";
import { getUserFromSession } from "@/app/lib/session";
import prisma from "@/lib/prisma";

const highlights = [
  "Resume onboarding instantly",
  "Track approval progress",
  "Secure session access",
];

const errorMessages: Record<string, string> = {
  "missing-fields": "Enter your email and password.",
  "invalid-credentials": "Incorrect email or password.",
  suspended: "This account is suspended. Contact support for help.",
  "login-failed": "We could not sign you in. Try again.",
  "staff-disabled": "Your staff access is currently disabled. Contact your manager.",
  "staff-invite-pending": "Accept your staff invite before accessing restaurant tools.",
};

type PageProps = {
  searchParams?: Promise<{ error?: string }> | { error?: string };
};

export default async function LoginPage({ searchParams }: PageProps) {
  const user = await getUserFromSession();
  if (user) {
    const activeStaffMembership = await prisma.restaurantStaffMember.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
      },
      select: { id: true },
    });
    if (activeStaffMembership) {
      redirect("/restaurant");
    }
    redirect(getPostLoginRedirectPath({ role: user.role, status: user.status }));
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const errorKey = resolvedSearchParams.error;
  const errorMessage = errorKey ? errorMessages[errorKey] : null;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center lg:gap-16">
        <section className="flex-1 space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Welcome back
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Sign in to Foodify.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              Continue onboarding, check approval status, and manage your
              Foodify account in one place.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {highlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-2xl border border-border/70 bg-card/70 px-4 py-4 text-sm font-medium"
              >
                {highlight}
              </div>
            ))}
          </div>
        </section>

        <Card className="w-full max-w-md border-border/70 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <p className="text-sm text-muted-foreground">
              Use the email and password you signed up with.
            </p>
          </CardHeader>
          <CardContent>
            <form action={signIn} className="space-y-5">
              {errorMessage ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Sign in
              </Button>
            </form>
            <div className="mt-6 border-t border-border/60 pt-4 text-sm text-muted-foreground">
              New to Foodify?{" "}
              <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
                Create an account
              </Link>
              .
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
