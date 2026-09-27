"use client";

import { toast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/provider";

type ShareData = { title?: string; text?: string; url?: string };

/**
 * Copies text. Uses the Clipboard API when available; otherwise (e.g. an
 * http:// LAN address, which isn't a "secure context", so the API is
 * missing) falls back to a hidden textarea + execCommand("copy"), which
 * iOS Safari still supports inside a tap.
 */
async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const field = document.createElement("textarea");
  field.value = text;
  field.readOnly = true; // no keyboard on iOS
  field.style.cssText = "position:fixed;top:0;left:0;opacity:0;font-size:16px";
  document.body.append(field);
  field.focus();
  field.setSelectionRange(0, text.length); // iOS needs an explicit range
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("copy failed");
}

/**
 * Share like a native app: the phone's share sheet (Web Share API) when
 * available (HTTPS/localhost only), otherwise copy the link and confirm with
 * a toast.
 *   const share = useShare();
 *   share({ title: "Qura", url: location.href });
 */
export function useShare() {
  const { t } = useLocale();

  return async function share(data: ShareData) {
    const url = new URL(data.url ?? window.location.href, window.location.origin)
      .href;
    const payload = { ...data, url };

    if (navigator.share && (navigator.canShare?.(payload) ?? true)) {
      try {
        await navigator.share(payload);
        return;
      } catch (error) {
        // Closing the share sheet isn't an error.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await copyText(url);
      toast.add({ title: t("Link copied"), type: "success" });
    } catch {
      toast.add({ title: t("Couldn't share this link"), type: "error" });
    }
  };
}
