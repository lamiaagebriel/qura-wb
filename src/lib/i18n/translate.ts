import type { Locale } from "./config";
import type { MessageVars, Messages, PluralForms, Translate } from "./types";

/**
 * Builds `t()` for one locale, shared by server and client so both behave
 * identically. A missing entry falls back to the key (the English text),
 * which is also why English itself needs no messages file.
 *
 *   t("Resend available in {{seconds}}s", { seconds: 30 })
 *   t.plural(n, { one: "{{count}} review", other: "{{count}} reviews" })
 */
export function createTranslator(
  locale: Locale,
  messages: Partial<Messages>,
): Translate {
  const rules = new Intl.PluralRules(locale);

  const t = ((key, vars) => {
    const entry = messages[key] ?? key;
    // A plural entry used without a count: its general form.
    const text = typeof entry === "string" ? entry : entry.other;
    return vars ? interpolate(text, vars) : text;
  }) as Translate;

  t.plural = (count, english, vars) => {
    const category = rules.select(count);
    const entry = messages[english.other];
    const forms: PluralForms =
      entry === undefined
        ? english // no translation (English): the forms given in code
        : typeof entry === "string"
          ? { other: entry }
          : entry;
    const text = forms[category] ?? forms.other;
    return interpolate(text, { count, ...vars });
  };

  return t;
}

function interpolate(text: string, vars: MessageVars) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
