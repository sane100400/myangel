import { genai } from "./gemini";
import type { SceneObject } from "@/types";
import { describeSchemaForLLM, normalizeScene, validateScene } from "./scene-schema";

const SYSTEM_PROMPT = `당신은 이미지 생성을 위한 장면 분해 엔진입니다.
사용자가 한국어로 입력한 이미지 설명을 분석하여, 장면을 구성하는 핵심 요소를 추출해주세요.

${describeSchemaForLLM()}

출력 JSON 형식:
{
  "objects": [
    {
      "id": "obj_1",
      "role": "subject | background | mood | lighting | color | texture | composition",
      "label": "한국어 라벨",
      "description": "해당 요소의 원본 설명 (한국어)",
      "attributes": [
        {
          "id": "attr_1",
          "name": "한국어 속성명",
          "nameEn": "영어 속성명 (카테고리 어휘 우선 사용)",
          "value": 50,
          "category": "style | texture | color | lighting | mood | detail"
        }
      ]
    }
  ]
}

규칙:
1. 최소 3개, 최대 7개의 오브젝트를 추출하세요.
2. subject(피사체)는 반드시 1개 이상 포함하세요.
3. 입력에 여러 피사체가 있으면 각각 별도의 subject 오브젝트로 분리하세요 (최대 3개).
4. 각 오브젝트에 2~4개의 관련 속성을 생성하세요.
5. value는 입력 텍스트의 뉘앙스에 맞게 0-100 사이로 설정하세요.
6. nameEn은 가능한 한 위 CATEGORIES의 어휘 내에서 선택하세요 — 스키마 일관성 유지.
7. role별 label 매핑: subject→피사체, background→배경, mood→분위기, lighting→조명, color→색감, texture→질감, composition→구도
8. 여러 subject가 있을 경우 label을 구분하세요 (예: "피사체: 고양이", "피사체: 강아지")`;

export async function analyzePrompt(input: string): Promise<SceneObject[]> {
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: `${SYSTEM_PROMPT}\n\n사용자 입력: "${input}"` }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("프롬프트 분석에 실패했습니다.");
  }

  const parsed = JSON.parse(text);
  const objects: SceneObject[] = parsed.objects || parsed;

  if (!Array.isArray(objects) || objects.length === 0) {
    throw new Error("장면 요소를 추출할 수 없었습니다.");
  }

  const normalized = normalizeScene(objects);
  const errors = validateScene(normalized).filter((v) => v.level === "error");
  if (errors.length > 0) {
    throw new Error(`스키마 위반: ${errors[0].message}`);
  }
  return normalized;
}
