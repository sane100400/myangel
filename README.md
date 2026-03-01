# MyAngel

서브컬처 패션 트렌드에 맞춘 **AI 이미지 생성 & 프롬프트 큐레이팅 플랫폼**.

지뢰계, 천사계, 양산형 등 일본 서브컬처 패션 스타일의 프롬프트를 탐색하고, AI로 나만의 이미지를 생성하고, 커뮤니티에 공유할 수 있습니다.

## 주요 기능

### Discover
큐레이팅된 무드 이미지 갤러리. 스타일 태그별 필터링, 무한 스크롤, 프롬프트 열람이 가능합니다. 커뮤니티 공유 이미지도 함께 노출됩니다. 프리미엄 프롬프트는 블러 처리되어 구매 후 확인할 수 있습니다.

### Generate
텍스트 프롬프트로 AI 이미지를 생성합니다. 10가지 스타일 프리셋(지뢰계, 천사계, 양산형, 로리타, 고스로리, 페어리코어, Y2K, 위시코어, 캐릭터, 감성)을 제공하며, 레퍼런스 이미지 첨부와 자유 프롬프트 입력도 지원합니다. 생성한 이미지는 로컬 저장 또는 Discover에 공유할 수 있습니다.

### Mypage
생성하고 저장한 이미지를 관리하는 개인 갤러리입니다. 로그인이 필요합니다.

### 공유 & 커뮤니티
생성한 이미지를 Discover에 공유하면 Gemini AI가 자동으로 제목과 태그를 생성합니다. 본인이 공유한 이미지는 제목 수정과 삭제가 가능합니다.

### 브랜드 추천
MA*RS, Angelic Pretty, Ank Rouge, ROJITA 등 스타일에 맞는 서브컬처 패션 브랜드를 소개합니다.

## 기술 스택

- **Frontend**: Next.js 16, React, Tailwind CSS v4
- **Backend**: Next.js API Routes, Sharp (이미지 처리)
- **인증**: Supabase Auth (Google, Kakao OAuth)
- **데이터베이스**: Supabase (PostgreSQL)
- **AI**: OpenAI (이미지 생성), Gemini (제목/태그 자동 생성)
- **배포**: GCP Compute Engine, systemd

## 성능 최적화

- 반응형 이미지 서빙 (200px / 400px / 원본) — 모바일 대역폭 절약
- srcSet/sizes 기반 브라우저 자동 이미지 선택
- LCP 최적화: 초기 이미지 eager 로드 + fetchPriority
- 상세 페이지 썸네일 blur placeholder → 풀 이미지 전환
- WebP 포맷 + 서버 캐시 (seed 7일, shared 1일)

## 시작하기

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

### 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```
