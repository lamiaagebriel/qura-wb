"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AddSquareIcon,
  Cancel01Icon,
  Download04Icon,
  Share01Icon,
} from "@hugeicons/core-free-icons";

import { useLocale } from "@/lib/i18n/client";

const DISMISSED_KEY = "qura-install-dismissed";

// Not in lib.dom.d.ts — Chromium-only, non-standard event.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// iPadOS 13+ drops the "iPad" token and reports as a plain Mac UA — the
// touch-point check is what actually tells it apart from a real Mac.
function isIos(): boolean {
  const ua = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Macintosh") && navigator.maxTouchPoints > 1)
  );
}

/**
 * Where a native install prompt exists (Chromium's `beforeinstallprompt`)
 * this drives that directly, no instructions needed. iOS Safari (and
 * every other iOS browser — they all run WebKit) never fires that event
 * because Apple doesn't implement it; "Share → Add to Home Screen" is the
 * *only* path there, so that branch shows the minimum needed to point at
 * it rather than skipping it entirely.
 *
 * First encounter is a full-screen, blocking ask; "Not now"/"Got it"
 * drops it to a slim top bar that stays available (across reloads, since
 * the dismissal itself is what's remembered, not "never ask again") for
 * whenever they'd rather install later. `appinstalled` (Chromium) or
 * reopening once already added (`navigator.standalone` on iOS) clears it.
 */
export function PwaInstallPrompt() {
  const { t } = useLocale();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<"chromium" | "ios" | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    function wasDismissed(): boolean {
      try {
        return localStorage.getItem(DISMISSED_KEY) === "1";
      } catch {
        // localStorage unavailable (private mode, etc.) — treat as
        // not-yet-dismissed rather than never offering install at all.
        return false;
      }
    }

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("chromium");
      if (wasDismissed()) setShowBar(true);
      else setShowModal(true);
    }

    function onAppInstalled() {
      setDeferredPrompt(null);
      setShowModal(false);
      setShowBar(false);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    // No event to wait for on iOS — if it can't already be running
    // standalone (checked above), the offer is available right away.
    if (isIos()) {
      setPlatform("ios");
      if (wasDismissed()) setShowBar(true);
      else setShowModal(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function install() {
    if (platform === "ios") {
      setShowModal(false);
      return;
    }
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      // A prompt already consumed (can't `.prompt()` the same event
      // twice) throws here — the bar just stays put for next time.
    }
    setShowModal(false);
  }

  function dismiss() {
    setShowModal(false);
    setShowBar(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Nothing to persist to — the bar for this tab still shows below.
    }
  }

  if (showModal) {
    return (
      <div className="bg-background fixed inset-0 z-100 flex flex-col items-center justify-center gap-6 px-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- local svg, no image optimizer needed */}
        <img src="/icon.svg" alt="" className="size-20 rounded-2xl" />
        <div className="flex flex-col gap-2">
          <h2 className="text-foreground text-lg font-semibold">
            {t("Install Qura")}
          </h2>
          {platform === "ios" ? (
            <p className="text-muted-foreground flex max-w-xs flex-wrap items-center justify-center gap-1 text-sm leading-relaxed">
              {t("Tap")}
              <HugeiconsIcon
                icon={Share01Icon}
                className="text-foreground size-4 shrink-0"
              />
              {t("then")}
              <HugeiconsIcon
                icon={AddSquareIcon}
                className="text-foreground size-4 shrink-0"
              />
              {t("Add to Home Screen.")}
            </p>
          ) : (
            <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
              {t(
                "Add Qura to your home screen for a faster, full-screen experience.",
              )}
            </p>
          )}
        </div>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <button
            type="button"
            onClick={install}
            className="bg-foreground text-background rounded-full py-3 text-sm font-semibold"
          >
            {platform === "ios" ? t("Got it") : t("Install")}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="text-muted-foreground py-3 text-sm font-medium"
          >
            {t("Not now")}
          </button>
        </div>
      </div>
    );
  }

  if (showBar) {
    return (
      <div className="bg-foreground text-background sticky top-0 z-50 flex items-center gap-3 px-4 py-2">
        <HugeiconsIcon icon={Download04Icon} className="size-4 shrink-0" />
        <span className="flex-1 text-[13px] font-medium">
          {t("Install the Qura app")}
        </span>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="bg-background text-foreground shrink-0 rounded-full px-3 py-1 text-[12.5px] font-semibold"
        >
          {t("Install")}
        </button>
        <button
          type="button"
          aria-label={t("Dismiss")}
          onClick={() => setShowBar(false)}
          className="text-background/70 shrink-0"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
        </button>
      </div>
    );
  }

  return null;
}
