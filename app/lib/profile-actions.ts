"use server";

import { redirect } from "next/navigation";

import { getUserFromSession } from "@/app/lib/session";
import { getCustomerProfile, updateUser, upsertCustomerProfile } from "@/app/lib/db";

function parseCoordinate(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export async function updateCustomerProfile(formData: FormData) {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "CUSTOMER") {
    redirect(`/onboarding/${user.role.toLowerCase()}`);
  }
  if (user.status === "EMAIL_UNVERIFIED") {
    redirect(`/signup/verify?email=${encodeURIComponent(user.email)}`);
  }
  if (user.status !== "PROFILE_COMPLETED") {
    redirect("/onboarding/customer");
  }

  const profile = await getCustomerProfile(user.id);
  if (!profile) {
    redirect("/onboarding/customer");
  }

  const fullName = String(formData.get("fullName") || "").trim();
  const addressText = String(formData.get("defaultAddressText") || "").trim();
  const latInput = String(formData.get("defaultAddressLat") || "").trim();
  const lngInput = String(formData.get("defaultAddressLng") || "").trim();
  const deliveryInstructions = String(
    formData.get("deliveryInstructions") || ""
  ).trim();

  if (!fullName || !addressText || !latInput || !lngInput) {
    redirect("/app/profile?error=missing");
  }

  const lat = parseCoordinate(latInput);
  const lng = parseCoordinate(lngInput);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    redirect("/app/profile?error=invalidCoords");
  }

  await upsertCustomerProfile(user.id, {
    defaultAddressText: addressText,
    defaultAddressLat: lat,
    defaultAddressLng: lng,
    deliveryInstructions: deliveryInstructions ? deliveryInstructions : null,
  });

  if (fullName !== user.fullName) {
    await updateUser(user.id, { fullName });
  }

  redirect("/app/profile?status=updated");
}


