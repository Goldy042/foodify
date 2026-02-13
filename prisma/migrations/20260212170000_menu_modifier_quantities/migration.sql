-- Support modifier defaults, included quantities, and per-option quantity limits.

ALTER TABLE "ModifierOption"
ADD COLUMN "maxQuantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "includedQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "defaultQuantity" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "OrderItemModifierSelection"
ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "ModifierOption"
ADD CONSTRAINT "ModifierOption_maxQuantity_check" CHECK ("maxQuantity" >= 1),
ADD CONSTRAINT "ModifierOption_includedQuantity_check" CHECK ("includedQuantity" >= 0),
ADD CONSTRAINT "ModifierOption_defaultQuantity_check" CHECK ("defaultQuantity" >= 0),
ADD CONSTRAINT "ModifierOption_defaultQuantity_maxQuantity_check" CHECK ("defaultQuantity" <= "maxQuantity"),
ADD CONSTRAINT "ModifierOption_includedQuantity_maxQuantity_check" CHECK ("includedQuantity" <= "maxQuantity");

ALTER TABLE "OrderItemModifierSelection"
ADD CONSTRAINT "OrderItemModifierSelection_quantity_check" CHECK ("quantity" >= 1);
