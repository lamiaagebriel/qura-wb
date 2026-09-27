import { iconImage } from "@/lib/brand-images";

// Browser tab icon (replaces the default favicon.ico).
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return iconImage(size.width, { padding: 0.08 });
}
