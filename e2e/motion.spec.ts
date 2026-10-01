import {
  expect,
  recordTransitions,
  tab,
  test,
  transitionOf,
  waitForHydration,
} from "./fixtures";

// Which animations actually run for each navigation, per language and
// motion preference. Forward: the new screen enters from the end edge
// (right in LTR, left in RTL). The back arrow is a history back: instant.
for (const lang of ["en", "ar"] as const) {
  for (const reduced of [false, true]) {
    test.describe(`${lang}${reduced ? ", reduced motion" : ""}`, () => {
      test.use({ reducedMotion: reduced ? "reduce" : "no-preference" });

      test("forward, back and tab transitions", async ({ page, context, setLang, signIn }) => {
        await signIn();
        await recordTransitions(context);
        await setLang(lang);
        await page.goto("/profile");
        await waitForHydration(page);
        const row = page.locator('main a[href="/profile/businesses"]'); // "My businesses"
        const back = page.locator(`[aria-label="${lang === "ar" ? "رجوع" : "Back"}"]`);

        const forward = await transitionOf(page, async () => {
          await row.tap();
          await page.waitForURL("**/profile/businesses");
        });
        const backward = await transitionOf(page, async () => {
          await back.tap();
          await page.waitForURL(/\/profile$/);
        });
        const tabSwitch = await transitionOf(page, async () => {
          await tab(page, "/").tap();
          await page.waitForURL((url) => url.pathname === "/");
        });

        const layer = (list: typeof forward, which: "new" | "old") =>
          list.find((a) => a.layer === which);

        if (reduced) {
          expect(forward.map((a) => a.name).sort()).toEqual(["nav-fade-in", "nav-fade-out"]);
        } else {
          const end = lang === "ar" ? "-100%" : "100%";
          const start = lang === "ar" ? "100%" : "-100%";
          expect(layer(forward, "new")?.from).toBe(end);
          expect(layer(forward, "old")?.to).toBe(start);
        }
        // Back is a history back (instant, like browser back); tabs too.
        expect(backward).toEqual([]);
        expect(tabSwitch).toEqual([]);
      });
    });
  }
}
