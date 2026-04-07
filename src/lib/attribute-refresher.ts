import { genai } from "./gemini";
import type { SceneObject, ObjectAttribute } from "@/types";

const SYSTEM_PROMPT = `당신은 이미지 생성 장면 요소의 속성 생성 엔진입니다.
주어진 장면 요소(role, label, description)에 적합한 속성(attributes)을 생성해주세요.

반환 형식 (JSON 배열):
[
  {
    "id": "attr_1",
    "name": "한국어 속성명 (예: 따뜻함, 밝기, 사실감)",
    "nameEn": "영어 속성명 (예: warmth, brightness, realism)",
    "value": 50,
    "category": "style | texture | color | lighting | mood | detail"
  }
]

규칙:
1. 2~4개의 속성을 생성하세요.
2. 속성은 해당 요소의 설명(description)과 역할(role)에 맞는 것으로 선택하세요.
3. value는 설명의 뉘앙스를 반영하여 0-100 사이로 설정하세요.
4. 속성은 이미지 생성에 실질적으로 영향을 줄 수 있는 시각적 특성이어야 합니다.
5. 설명이 바뀌었을 때 이전 속성과 관계없이, 새로운 설명에 맞는 속성을 새로 생성하세요.`;

export async function refreshAttributes(
  obj: Pick<SceneObject, "role" | "label" | "description">
): Promise<ObjectAttribute[]> {
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${SYSTEM_PROMPT}\n\n요소 정보:\n- role: ${obj.role}\n- label: ${obj.label}\n- description: "${obj.description}"`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("속성 생성에 실패했습니다.");
  }

  const parsed = JSON.parse(text);
  const attrs: ObjectAttribute[] = Array.isArray(parsed)
    ? parsed
    : parsed.attributes || [];

  if (!Array.isArray(attrs) || attrs.length === 0) {
    throw new Error("속성을 생성할 수 없었습니다.");
  }

  // Ensure unique IDs
  return attrs.map((a, i) => ({
    ...a,
    id: `attr_${Date.now()}_${i}`,
  }));
}
