CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER', 'VIEWER');

ALTER TABLE "User" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'ADMIN';
UPDATE "User" SET "firstName" = COALESCE("name", '');
ALTER TABLE "User" DROP COLUMN "name";

CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_invitedById_fkey"
FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "maintenance" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceMessage" TEXT,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
