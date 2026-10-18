// A larger, varied sample world for local development — loaded by
// `pnpm db:seed` (src/db/seed.ts) after the base samples, never in
// production. It lives in places of its own (Cairo, Giza, Alexandria,
// Fayoum and the places inside them), so the e2e tests' Aswan / Luxor data
// stays exactly as they expect. Deterministic (a seeded PRNG) and written
// once: skipped when Cairo already exists.

import { eq } from "drizzle-orm";

import type { Tx } from "@/lib/actions/run";
import type { OpeningHours } from "@/lib/business";
import type { AnyPostData } from "@/lib/posts";
import type { TicketType } from "@/lib/tickets/types";

import {
  businessFollows,
  businessLocations,
  businessReviews,
  businesses,
  history,
  placeAdmins,
  places,
  placeTypes,
  posts,
  postSaves,
  postVotes,
  tickets,
  type TicketRef,
  users,
} from "../schema";

/** Small deterministic PRNG, so the same world comes out every time. */
function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32;
    return seed / 2 ** 32;
  };
}
const rand = random(20261012);
const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const chance = (p: number) => rand() < p;
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
/** Spread over the last `days` days (so the dashboard's trends have a shape). */
const ago = (days: number) => new Date(Date.now() - rand() * days * DAY);

// ── Places ──────────────────────────────────────────────────────────────

type SeedPlace = {
  slug: string;
  parent: string | null;
  type: "City" | "Markaz" | "Village" | "Neighborhood";
  name: { en: string; ar: string };
  at: [number, number];
};

const PLACES: SeedPlace[] = [
  { slug: "cairo", parent: null, type: "City", name: { en: "Cairo", ar: "القاهرة" }, at: [30.0444, 31.2357] },
  { slug: "maadi", parent: "cairo", type: "Neighborhood", name: { en: "Maadi", ar: "المعادي" }, at: [29.9602, 31.2569] },
  { slug: "degla", parent: "maadi", type: "Neighborhood", name: { en: "Degla", ar: "دجلة" }, at: [29.9619, 31.2795] },
  { slug: "sarayat", parent: "maadi", type: "Neighborhood", name: { en: "Sarayat", ar: "السرايات" }, at: [29.9581, 31.2531] },
  { slug: "zamalek", parent: "cairo", type: "Neighborhood", name: { en: "Zamalek", ar: "الزمالك" }, at: [30.0609, 31.2197] },
  { slug: "heliopolis", parent: "cairo", type: "Neighborhood", name: { en: "Heliopolis", ar: "مصر الجديدة" }, at: [30.0911, 31.3225] },
  { slug: "nasr-city", parent: "cairo", type: "Neighborhood", name: { en: "Nasr City", ar: "مدينة نصر" }, at: [30.0511, 31.3656] },
  { slug: "giza", parent: null, type: "City", name: { en: "Giza", ar: "الجيزة" }, at: [30.0131, 31.2089] },
  { slug: "dokki", parent: "giza", type: "Neighborhood", name: { en: "Dokki", ar: "الدقي" }, at: [30.0385, 31.2123] },
  { slug: "mohandessin", parent: "giza", type: "Neighborhood", name: { en: "Mohandessin", ar: "المهندسين" }, at: [30.0561, 31.2001] },
  { slug: "haram", parent: "giza", type: "Neighborhood", name: { en: "Haram", ar: "الهرم" }, at: [29.9915, 31.1586] },
  { slug: "alexandria", parent: null, type: "City", name: { en: "Alexandria", ar: "الإسكندرية" }, at: [31.2001, 29.9187] },
  { slug: "smouha", parent: "alexandria", type: "Neighborhood", name: { en: "Smouha", ar: "سموحة" }, at: [31.2156, 29.9469] },
  { slug: "sidi-gaber", parent: "alexandria", type: "Neighborhood", name: { en: "Sidi Gaber", ar: "سيدي جابر" }, at: [31.2189, 29.9425] },
  { slug: "miami-alex", parent: "alexandria", type: "Neighborhood", name: { en: "Miami", ar: "ميامي" }, at: [31.2667, 30.0047] },
  { slug: "fayoum", parent: null, type: "City", name: { en: "Fayoum", ar: "الفيوم" }, at: [29.3084, 30.8428] },
  { slug: "tunis-village", parent: "fayoum", type: "Village", name: { en: "Tunis Village", ar: "قرية تونس" }, at: [29.4083, 30.6697] },
  { slug: "ibshaway", parent: "fayoum", type: "Markaz", name: { en: "Ibshaway", ar: "إبشواي" }, at: [29.3594, 30.6811] },
];

// ── People ──────────────────────────────────────────────────────────────

const FIRST = ["Ahmed", "Mohamed", "Mahmoud", "Ali", "Hassan", "Khaled", "Tarek", "Amr", "Mina", "Bassem", "Sherif", "Hany", "Nour", "Salma", "Yasmin", "Rana", "Dina", "Aya", "Mai", "Heba", "Farida", "Malak", "Jana", "Rawan"] as const;
const LAST = ["Mostafa", "Ibrahim", "Abdelrahman", "Saleh", "Fouad", "Zaki", "Naguib", "Lotfy", "Shawky", "Ramzy", "Hamdy", "Wahba", "Mansour", "Kamal", "Sabry", "Galal"] as const;

// ── Businesses ──────────────────────────────────────────────────────────

const BUSINESS_KINDS = [
  { category: "coffee-shop", en: ["Bean & Co", "Corner Café", "Third Wave", "Morning Cup"], ar: "قهوة" },
  { category: "bakery", en: ["Golden Crust", "Fino Bakery", "Sweet Oven"], ar: "مخبز" },
  { category: "traditional", en: ["Koshary El Tahrir", "Abou Tarek Corner", "Felfela House"], ar: "مطعم" },
  { category: "grill", en: ["Kebabgy Grill", "Charcoal House"], ar: "مشويات" },
  { category: "seafood", en: ["Fish Market", "Abou Ashraf Seafood", "Blue Wave"], ar: "مأكولات بحرية" },
  { category: "pizza", en: ["Pizza Station", "Napoli Corner"], ar: "بيتزا" },
  { category: "supermarket", en: ["Fresh Mart", "Daily Needs"], ar: "سوبر ماركت" },
  { category: "pharmacy", en: ["Seif Pharmacy", "Al Ezaby Branch", "Care Pharmacy"], ar: "صيدلية" },
  { category: "clinic", en: ["Family Clinic", "Smile Dental", "Kids Care Clinic"], ar: "عيادة" },
  { category: "gym", en: ["Iron Gym", "Flex Fitness", "Yoga Loft"], ar: "جيم" },
  { category: "salon", en: ["Glow Salon", "Barber Bros"], ar: "صالون" },
  { category: "phones", en: ["Mobile Hub", "Fix My Phone"], ar: "موبايلات" },
  { category: "bookstore", en: ["Diwan Corner", "Old Pages"], ar: "مكتبة" },
  { category: "school", en: ["Bright Minds Center", "Language Lab"], ar: "مركز تعليمي" },
  { category: "car-repair", en: ["Quick Fix Garage", "Auto Care"], ar: "ورشة سيارات" },
  { category: "hostel", en: ["Nile Nest Hostel", "Desert Rose Lodge"], ar: "نزل" },
] as const;

const ABOUT = [
  "Open daily, friendly staff and fair prices.",
  "A local favorite since 2010.",
  "Delivery available in the neighborhood.",
  "Family-run, quality first.",
  "New place — come say hi!",
] as const;

// ── Posts ───────────────────────────────────────────────────────────────

const TEXTS: Record<string, readonly string[]> = {
  general: ["Beautiful weather in the area today ☀️", "The new park by the metro is finally open.", "الجو جميل النهارده في المنطقة", "Anyone else notice the new street lights?"],
  question: ["Where can I find a good plumber nearby?", "Any recommendations for a pediatrician?", "فين أحسن مكان للفطار هنا؟", "Is the pharmacy on the main street open late?"],
  together: ["Looking for people to play football on Fridays ⚽", "Running group every morning at 6, join us!", "حد عايز يشترك معانا في مشوار الجمعة؟"],
  experience: ["Tried the new koshary place — honestly great.", "Had a bad experience with a taxi app today, be careful.", "تجربة رائعة في المخبز الجديد"],
  event: ["Book fair this weekend at the cultural center.", "Live music night on Thursday 🎶", "معرض فني يوم السبت"],
  job: ["Hiring a part-time cashier, evenings.", "We need a delivery rider with a motorcycle.", "مطلوب مساعد صيدلي"],
  housing: ["2-bedroom apartment for rent, furnished.", "Looking for a roommate, close to the metro.", "شقة للإيجار قريبة من النادي"],
  lost_found: ["Lost a black wallet near the bakery.", "Found a set of keys at the bus stop.", "قطة ضايعة لونها أبيض"],
  alert: ["Water cut tomorrow from 9 to 1.", "Road works on the main street all week.", "تحذير: زحمة شديدة عند الكوبري"],
  offer: ["20% off all week!", "Buy one get one free on Fridays.", "خصم خاص للطلبة"],
  announcement: ["We're open on Fridays now.", "New branch opening soon!", "مواعيد جديدة في رمضان"],
};
const REPLIES = ["Thanks for sharing!", "I'd recommend the one near the club.", "شكرًا جدًا", "Same here, good to know.", "Try calling them first.", "تمام، هجرب"] as const;
const REVIEW_TEXT = ["Great service, will come back.", "Good but a bit pricey.", "Average, nothing special.", "Very friendly staff!", "Not great this time, slow service.", "ممتاز جدًا", "جيد بس الزحمة كتير", ""] as const;

/** A week of opening hours, Sunday first: Fridays sometimes closed. */
const weekOf = (open: string, close: string): (OpeningHours | null)[] =>
  Array.from({ length: 7 }, (_, day) => (day !== 5 || chance(0.6) ? { open, close } : null));

/**
 * Writes the world (once), inside the seed's action (`tx`). Returns what it
 * added, for the log line.
 */
export async function seedWorld(tx: Tx) {
  const [already] = await tx.select({ id: places.id }).from(places).where(eq(places.slug, "cairo")).limit(1);
  if (already) return null;

  // Place types by English name (created by the places migration).
  const typeRows = await tx.select({ id: placeTypes.id, name: placeTypes.name }).from(placeTypes);
  const typeId = (name: string) => typeRows.find((t) => t.name.en === name)!.id;

  // Places, parents first (the list is in that order).
  const placeId = new Map<string, string>();
  for (const p of PLACES) {
    const [row] = await tx
      .insert(places)
      .values({
        slug: p.slug,
        parentId: p.parent ? placeId.get(p.parent)! : null,
        typeId: typeId(p.type),
        name: p.name,
        lat: p.at[0],
        lng: p.at[1],
        createdAt: ago(60),
      })
      .returning({ id: places.id });
    placeId.set(p.slug, row.id);
  }
  const slugs = PLACES.map((p) => p.slug);

  // People: 40, joined over the last two months; two suspended.
  const people = Array.from({ length: 40 }, (_, i) => {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 7) % LAST.length];
    const username = `${first}.${last}${i}`.toLowerCase();
    return {
      name: `${first} ${last}`,
      username,
      email: `${username}@seed.qura.test`,
      emailVerified: true,
      status: i === 7 || i === 23 ? ("suspended" as const) : ("active" as const),
      bio: chance(0.4) ? pick(["Coffee lover ☕", "Living in Cairo", "أحب مدينتي", "Runner and reader", "Foodie 🍕"]) : null,
      createdAt: ago(60),
    };
  });
  const personIds = (await tx.insert(users).values(people).returning({ id: users.id })).map((r) => r.id);
  const activeIds = personIds.filter((_, i) => i !== 7 && i !== 23);

  // Place admins: someone looks after each city, and Maadi / Zamalek.
  const admins = [
    ["cairo", 0], ["cairo", 1], ["maadi", 2], ["zamalek", 3], ["giza", 4], ["alexandria", 5], ["fayoum", 6],
  ] as const;
  await tx.insert(placeAdmins).values(admins.map(([slug, i]) => ({ placeId: placeId.get(slug)!, userId: personIds[i], createdAt: ago(40) })));

  // Businesses: every kind, spread over the places; a few pending,
  // suspended or closed; some verified; some added for someone else.
  const made: { id: string; city: string; ownerId: string | null }[] = [];
  let n = 0;
  for (const kind of BUSINESS_KINDS) {
    for (const en of kind.en) {
      n++;
      const city = slugs[(n * 5) % slugs.length];
      const place = PLACES.find((p) => p.slug === city)!;
      const status = n % 11 === 0 ? "pending" : n % 13 === 0 ? "suspended" : n % 17 === 0 ? "closed" : "active";
      const ownerless = n % 6 === 0;
      const ownerId = ownerless ? null : pick(activeIds);
      const createdAt = ago(55);
      const username = en.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "").slice(0, 30) + `.${place.slug.split("-")[0]}`;
      const [row] = await tx
        .insert(businesses)
        .values({
          username,
          name: { en, ar: `${kind.ar} ${en}` },
          bio: { en: pick(ABOUT) },
          category: kind.category,
          timeZone: "Africa/Cairo",
          ownerId,
          createdById: ownerId ?? pick(activeIds),
          verified: status === "active" && chance(0.35),
          status,
          links: [
            { platform: "whatsapp" as const, url: `https://wa.me/2010${between(10000000, 99999999)}` },
            ...(chance(0.6) ? [{ platform: "instagram" as const, url: `https://instagram.com/${username.replace(/\./g, "_")}` }] : []),
          ],
          hours: weekOf(pick(["08:00", "09:00", "10:00", "12:00"]), pick(["22:00", "23:00", "24:00"])),
          createdAt,
        })
        .returning({ id: businesses.id });
      made.push({ id: row.id, city, ownerId });

      // One branch, sometimes a second in another place.
      const branchPlaces = chance(0.25) ? [city, pick(slugs)] : [city];
      await tx.insert(businessLocations).values(
        [...new Set(branchPlaces)].map((slug, position) => {
          const p = PLACES.find((x) => x.slug === slug)!;
          return {
            businessId: row.id,
            position,
            address: { en: `${between(1, 120)} ${pick(["Main St", "Club St", "Corniche Rd", "Market Sq", "9th St"])}, ${p.name.en}` },
            lat: p.at[0] + (rand() - 0.5) / 100,
            lng: p.at[1] + (rand() - 0.5) / 100,
            placeId: placeId.get(slug)!,
          };
        }),
      );
    }
  }
  const live = made;

  // Posts: every type in every place, by people and by businesses.
  const postRows: { id: string; placeId: string; type: string; createdById: string }[] = [];
  const TYPES = Object.keys(TEXTS);
  const asBusiness = new Set(["offer", "announcement"]);
  for (const slug of slugs) {
    const count = slug === "cairo" || slug === "maadi" || slug === "giza" ? 14 : 5;
    for (let i = 0; i < count; i++) {
      const type = TYPES[(i + slug.length) % TYPES.length];
      const business = asBusiness.has(type) ? live.find((b) => b.city === slug && b.ownerId) ?? null : null;
      if (asBusiness.has(type) && !business) continue;
      const createdAt = ago(30);
      const [row] = await tx
        .insert(posts)
        .values({
          createdById: business?.ownerId ?? pick(activeIds),
          businessId: business?.id ?? null,
          type: type as never,
          body: pick(TEXTS[type]),
          placeId: placeId.get(slug)!,
          data: (type === "offer"
            ? { price: pick(["20% off", "150 EGP", "2 for 1"]), endsOn: new Date(Date.now() + between(-3, 14) * DAY).toISOString().slice(0, 10) }
            : {}) as AnyPostData,
          createdAt,
          updatedAt: createdAt,
        })
        .returning({ id: posts.id, placeId: posts.placeId, type: posts.type, createdById: posts.createdById });
      postRows.push(row);
    }
  }

  // Replies, votes and saves.
  for (const post of postRows) {
    for (let r = 0; r < between(0, 3); r++) {
      const at = ago(10);
      await tx.insert(posts).values({ parentId: post.id, type: post.type as never, placeId: post.placeId, body: pick(REPLIES), createdById: pick(activeIds), createdAt: at, updatedAt: at });
    }
    // Never the post's own writer (you can't vote on your own post).
    const voters = [...new Set(Array.from({ length: between(0, 8) }, () => pick(activeIds)))].filter((id) => id !== post.createdById);
    if (voters.length) await tx.insert(postVotes).values(voters.map((userId) => ({ userId, postId: post.id, value: chance(0.8) ? 1 : -1 })));
    const savers = [...new Set(Array.from({ length: between(0, 3) }, () => pick(activeIds)))];
    if (savers.length) await tx.insert(postSaves).values(savers.map((userId) => ({ userId, postId: post.id })));
  }

  // Follows and reviews (not of your own business).
  for (const business of made) {
    const fans = [...new Set(Array.from({ length: between(0, 12) }, () => pick(activeIds)))].filter((id) => id !== business.ownerId);
    if (fans.length) await tx.insert(businessFollows).values(fans.map((userId) => ({ userId, businessId: business.id, createdAt: ago(40) })));
    const critics = [...new Set(Array.from({ length: between(0, 6) }, () => pick(activeIds)))].filter((id) => id !== business.ownerId);
    if (critics.length)
      await tx.insert(businessReviews).values(
        critics.map((authorId) => {
          const at = ago(40);
          return { businessId: business.id, authorId, rating: pick([5, 5, 4, 4, 4, 3, 2, 1] as const), text: pick(REVIEW_TEXT), createdAt: at, updatedAt: at };
        }),
      );
  }

  // Tickets: what people asked for and reported. Waiting ones hold their
  // `openKey` (one per sender and subject, like `openTicket`); answered
  // ones get their answer in history, as the app records it.
  const ticket = async (
    type: TicketType,
    createdById: string,
    refs: TicketRef[],
    data: Record<string, unknown>,
    createdAt: Date,
    answer?: { status: "approved" | "rejected" | "dismissed" | "escalated"; by: string; note?: string; at: Date },
  ) => {
    const extra = type === "new_place" ? String((data.name as { en?: string }).en ?? "").toLowerCase() : "";
    const key = [type, createdById, ...refs.map((ref) => `${ref.table}:${ref.id}`), extra].filter(Boolean).join(":");
    const status = answer?.status ?? "open";
    const [row] = await tx
      .insert(tickets)
      .values({ type, status, createdById, refs, data, createdAt, openKey: status === "open" || status === "escalated" ? key : null })
      .returning({ id: tickets.id });
    if (answer) {
      const action = answer.status === "approved" ? "ticket.approve" : answer.status === "rejected" ? "ticket.reject" : answer.status === "dismissed" ? "ticket.dismiss" : "ticket.escalate";
      await tx.insert(history).values({ entry: "action", actorId: answer.by, source: "seed", action, input: { ticketId: row.id }, note: answer.note ?? null, at: answer.at });
    }
    return row.id;
  };
  const place = (slug: string): TicketRef => ({ table: "places", id: placeId.get(slug)! });
  const person = (i: number): TicketRef => ({ table: "users", id: personIds[i] });

  // New places: waiting (two asking for the same one), rejected with a reason.
  const neighborhood = typeId("Neighborhood");
  await ticket("new_place", personIds[10], [place("cairo")], { name: { en: "Garden City", ar: "جاردن سيتي" }, typeId: neighborhood, reason: "Lots of offices and cafés here." }, ago(5));
  await ticket("new_place", personIds[11], [place("cairo")], { name: { en: "Garden City" }, typeId: neighborhood, reason: "I live here." }, ago(3));
  await ticket("new_place", personIds[12], [place("giza")], { name: { en: "6th of October" }, typeId: typeId("City"), reason: "Big city, no page yet." }, ago(4));
  await ticket("new_place", personIds[13], [place("maadi")], { name: { en: "Zahraa El Maadi" }, customType: "Compound", reason: "" }, ago(2));
  await ticket("new_place", personIds[14], [place("alexandria")], { name: { en: "Stanley" }, typeId: neighborhood, reason: "" }, ago(9), {
    status: "rejected",
    by: personIds[5],
    note: "Already part of Sidi Gaber for now.",
    at: ago(1),
  });

  // Admin changes asked by place admins.
  await ticket("add_admin", personIds[2], [place("maadi"), person(15)], { note: "Very active in the neighborhood." }, ago(3));
  await ticket("remove_admin", personIds[0], [place("cairo"), person(1)], { note: "Hasn't been active for months." }, ago(2));

  // "It closed" requests about businesses.
  const someLive = made.filter((b) => b.ownerId).slice(0, 3);
  for (const [i, business] of someLive.entries()) {
    await ticket("close_business", activeIds[(i + 20) % activeIds.length], [{ table: "businesses", id: business.id }], { note: i === 0 ? "Shutters down for two weeks." : "" }, ago(4));
  }

  // Reports: open ones on posts, a post already hidden, one hidden then
  // edited (waiting for an admin), business reports (one sent on by a
  // place admin), a review and a person.
  const reported = postRows.filter((p) => p.type !== "offer").slice(0, 6);
  for (const [i, post] of reported.slice(0, 4).entries()) {
    for (let j = 0; j <= i; j++) {
      const reporterId = activeIds[(i * 3 + j + 25) % activeIds.length];
      if (reporterId === post.createdById) continue;
      const reason = (["spam", "offensive", "not_for_qura", "wrong_place"] as const)[(i + j) % 4];
      await ticket("report_post", reporterId, [{ table: "posts", id: post.id }], { reason, note: j === 0 && i === 1 ? "Rude language." : "" }, ago(3));
    }
  }
  const hide = async (post: (typeof reported)[number], by: string, note: string, status: "hidden" | "under_review", at: Date) => {
    await tx.update(posts).set({ status }).where(eq(posts.id, post.id));
    await tx.insert(history).values({ entry: "action", actorId: by, source: "seed", action: "post.hide", input: { postId: post.id }, note, at });
  };
  await hide(reported[4], personIds[0], "Please remove the phone number.", "hidden", ago(5));
  await hide(reported[5], personIds[2], "This belongs in Jobs.", "under_review", ago(6));
  await ticket("report_business", activeIds[30], [{ table: "businesses", id: made[2].id }], { reason: "fake", note: "Phone number doesn't work." }, ago(2));
  await ticket("report_business", activeIds[31], [{ table: "businesses", id: made[5].id }], { reason: "wrong_info", note: "Hours are wrong." }, ago(4), {
    status: "escalated",
    by: personIds[0],
    at: ago(1),
  });
  await ticket("report_business", activeIds[32], [{ table: "businesses", id: made[9].id }], { reason: "offensive", note: "" }, ago(1));
  const [someReview] = await tx.select({ id: businessReviews.id, authorId: businessReviews.authorId }).from(businessReviews).limit(1);
  if (someReview) {
    const reporter = activeIds.find((id) => id !== someReview.authorId)!;
    await ticket("report_review", reporter, [{ table: "business_reviews", id: someReview.id }], { reason: "fake", note: "They never went there." }, ago(2));
  }
  await ticket("report_user", activeIds[33], [person(24)], { reason: "spam", note: "Posts the same ad everywhere." }, ago(2));

  return { places: PLACES.length, people: people.length, businesses: made.length, posts: postRows.length };
}
