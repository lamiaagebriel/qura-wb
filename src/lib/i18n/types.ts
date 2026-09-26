import type ar from "./messages/ar";

/** Every translatable string. Keys are the English text itself. */
export type MessageKey = keyof typeof ar;

/** A full translation table — every other language must satisfy this. */
export type Messages = Record<MessageKey, string>;

/** Values for `{{name}}` placeholders in a message. */
export type MessageVars = Record<string, string | number>;

export type Translate = (key: MessageKey, vars?: MessageVars) => string;
