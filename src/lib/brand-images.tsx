import "server-only";

import { ImageResponse } from "next/og";

import { BRAND, type BrandMode } from "./brand";

/**
 * The app mark, drawn as vector shapes (no font needed, so it's identical
 * and crisp at every size). Placeholder until there's a real logo: replace
 * this SVG and every icon and splash screen updates.
 */
function Mark({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      {/* "Q": a ring with a tail crossing it (not a magnifier) */}
      <circle cx="46" cy="46" r="30" fill="none" stroke={color} strokeWidth="13" />
      <path
        d="M57 57 L84 84"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Square app icon (the OS applies its own mask/rounding). `padding`
 * (0–0.5) is the empty margin around the mark — maskable icons need ~20%+
 * since Android may crop them into circles. */
export function iconImage(size: number, { padding = 0.16 } = {}) {
  const { background, foreground } = BRAND.dark;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background,
        }}
      >
        <Mark size={Math.round(size * (1 - padding * 2))} color={foreground} />
      </div>
    ),
    { width: size, height: size },
  );
}

/** iOS launch screen: the app icon centered on the app background. */
export function splashImage(width: number, height: number, mode: BrandMode) {
  const { background } = BRAND[mode];
  const icon = Math.round(Math.min(width, height) * 0.26);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background,
        }}
      >
        <div
          style={{
            width: icon,
            height: icon,
            borderRadius: icon * 0.225, // iOS icon corner radius
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: BRAND.dark.background,
            // A hairline so the dark icon still reads on a dark screen.
            border: mode === "dark" ? `${Math.max(2, icon * 0.01)}px solid #2a2a2a` : "none",
          }}
        >
          <Mark size={Math.round(icon * 0.68)} color={BRAND.dark.foreground} />
        </div>
      </div>
    ),
    { width, height },
  );
}
