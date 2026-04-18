# MyAngel

> **한국어 의도 → 최적화된 이미지 생성 프롬프트**로 변환하는 AI 이미지 스튜디오.

모호한 한국어 표현("예쁜", "감성적인", "몽환적인")을 구체적 시각 요소로 구조화하고, 강도·위치·속성을 세밀하게 조정하면 최종 이미지에 그대로 반영됩니다.

---

## Core: Prompt Engineering Studio

`/generate`는 3단계 위저드입니다.

### 1. 입력 — Grammarly-style 인라인 강화

- 입력이 1초간 멈추면 자동으로 **약한 표현 감지** (물결 밑줄 표시)
- 밑줄 클릭 → AI가 제안하는 구체적 대안을 버블로 즉시 교체
- 정보 밀도 메트릭(구체성·시각 토큰 적중·명사 특이성·길이 페널티)으로 오탐 필터링
- 55+ 예시 프롬프트 풀에서 매 방문마다 랜덤 노출

### 2. 조정 — Scene Canvas

프롬프트를 Gemini로 파싱해 **SceneObject 스키마**로 분해합니다.

- **정식 스키마** — 8개 Role × 6개 Category × 카테고리별 표준 어휘, 정규화/검증 파이프라인
- **위치** — 피사체/배경을 캔버스에 드래그하면 3×3 그리드 공간 구문으로 변환되어 composition 슬롯에 주입 (예: 좌상단 → `upper-left of the frame`)
- **강도** — 속성 슬라이더(0–100)가 6개 밴드로 매핑되어 카테고리별 부사·가중치·반복을 결정
  - 61–80 "strong" → `(token:1.3)`
  - 81–100 "dominant" → SD 스타일 가중치 + 반복 강화
- **충돌 감지** — 12개 축(색 온도·조명 강도·사실성·시간대 등) 기반 hard/soft 충돌 탐지 및 해결 제안

### 3. 결과

- 원본 vs 강화 프롬프트 나란히 비교
- OpenAI로 이미지 생성
- **Contribution Badges** — 사용자 조정이 결과에 어떻게 반영됐는지 시각화 (위치 / 강한 속성 Top3 / 속성 일관성 / 자동 보완 개수)
- Discover 공유 · 로컬 저장

---

## 파이프라인 아키텍처

```
한국어 프롬프트
    │
    │ analyzePrompt (Gemini + 스키마 주입 + 정규화)
    ▼
SceneObject[]   role × category × attributes (+ optional position)
    │
    │ detectSlots → augmentSlots → composeFromSlots
    ▼
구조화된 영어 프롬프트
    subject → style → medium → lighting → composition → quality
    │
    │ OpenAI image model
    ▼
최종 이미지
```

각 시각 슬롯이 비어있으면 기본 어휘(`cinematic`, `soft natural light`, `balanced composition` 등)가 자동 주입되어 품질 하락을 방지합니다. 이 결과는 LLM composer에게 힌트로 전달되어 LLM/결정론 하이브리드로 최종 프롬프트를 조립합니다.

---

## 핵심 모듈 (`src/lib`)

| 파일 | 역할 |
|------|------|
| `scene-schema.ts` | ROLE_SPEC · CATEGORY_SPEC · 어휘 정렬 · 검증 · LLM 스키마 브리핑 |
| `intensity-mapping.ts` | 0–100 → 6 밴드 × 카테고리별 부사·가중치·반복 |
| `conflict-matrix.ts` | 12축 기반 hard/soft 충돌 탐지 + 해결 제안 |
| `information-density.ts` | 구체성·시각 토큰·명사 특이성·길이 → weak reason 분류 |
| `visual-augmentation.ts` | 6 슬롯 3단계 파이프라인 (감지 → 증강 → 조립) |
| `prompt-analyzer.ts` | 프롬프트 → SceneObject[] (Gemini) |
| `prompt-enhancer.ts` | 약한 표현 감지 (Gemini + 밀도 메트릭) |
| `prompt-composer.ts` | SceneObject[] → 최종 영어 프롬프트 (Gemini) |

---

## 기타 기능

### Discover (`/discover`)
큐레이팅된 무드 이미지 + 커뮤니티 공유 갤러리. 태그 필터, 무한 스크롤, 상세 페이지에서 프롬프트 열람.

### Mypage (`/boards`)
생성하고 저장한 이미지 관리. 본인이 Discover에 공유한 이미지는 제목 수정 및 삭제 가능. 로그인 필요.

### 공유 & 커뮤니티
Discover 공유 시 Gemini가 제목·태그를 자동 생성합니다.

---

## 기술 스택

- **Frontend**: Next.js 16 (Turbopack) · React 19 · Tailwind CSS v4
- **Backend**: Next.js API Routes · Sharp (이미지 처리)
- **AI**
  - Google Gemini — 프롬프트 분석, 약한 표현 감지, 프롬프트 조합, 문장 다듬기, 제목·태그 생성
  - OpenAI — 이미지 생성
- **인증**: Supabase Auth (Google, Kakao OAuth)
- **데이터베이스**: Supabase (PostgreSQL)
- **배포**: GCP Compute Engine (e2-small, Debian 12) · systemd

---

## 성능 최적화

- 반응형 이미지 서빙 (200 / 400px / 원본) — 모바일 대역폭 절약
- srcSet·sizes 기반 브라우저 자동 이미지 선택
- LCP 이미지 eager 로드 + `fetchPriority="high"`
- 상세 페이지 썸네일 blur placeholder → 풀 이미지 점진 전환
- WebP + 서버 캐시 (seed 7일, shared 1일)
- Step 2 편집 종료 후 composer prefetch — Step 3 진입 체감 대기 단축

---

## 시작하기

```bash
npm install
npm run dev
```

http://localhost:3000

### 환경변수 (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
```

### 배포

배포 절차는 [`CLAUDE.md`](./CLAUDE.md) 참고.
