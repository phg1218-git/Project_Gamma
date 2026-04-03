-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('REGULAR', 'SUBTHRESHOLD');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN "matchType" "MatchType" NOT NULL DEFAULT 'REGULAR';
