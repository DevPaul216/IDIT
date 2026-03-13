-- Add CHECK constraints to prevent negative quantities

ALTER TABLE "CurrentInventory" ADD CONSTRAINT "CurrentInventory_quantity_non_negative" CHECK ("quantity" >= 0);

ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_newQty_non_negative" CHECK ("newQty" >= 0);

ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_previousQty_non_negative" CHECK ("previousQty" IS NULL OR "previousQty" >= 0);