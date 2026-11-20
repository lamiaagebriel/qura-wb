"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

/**
 * A review's text, cut to four lines with "more" (Instagram's comments)
 * when it's longer; tapping it shows the rest.
 */
export function ReviewText({ text }: { text: string }) {
  const { t } = useLocale();
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setClamped(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  return (
    <div className="flex flex-col items-start">
      <p
        ref={ref}
        dir="auto"
        className={`w-full text-start text-sm leading-relaxed whitespace-pre-line ${expanded ? "" : "line-clamp-4"}`}
      >
        {text}
      </p>
      {clamped && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={cn(buttonVariants({ variant: "link" }), "-my-3 h-11 px-0 text-muted-foreground")}
        >
          {t("more")}
        </button>
      )}
    </div>
  );
}
