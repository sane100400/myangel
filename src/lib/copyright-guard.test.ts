import { describe, expect, it } from "vitest";
import { assessCopyrightRisk, formatCopyrightRiskError } from "./copyright-guard";

describe("copyright guard", () => {
  it("allows generic brand campaign language without a specific trademark", () => {
    const result = assessCopyrightRisk(
      "신규 라이프스타일 브랜드의 메인 캠페인 컷, 제품과 인물이 자연스럽게 어우러진 장면"
    );
    expect(result.action).toBe("allow");
  });

  it("blocks direct copyrighted character or franchise requests", () => {
    const result = assessCopyrightRisk("미키마우스가 천사 날개를 단 귀여운 이미지");
    expect(result.action).toBe("block");
    expect(result.issues[0]?.category).toBe("copyrighted_character");
  });

  it("blocks third-party trademark logo requests", () => {
    const result = assessCopyrightRisk("검은 후드티에 Nike logo가 크게 들어간 제품 사진");
    expect(result.action).toBe("block");
    expect(result.issues[0]?.category).toBe("trademark_logo");
  });

  it("does not treat ordinary non-logo brand words as logo infringement", () => {
    const result = assessCopyrightRisk("apple fruit arranged on a white table");
    expect(result.action).toBe("allow");
  });

  it("blocks contemporary artist or studio style mimicry", () => {
    const result = assessCopyrightRisk("그렉 루트코프스키 스타일의 판타지 일러스트");
    expect(result.action).toBe("block");
    expect(result.issues[0]?.category).toBe("living_artist_style");
  });

  it("allows public-domain historical style names that are not in the contemporary list", () => {
    const result = assessCopyrightRisk("반 고흐풍의 소용돌이치는 밤하늘");
    expect(result.action).toBe("allow");
  });

  it("blocks near-exact copy requests", () => {
    const result = assessCopyrightRisk("attached reference와 똑같이 1:1로 복제해줘");
    expect(result.action).toBe("block");
    expect(result.issues[0]?.category).toBe("near_exact_copy");
  });

  it("formats a user-facing Korean error", () => {
    const result = assessCopyrightRisk("나이키 로고가 있는 운동화 광고");
    expect(formatCopyrightRiskError(result)).toContain("차단됩니다");
  });
});

