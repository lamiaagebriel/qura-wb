import type { MessageVars, Messages, Translate } from "./types";

/**
 * Builds `t()` for one locale, shared by server and client so both behave
 * identically. A missing entry falls back to the key (the English text),
 * which is also why English itself needs no messages file.
 *
 *   t("Resend available in {{seconds}}s", { seconds: 30 })
 */
export function createTranslator(messages: Partial<Messages>): Translate {
  return (key, vars) => {
    const text = messages[key] ?? key;
    return vars ? interpolate(text, vars) : text;
  };
}

function interpolate(text: string, vars: MessageVars) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
