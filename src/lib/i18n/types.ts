import type ar from "./messages/ar";

/** Every translatable string. Keys are the English text itself. */
export type MessageKey = keyof typeof ar;

/**
 * A message that depends on a count, one text per plural category of the
 * language (`Intl.PluralRules`): English uses one/other, French adds many,
 * Arabic uses all six (zero, one, two, few, many, other). `other` is the
 * fallback for any category left out.
 */
export type PluralForms = { other: string } & Partial<
  Record<Exclude<Intl.LDMLPluralRule, "other">, string>
>;

/** A full translation table — every other language must satisfy this. */
export type Messages = Record<MessageKey, string | PluralForms>;

/** Values for `{{name}}` placeholders in a message. */
export type MessageVars = Record<string, string | number>;

export type Translate = {
  (key: MessageKey, vars?: MessageVars): string;
  /**
   * The message for `count`, in the right plural form. `other` is the key
   * (the English text); `one` is English's singular. `{{count}}` is filled
   * with `count` unless `vars.count` says otherwise (e.g. "12.8K").
   *   t.plural(n, { one: "{{count}} review", other: "{{count}} reviews" })
   */
  plural: (
    count: number,
    english: { one: string; other: MessageKey },
    vars?: MessageVars,
  ) => string;
};
