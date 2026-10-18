// What the dashboard may change in each table, and the rules: one zod
// schema per editable resource, shared by its form (client) and the save
// action (server). Fields not listed here are locked — see each resource's
// `locked` list for why. Client-safe.

import { z } from "zod";

import { CATEGORY_SLUGS } from "@/lib/categories";
import type { MessageKey } from "@/lib/i18n/types";
import { profileSchema } from "@/lib/profile";

const m = (key: MessageKey) => key;

const text = (max: number) => z.string().trim().max(max, m("Too long"));
const required = (max: number) => text(max).min(1, m("Required"));

/** `{ en, ar }`: at least one written (each falls back to the other). */
const localized = (max: number) =>
  z
    .object({ en: text(max), ar: text(max) })
    .refine((value) => !!(value.en || value.ar), { message: m("Required"), path: ["en"] });

/** `{ en, ar }`, both optional (a bio can be empty). */
const optionalLocalized = (max: number) => z.object({ en: text(max), ar: text(max) });

const coordinate = (limit: number) =>
  z
    .union([z.literal(""), z.coerce.number().min(-limit, m("Invalid")).max(limit, m("Invalid"))])
    .transform((value) => (value === "" ? null : value));

export const ADMIN_SCHEMAS = {
  users: profileSchema.pick({ name: true, username: true, bio: true }),
  businesses: z.object({
    name: localized(100),
    bio: optionalLocalized(300),
    category: z.enum(CATEGORY_SLUGS, { error: m("Required") }),
    /** The owner's @username; "" = nobody (added for someone else). */
    owner: text(51).transform((value) => value.replace(/^@/, "").toLowerCase()),
  }),
  branches: z.object({
    address: localized(200),
    city: required(80),
  }),
  posts: z.object({
    body: required(500),
  }),
  places: z.object({
    name: localized(60),
    type: required(40),
    lat: coordinate(90),
    lng: coordinate(180),
  }),
  "place-types": z.object({
    name: localized(50),
    listed: z.boolean(),
  }),
} as const;

export type EditableResource = keyof typeof ADMIN_SCHEMAS;

export const isEditable = (key: string): key is EditableResource =>
  key in ADMIN_SCHEMAS;
