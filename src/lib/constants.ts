import { generateIdFromEntropySize } from "lucia";

export const ID = {
  generate: (len?: number) => generateIdFromEntropySize(len ?? 10),
};
