/*
  Warnings:

  - Made the column `brand` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `category` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "quantity" TEXT,
    "packaging" TEXT,
    "country" TEXT,
    "ingredients" TEXT,
    "calories" TEXT,
    "price" DECIMAL,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL
);
INSERT INTO "new_Product" ("brand", "calories", "category", "country", "createdAt", "description", "id", "imageUrl", "ingredients", "name", "packaging", "price", "productId", "quantity") SELECT "brand", "calories", "category", "country", "createdAt", "description", "id", "imageUrl", "ingredients", "name", "packaging", "price", "productId", "quantity" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_productId_key" ON "Product"("productId");
CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE INDEX "Product_name_idx" ON "Product"("name");
CREATE INDEX "Product_brand_idx" ON "Product"("brand");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
