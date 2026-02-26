-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');
CREATE TYPE "ReviewType" AS ENUM ('PHOTO', 'BIO');
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TYPE "MatchStatus" ADD VALUE IF NOT EXISTS 'ENDED';
ALTER TYPE "MatchStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN "suspendedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP(3);

ALTER TABLE "Match" ADD COLUMN "endedAt" TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "Match" ADD COLUMN "endedReason" TEXT;

ALTER TABLE "ChatThread" ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE TABLE "Report" (
  "id" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "reportedId" TEXT NOT NULL,
  "reason" VARCHAR(300) NOT NULL,
  "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "metadata" JSONB,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Block" (
  "id" TEXT NOT NULL,
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProfileReview" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "ReviewType" NOT NULL,
  "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "decidedAt" TIMESTAMP(3),
  CONSTRAINT "ProfileReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Setting" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Block_blockerId_blockedId_key" ON "Block"("blockerId", "blockedId");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "Match_archivedAt_idx" ON "Match"("archivedAt");
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");
CREATE INDEX "Report_reportedId_idx" ON "Report"("reportedId");
CREATE INDEX "Block_createdAt_idx" ON "Block"("createdAt");
CREATE INDEX "ProfileReview_status_createdAt_idx" ON "ProfileReview"("status", "createdAt");
CREATE INDEX "ProfileReview_userId_idx" ON "ProfileReview"("userId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
CREATE INDEX "AuditLog_adminUserId_createdAt_idx" ON "AuditLog"("adminUserId", "createdAt");

ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProfileReview" ADD CONSTRAINT "ProfileReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
