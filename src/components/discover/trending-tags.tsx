"use client";

import { useState } from "react";

// 각 태그별 설명 해시태그
const TAG_DESCRIPTIONS: Record<string, string[]> = {
  "천사계": ["#파스텔블루", "#화이트레이스", "#날개모티브", "#순수청순", "#하늘빛무드"],
  "지뢰계": ["#블랙핑크조합", "#다크귀여움", "#프릴리본", "#인형같은", "#병약미"],
  "양산형": ["#핑크트위드", "#리본가방", "#페미닌코디", "#아이돌현장", "#귀여운정석"],
  "고스로리": ["#고딕로리타", "#블랙레이스", "#다크엘레강스", "#십자가모티브", "#중세풍"],
  "스위트로리타": ["#파스텔원피스", "#프릴가득", "#동화속공주", "#달콤한무드", "#리본장식"],
  "페어리코어": ["#요정무드", "#투명한소재", "#날개장식", "#자연감성", "#몽환적"],
  "발레코어": ["#발레슈즈", "#레오타드", "#튀튀스커트", "#우아한핑크", "#발레리나"],
  "Y2K": ["#2000년대감성", "#메탈릭소재", "#로우라이즈", "#화려한컬러", "#레트로퓨처"],
  "다크로맨틱": ["#다크빈티지", "#딥레드블랙", "#레이스장식", "#고딕감성", "#낭만적어둠"],
  "프릴": ["#프릴블라우스", "#러플디테일", "#페미닌감성", "#로맨틱무드", "#레이어드"],
  "레이스": ["#레이스원피스", "#투명소재", "#빈티지감성", "#로리타무드", "#섬세한디테일"],
  "리본": ["#리본헤어밴드", "#리본장식", "#큐트포인트", "#양산형필수", "#소녀감성"],
  "드림코어": ["#몽환적무드", "#비현실감성", "#파스텔톤", "#꿈속세계", "#초현실"],
  "로리타": ["#로리타패션", "#클래식우아", "#도레스코디", "#프린세스룩", "#빈티지레이스"],
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

            {/* Tooltip */}
            {hoveredTag === tag && TAG_DESCRIPTIONS[tag] && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 rounded-lg bg-white/90 backdrop-blur-xl px-3 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
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
