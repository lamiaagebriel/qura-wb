"use client";

import {
  createContext,
  use,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  AddSquareIcon,
  Download04Icon,
  HugeiconsIcon,
  SquareArrowUp02Icon,
  type IconSvgElement,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useLocale } from "@/lib/i18n/provider";

// Chromium's install event (not in the TS DOM lib yet).
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const VISITS_KEY = "qura:visits";
const VISIT_COUNTED_KEY = "qura:visit-counted";
const DISMISSED_KEY = "qura:install-dismissed-at";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000; // ask again after two weeks
const SHOW_DELAY_MS = 2500;

// localStorage can throw (private mode, blocked storage) — never break on it.
const storage = {
  get: (s: Storage, key: string) => {
    try {
      return s.getItem(key);
    } catch {
      return null;
    }
  },
  set: (s: Storage, key: string, value: string) => {
    try {
      s.setItem(key, value);
    } catch {}
  },
};

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIOS = () =>
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** Counts one visit per browser session; returns the total. */
function countVisit() {
  if (!storage.get(sessionStorage, VISIT_COUNTED_KEY)) {
    storage.set(sessionStorage, VISIT_COUNTED_KEY, "1");
    const visits = Number(storage.get(localStorage, VISITS_KEY) ?? 0) + 1;
    storage.set(localStorage, VISITS_KEY, String(visits));
  }
  return Number(storage.get(localStorage, VISITS_KEY) ?? 0);
}

type InstallPromptContextValue = {
  /** Installing is possible here (not already installed; the browser can
   * install, or it's an iPhone where we show the steps). */
  canInstall: boolean;
  /** Opens the install sheet now (e.g. from Settings), ignoring the
   * second-visit / snooze rules. */
  open: () => void;
};

const InstallPromptContext = createContext<InstallPromptContextValue>({
  canInstall: false,
  open: () => {},
});

/**
 * "Install Qura" sheet. Shown automatically from the second visit on, on
 * phones only, never inside the installed app; also on demand via
 * `useInstallPrompt().open()`. Android/Chromium: a real Install button
 * (native prompt). iPhone: the Share → Add to Home Screen steps, since iOS
 * has no install API. "Not now" snoozes the automatic prompt for two weeks.
 */
export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const [standalone, setStandalone] = useState(true); // hide until known
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(
    null,
  );
  const mode = installEvent ? "native" : "ios";

  useEffect(() => {
    const installed = isStandalone();
    document.documentElement.toggleAttribute("data-standalone", installed);
    // Reading browser-only APIs after mount (not during render) keeps the
    // server and client HTML identical.
    /* eslint-disable react-hooks/set-state-in-effect */
    setStandalone(installed);
    setIos(isIOS());
    /* eslint-enable react-hooks/set-state-in-effect */
    if (installed) return;

    const visits = countVisit();
    const dismissedAt = Number(storage.get(localStorage, DISMISSED_KEY) ?? 0);
    const autoShow =
      visits >= 2 &&
      Date.now() - dismissedAt > SNOOZE_MS &&
      window.matchMedia("(pointer: coarse)").matches;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const showSoon = () => {
      if (!autoShow) return;
      clearTimeout(timer);
      timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    };

    // Always keep the browser's install event, so Settings can use it too.
    const onInstallPrompt = (event: Event) => {
      event.preventDefault(); // we show our own sheet instead
      setInstallEvent(event as InstallPromptEvent);
      showSoon();
    };
    const onInstalled = () => {
      setInstallEvent(null);
      setStandalone(true);
      setOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (isIOS()) showSoon();

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    storage.set(localStorage, DISMISSED_KEY, String(Date.now()));
    setOpen(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    setInstallEvent(null);
    if (outcome === "accepted") setOpen(false);
    else dismiss();
  };

  const canInstall = !standalone && (!!installEvent || ios);

  return (
    <InstallPromptContext value={{ canInstall, open: () => setOpen(true) }}>
      {children}

      <Drawer
        open={open}
        onOpenChange={(next) => (next ? setOpen(true) : dismiss())}
      >
        <DrawerContent className="pb-[max(var(--safe-bottom),1.5rem)]">
          <DrawerHeader>
            <DrawerTitle>{t("Install Qura")}</DrawerTitle>
            <DrawerDescription>
              {t(
                "Add Qura to your home screen for a faster, full-screen experience.",
              )}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col gap-4 px-4">
            {mode === "ios" ? (
              <ol className="flex flex-col divide-y divide-border/60 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
                <Step
                  n={1}
                  icon={SquareArrowUp02Icon}
                  text={t("Tap the Share button in the browser bar")}
                />
                <Step
                  n={2}
                  icon={AddSquareIcon}
                  text={t("Choose “Add to Home Screen”")}
                />
              </ol>
            ) : (
              <Button size="xl" className="w-full rounded-xl" onClick={install}>
                <HugeiconsIcon icon={Download04Icon} strokeWidth={2} />
                {t("Install")}
              </Button>
            )}

            <Button
              size="xl"
              variant="ghost"
              className="w-full rounded-xl"
              onClick={dismiss}
            >
              {mode === "ios" ? t("Got it") : t("Not now")}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </InstallPromptContext>
  );
}

export function useInstallPrompt() {
  return use(InstallPromptContext);
}

function Step({
  n,
  icon,
  text,
}: {
  n: number;
  icon: IconSvgElement;
  text: string;
}) {
  return (
    <li className="flex min-h-14 items-center gap-3 px-4 py-2">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
        {n}
      </span>
      <span className="flex-1 text-sm">{text}</span>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
        <HugeiconsIcon icon={icon} strokeWidth={2} className="size-5" />
      </span>
    </li>
  );
}
