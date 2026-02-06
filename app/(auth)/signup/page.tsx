import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupRoleOptions } from "@/app/lib/constants";
import { signUp } from "@/app/lib/auth-actions";

type RoleOption = (typeof signupRoleOptions)[number];

type RoleContent = {
  eyebrow: string;
  title: string;
  description: string;
  perks: string[];
};

const roleContent: Record<RoleOption, RoleContent> = {
  Customer: {
    eyebrow: "Customer signup",
    title: "Order from trusted kitchens in minutes.",
    description:
      "Foodify keeps ordering simple with verified restaurants, live tracking, and secure delivery handoff.",
    perks: ["Verified restaurants", "Live rider tracking", "Pickup or delivery"],
  },
  Restaurant: {
    eyebrow: "Restaurant signup",
    title: "Grow your kitchen with a low, flat fee.",
    description:
      "Reach nearby customers, manage a structured menu, and keep payouts predictable.",
    perks: ["5% service fee", "Structured menus", "Reliable payouts"],
  },
  Driver: {
    eyebrow: "Rider signup",
    title: "Deliver smarter and earn faster.",
    description:
      "Smart routing, clear drop-offs, and immediate payout after confirmation.",
    perks: ["Instant payouts", "Smart routes", "Personal dashboard"],
  },
};

const roleAliases: Record<string, RoleOption> = {
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

const errorMessages: Record<string, string> = {
  "missing-fields": "Please fill out all required fields.",
  "invalid-role": "Select a valid role to continue.",
  "email-exists": "An account with this email already exists.",
  "signup-failed": "We could not create your account. Try again.",
  "missing-email": "Enter your email to continue.",
  "not-found": "We could not find that email address.",
  "already-verified": "Your email is already verified. Sign in soon.",
  "invalid-token": "Verification link is invalid or expired.",
};

type PageProps = {
  searchParams?: Promise<{ error?: string; role?: string }> | { error?: string; role?: string };
};

function resolveRole(param?: string): RoleOption | null {
  if (!param) return null;
  const normalized = param.trim().toLowerCase();
  return roleAliases[normalized] ?? null;
}

export default async function SignupPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const errorKey = resolvedSearchParams.error;
  const errorMessage = errorKey ? errorMessages[errorKey] : null;
  const resolvedRole = resolveRole(resolvedSearchParams.role);
  const selectedRole = resolvedRole ?? "Customer";
  const isRoleLocked = Boolean(resolvedRole);
  const content = roleContent[selectedRole];

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center lg:gap-16">
        <section className="flex-1 space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              {content.eyebrow}
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
              {content.title}
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              {content.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {content.perks.map((perk) => (
              <div
                key={perk}
                className="rounded-2xl border border-border/70 bg-card/70 px-4 py-4 text-sm font-medium"
              >
                {perk}
              </div>
            ))}
          </div>

          {!isRoleLocked ? (
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Choose a role
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {signupRoleOptions.map((role) => (
                  <Button
                    key={role}
                    asChild
                    size="sm"
                    variant={role === selectedRole ? "default" : "outline"}
                  >
                    <Link href={`/signup?role=${role}`}>{role}</Link>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Signing up as <span className="font-semibold">{selectedRole}</span>.{" "}
              <Link href="/signup" className="text-primary underline-offset-4 hover:underline">
                Change role
              </Link>
            </p>
          )}
        </section>

        <Card className="w-full max-w-md border-border/70 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <p className="text-sm text-muted-foreground">
              Just your name, email, and password. We handle the rest.
            </p>
          </CardHeader>
          <CardContent>
            <form action={signUp} className="space-y-5">
              <input type="hidden" name="role" value={selectedRole} />
              {errorMessage ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />
              </div>
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
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Create account
              </Button>
              <p className="text-xs text-muted-foreground">
                We will email a verification link to activate your account.
              </p>
            </form>
            <div className="mt-6 border-t border-border/60 pt-4 text-sm text-muted-foreground">
              Already have an account? Sign in (coming soon).
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
