-- Migration: add_subthreshold_recommendation
-- 기준 점수 미만 추천 매칭 시스템 + 알림 actionType/actionPayload 필드 추가
--
-- 주의: NotificationType enum과 Notification 테이블은 이전에 prisma db push로
--       반영되었을 수 있어 IF NOT EXISTS 패턴으로 안전하게 처리합니다.

-- 1. NotificationType enum: 없으면 생성(SYSTEM 포함), 있으면 SYSTEM 값만 추가
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'NotificationType'
  ) THEN
    CREATE TYPE "NotificationType" AS ENUM (
      'INFO', 'WARNING', 'IMPORTANT', 'EVENT', 'SYSTEM'
    );
  ELSE
    -- SYSTEM 값이 없을 때만 추가 (IF NOT EXISTS: PostgreSQL 9.3+)
    ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SYSTEM';
  END IF;
END $$;

-- 2. Notification 테이블: 없으면 생성
CREATE TABLE IF NOT EXISTS "Notification" (
  "id"        TEXT                 NOT NULL,
  "userId"    TEXT,
  "type"      "NotificationType"   NOT NULL DEFAULT 'INFO',
  "title"     VARCHAR(100)         NOT NULL,
  "content"   VARCHAR(500)         NOT NULL,
  "isRead"    BOOLEAN              NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt"    TIMESTAMP(3),

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- 2-a. Notification FK: 없으면 추가
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey'
  ) THEN
    ALTER TABLE "Notification"
      ADD CONSTRAINT "Notification_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 2-b. Notification 인덱스: 없으면 생성
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx"
  ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx"
  ON "Notification"("createdAt");

-- 3. Notification에 actionType, actionPayload 컬럼 추가
ALTER TABLE "Notification"
  ADD COLUMN IF NOT EXISTS "actionType"    TEXT,
  ADD COLUMN IF NOT EXISTS "actionPayload" JSONB;

-- 4. SubthresholdStatus enum 생성
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'SubthresholdStatus'
  ) THEN
    CREATE TYPE "SubthresholdStatus" AS ENUM (
      'SHOWN',
      'DECLINED',
      'ACCEPTED',
      'PENDING_B',
      'CHAT_CREATED',
      'B_REJECTED'
    );
  END IF;
END $$;

-- 5. SubthresholdRecommendation 테이블 생성
CREATE TABLE IF NOT EXISTS "SubthresholdRecommendation" (
  "id"         TEXT                  NOT NULL,
  "fromUserId" TEXT                  NOT NULL,
  "toUserId"   TEXT                  NOT NULL,
  "score"      DOUBLE PRECISION      NOT NULL,
  "breakdown"  JSONB                 NOT NULL DEFAULT '{}',
  "status"     "SubthresholdStatus"  NOT NULL DEFAULT 'SHOWN',
  "createdAt"  TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"  TIMESTAMP(3)          NOT NULL,

  CONSTRAINT "SubthresholdRecommendation_pkey" PRIMARY KEY ("id")
);

-- 6. SubthresholdRecommendation 인덱스
CREATE INDEX IF NOT EXISTS "SubthresholdRecommendation_fromUserId_status_idx"
  ON "SubthresholdRecommendation"("fromUserId", "status");
CREATE INDEX IF NOT EXISTS "SubthresholdRecommendation_toUserId_status_idx"
  ON "SubthresholdRecommendation"("toUserId", "status");
CREATE INDEX IF NOT EXISTS "SubthresholdRecommendation_expiresAt_idx"
  ON "SubthresholdRecommendation"("expiresAt");

-- 7. SubthresholdRecommendation 외래 키
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'SubthresholdRecommendation_fromUserId_fkey'
  ) THEN
    ALTER TABLE "SubthresholdRecommendation"
      ADD CONSTRAINT "SubthresholdRecommendation_fromUserId_fkey"
      FOREIGN KEY ("fromUserId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'SubthresholdRecommendation_toUserId_fkey'
  ) THEN
    ALTER TABLE "SubthresholdRecommendation"
      ADD CONSTRAINT "SubthresholdRecommendation_toUserId_fkey"
      FOREIGN KEY ("toUserId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
