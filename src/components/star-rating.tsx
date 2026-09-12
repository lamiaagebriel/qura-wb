"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { StarIcon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

/** Five stars, filled up through `value` (rounded to the nearest whole
 * star — no half-star rendering) — shared by anywhere a rating shows as
 * stars rather than a number: `BusinessReviews`' composer (interactive,
 * `onChange` given) and its own summary header, and a profile's header
 * (read-only, just `value`). Interactive vs. read-only is purely
 * whether `onChange` is passed — same component either way, so a
 * rating always looks identical whichever context it's in. */
export function StarRating({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState(0);
  const interactive = !!onChange;
  const shown = interactive && hover > 0 ? hover : Math.round(value);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          className={cn(!interactive && "cursor-default")}
        >
          <HugeiconsIcon
            icon={StarIcon}
            className={cn(
              size === "sm" ? "size-3.5" : "size-4",
              n <= shown ? "text-amber-400" : "text-muted-foreground/25",
            )}
            fill={n <= shown ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}
