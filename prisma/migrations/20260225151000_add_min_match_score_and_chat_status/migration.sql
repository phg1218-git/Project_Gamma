-- Add profile-level minimum match score
ALTER TABLE "Profile"
ADD COLUMN "minMatchScore" INTEGER NOT NULL DEFAULT 50;

CREATE INDEX "Profile_minMatchScore_idx" ON "Profile"("minMatchScore");

-- Add chat status lifecycle tracking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ChatStatus') THEN
    CREATE TYPE "ChatStatus" AS ENUM ('OPEN', 'CLOSED');
  END IF;
END $$;

ALTER TABLE "ChatThread"
ADD COLUMN "status" "ChatStatus" NOT NULL DEFAULT 'OPEN',
ADD COLUMN "closedAt" TIMESTAMP(3),
ADD COLUMN "endedByUserId" TEXT;

-- Backfill from legacy isActive column for compatibility
UPDATE "ChatThread"
SET "status" = CASE WHEN "isActive" THEN 'OPEN'::"ChatStatus" ELSE 'CLOSED'::"ChatStatus" END,
    "closedAt" = CASE WHEN "isActive" THEN NULL ELSE NOW() END
WHERE "status" = 'OPEN'::"ChatStatus";

CREATE INDEX "ChatThread_userAId_status_idx" ON "ChatThread"("userAId", "status");
CREATE INDEX "ChatThread_userBId_status_idx" ON "ChatThread"("userBId", "status");
