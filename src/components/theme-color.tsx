"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

import { BRAND } from "@/lib/brand";

const SHEET_OPEN = '[data-vaul-overlay][data-state="open"]';
const DIMMED = "#000000";

/**
 * Keeps the browser/system bar color (`<meta name="theme-color">`) in sync
 * with the app: follows the in-app light/dark choice (not only the system
 * setting), and goes dark while a bottom sheet dims the screen.
 */
export function ThemeColor() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const base =
      resolvedTheme === "dark"
        ? BRAND.dark.background
        : BRAND.light.background;

    const apply = () => {
      const color = document.querySelector(SHEET_OPEN) ? DIMMED : base;
      for (const meta of document.querySelectorAll<HTMLMetaElement>(
        'meta[name="theme-color"]',
      )) {
        if (meta.content !== color) meta.content = color;
      }
    };

    apply();
    // Sheets (vaul) mount an overlay with data-state="open" in a portal.
    const observer = new MutationObserver(apply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
    });
    return () => observer.disconnect();
  }, [resolvedTheme]);

  return null;
}
