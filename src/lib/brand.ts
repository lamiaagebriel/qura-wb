/**
 * Brand constants, safe to import anywhere (client or server). The images
 * drawn from them (icons, splash screens) live in `brand-images.tsx`,
 * which is server-only.
 */
export const BRAND = {
  name: "Qura",
  light: { background: "#ffffff", foreground: "#0a0a0a" },
  dark: { background: "#0a0a0a", foreground: "#ffffff" },
} as const;

export type BrandMode = keyof Omit<typeof BRAND, "name">;

/**
 * iPhone screens that get a matching launch image (CSS px × pixel ratio).
 * iOS only shows a startup image whose size matches the device exactly.
 */
export const IPHONE_SCREENS = [
  { w: 440, h: 956, r: 3 }, // 16 Pro Max
  { w: 402, h: 874, r: 3 }, // 16 Pro
  { w: 430, h: 932, r: 3 }, // 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  { w: 393, h: 852, r: 3 }, // 14 Pro, 15, 15 Pro, 16
  { w: 428, h: 926, r: 3 }, // 12/13 Pro Max, 14 Plus
  { w: 390, h: 844, r: 3 }, // 12, 13, 14
  { w: 414, h: 896, r: 3 }, // XS Max, 11 Pro Max
  { w: 375, h: 812, r: 3 }, // X, XS, 11 Pro, 12/13 mini
  { w: 414, h: 896, r: 2 }, // XR, 11
  { w: 375, h: 667, r: 2 }, // SE 2/3, 8
] as const;

/** One launch image per screen × light/dark, as `1179x2556-dark.png`. */
export const SPLASH_SCREENS = IPHONE_SCREENS.flatMap(({ w, h, r }) =>
  (["light", "dark"] as const).map((mode) => ({
    name: `${w * r}x${h * r}-${mode}.png`,
    width: w * r,
    height: h * r,
    mode,
    media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait) and (prefers-color-scheme: ${mode})`,
  })),
);
