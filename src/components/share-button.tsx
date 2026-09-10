"use client";

import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Share01Icon } from "@hugeicons/core-free-icons";

import { Button, type ButtonProps } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";

/**
 * Actually shares — the native share sheet where one exists (most mobile
 * browsers), same pattern `thread-card.tsx`'s share action already
 * uses, rather than silently copying a link and calling that "sharing."
 * Falls back to the clipboard only where there's no share sheet to open
 * (most desktop browsers) or the user dismissed it without picking
 * anything (`AbortError` — not a real failure, so no error toast for
 * that specific case).
 */
export function ShareButton({
  url,
  shareTitle,
  copiedToast,
  children,
  ...props
}: ButtonProps & {
  url: string;
  shareTitle?: string;
  copiedToast: string;
  children?: React.ReactNode;
}) {
  async function handleClick() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ url, title: shareTitle });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    const succeeded = await copyToClipboard(url);
    if (!succeeded) {
      toast.error(url);
      return;
    }
    toast.success(copiedToast);
  }

  return (
    <Button type="button" onClick={handleClick} {...props}>
      <HugeiconsIcon icon={Share01Icon} />
      {children}
    </Button>
  );
}
