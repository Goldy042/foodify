-- Ensure one payout ledger row per recipient per order.
CREATE UNIQUE INDEX "PayoutLedgerEntry_orderId_recipientType_recipientId_key"
ON "PayoutLedgerEntry"("orderId", "recipientType", "recipientId");
