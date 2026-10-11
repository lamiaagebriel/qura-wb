// Sample posts for local development and e2e tests — loaded by
// `pnpm db:seed` (src/db/seed.ts), never in production. Deterministic:
// every run writes the same posts (once).

import { CITIES, type CitySlug } from "@/lib/cities";
import type { AnyPostData, PostType } from "@/lib/posts";

const HOUR = 3600 * 1000;

/** What people in a city write, by type (offers / announcements are businesses'). */
const TEXTS: Record<
  Exclude<PostType, "offer" | "announcement" | "job">,
  string[]
> = {
  general: [
    "The Corniche at sunset today was something else. Worth the walk!",
    "Power is back in the Old Souq area, for anyone wondering.",
    "الجو النهارده جميل جدًا، مناسب لنزهة على النيل 🌅",
    "Quelqu’un a vu le marché ce matin ? Il y avait un monde fou.",
    "New bike lane on the main road looks great, finally.",
  ],
  question: [
    "Where can I get a good haircut near the station?",
    "Any recommendations for a reliable plumber?",
    "فين أحسن مكان للفطار الصبح؟",
    "Is the ferry to the West Bank running on Fridays?",
    "Où trouver des épices de qualité à bon prix ?",
  ],
  together: [
    "Anyone up for a felucca ride this Saturday afternoon? Splitting the cost.",
    "Looking for people to play football on Thursday evenings.",
    "مين عايز ينضم لمجموعة جري الصبح على الكورنيش؟",
  ],
  experience: [
    "Tried the koshary place behind the market — generous and cheap.",
    "Visited the Nubian village last weekend. The hospitality was amazing.",
    "تجربتي مع الصيدلية الجديدة كانت ممتازة، سريعين ومحترمين.",
  ],
  event: [
    "Nubian music night at the cultural centre this Thursday, 8 pm. Free entry!",
    "Weekend market on the Corniche: crafts, food and live music.",
    "Tournoi de football amical samedi matin au stade municipal.",
  ],
  housing: [
    "Furnished room for rent near the university, quiet building, 2500 EGP/month.",
    "Looking for a two-bedroom flat with a Nile view, from next month.",
    "شقة للإيجار في حي السيل، ٣ غرف، قريبة من المواصلات.",
  ],
  lost_found: [
    "Found a set of keys near the ferry dock this morning — message me.",
    "Lost a brown wallet around the old market. Reward if found!",
    "ضاع مني قطة رمادية في حي السيل، لو حد شافها يبلغني 🙏",
  ],
  alert: [
    "Road works near the bridge — expect delays this week.",
    "Water will be cut tomorrow from 9 to 1 in the north district.",
    "تحذير: زحمة شديدة عند الموقف بسبب الإصلاحات.",
  ],
};

export type SeedPost = {
  type: PostType;
  body: string;
  city: CitySlug;
  createdAt: Date;
  /** A sample reviewer's email, or a seeded business's @handle. */
  by: { reviewer: string } | { business: string };
  /** Its type's fields (`POST_DATA`), e.g. an offer's price. */
  data?: AnyPostData;
};

/** yyyy-mm-dd, `days` from today. */
const inDays = (days: number) =>
  new Date(Date.now() + days * 24 * HOUR).toISOString().slice(0, 10);

/**
 * Posts of every type in every city, by the sample reviewers — and in
 * Aswan more than a page of general posts and questions (infinite scroll).
 */
export function seedUserPosts(reviewers: string[]): SeedPost[] {
  const now = Date.now();
  const posts: SeedPost[] = [];
  let n = 0;
  const add = (type: keyof typeof TEXTS, city: CitySlug, i: number) => {
    const texts = TEXTS[type];
    posts.push({
      type,
      city,
      body: texts[i % texts.length],
      createdAt: new Date(now - (n + 1) * 3 * HOUR),
      by: { reviewer: reviewers[n++ % reviewers.length] },
    });
  };
  for (const { slug } of CITIES) {
    for (const type of Object.keys(TEXTS) as (keyof typeof TEXTS)[]) {
      const count = slug === "aswan" ? 3 : 1;
      for (let i = 0; i < count; i++) add(type, slug, i);
    }
  }
  // More than one page (POSTS_PAGE_SIZE) in Aswan.
  for (let i = 0; i < 24; i++) add("general", "aswan", i);
  for (let i = 0; i < 22; i++) add("question", "aswan", i);
  return posts;
}

/** Offers, announcements and jobs from the businesses the test user owns. */
export function seedBusinessPosts(): SeedPost[] {
  const now = Date.now();
  return [
    {
      type: "offer",
      business: "nilebreeze",
      body: "Breakfast for two with a Nile view — this week only.",
      data: { price: "20% off", endsOn: inDays(7) },
      age: 2,
    },
    {
      type: "offer",
      business: "aswan.eats",
      body: "Family meal deal every Friday: four mains, salads and drinks.",
      data: { price: "450 EGP" },
      age: 26,
    },
    {
      type: "announcement",
      business: "nilebreeze",
      body: "We’re now open until midnight on weekends!",
      age: 5,
    },
    {
      type: "announcement",
      business: "aswan.eats",
      body: "New Nubian dishes on the menu from next week.",
      age: 50,
    },
    {
      type: "job",
      business: "nilebreeze",
      body: "We're hiring a barista for morning shifts. Experience a plus, training provided.",
      age: 8,
    },
    {
      type: "job",
      business: "aswan.eats",
      body: "مطلوب مساعد طباخ للعمل في المطبخ، دوام كامل.",
      age: 30,
    },
  ].map(({ business, age, ...post }) => ({
    ...(post as Omit<SeedPost, "by" | "city" | "createdAt">),
    city: "aswan" as const,
    createdAt: new Date(now - age * HOUR),
    by: { business },
  }));
}
