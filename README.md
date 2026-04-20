# MyAngel

**한국어로 상상한 이미지를 AI가 최적화된 프롬프트로 변환해 생성해주는 인터랙티브 이미지 스튜디오.**

"몽환적인 하얀 침대방" 같은 추상적인 표현을 입력하면, AI가 장면을 오브젝트 단위로 분해하고 각 요소를 정밀하게 조정할 수 있는 편집 인터페이스를 제공합니다. 복잡한 프롬프트 문법 없이도 원하는 이미지에 가까운 결과를 얻을 수 있습니다.

🔗 **[myangel.studio](http://34.56.233.158)**

---

## 핵심 기능

### 1. Grammarly-style 인라인 프롬프트 강화

입력창에서 실시간으로 약한 표현을 감지하고 구체적인 대안을 제시합니다.

- 입력 1초 후 자동으로 **추상 표현 감지** → 물결 밑줄 표시
- 밑줄 클릭 → AI 제안 버블 즉시 노출 및 원클릭 교체
- 4가지 정보 밀도 메트릭(구체성 · 시각 토큰 적중률 · 명사 특이성 · 길이)으로 오탐 필터링
- 55개 예시 프롬프트 풀에서 매 방문마다 랜덤 4개 노출

### 2. Scene Canvas — 오브젝트 기반 편집

프롬프트를 Gemini가 분석해 장면 구성 요소(SceneObject)로 분해합니다.

```
"몽환적인 하얀 침대방"
    ↓ Gemini 파싱
[피사체: 하얀 침대]  [배경: 방]  [분위기: 몽환적]  [조명: 자연광]  [색감: 화이트 톤]
```

- **8개 Role × 6개 Category** 정식 스키마 + 카테고리별 표준 어휘 정규화
- **위치 조정** — 캔버스 드래그 → 3×3 그리드 공간 구문 자동 변환 (`upper-left of the frame`)
- **강도 슬라이더** (0–100) → 6단계 밴드로 부사·가중치·반복 자동 결정
  - 61–80 "strong" → `(token:1.3)`
  - 81–100 "dominant" → SD 스타일 가중치 + 반복 강화
- **충돌 감지** — 색 온도·조명 강도·사실성·시간대 등 12개 축 기반 hard/soft 충돌 탐지 및 해결 제안

### 3. 결과 비교 & 이미지 생성

- 원본 vs 강화 프롬프트 나란히 비교
- OpenAI 이미지 모델로 실제 이미지 생성
- **Contribution Badges** — 위치·강한 속성 Top3·속성 일관성·자동 보완 개수 시각화
- Discover 갤러리 공유 / 로컬 저장

---

## 파이프라인

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

각 시각 슬롯이 비어 있으면 기본 어휘(`cinematic`, `soft natural light`, `balanced composition` 등)를 자동 주입합니다. LLM과 결정론 로직의 하이브리드로 최종 프롬프트를 조립합니다.

---

## 기타 페이지

| 페이지 | 설명 |
|--------|------|
| `/discover` | 큐레이팅 무드 이미지 + 커뮤니티 공유 갤러리. 태그 필터, 무한 스크롤 |
| `/boards` | 내가 생성·저장한 이미지 관리. 공유 이미지 제목 수정·삭제 (로그인 필요) |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Next.js 16 (Turbopack) · React 19 · Tailwind CSS v4 |
| Backend | Next.js API Routes · Sharp (이미지 처리) |
| AI — 프롬프트 | Google Gemini (분석 · 강화 · 조합 · 다듬기 · 제목/태그 생성) |
| AI — 이미지 생성 | OpenAI |
| 인증 | Supabase Auth (Google, Kakao OAuth) |
| 데이터베이스 | Supabase (PostgreSQL) |
| 배포 | GCP Compute Engine (e2-small, Debian 12) · systemd |

---

## 주요 모듈 (`src/lib`)

| 파일 | 역할 |
|------|------|
| `scene-schema.ts` | ROLE_SPEC · CATEGORY_SPEC · 어휘 정렬 · 검증 · LLM 스키마 브리핑 |
| `intensity-mapping.ts` | 0–100 → 6밴드 × 카테고리별 부사·가중치·반복 매핑 |
| `conflict-matrix.ts` | 12축 기반 hard/soft 충돌 탐지 + 해결 제안 |
| `information-density.ts` | 구체성·시각 토큰·명사 특이성·길이 → weak reason 분류 |
| `visual-augmentation.ts` | 6슬롯 3단계 파이프라인 (감지 → 증강 → 조립) |
| `prompt-analyzer.ts` | 프롬프트 → SceneObject[] (Gemini) |
| `prompt-enhancer.ts` | 약한 표현 감지 (Gemini + 밀도 메트릭) |
| `prompt-composer.ts` | SceneObject[] → 최종 영어 프롬프트 (Gemini) |

---

## 성능 최적화

- 반응형 이미지 서빙 (200 / 400px / 원본) — 모바일 대역폭 절약
- `srcSet` · `sizes` 기반 브라우저 자동 이미지 선택
- LCP 이미지 eager 로드 + `fetchPriority="high"`
- 상세 페이지 썸네일 blur placeholder → 풀 이미지 점진 전환
- WebP + 서버 캐시 (seed 7일, shared 1일)
- Step 2 편집 종료 후 composer prefetch — Step 3 체감 대기 단축

---

## 로컬 개발

```bash
npm install
npm run dev
# http://localhost:3000
```

### 환경변수 (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
```

### 배포

배포 절차는 [`CLAUDE.md`](./CLAUDE.md) 참고.
