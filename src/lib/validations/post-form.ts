// Writing or editing a post: checked by the form and again by the post
// actions. Each type's own fields are `POST_DATA` (`lib/posts.ts`).
// Client-safe.

import { z } from "zod";

import {
  checkData,
  POST_MAX_LENGTH,
  POST_TYPES,
  typesFor,
  type PostType,
} from "@/lib/posts";
import { MAX_IMAGES } from "@/lib/post-images";

export const body = z.string().trim().min(1).max(POST_MAX_LENGTH);
const data = z.record(z.string(), z.unknown()).default({});
// Photo URLs, in order; the actions check each is one the author uploaded.
const images = z.array(z.url()).max(MAX_IMAGES).default([]);
// An ad is a banner: it needs its photo.
const NEEDS_PHOTO = { path: ["images"], message: "Add at least one photo" };

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
    images,
  })
  .refine((post) => typesFor(!!post.business).includes(post.type), {
    path: ["type"],
    message: "Not available for this account",
  })
  .refine((post) => post.type !== "ad" || post.images.length > 0, NEEDS_PHOTO)
  .transform(checkData);

/** What the form holds: its `data` fields as typed (strings). */
export type PostFormValues = {
  type: PostType;
  city: string;
  business: string;
  body: string;
  data: Record<string, string>;
  /** Photo URLs, filled in at submit (the picker keeps the files until then). */
  images: string[];
};
/** What a valid post becomes. */
export type PostInput = z.output<typeof postSchema>;

/**
 * An edit: the text and the type's fields (type and author stay, so the
 * post's own `type` checks `data`).
 */
export const postEditSchema = (type: PostType) =>
  z
    .object({ body, data, images })
    .refine((edit) => type !== "ad" || edit.images.length > 0, NEEDS_PHOTO)
    .transform((edit, ctx) => checkData({ ...edit, type }, ctx));

/** Who a post shows as: the business when it's linked to one, else the user. */
