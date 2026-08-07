"use client";

import { useEffect } from "react";

/**
 * Catches errors thrown by the root layout itself (e.g. `getLocale()`
 * failing) — `error.tsx` can't see those, since it renders *inside* the
 * layout it's meant to guard. Must own its own `<html>`/`<body>` and
 * can't reach `LocaleProvider`/Tailwind's compiled output reliably, so
 * this stays plain, inline-styled, and English-only on purpose.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#fafaf8",
          color: "#1a1a1a",
        }}
      >
        <div
          style={{
            display: "flex",
            height: 56,
            width: 56,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9999px",
            background: "rgba(220, 38, 38, 0.1)",
            fontSize: 24,
          }}
          aria-hidden
        >
          ⚠️
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h1 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>
            Something went wrong
          </h1>
          <p
            style={{
              maxWidth: 320,
              fontSize: 13.5,
              lineHeight: 1.6,
              color: "#6b6b6b",
              margin: 0,
            }}
          >
            We couldn&apos;t load the app. This is usually temporary — try
            again in a moment.
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, color: "#a3a3a3", marginTop: 4 }}>
              Reference: {error.digest}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => unstable_retry()}
          style={{
            height: 28,
            padding: "0 16px",
            borderRadius: 6,
            border: "none",
            background: "#1a1a1a",
            color: "#fafaf8",
            fontSize: 12.5,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
