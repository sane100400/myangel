# 마커 기반 이미지 편집 프로토콜

MyAngel의 `/edit` 기능은 자연어만으로 편집 대상을 추정하지 않고, 사용자가 이미지 위에 놓은 원형 마커를 모델 입력으로 함께 전달합니다. 현재 구현은 로컬 마커 편집과 이미지 전체 분위기·조명 조정을 분리합니다.

## 지원 편집 방식

### 로컬 마커 편집

```ts
interface MarkerSpec {
  id: string;
  op: "replace" | "add" | "remove";
  circle: { cx: number; cy: number; r: number };
  refIndex?: number;
  note?: string;
}
```

- `cx`, `cy`: 이미지 좌상단 기준 정규화 좌표 `[0, 1]`
- `r`: `min(width, height)` 대비 반지름 비율 `(0, 0.6]`
- `replace`: 마커 위치의 객체나 영역을 레퍼런스 이미지 또는 마커 프롬프트 기준으로 교체
- `add`: 마커 위치 주변에 새 콘텐츠 추가
- `remove`: 마커 위치의 콘텐츠 제거 후 배경 복원

`replace`와 `add`는 레퍼런스 이미지가 없으면 마커 프롬프트가 필요합니다. `remove`는 프롬프트 없이도 가능하지만, 자연스러운 복원을 위해 설명을 추가할 수 있습니다.

### 글로벌 분위기·조명 조정

```ts
interface GlobalAdjust {
  mood?: string;
  lighting?: string;
  note?: string;
}
```

- 마커 없이 `globalAdjust`만으로도 편집 가능
- 마커와 동시에 사용하면 로컬 편집 후 전체 톤·색감·조명 변환을 적용
- 기존 `adjust` 마커 op는 사용하지 않으며, 전역 조정은 별도 `globalAdjust` 필드로 처리

## 마스크와 모델 입력

### Nano Banana Pro

Nano Banana Pro 경로는 세 가지 입력을 함께 전달합니다.

1. 원본 이미지
2. 원본 위에 마커 외곽선을 그린 시각 가이드
3. 그레이스케일 마스크

그레이스케일 마스크 값:

| 값 | 의미 |
|---:|---|
| 0 | preserve |
| 64 | remove |
| 128 | add |
| 255 | replace |

### GPT Image 2

GPT Image 2 경로는 OpenAI 이미지 편집 API에 원본 이미지와 알파 마스크를 전달합니다.

- 투명 픽셀: 편집 대상
- 불투명 픽셀: 보존 대상
- GPT Image 2에는 `quality` 파라미터를 보내지 않음
- 앱의 1K/2K 선택은 결과 파일의 후처리 해상도에 적용
- GPT Image 2 + 4K 조합은 검증 단계에서 거부

## Prompt Builder

`src/lib/marker-prompt.ts`는 입력 모드별로 prompt를 구성합니다.

- 마커만: 로컬 영역만 수정하고 선택되지 않은 영역 보존
- 글로벌 조정만: subject, composition, geometry를 유지하고 mood/lighting만 변경
- 마커 + 글로벌 조정: 로컬 편집을 먼저 수행하고 전체 분위기 변환을 적용

프롬프트에는 이미지 크기, 정규화 좌표, 중심 픽셀, 마커 지름, 레퍼런스 이미지 번호, 마커 노트를 포함합니다.

## 검증

`src/lib/marker-protocol.ts`의 `validateEditRequest`가 다음을 보장합니다.

- `base`, `references[]`: base64, MIME, 매직 바이트, 크기 검증
- `markers.length <= 3`, `references.length <= 3`
- `op`는 `replace | add | remove`만 허용
- 좌표 범위와 반지름 범위 검증
- `refIndex`가 있으면 레퍼런스 배열 범위 안에 있어야 함
- `markers`가 비어 있으면 `globalAdjust`가 필요
- `count`는 1~4로 제한
- `quality`는 1K/2K/4K 중 하나로 정규화
- 모델/화질 조합 검증: GPT Image 2는 4K 요청 거부

## 호출 흐름

```text
client (/edit)
  POST /api/edit { base, markers, references, globalAdjust, count, quality, model }
    -> assertSameOrigin
    -> Supabase auth
    -> validateEditRequest
    -> deductCredits
    -> runMarkerEdit
       -> sharp metadata
       -> marker prompt build
       -> Nano Banana Pro or GPT Image 2
       -> SSE image / image_failed / done
    -> 클라이언트가 성공 이미지를 Mypage에 자동 저장
```

전체 실패 시 차감된 크레딧은 환불합니다. 일부 성공/일부 실패인 경우 현재 정책은 성공 결과를 반환하고 전액 환불하지 않습니다.

## 관련 테스트

- `src/lib/marker-protocol.test.ts`
- `src/lib/marker-renderer.test.ts`
- `src/lib/marker-prompt.ts`는 `edit-client.test.ts`에서 모델 호출 입력으로 간접 검증
- `src/lib/edit-client.test.ts`
- `src/lib/openai-image-requests.test.ts`
