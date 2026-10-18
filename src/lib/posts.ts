// Posts: one table for every type (offers, announcements, questions…),
// what the screens show (read from `lib/data/posts.ts`) and the rules for
// writing one — the same zod schema checks the composer and the actions.
// Client-safe.

import { z } from "zod";

import type { Localized } from "@/lib/localized";

/** Stored (never rename one); also the order of the home sections. */
export const POST_TYPES = [
  "general",
  "question",
  "together",
  "experience",
  "event",
  "offer",
  "announcement",
  "job",
  "housing",
  "lost_found",
  "alert",
] as const;
export type PostType = (typeof POST_TYPES)[number];

export const isPostType = (value: unknown): value is PostType =>
  POST_TYPES.includes(value as PostType);

/** Types anyone can post: as themselves or as a business. */
const COMMON_TYPES: readonly PostType[] = [
  "general",
  "question",
  "event",
  "job",
  "housing",
  "lost_found",
  "alert",
];
/** Only as yourself. */
const PERSONAL_ONLY: readonly PostType[] = ["together", "experience"];
/** Only as one of your businesses. */
const BUSINESS_ONLY: readonly PostType[] = ["offer", "announcement"];

// Each in the order of POST_TYPES (the picker's order).
const pick = (lists: (readonly PostType[])[]) =>
  POST_TYPES.filter((type) => lists.some((list) => list.includes(type)));

/** What a person can post (as themselves). */
export const USER_TYPES = pick([COMMON_TYPES, PERSONAL_ONLY]);

/** What a business can post (as one of yours). */
export const BUSINESS_TYPES = pick([COMMON_TYPES, BUSINESS_ONLY]);

/** The types open to whoever is posting: a business, or yourself. */
export const typesFor = (asBusiness: boolean) =>
  asBusiness ? BUSINESS_TYPES : USER_TYPES;

export const POST_MAX_LENGTH = 500;
export const PRICE_MAX_LENGTH = 40;
/** Posts per page of a type's list (infinite scroll). */
export const POSTS_PAGE_SIZE = 20;

// Per-type fields (`posts.data`, one JSON column). To give a type more
// fields, add them to its schema here — no migration. Every field is
// optional (old posts don't have it); unknown keys are dropped; a form's
// empty input ("") is left out.
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);
const day = z
  .union([z.literal(""), z.iso.date()])
  .optional()
  .transform((value) => value || undefined);
const none = z.object({});

export const POST_DATA = {
  general: none,
  question: none,
  together: none,
  experience: none,
  event: none,
  offer: z.object({
    /** "20% off", "450 EGP"… */
    price: text(PRICE_MAX_LENGTH),
    /** Its last day, yyyy-mm-dd. */
    endsOn: day,
  }),
  announcement: none,
  job: none,
  housing: none,
  lost_found: none,
  alert: none,
} satisfies Record<PostType, z.ZodObject>;

/** The extra fields of one type (`PostData<"offer">`), or of any. */
export type PostData<T extends PostType = PostType> = z.output<
  (typeof POST_DATA)[T]
>;

type UnionToIntersection<U> = (
  U extends unknown ? (u: U) => void : never
) extends (i: infer I) => void
  ? I
  : never;
/** Every type's fields at once, all optional — how `posts.data` is read. */
export type AnyPostData = Partial<UnionToIntersection<PostData>>;

/** Checks `data` against its type's schema; issues point at `data.…`. */
function checkData<T extends { type: PostType; data: unknown }>(
  post: T,
  ctx: z.RefinementCtx,
) {
  const parsed = POST_DATA[post.type].safeParse(post.data ?? {});
  if (parsed.success) return { ...post, data: parsed.data as AnyPostData };
  for (const issue of parsed.error.issues) {
    ctx.addIssue({
      code: "custom",
      message: issue.message,
      path: ["data", ...issue.path],
    });
  }
  return z.NEVER;
}

/** The last day of an offer as a Date (noon, so no time zone moves it a day). */
export const dayOf = (yyyyMmDd: string) => new Date(`${yyyyMmDd}T12:00:00`);

const body = z.string().trim().min(1).max(POST_MAX_LENGTH);
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

export const replySchema = z.object({ body });

/** Who a post shows as: the business when it's linked to one, else the user. */
export type PostAuthor =
  | {
      type: "business";
      name: Localized;
      username: string;
      image: string | null;
      verified: boolean;
      category: string;
    }
  | { type: "user"; name: string; username: string; image: string | null };

export type Post = {
  id: string;
  type: PostType;
  body: string;
  /** Its type's own fields (`POST_DATA`). */
  data: AnyPostData;
  /** An offer's last day has passed (when the page was made). */
  ended: boolean;
  createdAt: Date;
  edited: boolean;
  author: PostAuthor;
  replyCount: number;
  /** Helpful minus not-helpful votes. */
  score: number;
  /** The viewer's vote (0 = none) and bookmark. */
  myVote: -1 | 0 | 1;
  saved: boolean;
  /** The viewer wrote it: may edit / delete it. */
  mine: boolean;
  /** The post it replies to; `null` for a post. */
  replyTo: string | null;
  /**
   * Hidden by an admin (only its author gets such a post): why, and
   * whether an edit since waits for the admin to look again.
   */
  hidden: { reason: string; waiting: boolean } | null;
};

/** One of your live businesses you can post as. */
export type PostingBusiness = {
  username: string;
  name: string;
  image: string | null;
  verified: boolean;
  /** Its category slug (the icon when it has no logo). */
  category: string;
};

/** You, as the composer's "Post as" shows you. */
export type PostingUser = {
  name: string;
  username: string;
  image: string | null;
};

/** One page of a list, and where the next one starts (`null` = the end). */
export type PostPage = { posts: Post[]; next: string | null };
