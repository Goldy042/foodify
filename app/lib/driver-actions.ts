"use server";

import { redirect } from "next/navigation";

import { requireDriverAccess } from "@/app/driver/_lib/access";
import {
  acceptDriverAssignment,
  completeDriverDeliveryWithCode,
  rejectDriverAssignment,
  updateDriverDeliveryStatus,
} from "@/app/lib/db";

function mapAssignmentErrorToCode(error: unknown) {
  if (!(error instanceof Error)) {
    return "unexpected";
  }

  if (error.message === "ASSIGNMENT_NOT_FOUND") {
    return "assignment-not-found";
  }
  if (error.message === "ASSIGNMENT_REJECTED") {
    return "assignment-rejected";
  }
  if (error.message === "ASSIGNMENT_ALREADY_ACCEPTED") {
    return "assignment-already-accepted";
  }
  if (error.message === "INVALID_ORDER_STATUS") {
    return "invalid-order-status";
  }
  if (error.message === "INVALID_CODE_FORMAT") {
    return "invalid-code-format";
  }
  if (error.message === "INVALID_DELIVERY_CODE") {
    return "invalid-delivery-code";
  }
  if (error.message === "ASSIGNMENT_NOT_ACTIVE") {
    return "assignment-not-active";
  }
  return "unexpected";
}

export async function acceptAssignment(formData: FormData) {
  const assignmentId = String(formData.get("assignmentId") || "").trim();
  if (!assignmentId) {
    redirect("/driver/assignments?error=assignment-not-found");
  }

  const { user } = await requireDriverAccess();

  try {
    await acceptDriverAssignment({
      assignmentId,
      driverId: user.id,
    });
  } catch (error) {
    const code = mapAssignmentErrorToCode(error);
    redirect(`/driver/assignments?error=${code}`);
  }

  redirect("/driver/assignments?status=assignment-accepted");
}

export async function rejectAssignment(formData: FormData) {
  const assignmentId = String(formData.get("assignmentId") || "").trim();
  if (!assignmentId) {
    redirect("/driver/assignments?error=assignment-not-found");
  }

  const { user } = await requireDriverAccess();

  try {
    await rejectDriverAssignment({
      assignmentId,
      driverId: user.id,
    });
  } catch (error) {
    const code = mapAssignmentErrorToCode(error);
    redirect(`/driver/assignments?error=${code}`);
  }

  redirect("/driver/assignments?status=assignment-rejected");
}

export async function markOrderPickedUp(formData: FormData) {
  const orderId = String(formData.get("orderId") || "").trim();
  if (!orderId) {
    redirect("/driver/assignments?error=assignment-not-found");
  }

  const { user } = await requireDriverAccess();

  try {
    await updateDriverDeliveryStatus({
      orderId,
      driverId: user.id,
      nextStatus: "PICKED_UP",
    });
  } catch (error) {
    const code = mapAssignmentErrorToCode(error);
    redirect(`/driver/assignments?error=${code}`);
  }

  redirect("/driver/assignments?status=picked-up");
}

export async function markOrderEnRoute(formData: FormData) {
  const orderId = String(formData.get("orderId") || "").trim();
  if (!orderId) {
    redirect("/driver/assignments?error=assignment-not-found");
  }

  const { user } = await requireDriverAccess();

  try {
    await updateDriverDeliveryStatus({
      orderId,
      driverId: user.id,
      nextStatus: "EN_ROUTE",
    });
  } catch (error) {
    const code = mapAssignmentErrorToCode(error);
    redirect(`/driver/assignments?error=${code}`);
  }

  redirect("/driver/assignments?status=en-route");
}

export async function confirmOrderDelivery(formData: FormData) {
  const orderId = String(formData.get("orderId") || "").trim();
  const deliveryCode = String(formData.get("deliveryCode") || "").trim();
  if (!orderId) {
    redirect("/driver/assignments?error=assignment-not-found");
  }

  const { user } = await requireDriverAccess();

  try {
    await completeDriverDeliveryWithCode({
      orderId,
      driverId: user.id,
      code: deliveryCode,
    });
  } catch (error) {
    console.log(error)
    const code = mapAssignmentErrorToCode(error);
    redirect(`/driver/assignments?error=${code}`);
  }

  redirect("/driver/assignments?status=delivery-confirmed");
}
