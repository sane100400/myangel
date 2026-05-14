"use client";

import { useState } from "react";

// 공유 이미지 태그 설명
const TAG_DESCRIPTIONS: Record<string, string[]> = {
  "생성": ["#prompt", "#model", "#result"],
  "편집": ["#base", "#edit", "#result"],
  "부분편집": ["#mask", "#inpaint", "#marker"],
  "마커편집": ["#replace", "#add", "#remove"],
  "프롬프트강화": ["#rewrite", "#detail", "#korean"],
  "배경수정": ["#background", "#replace"],
  "소품추가": ["#object", "#add"],
  "색감보정": ["#tone", "#color"],
  "레퍼런스": ["#reference", "#reuse"],
  "공유": ["#discover", "#archive"],
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
                      className="text-[12px] text-[var(--angel-text-soft)]"
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
