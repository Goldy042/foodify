import { cookies } from "next/headers";

import { getUserBySessionToken } from "./db";

export async function getUserFromSession() {
  const cookieStore = await cookies();
  console.log("here1")
  const token = cookieStore.get("foodify_session")?.value;
  if (!token) {
    return null;
  }
  console.log("here2", token)
  return getUserBySessionToken(token);
}
