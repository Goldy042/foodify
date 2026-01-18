import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { signupRoleOptions } from "@/app/lib/constants";
import { signUp } from "@/app/lib/auth-actions";

const roleDescriptions: Record<(typeof signupRoleOptions)[number], string> = {
  Customer: "Order from restaurants and track delivery.",
  Restaurant: "List menus and fulfill customer orders.",
  Driver: "Deliver orders and get paid after confirmation.",
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

export default async function SignupPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const errorKey = resolvedSearchParams.error;
  const errorMessage = errorKey ? errorMessages[errorKey] : null;
  const roleParam = resolvedSearchParams.role;
  const roleMatch = signupRoleOptions.includes(
    roleParam as (typeof signupRoleOptions)[number]
  );
  const defaultRole = roleMatch
    ? (roleParam as (typeof signupRoleOptions)[number])
    : "Customer";

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center lg:gap-16">
        <section className="flex-1 space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Foodify onboarding
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Start with the role that fits you
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              Choose the role that matches your work. You will verify your email
              first, then complete a role-specific profile with structured
              fields.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Email verification required
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                A single-use link is sent to activate your account and unlock
                profile setup.
              </CardContent>
            </Card>
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-base font-semibold">
                  Profile completion gate
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Dashboard access stays locked until your profile is completed.
              </CardContent>
            </Card>
          </div>
        </section>

        <Card className="w-full max-w-md border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <p className="text-sm text-muted-foreground">
              Role selected: <span className="font-medium">{defaultRole}</span>
            </p>
          </CardHeader>
          <CardContent>
            <form action={signUp} className="space-y-5">
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
              <fieldset className="space-y-3">
                <Label className="text-sm font-medium">Role</Label>
                <RadioGroup
                  defaultValue={defaultRole}
                  name="role"
                  className="space-y-3"
                >
                  {signupRoleOptions.map((role) => (
                    <label
                      key={role}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 bg-background px-3 py-3 text-sm transition hover:border-border"
                    >
                      <RadioGroupItem value={role} className="mt-1" />
                      <span className="space-y-1">
                        <span className="block font-medium text-foreground">
                          {role}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {roleDescriptions[role]}
                        </span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </fieldset>
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
