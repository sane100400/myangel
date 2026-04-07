import { genai } from "./gemini";
import type { SceneObject } from "@/types";

const SYSTEM_PROMPT = `당신은 이미지 생성을 위한 장면 분해 엔진입니다.
사용자가 한국어로 입력한 이미지 설명을 분석하여, 장면을 구성하는 핵심 요소를 추출해주세요.

각 요소는 다음 JSON 형태로 반환해주세요:
{
  "objects": [
    {
      "id": "고유 ID (obj_1, obj_2 등)",
      "role": "subject | background | mood | lighting | color | texture | composition",
      "label": "한국어 라벨 (예: 피사체, 배경, 분위기, 조명, 색감, 질감, 구도)",
      "description": "해당 요소에 대한 원본 설명 (한국어)",
      "attributes": [
        {
          "id": "고유 ID (attr_1 등)",
          "name": "속성 이름 (한국어, 예: 사실감, 디테일, 밝기)",
          "nameEn": "영어 속성명 (예: realism, detail, brightness)",
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
   예: "고양이와 강아지가 놀고 있는 공원" → subject 2개 (고양이, 강아지) + background 1개 (공원)
   예: "세 명의 소녀가 카페에 앉아있는 모습" → subject 3개 (소녀1, 소녀2, 소녀3) + background 1개 (카페)
4. 각 오브젝트에 2~4개의 관련 속성을 생성하세요.
5. 속성의 value는 입력 텍스트의 뉘앙스에 맞게 0-100 사이로 설정하세요.
6. 입력에 명시되지 않은 요소도 장면 완성을 위해 합리적으로 추론하여 추가하세요.
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

  return objects;
}
