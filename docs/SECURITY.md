# 보안 설계 노트

## 위협 모델

본 앱은 **인증된 사용자만 비용 발생 작업(이미지 생성·편집)이 가능**한 SaaS 패턴입니다. 주요 위협 시나리오:

1. **무인증 API 남용** — 비로그인 사용자가 외부 AI 호출(과금 발생)을 트리거
2. **타 사용자 데이터 변조** — IDOR로 남의 이미지·잔액 변경
3. **SSRF** — 서버가 외부 URL을 fetch하는 지점에서 내부망 접근
4. **CSRF** — 다른 도메인의 form/script가 사용자 쿠키로 mutating endpoint 호출
5. **이미지 위조** — 위조 mimeType + 실제 다른 콘텐츠 업로드 (저장 오염)
6. **크레딧 race** — 동시 요청으로 잔액 음수 또는 이중 차감
7. **Rate-limit 우회** — 단일 사용자가 외부 API 토큰 고갈

## 완화 매핑

| 위협 | 완화 |
|---|---|
| 무인증 남용 | 모든 mutating endpoint에서 `supabase.auth.getUser()` → 401 |
| IDOR | RLS (`auth.uid() = user_id`) + 명시적 `.eq("user_id", user.id)` 이중 방어 |
| SSRF | `isSafeFetchUrl(url)` 호스트 화이트리스트 + 30s `AbortSignal` |
| CSRF | Origin 헤더 화이트리스트 (`assertSameOrigin`) + Supabase 쿠키 SameSite=Lax |
| 이미지 위조 | 매직 바이트 (`verifyImageMagic`) + base64 정규식 + 사이즈 캡 |
| 크레딧 race | Postgres SECURITY DEFINER RPC 단일 트랜잭션 (`FOR UPDATE` lock + 잔액 확인 + 차감 + ledger insert) |
| Rate limit | per-user in-memory token bucket (분당 30~60회 / API별), IP 기반 공유는 일일 10회 |

## 핵심 코드 위치

| 가드 | 파일 |
|---|---|
| `assertSameOrigin`, `rateLimitOk`, `verifyImageMagic`, `parseAndVerifyDataUrl`, `isSafeFetchUrl` | `src/lib/api-guard.ts` |
| `validateEditRequest` (마커·refs·globalAdjust 통합 검증) | `src/lib/marker-protocol.ts` |
| `deductCredits`, `refundCredits` RPC 래퍼 | `src/lib/credits.ts` |
| `deduct_credits`, `refund_credits` SQL 함수 | `supabase/schema.sql`, `supabase/migrations/*credit*.sql` |

## RLS 정책 요약

```sql
-- user_credits / credit_ledger
SELECT: auth.uid() = user_id
INSERT/UPDATE: 없음 — RPC(SECURITY DEFINER)로만 변경

-- pricing_config
SELECT: 모두 허용 (가격은 공개)
INSERT/UPDATE: 없음 — 운영자 직접 SQL

-- user_generations
SELECT/INSERT/DELETE: auth.uid() = user_id

-- discover_images
SELECT: 모두 허용
INSERT/UPDATE/DELETE: auth.uid() = user_id

-- error_logs
SELECT: auth.uid() = user_id
INSERT: 서버 service-role만 수행

-- Storage
shared-images: 공개 읽기, 작성자 폴더에만 INSERT/DELETE
user-generations: 본인 폴더만 SELECT/INSERT/DELETE
```

## 알려진 제약

- **단일 노드 rate limit**: in-memory 토큰 버킷이라 멀티 인스턴스 운영 시 각자 카운팅. 현재 GCP VM 1대라 무관.
- **부분 환불 미구현**: 4장 요청 중 3장 성공 시 전액 차감 (정책 결정).

## 단위 테스트 커버리지

`vitest`로 보안·검증·모델 요청 계약을 테스트합니다. 전체 테스트 수는 기능 추가에 따라 변할 수 있으므로 `npm test` 결과를 기준으로 확인합니다.

- 매직 바이트 검증 (위조 mime, 빈 입력, 깨진 base64)
- Rate limit (윈도 만료, 초과 차단, key 격리)
- SSRF host 화이트리스트 (서브도메인 hijack, http 차단, localhost SSRF)
- 마커 검증 (좌표 범위, op-refIndex 매칭, 글로벌 조정만)
- GPT Image 2 요청 payload 제한 (`quality` 미전송, 지원 size만 허용)
- 이미지 후처리 비율/해상도 정규화

```bash
npm test
```
