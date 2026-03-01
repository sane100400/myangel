"use client";

interface TrendingTagsProps {
  tags: string[];
  selectedTag: string | null;
  onTagClick: (tag: string | null) => void;
}

export function TrendingTags({ tags, selectedTag, onTagClick }: TrendingTagsProps) {
  return (
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
        <button
          key={tag}
          onClick={() => onTagClick(selectedTag === tag ? null : tag)}
          className={`angel-tag transition-all duration-300 ${
            selectedTag === tag ? "angel-tag-active" : ""
          }`}
        >
          #{tag}
        </button>
      ))}
    </div>
  );
}
