-- CreateIndex
CREATE INDEX "CurrentInventory_productId_idx" ON "CurrentInventory"("productId");

-- CreateIndex
CREATE INDEX "InventoryLog_changedAt_idx" ON "InventoryLog"("changedAt");

-- CreateIndex
CREATE INDEX "InventoryLog_locationId_idx" ON "InventoryLog"("locationId");

-- CreateIndex
CREATE INDEX "InventoryLog_productId_idx" ON "InventoryLog"("productId");
