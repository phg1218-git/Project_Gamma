CREATE TABLE "MatchingConfig" (
  "id"             INTEGER  NOT NULL DEFAULT 1,
  "filterSmoker"   BOOLEAN  NOT NULL DEFAULT true,
  "filterDrinker"  BOOLEAN  NOT NULL DEFAULT true,
  "filterReligion" BOOLEAN  NOT NULL DEFAULT true,
  "filterDistance" BOOLEAN  NOT NULL DEFAULT true,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MatchingConfig_pkey" PRIMARY KEY ("id")
);

-- 기본 행 삽입 (항상 id=1 단일 행)
INSERT INTO "MatchingConfig" ("id", "filterSmoker", "filterDrinker", "filterReligion", "filterDistance", "updatedAt")
VALUES (1, true, true, true, true, NOW())
ON CONFLICT ("id") DO NOTHING;
