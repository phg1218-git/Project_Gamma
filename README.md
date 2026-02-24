# 이어줌 (Connecting) — Project_Gamma

> Anonymous dating matchmaking platform using structured data and weighted scoring.

[![CI](https://github.com/phg1218-git/Project_Gamma/actions/workflows/ci.yml/badge.svg)](https://github.com/phg1218-git/Project_Gamma/actions)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui + lucide-react |
| Auth | Auth.js (NextAuth v5) — Google, Naver, Kakao |
| Database | PostgreSQL (Neon free tier) |
| ORM | Prisma |
| Validation | Zod |
| Deployment | Vercel (hosting) + Neon (database) |

---

## Quick Start

```bash
git clone https://github.com/phg1218-git/Project_Gamma.git
cd Project_Gamma
npm install
cp .env.example .env.local
# Fill in .env.local values
npx prisma migrate dev --name init
npm run dev
```

---

## DELIVERABLE 5: API Documentation

### Authentication
All protected routes require an active Auth.js session.

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | Auth.js handlers (login, callback, session) |

### Profile
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/profile` | Required | Get current user's profile |
| POST | `/api/profile` | Required | Create profile (first-time) |
| PUT | `/api/profile` | Required | Update profile |

**POST/PUT Body** (validated by Zod):
```json
{
  "gender": "MALE|FEMALE",
  "dateOfBirth": "1995-03-15",
  "nickname": "string (2-20 chars)",
  "jobCategory": "IT|OFFICE|...",
  "jobDetail": "프론트엔드 개발자",
  "companyLocation": "서울특별시|강남구",
  "residenceLocation": "서울특별시|서초구",
  "hometownLocation": "경기도|수원시",
  "personality": "string (10-200 chars)",
  "hobbies": ["운동/피트니스", "독서"],
  "preferences": ["유머감각", "진지한 대화"],
  "mbti": "ENFP",
  "bloodType": "A|B|O|AB",
  "religion": "NONE|CHRISTIANITY|...",
  "drinking": "NEVER|RARELY|SOMETIMES|OFTEN",
  "smoking": "NEVER|QUIT|SOMETIMES|OFTEN",
  "dislikedConditions": ["흡연자", "과음자"],
  "stopMatching": false
}
```

### Survey
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/survey` | Required | Get survey responses |
| POST | `/api/survey` | Required | Submit/update survey |

**POST Body**: JSON object with question IDs as keys.

### Matches
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/matches` | Required | Get match results (auto-computes if empty) |
| POST | `/api/matches` | Required | Force re-compute matches |
| PATCH | `/api/matches` | Required | Accept/reject a match |

### Chat
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/chat` | Required | List chat threads |
| GET | `/api/chat/[threadId]/messages?after=ISO&limit=50` | Required | Poll messages |
| POST | `/api/chat/[threadId]/messages` | Required | Send message |

---

## DELIVERABLE 6: Matching Algorithm Design

### Overview

The matching engine uses a **two-phase pipeline**:

1. **Hard Filters** — Eliminate incompatible candidates
2. **Soft Scoring** — Rank remaining candidates by compatibility

### Phase 1: Hard Filters (Pass/Fail)

| Filter | Logic |
|--------|-------|
| Active Matching | Both users must have `stopMatching = false` |
| Self-exclusion | Cannot match with yourself |
| Gender | Opposite gender only (MALE ↔ FEMALE) |
| Dealbreakers | User's `dislikedConditions` checked against candidate |

**Dealbreaker Mapping:**
- "흡연자" → candidate.smoking is OFTEN or SOMETIMES
- "과음자" → candidate.drinking is OFTEN
- "종교차이" → Different non-NONE religions
- "장거리" → Different residence provinces

### Phase 2: Soft Scoring (0-100 points)

| Category | Weight | Max Points | Questions |
|----------|--------|------------|-----------|
| Survey Similarity | 45% | 45 | dv_*, cm_* (10 questions) |
| Lifestyle | 25% | 25 | ls_* (6 questions) |
| Value Alignment | 20% | 20 | fp_* (4 questions) |
| Personality | 10% | 10 | pd_* (5 questions) |

### Similarity Functions

**Slider Questions** (numeric range):
```
similarity = 1 - |A - B| / (max - min)
Range: 0.0 (opposite ends) to 1.0 (identical)
```

**Select Questions** (single choice):
```
similarity = (A === B) ? 1.0 : 0.0
Binary: exact match or no match
```

**Multiselect Questions** (Jaccard Index):
```
similarity = |A ∩ B| / |A ∪ B|
Range: 0.0 (no overlap) to 1.0 (identical sets)
```

### Per-Question Weight Multipliers

Some questions carry extra weight within their category:

| Question | Multiplier | Rationale |
|----------|------------|-----------|
| fp_marriage_intent | 1.5x | Fundamental life choice |
| fp_children_preference | 1.4x | Major compatibility factor |
| dv_conflict_resolution | 1.3x | Highly predictive of success |
| dv_importance_of_love | 1.2x | Core values indicator |
| pd_introvert_extrovert | 1.2x | Energy compatibility |

### Score Computation Formula

```
For each category C:
  raw_score_C = Σ(similarity_i × weight_i) / Σ(weight_i)   // 0-1
  scaled_score_C = raw_score_C × CATEGORY_WEIGHT_C           // 0-max

Total = Σ(scaled_score_C)                                     // 0-100
```

---

## DELIVERABLE 7: Page Route Map

| Route | Auth | Description |
|-------|------|-------------|
| `/` | Public | Landing page with CTA |
| `/login` | Public | Social login (Google, Naver, Kakao) |
| `/profile` | Protected | View profile |
| `/profile/setup` | Protected | Create/edit profile |
| `/survey` | Protected | Complete matching survey |
| `/matches` | Protected | View match results |
| `/chat` | Protected | Chat thread list |
| `/chat/[threadId]` | Protected | Individual chat |
| `/settings` | Protected | Account settings |

---

## DELIVERABLE 8: 2-Person 2-Week MVP Roadmap

### Week 1: Core Backend + Auth

| Day | Person A (Backend) | Person B (Frontend) |
|-----|-------------------|---------------------|
| D1 | Neon DB setup, Prisma schema, migrations | Next.js scaffold, Tailwind config, pink theme |
| D2 | Auth.js config (Google, Naver, Kakao) | Login page, landing page, auth layout |
| D3 | Profile API (GET/POST/PUT) + Zod | Profile setup form (all fields) |
| D4 | Survey API + validation | Survey form (step-by-step) |
| D5 | Matching engine (filters + scoring) | Profile view page, settings page |
| D6 | Matching API + Match DB operations | Matches page with score breakdown |
| D7 | Integration testing, bug fixes | Responsive polish, navigation |

### Week 2: Chat + Polish + Deploy

| Day | Person A (Backend + DevOps) | Person B (Frontend + UX) |
|-----|---------------------------|--------------------------|
| D8 | Chat API (threads + messages) | Chat list page |
| D9 | Chat polling endpoint + read receipts | Chat thread page with real-time polling |
| D10 | CI/CD pipeline (GitHub Actions) | Animations, loading states, error states |
| D11 | Vercel deployment, env setup | Mobile responsive fixes |
| D12 | OAuth provider production setup | Final UI polish, empty states |
| D13 | Production testing, monitoring | Cross-browser testing |
| D14 | Documentation, README, release | Final QA, demo preparation |

---

## DELIVERABLE 9: CI/CD Configuration

See `.github/workflows/ci.yml` for the full GitHub Actions pipeline.

**Pipeline Steps:**
1. Checkout code
2. Install dependencies (`npm ci`)
3. Generate Prisma client
4. TypeScript type checking (`tsc --noEmit`)
5. ESLint (`next lint`)
6. Build verification (`next build`)

**Triggers:** PRs to `main` and `develop` branches.

**Vercel Integration:**
- `main` → Production deployment
- `develop` → Preview deployment
- Feature branches → Preview URLs (automatic)

---

## DELIVERABLE 10: Full Deployment Guide

### 1. Neon DB Setup

1. Go to [console.neon.tech](https://console.neon.tech)
2. Create account → New Project → Name: "earszoom"
3. Select region closest to your users (e.g., AWS ap-northeast-2 for Korea)
4. Copy the connection string → set as `DATABASE_URL`
5. Copy the direct (non-pooled) connection string → set as `DIRECT_URL`

### 2. OAuth Provider Setup

#### Google Console
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project → "이어줌"
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Authorized redirect URIs:
   - Dev: `http://localhost:3000/api/auth/callback/google`
   - Prod: `https://yourdomain.com/api/auth/callback/google`
5. Copy Client ID and Secret

#### Naver Developer Center
1. Go to [developers.naver.com](https://developers.naver.com)
2. 애플리케이션 등록 → "이어줌"
3. 사용 API: 네아로 (네이버 아이디로 로그인)
4. 서비스 URL: `https://yourdomain.com`
5. Callback URL:
   - Dev: `http://localhost:3000/api/auth/callback/naver`
   - Prod: `https://yourdomain.com/api/auth/callback/naver`

#### Kakao Developers
1. Go to [developers.kakao.com](https://developers.kakao.com)
2. 내 애플리케이션 → 추가 → "이어줌"
3. 카카오 로그인 활성화
4. Redirect URI:
   - Dev: `http://localhost:3000/api/auth/callback/kakao`
   - Prod: `https://yourdomain.com/api/auth/callback/kakao`
5. 동의항목: 닉네임, 프로필 사진, 이메일 (선택)

### 3. Vercel Project Setup

1. Go to [vercel.com](https://vercel.com) → Import Git Repository
2. Select `phg1218-git/Project_Gamma`
3. Framework Preset: Next.js (auto-detected)
4. Build settings:
   - Build Command: `prisma generate && next build`
   - Output Directory: `.next` (default)

### 4. Environment Variables (Vercel)

Add all variables from `.env.example` to Vercel:
- Settings → Environment Variables
- Set `NEXTAUTH_URL` to your production domain
- Generate new `NEXTAUTH_SECRET` for production
- Use production OAuth credentials

**Important:** Set different values for Production vs Preview environments.

### 5. Prisma Production Migration

```bash
# Option A: From local machine
DATABASE_URL="your-production-url" npx prisma migrate deploy

# Option B: Add to Vercel build command
# Build: prisma generate && prisma migrate deploy && next build
```

### 6. Domain Connection

1. Vercel → Settings → Domains → Add domain
2. Add DNS records (CNAME or A record) at your domain registrar
3. Vercel auto-provisions SSL certificate

### 7. HTTPS Verification

Vercel handles HTTPS automatically. Verify by visiting your domain.

### 8. Preview Environment Separation

- Vercel auto-creates preview deployments for PRs
- Use different environment variables for preview vs production
- Preview uses development OAuth credentials

### 9. Rollback Strategy

```bash
# Vercel CLI rollback
vercel rollback [deployment-url]

# Database rollback
npx prisma migrate resolve --rolled-back [migration-name]
```

---

## DELIVERABLE 11: Operations Guide

### 1. Monitoring Strategy

- **Vercel Analytics**: Built-in Web Vitals, real-user monitoring
- **Vercel Logs**: Function logs available in real-time
- **Optional Sentry**: Error tracking with source maps
  ```
  npm install @sentry/nextjs
  npx @sentry/wizard@latest -i nextjs
  ```

### 2. Log Access

- Vercel Dashboard → Project → Logs
- Filter by: Function name, Status code, Time range
- Structured logging via `console.error("[Module]", error)` pattern

### 3. Error Tracking

All API routes follow the pattern:
```typescript
try { ... } catch (error) {
  console.error("[ModuleName]", error);
  // Sentry.captureException(error); // If Sentry is enabled
  return NextResponse.json({ error: "..." }, { status: 500 });
}
```

### 4. Secret Rotation Process

1. Generate new secret value
2. Update in Vercel Environment Variables
3. Re-deploy (Vercel auto-triggers on env change)
4. For `NEXTAUTH_SECRET`: all existing sessions are invalidated
5. For OAuth credentials: update in provider console first, then Vercel

### 5. Backup Strategy (Neon)

- **Neon Auto-backup**: Free tier includes 7-day point-in-time restore
- **Manual Backup**: `pg_dump` via Neon connection string
- **Branch-based Testing**: Create Neon branches for safe testing

### 6. Schema Migration Safety

```bash
# Always test migrations locally first
npx prisma migrate dev --name descriptive-name

# Review generated SQL before applying to production
cat prisma/migrations/*/migration.sql

# Deploy to production
npx prisma migrate deploy

# If migration fails, resolve
npx prisma migrate resolve --rolled-back migration-name
```

### 7. Scaling Considerations

| Threshold | Action |
|-----------|--------|
| 100 users | Current architecture handles fine |
| 500 users | Add database indexes for matching queries |
| 1000 users | Push hard filters to SQL, add pagination to matching |
| 5000+ users | Consider background job queue for matching computation |
| 10000+ users | Upgrade Neon tier, add Redis caching, consider WebSockets |

### 8. Future Architecture Evolution

**Phase 1 (Current)**: Monolithic Next.js + Polling
- Simple, fast to develop
- Adequate for MVP and initial users

**Phase 2 (500+ users)**: Optimize
- Add Redis caching for match results
- Implement WebSocket for real-time chat (via Socket.io or Pusher)
- Add background job queue (BullMQ) for matching computation

**Phase 3 (5000+ users)**: Scale
- Separate matching engine into microservice
- Add CDN for static assets
- Implement database read replicas
- Consider GraphQL for efficient data fetching

---

## License

Open-source. See LICENSE for details.

---

Built with love by the 이어줌 team.
