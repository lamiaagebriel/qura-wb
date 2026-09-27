import { ViewTransition, type ReactNode } from "react";

import { NAV_BACK, NAV_FORWARD } from "@/lib/navigation";

const directional = {
  [NAV_FORWARD]: NAV_FORWARD,
  [NAV_BACK]: NAV_BACK,
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
      <div className="flex flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}
