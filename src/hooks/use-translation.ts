import { useLocale } from "@/hooks/use-locale";
import { t } from "@/lib/locale";
import { useEffect, useState } from "react";

export function useTranslation(txt: string): string | null {
  const lang = useLocale();
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    const fetchTranslation = async () => {
      try {
        setValue(txt ? await t(String(txt), lang) : null);
      } catch (error) {
        console.error("Translation error:", error);
      }
    };

    fetchTranslation();
  }, [lang, txt]);

  return value;
}
