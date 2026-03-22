-- AlterTable: Add photo reveal consent fields to ChatThread
ALTER TABLE "ChatThread"
  ADD COLUMN IF NOT EXISTS "photoRevealA" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "photoRevealB" BOOLEAN NOT NULL DEFAULT false;
