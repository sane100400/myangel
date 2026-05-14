import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | MyAngel",
  description: "MyAngel AI 이미지 생성·편집 서비스 이용약관",
};

const TERMS_SECTIONS = [
  {
    title: "1. 서비스의 목적",
    body: [
      "MyAngel은 사용자가 텍스트 프롬프트와 참고 이미지를 입력해 AI 이미지를 생성하고, 마커 기반으로 이미지를 편집하며, 결과물을 저장·공유할 수 있도록 돕는 웹 서비스입니다.",
      "서비스에는 이미지 생성, 이미지 편집, 프롬프트 강화, 저장 이미지 관리, Discover 공개 공유 기능이 포함됩니다.",
    ],
  },
  {
    title: "2. 계정과 인증",
    body: [
      "이미지 생성, 편집, 저장, 공유처럼 비용 또는 데이터 변경이 발생하는 기능은 로그인한 사용자만 사용할 수 있습니다.",
      "사용자는 본인 계정으로 발생한 요청, 저장 이미지, 공개 공유 이미지, 크레딧 사용에 대한 책임을 집니다.",
    ],
  },
  {
    title: "3. AI 생성·편집 결과",
    body: [
      "AI 모델의 출력은 동일한 입력에서도 달라질 수 있으며, 결과의 정확성, 완전성, 특정 목적 적합성을 보장하지 않습니다.",
      "GPT Image 2는 4K 출력을 지원하지 않습니다. GPT Image 2의 1K/2K 선택은 결과 파일 후처리 해상도와 크레딧 계산에 적용됩니다.",
      "Nano Banana Pro는 1K, 2K, 4K 요청을 지원합니다.",
      "편집 기능은 사용자가 지정한 마커와 전체 분위기·조명 조정 입력을 바탕으로 동작하지만, 주변 맥락에 따라 예상과 다른 결과가 나올 수 있습니다.",
    ],
  },
  {
    title: "4. 크레딧과 환불",
    body: [
      "이미지 생성·편집 요청은 선택한 화질과 개수에 따라 크레딧을 차감합니다.",
      "요청한 이미지가 모두 실패한 경우 차감된 크레딧은 자동 환불됩니다.",
      "여러 장 요청 중 일부가 성공한 경우 현재 정책상 전액 환불하지 않습니다.",
      "운영자는 모델 비용, 서비스 안정성, 이벤트 정책에 따라 크레딧 단가나 지급 정책을 변경할 수 있습니다.",
    ],
  },
  {
    title: "5. 사용자 콘텐츠와 저장",
    body: [
      "사용자가 업로드한 베이스 이미지, 참고 이미지, 프롬프트, 생성·편집 결과는 서비스 제공, 저장, 공유, 오류 대응을 위해 처리될 수 있습니다.",
      "Mypage 저장 이미지는 로그인 사용자 본인만 접근할 수 있도록 관리됩니다.",
      "Discover에 공유한 이미지는 공개 갤러리에 표시되며, 다른 사용자가 열람할 수 있습니다.",
      "사용자는 본인이 업로드·공유하는 콘텐츠에 필요한 권리와 사용 허가를 갖고 있어야 합니다.",
    ],
  },
  {
    title: "6. 금지 행위",
    body: [
      "타인의 권리, 초상, 개인정보, 저작권, 상표권을 침해하는 콘텐츠 업로드 또는 공유를 금지합니다.",
      "불법, 유해, 사기, 괴롭힘, 혐오, 성적 착취, 폭력 조장 등 서비스 운영에 부적절한 콘텐츠 생성을 금지합니다.",
      "자동화된 대량 요청, rate limit 우회, 취약점 악용, 비정상적인 크레딧 사용을 금지합니다.",
      "운영자는 위반 콘텐츠를 삭제하거나 계정·기능 접근을 제한할 수 있습니다.",
    ],
  },
  {
    title: "7. 보안과 오류 기록",
    body: [
      "서비스는 Origin 검증, 인증, RLS, 이미지 형식 검증, rate limit, SSRF 방어 등 안전장치를 사용합니다.",
      "클라이언트 또는 서버 오류는 문제 해결과 서비스 안정화를 위해 최소한의 메타데이터와 함께 기록될 수 있습니다.",
    ],
  },
  {
    title: "8. 서비스 변경과 중단",
    body: [
      "AI 모델, 외부 API, 인프라 상태에 따라 일부 기능이 지연되거나 실패할 수 있습니다.",
      "운영자는 서비스 품질 개선, 보안, 비용 관리, 정책 변경을 위해 기능, 모델, 크레딧 정책, 이용약관을 변경할 수 있습니다.",
    ],
  },
  {
    title: "9. 문의",
    body: [
      "서비스 이용, 콘텐츠 삭제, 계정, 크레딧, 보안 문제에 대한 문의는 운영자에게 전달해 주세요.",
      "별도 고지된 연락 채널이 없는 경우 서비스 운영자가 제공한 공식 연락 수단을 사용합니다.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="narrow-shell py-10 md:py-14">
      <div className="page-header">
        <div>
          <p className="page-kicker">Terms</p>
          <h1 className="page-title">이용약관</h1>
          <p className="page-lead">
            MyAngel의 이미지 생성·편집·저장·공유 기능을 사용할 때 적용되는 기본 조건입니다.
          </p>
        </div>
      </div>

      <div className="surface-panel space-y-7">
        <p className="text-[13px] leading-6 text-[var(--angel-text-faint)]">
          시행일: 2026년 5월 13일
        </p>
        {TERMS_SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-[17px] font-bold text-[var(--angel-text)]">
              {section.title}
            </h2>
            <div className="mt-3 space-y-2">
              {section.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-[14px] leading-7 text-[var(--angel-text-soft)] [word-break:keep-all]"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
