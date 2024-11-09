import * as React from "react";

import { t } from "@/lib/locale";
import { useLocale } from "@/hooks/use-locale";

export function useTranslation(txt: string): string | null {
	const lang = useLocale();
	const [value, setValue] = React.useState<string | null>(null);

	React.useEffect(() => {
		const fetchTranslation = async () => {
			try {
				setValue(txt ? await t({ value: String(txt), from: "en", to: lang }) : null);
			} catch (error) {
				console.error("Translation error:", error);
			}
		};

		fetchTranslation();
	}, [lang, txt]);

	return value;
}
