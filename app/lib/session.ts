import { cookies } from "next/headers";

import { getUserBySessionToken } from "./store";

export async function getUserFromSession() {
  const token = cookies().get("foodify_session")?.value;
  if (!token) {
    return null;
  }
  return getUserBySessionToken(token);
}
