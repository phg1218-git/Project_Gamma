-- AlterTable: User에 약관 동의 시각 및 탈퇴 처리 시각 컬럼 추가
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAgreedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "privacyAgreedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
