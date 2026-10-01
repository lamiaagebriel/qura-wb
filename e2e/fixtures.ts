import { test as base, expect, type BrowserContext, type Page } from "@playwright/test";

import { signIn } from "./auth";

export { expect };

export const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
export const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";

type Lang = "en" | "ar" | "fr";

/**
 * - Every page hides the Next.js dev badge (it's draggable and can sit on
 *   top of app controls; it only exists in development).
 * - Any console error or uncaught page error fails the test.
 * - `setLang(lang)` picks the app language for this test's browser.
 * - `signIn()` signs this test's browser in as the test user (e2e/auth.ts).
 */
export const test = base.extend<{
  setLang: (lang: Lang) => Promise<void>;
  signIn: () => Promise<void>;
  pageErrors: string[];
}>({
  signIn: async ({ context, baseURL }, use) => {
    await use(() => signIn(context, baseURL!));
  },

  context: async ({ context }, use) => {
    await hideDevBadge(context);
    await use(context);
  },

  pageErrors: [
    async ({ context }, use) => {
      const errors: string[] = [];
      const watch = (page: Page) => {
        page.on("pageerror", (e) => errors.push(String(e)));
        page.on("console", (m) => {
          if (m.type() === "error") errors.push(m.text());
        });
      };
      context.pages().forEach(watch);
      context.on("page", watch);
      await use(errors);
      expect(errors, "console/page errors").toEqual([]);
    },
    { auto: true },
  ],

  setLang: async ({ context, baseURL }, use) => {
    await use(async (lang) => {
      await context.addCookies([{ name: "qura__lang", value: lang, url: baseURL! }]);
    });
  },
});

export async function hideDevBadge(context: BrowserContext) {
  await context.addInitScript(() =>
    addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal{display:none!important}";
      document.head.append(style);
    }),
  );
}

export type NavAnimation = {
  layer: "old" | "new";
  name: string;
  from?: string;
  to?: string;
};
export type RecordedTransition = { types: string[]; animations: NavAnimation[] };

/**
 * Records every view transition the app starts (window.__vt): its types,
 * and — read at `ready`, when the browser guarantees all its animations
 * have started — which nav animations run and where they slide from/to.
 * Deterministic, unlike polling from the test.
 */
export async function recordTransitions(context: BrowserContext) {
  await context.addInitScript(() => {
    const w = window as unknown as { __vt: RecordedTransition[] };
    w.__vt = [];
    const original = document.startViewTransition?.bind(document);
    if (!original) return;
    document.startViewTransition = ((arg: unknown) => {
      const types =
        typeof arg === "object" && arg && "types" in arg
          ? [...((arg as { types: Iterable<string> }).types ?? [])]
          : [];
      const entry: RecordedTransition = { types, animations: [] };
      w.__vt.push(entry);
      const transition = original(arg as never);
      transition.ready
        .then(() => {
          entry.animations = document
            .getAnimations()
            .filter(
              (anim) =>
                (anim.effect as KeyframeEffect | null)?.pseudoElement?.startsWith(
                  "::view-transition",
                ) && /^nav-/.test((anim as CSSAnimation).animationName ?? ""),
            )
            .map((anim) => {
              const effect = anim.effect as KeyframeEffect;
              const frames = effect.getKeyframes();
              return {
                layer: effect.pseudoElement!.includes("-new(") ? "new" : "old",
                name: (anim as CSSAnimation).animationName,
                from: frames[0]?.translate as string | undefined,
                to: frames.at(-1)?.translate as string | undefined,
              } as NavAnimation;
            });
        })
        .catch(() => {});
      return transition;
    }) as typeof document.startViewTransition;
  });
}

/** Types of the transitions recorded so far (and clears them). */
export const takeTransitions = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { __vt: { types: string[] }[] }).__vt
      .splice(0)
      .map((t) => t.types),
  );

/**
 * Runs an action and returns the nav animations of the transition it
 * started (empty if it started none). Waits for that transition to finish.
 */
export async function transitionOf(page: Page, action: () => Promise<void>) {
  await page.evaluate(() => {
    (window as unknown as { __vt: unknown[] }).__vt.length = 0;
  });
  await action();
  await page.waitForTimeout(400); // a navigation may fetch before starting
  const recorded = await page.evaluate(
    () => (window as unknown as { __vt: RecordedTransition[] }).__vt,
  );
  await transitionSettled(page);
  return recorded.flatMap((t) => t.animations);
}

/** Waits until no view transition is running (like a user's next tap). */
export async function transitionSettled(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document
            .getAnimations()
            .filter((a) =>
              (a.effect as KeyframeEffect | null)?.pseudoElement?.startsWith(
                "::view-transition",
              ),
            ).length,
      ),
    )
    .toBe(0);
}

// Tab order in the bar (lib/navigation.ts TABS).
const TAB_INDEX = { "/": 1, "/search": 2, "/profile": 3 } as const;

/** A tab of the bottom bar by its root path, e.g. tab(page, "/profile").
 * By position, not href: a tab's link points at the screen it remembers
 * (e.g. /profile/businesses). */
export const tab = (page: Page, path: keyof typeof TAB_INDEX) =>
  page.locator(`nav[aria-label] li:nth-child(${TAB_INDEX[path]}) a`);

export const pathname = (page: Page) => new URL(page.url()).pathname;

/**
 * A real one-finger touch drag (Chromium touch input): `steps` moves ~16ms
 * apart, like a finger. `steps = 0` is a tap at `from`.
 */
export async function touchDrag(
  page: Page,
  from: [number, number],
  to: [number, number] = from,
  steps = 12,
) {
  const cdp = await page.context().newCDPSession(page);
  const point = (x: number, y: number) => [{ x, y, id: 1 }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point(...from) });
  for (let i = 1; i <= steps; i++) {
    const x = from[0] + ((to[0] - from[0]) * i) / steps;
    const y = from[1] + ((to[1] - from[1]) * i) / steps;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: point(x, y) });
    await page.waitForTimeout(16);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

/** Makes the page tall enough to scroll (screens are short while empty). */
export const makeTall = (context: BrowserContext) =>
  context.addInitScript(() =>
    addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "main{min-height:250vh}";
      document.head.append(style);
    }),
  );

/**
 * Simulates Chromium's `beforeinstallprompt` (user accepts). Re-sends it
 * until the app's listener has taken it (it calls preventDefault), so it
 * can't be lost before hydration.
 */
export async function fireInstallEvent(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const w = window as unknown as { __prompted: boolean };
        w.__prompted = false;
        const event = new Event("beforeinstallprompt", { cancelable: true });
        Object.assign(event, {
          prompt: async () => {
            w.__prompted = true;
          },
          userChoice: Promise.resolve({ outcome: "accepted" }),
        });
        window.dispatchEvent(event);
        return event.defaultPrevented;
      }),
    )
    .toBe(true);
}

/**
 * Waits until React has hydrated the app (it attaches `__reactProps$…` to
 * the DOM nodes it owns) and link prefetches have landed — like a real user,
 * who can't tap within milliseconds of the page appearing. Before hydration,
 * links are plain `<a>` tags (full page load, no transitions); before the
 * prefetch lands, a navigation has to fetch first.
 */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const link = document.querySelector("nav[aria-label] li a");
    return !!link && Object.keys(link).some((k) => k.startsWith("__reactProps$"));
  });
  await page.waitForLoadState("networkidle");
}
