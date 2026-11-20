// Writing or editing a post: checked by the form and again by the post
// actions. Each type's own fields are `POST_DATA` (`lib/posts.ts`).
// Client-safe.

import { z } from "zod";

import { checkData, POST_MAX_LENGTH, POST_TYPES, typesFor, type PostType } from "@/lib/posts";

export const body = z.string().trim().min(1).max(POST_MAX_LENGTH);
const data = z.record(z.string(), z.unknown()).default({});

/**
 * A new post. `city` is the place it's for (a slug, checked by the action;
 * "" = the place being browsed). `business` is the @handle of one of your businesses ("" =
 * as yourself), which decides the types open to it (`typesFor`); `data`
 * holds the type's own fields (`POST_DATA`).
 */
export const postSchema = z
  .object({
    type: z.enum(POST_TYPES),
    city: z.string().max(80).default(""),
    business: z.string().max(50),
    body,
    data,
  })
  .refine((post) => typesFor(!!post.business).includes(post.type), {
    path: ["type"],
    message: "Not available for this account",
  })
  .transform(checkData);

/** What the form holds: its `data` fields as typed (strings). */
export type PostFormValues = {
  type: PostType;
  city: string;
  business: string;
  body: string;
  data: Record<string, string>;
};
/** What a valid post becomes. */
export type PostInput = z.output<typeof postSchema>;

/**
 * An edit: the text and the type's fields (type and author stay, so the
 * post's own `type` checks `data`).
 */
export const postEditSchema = (type: PostType) =>
  z
    .object({ body, data })
    .transform((edit, ctx) => checkData({ ...edit, type }, ctx));

/** Who a post shows as: the business when it's linked to one, else the user. */
