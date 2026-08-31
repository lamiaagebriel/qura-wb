import { pgEnum } from "drizzle-orm/pg-core";

// Every Egyptian city Qura could ever operate in — a superset of
// `AVAILABLE_CITIES` (`lib/city/cities.ts`), which is the app-level list
// of which of these actually have content yet. Keeping the full roster
// here means a city going from "coming soon" to live is a config change,
// not a migration.
export const CITIES = [
  "aswan",
  "luxor",
  "cairo",
  "alexandria",
  "qena",
  "hurghada",
  "sharm-el-sheikh",
  "sohag",
  "marsa-alam",
] as const;

export const cityEnum = pgEnum("city", CITIES);

export type CityId = (typeof CITIES)[number];
