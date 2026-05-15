# 이미지 생성 저작권 리스크 대응안

Last updated: 2026-05-14

> 이 문서는 MyAngel 운영 리스크를 낮추기 위한 제품·기술 기준입니다. 법률 의견이 아니며, 상업 출시나 분쟁 대응 전에는 관할 지역 변호사 검토가 필요합니다.

## 1. 현재 기준 요약

- AI 생성물은 관할과 사실관계에 따라 권리 상태가 달라질 수 있습니다. 미국 저작권청은 순수 AI 산출물은 인간 저작성이 부족할 수 있고, 인간의 선택·배열·수정 등 창작 기여가 드러나는 부분만 보호될 수 있다고 봅니다.
- 사용자가 프롬프트만 입력한 경우에는 결과물 전체에 대해 저작권을 주장하기 어렵다는 리스크가 있습니다. 반대로 사람이 직접 편집·배열·후처리한 부분은 별도 보호 가능성이 있습니다.
- 생성 결과를 공유하거나 상업적으로 쓰는 사용자는 AI 사용 사실, 권리 보유 여부, 제3자 권리 침해 여부를 스스로 확인해야 합니다.
- 모델 제공자 정책도 준수해야 합니다. OpenAI와 Google 모두 제3자 권리 침해, 개인정보·초상권 침해, 보호장치 우회, 출처 오인 표시를 금지하거나 제한합니다.

참고한 1차 자료:

- U.S. Copyright Office, Copyright and Artificial Intelligence: https://www.copyright.gov/ai/
- U.S. Copyright Office, Registration Guidance for Works Containing AI-Generated Material: https://www.copyright.gov/ai/ai_policy_guidance.pdf
- OpenAI Usage Policies: https://openai.com/policies/usage-policies/
- OpenAI API output copyright FAQ: https://help.openai.com/en/articles/5008634-will-openai-claim-copyright-over-what-outputs-i-generate-with-the-api
- Google Generative AI Prohibited Use Policy: https://policies.google.com/terms/generative-ai/use-policy
- Gemini API Terms: https://ai.google.dev/gemini-api/terms
- Gemini API Safety Guidance: https://ai.google.dev/gemini-api/docs/safety-guidance

## 2. MyAngel 정책 원칙

1. **권리 보유 입력만 허용**  
   사용자는 본인이 만든 이미지, 사용 허가를 받은 이미지, 라이선스상 허용된 이미지만 업로드·공유해야 합니다.

2. **제3자 IP 직접 복제 차단**  
   기존 캐릭터, 프랜차이즈, 로고, 상표, 현존 작가·스튜디오의 고유한 스타일을 직접 재현하는 요청은 생성·편집 전에 차단합니다.

3. **레퍼런스는 복제가 아니라 방향성 참고**  
   레퍼런스 이미지는 분위기, 색감, 구도 참고 용도입니다. “똑같이 복제”, “1:1 copy” 같은 요청은 차단합니다.

4. **공유 시 출처 오인 방지**  
   Discover에 공유되는 결과물은 AI 생성·편집물이라는 서비스 맥락 안에서 노출됩니다. 사용자가 외부에 게시할 때도 AI 사용 사실을 숨기지 않도록 약관에 명시합니다.

5. **저작권 등록·상업 이용은 사용자 책임**  
   결과물의 권리 귀속, 등록 가능성, 광고·상품화 가능성은 입력·후처리·관할에 따라 달라집니다. 서비스는 권리 확보를 보장하지 않습니다.

## 3. 구현된 1차 방어선

### 서버 차단

`src/lib/copyright-guard.ts`를 추가해 생성·편집 API에서 다음 유형을 크레딧 차감 전에 차단합니다.

- 기존 캐릭터·프랜차이즈 직접 요청
- 제3자 브랜드 로고·상표 생성 요청
- 현존 작가·스튜디오의 스타일 직접 모방 요청
- 레퍼런스 또는 기존 작품의 근접 복제 요청

적용 지점:

- `/api/generate`: 사용자 프롬프트 검사
- `/api/edit`: 마커 프롬프트와 전체 분위기·조명 조정 텍스트 검사
- `/api/enhance-prompt`: 프롬프트 강화 모델이 기존 캐릭터·브랜드·현존 작가명을 대안으로 추천하지 않도록 시스템 프롬프트에 제한 추가

차단 응답:

```json
{
  "code": "copyright_risk",
  "error": "사용자에게 보여줄 한국어 안내",
  "copyrightRisk": {
    "action": "block",
    "issues": []
  }
}
```

### 테스트

`src/lib/copyright-guard.test.ts`에서 다음 회귀 케이스를 고정합니다.

- “브랜드 캠페인 컷” 같은 일반 마케팅 표현은 허용
- 미키마우스 등 기존 캐릭터 요청 차단
- Nike logo 같은 상표·로고 요청 차단
- apple fruit 같은 일반 단어 오탐 방지
- 현대 작가 스타일 모방 요청 차단
- 반 고흐풍 같은 공개 도메인 작가명은 현 1차 규칙에서 허용
- 레퍼런스 1:1 복제 요청 차단

## 4. 운영 프로세스

1. **차단 목록 업데이트**
   - 사용자 로그와 모델 거절 사례를 월 1회 검토합니다.
   - 오탐이 많은 단어는 “브랜드명 + 로고 맥락”처럼 조건부 규칙으로 조정합니다.

2. **삭제 요청 대응**
   - Discover 이미지에 대해 권리자 신고가 들어오면 공개 이미지를 우선 비공개/삭제하고, 작성자에게 근거 자료를 요청합니다.
   - 반복 위반 사용자는 공유 기능 제한 또는 계정 제한을 적용합니다.

3. **상업 이용 안내**
   - 사용자가 결과물을 광고·굿즈·상표·출판물에 쓰려는 경우, 업로드 원본 권리와 AI 생성물 권리 상태를 별도로 검토하도록 안내합니다.

4. **모델 정책 변경 추적**
   - OpenAI, Google, U.S. Copyright Office 정책 페이지를 릴리스 전 또는 월 1회 확인합니다.

## 5. 다음 단계

- UI에 “저작권·상표권 주의” 도움말을 프롬프트 입력창과 레퍼런스 업로드 영역에 추가합니다.
- 레퍼런스 업로드 시 “권리 보유/사용 허가 확인” 체크박스를 추가하고, 서버 요청에도 `rightsAcknowledged` 필드를 저장합니다.
- Discover 공유 전 AI 생성물 표시와 권리 보유 확인 문구를 모달에 추가합니다.
- 공개 신고/삭제 플로우를 별도 API와 관리자 화면으로 분리합니다.
