# MyAngel

한국어 사용자에 최적화된 AI 이미지 생성·부분 편집·저장·공유 웹 앱입니다.

라이브: https://ku-myangel.site

## 현재 기능

### 이미지 생성

`/generate`에서 텍스트 프롬프트와 최대 3장의 레퍼런스 이미지로 결과를 생성합니다.

| 모델 | 용도 | 화질 옵션 |
|---|---|---|
| GPT Image 2 (`gpt-image-2`) | 빠른 기본 생성, 텍스트·로고·라벨 표현 | 1K / 2K |
| Nano Banana Pro (`gemini-3-pro-image-preview`) | 스타일 표현과 고해상도 생성 | 1K / 2K / 4K |

- GPT Image 2는 4K를 지원하지 않으므로 UI와 API 검증에서 `GPT Image 2 + 4K` 조합을 차단합니다.
- GPT Image 2 요청에는 `quality` 파라미터를 보내지 않습니다. 앱의 1K/2K 선택은 결과 파일의 후처리 해상도와 크레딧 계산에 사용됩니다.
- Nano Banana Pro는 `imageConfig.imageSize`에 1K/2K/4K를 전달합니다.
- GPT Image 2 결과는 선택한 비율과 화질에 맞게 서버에서 `sharp`로 정규화합니다.

### 프롬프트 강화

`/generate`의 인라인 강화 UI는 약한 표현을 감지하고 더 구체적인 대안을 제안합니다. 선택한 대안은 `/api/rewrite-prompt`를 통해 자연스러운 한국어 문장으로 다시 정리할 수 있습니다.

### 마커 기반 편집

`/edit`에서 베이스 이미지 위에 원형 마커를 놓고 부분 편집을 실행합니다.

지원 op:

- `replace`: 선택 영역 교체
- `add`: 선택 영역 주변에 새 요소 추가
- `remove`: 선택 영역 제거 후 배경 복원

전역 분위기·조명 변경은 마커 op가 아니라 `globalAdjust` 필드로 처리합니다. 마커 없이도 Mood, Lighting, Note만으로 전체 이미지를 조정할 수 있습니다.

모델별 편집 경로:

- Nano Banana Pro: 원본, 마커 가이드, 그레이스케일 마스크, 레퍼런스 이미지를 함께 전달
- GPT Image 2: 원본, 알파 마스크, 레퍼런스 이미지를 OpenAI 이미지 편집 API에 전달

자세한 내용은 [docs/MARKER_PROTOCOL.md](./docs/MARKER_PROTOCOL.md)를 참고하세요.

### 저장·공유

- 생성/편집 성공 결과는 클라이언트에서 `/api/saved-images`로 자동 저장합니다.
- `/boards`에서 저장 이미지를 확인, 삭제, 재편집, Discover 공유할 수 있습니다.
- `/discover`는 공개 공유 이미지 갤러리입니다.
- `/discover/[id]`는 공유 결과 상세 페이지입니다.

### 크레딧

- 인증 사용자만 생성·편집·저장·공유 API를 사용할 수 있습니다.
- 생성/편집 요청 전에 Supabase RPC로 크레딧을 차감합니다.
- 전체 실패 시 차감 내역을 환불합니다.
- 일부 성공/일부 실패는 현재 전액 환불하지 않습니다.
- 단가표는 `pricing_config`에서 관리하며 `/api/credits/balance`가 잔액과 단가를 반환합니다.

## 주요 라우트

| 경로 | 설명 |
|---|---|
| `/` | 제품 소개 |
| `/generate` | 이미지 생성 |
| `/edit` | 마커 기반 편집 |
| `/boards` | 내 저장 이미지 |
| `/discover` | 공개 갤러리 |
| `/discover/[id]` | 공개 이미지 상세 |
| `/auth/login` | 이메일/Google 로그인 |
| `/terms` | 이용약관 |

## API 라우트

| 경로 | 설명 |
|---|---|
| `/api/generate` | 이미지 생성 SSE |
| `/api/edit` | 이미지 편집 SSE |
| `/api/enhance-prompt` | 약한 표현 감지 |
| `/api/rewrite-prompt` | 프롬프트 문장 다듬기 |
| `/api/saved-images` | 저장 이미지 목록/생성 |
| `/api/saved-images/[id]` | 저장 이미지 삭제 |
| `/api/discover/images` | Discover 목록 |
| `/api/discover/images/[id]` | Discover 상세 |
| `/api/share` | 저장 이미지를 Discover에 공유 |
| `/api/share/[id]` | 공유 이미지 상세/수정/삭제 |
| `/api/credits/balance` | 크레딧 잔액과 단가 |
| `/api/log-error` | 클라이언트 오류 기록 |

## 기술 스택

- Next.js 16 App Router, React 19, Tailwind CSS v4
- Supabase Auth, Postgres, Storage, RLS
- OpenAI Node SDK
- Google GenAI SDK
- `sharp` 이미지 후처리와 마스크 렌더링
- Vitest 단위 테스트
- GCP Compute Engine, nginx, systemd

## 주요 모듈

```text
src/
├── app/
│   ├── generate/                 # 생성 화면
│   ├── edit/                     # 편집 화면
│   ├── boards/                   # 저장 이미지
│   ├── discover/                 # 공개 갤러리
│   ├── terms/                    # 이용약관
│   └── api/                      # Next.js API routes
├── components/
│   ├── studio/                   # 생성/편집 공용 UI
│   ├── board/                    # 저장 이미지 UI
│   ├── discover/                 # Discover UI
│   └── layout/                   # Navbar/Footer
└── lib/
    ├── image-models.ts           # 모델/화질/비율 계약
    ├── image-output.ts           # 서버 이미지 후처리
    ├── openai-image-requests.ts  # GPT Image 2 요청 payload 제한
    ├── marker-protocol.ts        # 편집 요청 검증
    ├── marker-renderer.ts        # 마스크/미리보기 렌더링
    ├── marker-prompt.ts          # 편집 prompt builder
    ├── edit-client.ts            # 편집 모델 호출
    ├── credits.ts                # 크레딧 RPC wrapper
    ├── saved-images.ts           # 저장 이미지 클라이언트
    └── api-guard.ts              # Origin, rate limit, SSRF, 이미지 검증
```

## 보안

주요 mutating endpoint는 Origin 검증, Supabase 인증, RLS, 매직 바이트 검증, rate limit, SSRF 방어를 사용합니다. 자세한 내용은 [docs/SECURITY.md](./docs/SECURITY.md)를 참고하세요.

이미지 생성·편집의 저작권·상표권 리스크 대응 기준은 [docs/COPYRIGHT_RISK_MITIGATION.md](./docs/COPYRIGHT_RISK_MITIGATION.md)를 참고하세요.

## 로컬 개발

```bash
npm install
npm run dev
```

필수 환경변수:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_AI_API_KEY=
OPENAI_API_KEY=
```

검증:

```bash
npm run lint
npm test
npm run build
```

## 배포

운영 서버는 GCP VM에서 nginx가 80/443을 받고 Next.js standalone 서버가 `localhost:3000`에서 실행됩니다. 현재 표준 배포 절차는 tar 기반이며 [CLAUDE.md](./CLAUDE.md)에 정리되어 있습니다.
