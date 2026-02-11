-- Drop existing unique constraint on StorageLocation.name
ALTER TABLE "StorageLocation" DROP CONSTRAINT IF EXISTS "StorageLocation_name_key";

-- Add new unique constraint on (name, parentId) for StorageLocation
ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_name_parentId_key" UNIQUE ("name", "parentId");

-- Add onDelete Cascade to StorageLocation.parentId foreign key
ALTER TABLE "StorageLocation" DROP CONSTRAINT IF EXISTS "StorageLocation_parentId_fkey";
ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StorageLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove isActive column from StorageLocation
ALTER TABLE "StorageLocation" DROP COLUMN "isActive";

-- Remove isActive column from ProductVariant
ALTER TABLE "ProductVariant" DROP COLUMN "isActive";
