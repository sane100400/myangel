"use client";

import { useState } from "react";

// 각 태그별 설명 해시태그 — 메인 STYLE_PRESETS와 동일한 태그 + 아이템 카테고리 태그
const TAG_DESCRIPTIONS: Record<string, string[]> = {
  // 스타일 태그 (메인 STYLE_PRESETS와 동일)
  "지뢰계": ["#다크로맨틱", "#레이스", "#리본", "#블랙핑크"],
  "천사계": ["#파스텔", "#레이스", "#날개", "#순수"],
  "양산형": ["#핑크", "#리본", "#프릴", "#스위트"],
  "로리타": ["#프릴", "#레이스", "#드레스", "#클래식"],
  "고스로리": ["#고딕", "#다크", "#빈티지", "#로맨틱"],
  "페어리코어": ["#파스텔", "#몽환", "#요정", "#드림코어"],
  "Y2K": ["#레트로", "#메탈릭", "#글로시", "#2000s"],
  "위시코어": ["#빈티지로맨틱", "#아기자기", "#소녀감성", "#리본진주"],
  "캐릭터": ["#애니", "#일러스트", "#캐릭터디자인", "#판타지"],
  "감성": ["#에스테틱", "#무드", "#감성사진", "#아트"],
  // 아이템 카테고리 태그
  "레이스": ["#레이스원피스", "#투명소재", "#빈티지감성", "#섬세한디테일"],
  "리본": ["#리본헤어밴드", "#리본장식", "#큐트포인트", "#소녀감성"],
  "다크로맨틱": ["#다크빈티지", "#딥레드블랙", "#고딕감성", "#낭만적어둠"],
  "파스텔": ["#파스텔블루", "#파스텔핑크", "#부드러운무드", "#순수한톤"],
  "인테리어": ["#룸데코", "#일본방꾸미기", "#감성인테리어", "#카와이룸"],
  "인형": ["#BJD인형", "#봉제인형", "#드레스업", "#미니어처"],
  "액세서리": ["#헤어클립", "#초커", "#귀걸이", "#카와이소품"],
  "핑크": ["#핑크코디", "#베이비핑크", "#핑크덕후", "#핑크무드"],
};

interface TrendingTagsProps {
  tags: string[];
  selectedTag: string | null;
  onTagClick: (tag: string | null) => void;
}

export function TrendingTags({ tags, selectedTag, onTagClick }: TrendingTagsProps) {
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  return (
    <div className="relative">
      <div className="flex flex-wrap justify-center gap-2">
        <button
          onClick={() => onTagClick(null)}
          className={`angel-tag transition-all duration-300 ${
            selectedTag === null ? "angel-tag-active" : ""
          }`}
        >
          All
        </button>
        {tags.map((tag) => (
          <div key={tag} className="relative">
            <button
              onClick={() => onTagClick(selectedTag === tag ? null : tag)}
              onMouseEnter={() => setHoveredTag(tag)}
              onMouseLeave={() => setHoveredTag(null)}
              className={`angel-tag transition-all duration-300 ${
                selectedTag === tag ? "angel-tag-active" : ""
              }`}
            >
              #{tag}
            </button>

            {/* Tooltip — desktop only */}
            {hoveredTag === tag && TAG_DESCRIPTIONS[tag] && (
              <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 rounded-lg bg-white/90 backdrop-blur-xl px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                <div className="flex gap-2 whitespace-nowrap">
                  {TAG_DESCRIPTIONS[tag].map((desc) => (
                    <span
                      key={desc}
                      className="text-[10px] text-[var(--angel-text-soft)]"
                    >
                      {desc}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
