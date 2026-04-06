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
2. subject(피사체)는 반드시 포함하세요.
3. 각 오브젝트에 2~4개의 관련 속성을 생성하세요.
4. 속성의 value는 입력 텍스트의 뉘앙스에 맞게 0-100 사이로 설정하세요.
5. 입력에 명시되지 않은 요소도 장면 완성을 위해 합리적으로 추론하여 추가하세요.
6. role별 label 매핑: subject→피사체, background→배경, mood→분위기, lighting→조명, color→색감, texture→질감, composition→구도`;

export async function analyzePrompt(input: string): Promise<SceneObject[]> {
  const response = await genai.models.generateContent({
    model: "gemini-2.0-flash",
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
