import {
  decimal as _decimal,
  timestamp as _timestamp,
  varchar as _varchar,
  PgColumn,
  pgTableCreator,
  ReferenceConfig,
} from "drizzle-orm/pg-core";

export const pgTable = pgTableCreator((name) => name);
export const varchar = (k: string, p: { length: number } = { length: 255 }) =>
  _varchar(k, p);
export const timestamp = (k: string) =>
  _timestamp(k, { withTimezone: true, mode: "date" });
export const decimal = (
  k: string,
  p: { precision: number; scale: number } = { precision: 10, scale: 2 }
) => _decimal(k, p);

export const id = (k: string, p: { length: number } = { length: 255 }) =>
  varchar(k, p).primaryKey().notNull();

export const references = (
  k: string,
  p: { length: number } = { length: 255 },
  ref: PgColumn,
  actions?: ReferenceConfig["actions"]
) => varchar(k, p).references(() => ref, actions);

export const defaultFields = {
  id: id("id", { length: 21 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$defaultFn(() => new Date())
    .notNull(),
};
