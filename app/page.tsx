import { redirect } from "next/navigation";

import { HomePage } from "@/components/marketing/home-page";
import { getPostLoginRedirectPath } from "@/app/lib/role-routing";
import { getUserFromSession } from "@/app/lib/session";

export default async function Page() {
  const user = await getUserFromSession();

  if (user) {
    redirect(getPostLoginRedirectPath({ role: user.role, status: user.status }));
  }

  return <HomePage />;
}
