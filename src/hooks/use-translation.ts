import * as React from "react";

import { t } from "@/lib/locale";

import { useLocale } from "@/components/locale-provider";

export function useTranslation(txt: string): string | null {
  const { locale } = useLocale();
  const [value, setValue] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchTranslation = async () => {
      try {
        setValue(txt ? await t(String(txt), { from: "en", to: locale }) : null);
      } catch (error) {
        console.error("Translation error:", error);
      }
    };

    fetchTranslation();
  }, [locale, txt]);

  return value;
}
