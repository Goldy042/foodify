import prisma from "@/lib/prisma";
import { OrderStatus, Prisma } from "@/app/generated/prisma/client";
import { canDriverTransitionOrderStatus } from "@/app/lib/driver-flow";

const ACTIVE_DELIVERY_ORDER_STATUSES: OrderStatus[] = [
  "DRIVER_ASSIGNED",
  "PICKED_UP",
  "EN_ROUTE",
  "DELIVERED",
];

async function createPayoutLedgerEntryIfMissing(
  db: Prisma.TransactionClient | typeof prisma,
  data: {
    orderId: string;
    recipientType: "RESTAURANT" | "DRIVER";
    recipientId: string;
    amount: Prisma.Decimal;
  }
) {
  try {
    await db.payoutLedgerEntry.create({
      data: {
        ...data,
        status: "HELD",
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return;
    }
    throw error;
  }
}

export async function listDriverAssignments(driverId: string, limit = 20) {
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 20, 1), 100);
  return prisma.driverAssignment.findMany({
    where: { driverId },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          deliveryAddressText: true,
          createdAt: true,
          restaurant: {
            select: {
              restaurantName: true,
            },
          },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
    take: safeLimit,
  });
}

export async function createDriverAssignment(input: {
  orderId: string;
  driverId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const driver = await tx.user.findUnique({
      where: { id: input.driverId },
      select: {
        id: true,
        role: true,
        status: true,
        isSuspended: true,
      },
    });

    if (!driver || driver.role !== "DRIVER") {
      throw new Error("INVALID_DRIVER");
    }
    if (driver.status !== "APPROVED" || driver.isSuspended) {
      throw new Error("DRIVER_NOT_ELIGIBLE");
    }

    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      select: {
        id: true,
        status: true,
        driverId: true,
      },
    });
    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    const existing = await tx.driverAssignment.findUnique({
      where: { orderId: input.orderId },
      select: {
        id: true,
        driverId: true,
        acceptedAt: true,
        rejectedAt: true,
      },
    });

    if (existing) {
      if (existing.driverId !== input.driverId && !existing.rejectedAt) {
        throw new Error("ORDER_ALREADY_ASSIGNED");
      }
      if (
        existing.driverId === input.driverId &&
        !existing.rejectedAt &&
        ACTIVE_DELIVERY_ORDER_STATUSES.includes(order.status)
      ) {
        return existing;
      }
    }

    if (order.status !== "READY_FOR_PICKUP" && order.status !== "DRIVER_ASSIGNED") {
      throw new Error("INVALID_ORDER_STATUS");
    }

    const assignment = await tx.driverAssignment.upsert({
      where: { orderId: input.orderId },
      update: {
        driverId: input.driverId,
        assignedAt: new Date(),
        acceptedAt: null,
        rejectedAt: null,
      },
      create: {
        orderId: input.orderId,
        driverId: input.driverId,
      },
    });

    await tx.order.update({
      where: { id: input.orderId },
      data: {
        driverId: input.driverId,
        status: "DRIVER_ASSIGNED",
      },
    });

    return assignment;
  });
}

export async function acceptDriverAssignment(input: {
  assignmentId: string;
  driverId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const assignment = await tx.driverAssignment.findUnique({
      where: { id: input.assignmentId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
    if (!assignment || assignment.driverId !== input.driverId) {
      throw new Error("ASSIGNMENT_NOT_FOUND");
    }

    if (assignment.rejectedAt) {
      throw new Error("ASSIGNMENT_REJECTED");
    }

    if (assignment.acceptedAt) {
      return assignment;
    }

    if (assignment.order.status !== "DRIVER_ASSIGNED") {
      throw new Error("INVALID_ORDER_STATUS");
    }

    const acceptedAt = new Date();
    const updated = await tx.driverAssignment.updateMany({
      where: {
        id: assignment.id,
        acceptedAt: null,
        rejectedAt: null,
      },
      data: { acceptedAt },
    });

    if (updated.count === 0) {
      const latest = await tx.driverAssignment.findUnique({
        where: { id: assignment.id },
      });
      if (!latest) {
        throw new Error("ASSIGNMENT_NOT_FOUND");
      }
      return latest;
    }

    return tx.driverAssignment.findUniqueOrThrow({
      where: { id: assignment.id },
    });
  });
}

export async function rejectDriverAssignment(input: {
  assignmentId: string;
  driverId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const assignment = await tx.driverAssignment.findUnique({
      where: { id: input.assignmentId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            driverId: true,
          },
        },
      },
    });
    if (!assignment || assignment.driverId !== input.driverId) {
      throw new Error("ASSIGNMENT_NOT_FOUND");
    }

    if (assignment.acceptedAt) {
      throw new Error("ASSIGNMENT_ALREADY_ACCEPTED");
    }

    if (assignment.rejectedAt) {
      return assignment;
    }

    const rejectedAt = new Date();
    const updated = await tx.driverAssignment.updateMany({
      where: {
        id: assignment.id,
        acceptedAt: null,
        rejectedAt: null,
      },
      data: { rejectedAt },
    });

    if (updated.count === 0) {
      const latest = await tx.driverAssignment.findUnique({
        where: { id: assignment.id },
      });
      if (!latest) {
        throw new Error("ASSIGNMENT_NOT_FOUND");
      }
      return latest;
    }

    if (
      assignment.order.status === "DRIVER_ASSIGNED" &&
      assignment.order.driverId === input.driverId
    ) {
      await tx.order.update({
        where: { id: assignment.order.id },
        data: {
          driverId: null,
          status: "READY_FOR_PICKUP",
        },
      });
    }

    return tx.driverAssignment.findUniqueOrThrow({
      where: { id: assignment.id },
    });
  });
}

export async function updateDriverDeliveryStatus(input: {
  orderId: string;
  driverId: string;
  nextStatus: "PICKED_UP" | "EN_ROUTE";
}) {
  return prisma.$transaction(async (tx) => {
    const assignment = await tx.driverAssignment.findUnique({
      where: { orderId: input.orderId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            driverId: true,
          },
        },
      },
    });

    if (!assignment || assignment.driverId !== input.driverId) {
      throw new Error("ASSIGNMENT_NOT_FOUND");
    }
    if (!assignment.acceptedAt || assignment.rejectedAt) {
      throw new Error("ASSIGNMENT_NOT_ACTIVE");
    }
    if (assignment.order.driverId !== input.driverId) {
      throw new Error("ORDER_DRIVER_MISMATCH");
    }

    if (assignment.order.status === input.nextStatus) {
      return assignment.order;
    }
    if (!canDriverTransitionOrderStatus(assignment.order.status, input.nextStatus)) {
      throw new Error("INVALID_ORDER_STATUS");
    }

    const updated = await tx.order.updateMany({
      where: {
        id: assignment.order.id,
        driverId: input.driverId,
        status: assignment.order.status,
      },
      data: {
        status: input.nextStatus,
      },
    });

    if (updated.count === 0) {
      const latest = await tx.order.findUnique({
        where: { id: assignment.order.id },
      });
      if (!latest) {
        throw new Error("ORDER_NOT_FOUND");
      }
      return latest;
    }

    return tx.order.findUniqueOrThrow({
      where: { id: assignment.order.id },
    });
  });
}

export async function completeDriverDeliveryWithCode(input: {
  orderId: string;
  driverId: string;
  code: string;
}) {
  const normalizedCode = input.code.trim();
  if (!/^\d{4}$/.test(normalizedCode)) {
    throw new Error("INVALID_CODE_FORMAT");
  }

  const completion = await prisma.$transaction(async (tx) => {
    const assignment = await tx.driverAssignment.findUnique({
      where: { orderId: input.orderId },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            driverId: true,
            deliveryConfirmationCode: true,
            itemsSubtotal: true,
            deliveryFee: true,
            restaurant: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!assignment || assignment.driverId !== input.driverId) {
      throw new Error("ASSIGNMENT_NOT_FOUND");
    }
    if (!assignment.acceptedAt || assignment.rejectedAt) {
      throw new Error("ASSIGNMENT_NOT_ACTIVE");
    }
    if (assignment.order.driverId !== input.driverId) {
      throw new Error("ORDER_DRIVER_MISMATCH");
    }
    if (assignment.order.status === "DELIVERED") {
      return {
        orderId: assignment.order.id,
        status: assignment.order.status,
        restaurantUserId: assignment.order.restaurant.userId,
        itemsSubtotal: assignment.order.itemsSubtotal,
        deliveryFee: assignment.order.deliveryFee,
      };
    }
    if (assignment.order.status !== "EN_ROUTE") {
      throw new Error("INVALID_ORDER_STATUS");
    }
    if (assignment.order.deliveryConfirmationCode !== normalizedCode) {
      throw new Error("INVALID_DELIVERY_CODE");
    }

    const updated = await tx.order.updateMany({
      where: {
        id: assignment.order.id,
        driverId: input.driverId,
        status: "EN_ROUTE",
      },
      data: {
        status: "DELIVERED",
      },
    });

    if (updated.count === 0) {
      const latest = await tx.order.findUnique({
        where: { id: assignment.order.id },
        select: {
          id: true,
          status: true,
        },
      });
      if (!latest) {
        throw new Error("ORDER_NOT_FOUND");
      }
      return {
        orderId: latest.id,
        status: latest.status,
        restaurantUserId: assignment.order.restaurant.userId,
        itemsSubtotal: assignment.order.itemsSubtotal,
        deliveryFee: assignment.order.deliveryFee,
      };
    }

    return {
      orderId: assignment.order.id,
      status: "DELIVERED" as const,
      restaurantUserId: assignment.order.restaurant.userId,
      itemsSubtotal: assignment.order.itemsSubtotal,
      deliveryFee: assignment.order.deliveryFee,
    };
  }, { timeout: 12000 });

  if (completion.status === "DELIVERED") {
    await createPayoutLedgerEntryIfMissing(prisma, {
      orderId: completion.orderId,
      recipientType: "RESTAURANT",
      recipientId: completion.restaurantUserId,
      amount: completion.itemsSubtotal,
    });

    await createPayoutLedgerEntryIfMissing(prisma, {
      orderId: completion.orderId,
      recipientType: "DRIVER",
      recipientId: input.driverId,
      amount: completion.deliveryFee,
    });
  }

  return prisma.order.findUniqueOrThrow({
    where: { id: completion.orderId },
  });
}
