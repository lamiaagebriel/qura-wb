import { ImageResponse } from "next/og";

import { BRAND } from "@/lib/brand";

// Share card shown when a Qura link is posted (WhatsApp, Facebook, X…).
export const alt = "Qura — Your city, one feed";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const { background, foreground } = BRAND.dark;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          gap: 28,
          background,
          color: foreground,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 100 100">
          <circle cx="46" cy="46" r="30" fill="none" stroke={foreground} strokeWidth="13" />
          <path d="M57 57 L84 84" stroke={foreground} strokeWidth="14" strokeLinecap="round" />
        </svg>
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: "-0.03em" }}>
          {BRAND.name}
        </div>
        <div style={{ fontSize: 40, opacity: 0.75, maxWidth: 900 }}>
          Your city, one feed — restaurants, events, jobs, apartments and more.
        </div>
      </div>
    ),
    size,
  );
}
