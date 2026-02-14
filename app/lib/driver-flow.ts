import { OrderStatus } from "@/app/generated/prisma/client";

export const driverManagedOrderStatuses: readonly OrderStatus[] = [
  OrderStatus.DRIVER_ASSIGNED,
  OrderStatus.PICKED_UP,
  OrderStatus.EN_ROUTE,
  OrderStatus.DELIVERED,
];

export const driverOrderTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PLACED]: [],
  [OrderStatus.PAID]: [],
  [OrderStatus.FAILED_PAYMENT]: [],
  [OrderStatus.ACCEPTED]: [],
  [OrderStatus.REJECTED]: [],
  [OrderStatus.PREPARING]: [],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.DRIVER_ASSIGNED],
  [OrderStatus.DRIVER_ASSIGNED]: [OrderStatus.PICKED_UP],
  [OrderStatus.PICKED_UP]: [OrderStatus.EN_ROUTE],
  [OrderStatus.EN_ROUTE]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
};

export function canDriverTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus
) {
  return driverOrderTransitions[from].includes(to);
}

export function isDriverVisibleOrderStatus(status: OrderStatus) {
  return driverManagedOrderStatuses.includes(status);
}
