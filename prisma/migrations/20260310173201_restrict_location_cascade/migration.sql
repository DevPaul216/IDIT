-- DropForeignKey
ALTER TABLE "StorageLocation" DROP CONSTRAINT "StorageLocation_parentId_fkey";

-- DropIndex
DROP INDEX "StorageLocation_name_key";

-- AddForeignKey
ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "StorageLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
