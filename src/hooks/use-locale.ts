import { i18n } from "@/lib/locale";
import { Locale } from "@/types/locale";
import { usePathname } from "next/navigation";

export function useLocale(): Locale {
  const pathname = usePathname();
  if (!pathname) return i18n.defaultLocale;

  const segments = pathname.split("/");
  return segments[1] as Locale;
}
