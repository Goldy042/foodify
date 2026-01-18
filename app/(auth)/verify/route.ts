import { NextResponse } from "next/server";

import { consumeVerificationToken, createSession } from "@/app/lib/store";

function roleToPath(role: string) {
  return role.toLowerCase();
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${origin}/signup?error=invalid-token`);
  }

  const user = await consumeVerificationToken(token);
  if (!user) {
    return NextResponse.redirect(`${origin}/signup?error=invalid-token`);
  }

  const sessionToken = await createSession(user.id);
  const redirectPath = `/onboarding/${roleToPath(user.role)}`;
  const response = NextResponse.redirect(`${origin}${redirectPath}`);

  response.cookies.set("foodify_session", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
