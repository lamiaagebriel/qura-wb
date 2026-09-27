import { ViewTransition, type ReactNode } from "react";

import { NAV_TYPES } from "@/lib/navigation";

// Each navigation type animates with the CSS class of the same name.
const directional = {
  ...Object.fromEntries(NAV_TYPES.map((type) => [type, type])),
  default: "none",
};

/**
 * Wrap every page's content in this. Forward/back navigations (tagged by
 * `StackLink` / `BackButton`) slide in and out, stack-style; everything
 * else — tab switches, browser back, refreshes — is instant. Must live in
 * the page, not a layout (layouts persist, so they never enter/exit).
 * Slide CSS: `globals.css` → "Stack transitions".
 */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={directional} exit={directional} default="none">
      {/* Opaque and full-height: during a slide the screen is a solid sheet,
          so the screen underneath never shows through its gaps or its
          (transparent-at-top) header. */}
      <div className="flex flex-1 flex-col bg-background">
        {children}
      </div>
    </ViewTransition>
  );
}
