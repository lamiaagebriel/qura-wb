import { notFound } from "next/navigation";

import { iconImage } from "@/lib/brand-images";

// Manifest icons, generated once at build time (static files).
// "any" icons fill the square; maskable ones keep the mark inside the
// central safe zone because Android crops them (circle, squircle…).
const ICONS = {
  "96.png": { size: 96 },
  "192.png": { size: 192 },
  "512.png": { size: 512 },
  "maskable-192.png": { size: 192, padding: 0.26 },
  "maskable-512.png": { size: 512, padding: 0.26 },
} satisfies Record<string, { size: number; padding?: number }>;

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ICONS).map((name) => ({ name }));
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/icons/[name]">,
) {
  const icon = ICONS[(await params).name as keyof typeof ICONS];
  if (!icon) notFound();
  return iconImage(icon.size, { padding: "padding" in icon ? icon.padding : undefined });
}
