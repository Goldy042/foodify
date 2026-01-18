import { redirect } from "next/navigation";

import { resendVerification } from "@/app/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupVerifyPage({
  searchParams,
}: {
  searchParams?: { email?: string; status?: string };
}) {
  const email = searchParams?.email?.trim();
  if (!email) {
    redirect("/signup");
  }

  const resent = searchParams?.status === "resent";

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center px-6 py-16">
        <Card className="w-full border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <p className="text-sm text-muted-foreground">
              We sent a verification link to <span className="font-medium">{email}</span>.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-muted-foreground">
            <div className="rounded-lg border border-border/70 bg-muted/40 px-4 py-3">
              Click the link in the email to verify your account and continue
              onboarding.
            </div>
            {resent ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
                A fresh verification email was sent.
              </div>
            ) : null}
            <form action={resendVerification}>
              <input type="hidden" name="email" value={email} />
              <Button type="submit" variant="outline" className="w-full">
                Resend verification email
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
