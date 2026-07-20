import {
  decimal as _decimal,
  timestamp as _timestamp,
  varchar as _varchar,
  PgColumn,
  pgTableCreator,
  ReferenceConfig,
  uuid,
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

export const createId = (k: string) => uuid(k);

export const references = ({
  k,
  ref,
  actions,
}: {
  k: string;
  ref: PgColumn;
  actions?: ReferenceConfig["actions"];
}) => uuid(k).references(() => ref, actions);

export const id = { id: createId("id").primaryKey().notNull().defaultRandom() };
export const createdAt = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
};
export const updatedAt = {
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$defaultFn(() => new Date())
    .notNull(),
};
