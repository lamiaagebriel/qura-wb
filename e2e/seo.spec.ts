import { expect, test } from "./fixtures";

const PNG = [0x89, 0x50, 0x4e, 0x47];

test.describe("icons & manifest", () => {
  test("manifest is complete and every icon loads as a PNG", async ({ request }) => {
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest).toMatchObject({
      id: "/",
      short_name: "Qura",
      display: "standalone",
      start_url: "/",
    });
    expect(manifest.icons.filter((i: { purpose: string }) => i.purpose === "maskable")).toHaveLength(2);
    expect(manifest.shortcuts).toHaveLength(2);

    const icons = [
      ...manifest.icons,
      ...manifest.shortcuts.flatMap((s: { icons: unknown[] }) => s.icons),
      { src: "/icon" },
      { src: "/apple-icon" },
      { src: "/splash/1179x2556-light.png" },
      { src: "/splash/1179x2556-dark.png" },
      { src: "/opengraph-image" },
    ];
    for (const { src } of icons) {
      const res = await request.get(src);
      expect(res.status(), src).toBe(200);
      expect([...(await res.body()).subarray(0, 4)], src).toEqual(PNG);
    }
    expect((await request.get("/icons/nope.png")).status()).toBe(404);
  });

  test("/favicon.ico (asked for by browsers on their own) is the icon", async ({ request }) => {
    const res = await request.get("/favicon.ico");
    expect(res.status()).toBe(200);
    expect([...(await res.body()).subarray(0, 4)]).toEqual(PNG);
  });

  test("every iPhone launch screen is linked", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('link[rel="apple-touch-startup-image"]')).toHaveCount(20);
  });
});

test.describe("SEO", () => {
  test("home: canonical, share cards, indexable", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("Qura — Your city, one feed");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/$|:\d+$/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /opengraph-image/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  });

  test("search has its own canonical and title", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveTitle("Search · Qura");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/search$/);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
  });

  test("personal pages are noindex", async ({ page }) => {
    for (const path of ["/profile", "/login"]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]'), path).toHaveAttribute(
        "content",
        /noindex/,
      );
    }
  });

  test("robots.txt and sitemap", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain("Sitemap:");
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/search</loc>");
    // Every business is listed…
    expect(sitemap).toContain("/bs/nileview</loc>");
  });

  test("a business's page is indexable, with its own canonical", async ({ page }) => {
    await page.goto("/bs/nileview");
    await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute("content", /noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/bs\/nileview$/);
  });
});

test.describe("layout", () => {
  test("no page overflows the screen", async ({ page }) => {
    for (const path of ["/", "/search", "/login"]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollHeight - innerHeight,
      );
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });

  test("404 page", async ({ page, pageErrors }) => {
    const res = await page.goto("/does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("Page not found")).toBeVisible();
    // The browser logs the 404 response itself — expected here.
    pageErrors.splice(0, pageErrors.length, ...pageErrors.filter((e) => !/404/.test(e)));
  });
});
