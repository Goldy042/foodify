import prisma from "@/lib/prisma";

export async function getCustomerOrder(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      customerId: userId,
    },
    include: {
      restaurant: true,
      items: {
        include: {
          menuItem: true,
          modifiers: {
            include: {
              modifierOption: true,
            },
          },
        },
      },
      assignment: true,
      payment: true,
    },
  });
}

export async function listCustomerOrders(userId: string) {
  return prisma.order.findMany({
    where: {
      customerId: userId,
    },
    include: {
      restaurant: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
