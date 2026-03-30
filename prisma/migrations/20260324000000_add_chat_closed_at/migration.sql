-- AlterTable: ChatThread에 closedAt 컬럼 추가
ALTER TABLE "ChatThread" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);
