-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notice_productId_idx" ON "Notice"("productId");

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Reprise des données : chaque noticeUrl existant devient une notice « Notice »
INSERT INTO "Notice" ("id", "productId", "label", "url", "position")
SELECT gen_random_uuid()::text, "id", 'Notice', "noticeUrl", 0
FROM "Product"
WHERE "noticeUrl" IS NOT NULL AND btrim("noticeUrl") <> '';

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "noticeUrl";
