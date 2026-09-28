"use client";

import { useSyncExternalStore } from "react";

import { HugeiconsIcon, WifiDisconnected01Icon } from "@/components/icons";
import { useLocale } from "@/lib/i18n/provider";

const subscribe = (onChange: () => void) => {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
};

/** A small pill under the status bar while there's no connection. */
export function OfflineBanner() {
  const { t } = useLocale();
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true, // server: assume online
  );
  if (online) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-[calc(var(--safe-top)+0.5rem)] z-50 flex justify-center px-4 animate-in fade-in slide-in-from-top-2 duration-300 motion-reduce:animate-none"
    >
      <span className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg">
        <HugeiconsIcon icon={WifiDisconnected01Icon} strokeWidth={2} className="size-4" />
        {t("You're offline")}
      </span>
    </div>
  );
}
