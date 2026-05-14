"use client";

import { useState } from "react";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({
  src,
  name,
  className = "h-8 w-8",
  fallbackClassName = "text-[12px]",
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initial = (name?.trim().slice(0, 1) || "U").toUpperCase();

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={`${className} shrink-0 rounded-full border border-[var(--angel-border)] object-cover`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${className} ${fallbackClassName} inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--angel-border)] bg-[var(--angel-blue)]/15 font-bold text-[var(--angel-blue)]`}
    >
      {initial}
    </span>
  );
}
