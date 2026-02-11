/*
  Warnings:

  - You are about to drop the `Item` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Item";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "StorageLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "x" INTEGER NOT NULL DEFAULT 0,
    "y" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER NOT NULL DEFAULT 1,
    "height" INTEGER NOT NULL DEFAULT 1,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StorageLocation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StorageLocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventorySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "takenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "takenById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventorySnapshot_takenById_fkey" FOREIGN KEY ("takenById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "snapshotId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "InventoryEntry_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "InventorySnapshot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryEntry_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StorageLocation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryEntry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ProductVariant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StorageLocation_name_key" ON "StorageLocation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_code_key" ON "ProductVariant"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryEntry_snapshotId_locationId_productId_key" ON "InventoryEntry"("snapshotId", "locationId", "productId");
