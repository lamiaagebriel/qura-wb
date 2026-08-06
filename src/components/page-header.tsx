"use client";

import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shared top bar for every `/account/*` sub-page — back button, centered
 * title, optional trailing action. Referenced (but not yet implemented)
 * from `(marketing)/layout.tsx`'s comment about sub-pages bringing their
 * own header; this is that piece.
 */
export function PageHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "border-border/50 bg-background/85 sticky top-0 z-40 border-b backdrop-blur-xl",
        className,
      )}
    >
      <div className="container flex h-12.5 items-center gap-2 px-4">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back"
          onClick={() => router.back()}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="rtl:rotate-180" />
        </Button>
        <h1 className="text-foreground flex-1 truncate text-center text-[15px] font-semibold">
          {title}
        </h1>
        <div className="flex w-7 items-center justify-end">{action}</div>
      </div>
    </header>
  );
}
