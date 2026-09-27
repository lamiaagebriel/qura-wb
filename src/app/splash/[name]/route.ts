import { notFound } from "next/navigation";

import { SPLASH_SCREENS } from "@/lib/brand";
import { splashImage } from "@/lib/brand-images";

// iOS launch screens, e.g. /splash/1179x2556-dark.png — generated once at
// build time (static files), listed in app/layout.tsx `startupImage`.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return SPLASH_SCREENS.map(({ name }) => ({ name }));
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/splash/[name]">,
) {
  const { name } = await params;
  const screen = SPLASH_SCREENS.find((s) => s.name === name);
  if (!screen) notFound();
  return splashImage(screen.width, screen.height, screen.mode);
}
