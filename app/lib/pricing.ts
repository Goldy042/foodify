export const DELIVERY_FEE = 1200;
export const SERVICE_FEE_RATE = 0.05;

export function formatCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return "NGN --";
  }
  return `NGN ${value.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function calculateFees(itemsSubtotal: number) {
  const safeSubtotal = Number.isFinite(itemsSubtotal) ? itemsSubtotal : 0;
  const serviceFee = Number(
    Math.max(0, safeSubtotal * SERVICE_FEE_RATE).toFixed(2)
  );
  const deliveryFee = DELIVERY_FEE;
  const total = Number((safeSubtotal + serviceFee + deliveryFee).toFixed(2));
  return {
    itemsSubtotal: safeSubtotal,
    serviceFee,
    deliveryFee,
    total,
  };
}
