import { cookies } from "next/headers";

import { getUserBySessionToken } from "./db";

export async function getUserFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("foodify_session")?.value;
  if (!token) {
    return null;
  }
  return getUserBySessionToken(token);
}
