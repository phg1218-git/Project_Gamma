-- AlterTable: Add missing Profile columns (height, profileImage, celebrity, minMatchScore)
-- These fields are defined in schema.prisma but were absent from the initial migration.

ALTER TABLE "Profile"
  ADD COLUMN IF NOT EXISTS "height"        INTEGER,
  ADD COLUMN IF NOT EXISTS "profileImage"  TEXT,
  ADD COLUMN IF NOT EXISTS "celebrity"     VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "minMatchScore" INTEGER NOT NULL DEFAULT 0;
