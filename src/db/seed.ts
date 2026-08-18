import { randomUUID } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { getTableName, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import { EMPTY_WORKING_HOURS, type DayKey, type WorkingHours } from "@/lib/working-hours";

function dailyHours(
  days: DayKey[],
  ranges: { open: string; close: string }[],
  base: WorkingHours = EMPTY_WORKING_HOURS,
): WorkingHours {
  return days.reduce((acc, day) => ({ ...acc, [day]: ranges }), base);
}

const ALL_DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const WEEKDAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri"];

// A split shift (lunch break) six days a week, closed Sunday — exercises
// both "multiple ranges in one day" and "a day with none".
const KITCHEN_HOURS = dailyHours(
  ["mon", "tue", "wed", "thu", "fri", "sat"],
  [
    { open: "09:00", close: "15:00" },
    { open: "18:00", close: "23:00" },
  ],
);

// Weekdays full day, Saturday a half day, Sunday closed.
const CLINIC_HOURS = dailyHours(WEEKDAYS, [{ open: "09:00", close: "17:00" }]);
CLINIC_HOURS.sat = [{ open: "09:00", close: "13:00" }];

// Same hours every day, no closures.
const MARKET_HOURS = dailyHours(ALL_DAYS, [{ open: "08:00", close: "21:00" }]);

// Same Argon2id params as `lib/auth/password.ts` — duplicated rather than
// imported, since that file pulls in `server-only`, which throws when
// resolved outside a bundler's "react-server" condition (i.e. exactly the
// plain `tsx` process this script runs under).
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
} as const;

const SEED_PASSWORD = "Passw0rd1!";

const SEED_USERS = [
  {
    name: "Yasmine Trabelsi",
    username: "yasmine",
    email: "yasmine@qura.dev",
    bio: "Photographer chasing golden hour around Sousse. Weddings, portraits, the occasional stray cat.",
  },
  {
    name: "Omar Belhadj",
    username: "omar",
    email: "omar@qura.dev",
    bio: "Car guy. Currently restoring a '98 Golf that's eaten more weekends than I'd like to admit.",
  },
  {
    name: "Ines Gharbi",
    username: "ines",
    email: "ines@qura.dev",
    bio: "Eating my way through Hammamet, one review at a time. Cooking the rest of it myself.",
  },
  {
    name: "Sami Ayari",
    username: "sami",
    email: "sami@qura.dev",
    bio: "5am gym, questionable life choices after. PR or it didn't happen.",
  },
  {
    name: "Rania Khelifi",
    username: "rania",
    email: "rania@qura.dev",
    bio: "Hair today, gone tomorrow — I mean that as a compliment to my clients, not a warning.",
  },
  {
    name: "Walid Snoussi",
    username: "walid",
    email: "walid@qura.dev",
    bio: "Building the boring parts of the internet so other people don't have to.",
  },
  {
    name: "Nadia Fersi",
    username: "nadia",
    email: "nadia@qura.dev",
    bio: "Dentist by day. Still afraid of my own dentist, ironically.",
  },
  {
    name: "Marwa Cherni",
    username: "marwa",
    email: "marwa@qura.dev",
    bio: "Interior designer. Will judge your lighting choices silently, then fix them.",
  },
  {
    name: "Hedi Mansour",
    username: "hedi",
    email: "hedi@qura.dev",
    bio: "Planning other people's vacations so well I forget to plan my own.",
  },
  {
    name: "Salma Jendoubi",
    username: "salma",
    email: "salma@qura.dev",
    bio: null,
  },
] as const;

// Business rows are `users` rows with `ownerId` set — never logged into
// directly, same as `lib/business/actions/create.ts`. `owner` here is a
// username from `SEED_USERS`, resolved to an id after users are inserted.
const SEED_BUSINESSES = [
  {
    owner: "ines",
    name: "Ines' Kitchen",
    username: "ineskitchen",
    bio: "Home-cooked Tunisian classics, delivered across Hammamet. Family recipes, no shortcuts.",
    block: {
      category: "food-drinks" as const,
      data: {
        cuisine: "Tunisian home cooking",
        priceRange: "$$",
        workingHours: KITCHEN_HOURS,
        deliveryAvailable: true,
        reservationsAvailable: true,
        menuUrl: "https://ineskitchen.example.com/menu",
        location: {
          description: "Hammamet, near Yasmine Hammamet — delivery-only, no walk-in counter.",
        },
        phones: ["+216 20 111 222"],
      },
    },
  },
  {
    owner: "omar",
    name: "Belhadj Auto Garage",
    username: "belhadjauto",
    bio: "Mechanics, tires, and honest quotes. Sousse industrial zone, since 2015.",
    block: {
      category: "automotive" as const,
      data: {
        details:
          "General mechanics, tire changes, oil service, and full diagnostics. Walk-ins welcome, no appointment needed — though for anything major, a quick call ahead saves you a wait.",
        location: {
          description: "Sousse industrial zone, gate 4.",
          lat: 35.833,
          lng: 10.64,
        },
        phones: ["+216 73 300 111", "+216 20 300 111"],
      },
    },
  },
  {
    owner: "yasmine",
    name: "Yasmine Studio",
    username: "yasminestudio",
    bio: "Portrait, event, and product photography.",
    block: {
      category: "creative" as const,
      data: {
        details:
          "Portrait sessions, weddings, and product shoots for small businesses. Studio in central Sousse, on-location shoots available anywhere in the Sahel region.",
        location: {
          description: "Central Sousse, Rue Habib Bourguiba",
        },
        phones: ["+216 20 456 789"],
        socialLinks: [
          "https://instagram.com/yasminestudio",
          "https://facebook.com/yasminestudio",
        ],
      },
    },
  },
  {
    owner: "rania",
    name: "Rania Hair & Beauty",
    username: "raniabeauty",
    bio: "Hair, nails, and everything in between.",
    block: {
      category: "beauty" as const,
      data: {
        details:
          "Hair styling, coloring, balayage, manicure and pedicure. Bridal packages available on request — book at least a month ahead for wedding season.",
        location: {
          description: "Above the pharmacy, ring the top bell.",
          lat: 35.8256,
          lng: 10.6084,
        },
        phones: ["+216 20 987 654"],
        socialLinks: [
          "https://instagram.com/raniabeauty",
          "https://tiktok.com/@raniabeauty",
          "https://wa.me/21620987654",
        ],
      },
    },
  },
  {
    owner: "nadia",
    name: "Dr. Nadia Fersi — Dental Clinic",
    username: "nadiadental",
    bio: "General and cosmetic dentistry. Gentle with nervous patients — promise.",
    block: {
      category: "health" as const,
      data: {
        specialty: "General & Cosmetic Dentistry",
        clinicAddress: "34 Rue de la République, Sousse",
        workingHours: CLINIC_HOURS,
        acceptsInsurance: true,
        appointmentPhone: "+216 73 220 145",
        consultationFee: "70 TND",
        location: {
          description: "34 Rue de la République, Sousse — 3rd floor, elevator available.",
          lat: 35.8283,
          lng: 10.6036,
        },
        phones: ["+216 73 220 145"],
      },
    },
  },
  {
    owner: "marwa",
    name: "Marwa Interiors",
    username: "marwainteriors",
    bio: "Residential interior design, from a single room to a full renovation.",
    block: {
      category: "home-services" as const,
      data: {
        details:
          "Full interior design service: layout planning, material sourcing, and on-site supervision through to the last coat of paint. Free initial consultation.",
        location: {
          description: "Home visits across Sousse & Hammamet",
        },
        phones: ["+216 22 111 333"],
      },
    },
  },
  {
    owner: "hedi",
    name: "Hedi Travel & Tours",
    username: "heditravel",
    bio: "Custom trips across Tunisia — desert, coast, and everything between.",
    block: {
      category: "tourism" as const,
      data: {
        details:
          "Custom multi-day itineraries, desert camping trips to Douz and Tozeur, and day trips along the Sahel coast. Small groups only, French/English/Arabic guiding.",
        location: {
          description: "Office by the marina, next to the ferry ticket booth.",
          lat: 35.8367,
          lng: 10.635,
        },
        phones: ["+216 98 222 444", "+216 20 222 444"],
      },
    },
  },
  {
    owner: "salma",
    name: "Sousse Corner Market",
    username: "soussemarket",
    bio: "Neighborhood grocery, fresh produce delivered daily.",
    block: {
      category: "shopping" as const,
      data: {
        details:
          "Fresh produce, bakery, and pantry staples. Local delivery within Sousse for orders over 30 TND.",
        workingHours: MARKET_HOURS,
        location: {
          description: "Downtown Sousse, Avenue Léopold Sédar Senghor",
        },
        phones: ["+216 73 555 666"],
      },
    },
  },
] as const;

const SEED_THREADS: {
  author: string;
  body: string;
  images?: string[];
  replies?: { author: string; body: string }[];
}[] = [
  {
    author: "yasmine",
    body: "Shot a wedding at the marina this weekend — the light right before sunset was unreal. Twelve years doing this and it still gets me every time.",
    images: [
      "https://images.unsplash.com/photo-1519741497674-611481863552",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6",
    ],
    replies: [
      { author: "ines", body: "Okay this is stunning, send me the full gallery" },
      { author: "sami", body: "The marina really is unbeatable at that hour" },
      { author: "marwa", body: "The color grading on these is so good" },
    ],
  },
  {
    author: "omar",
    body: "PSA: if your AC hasn't been serviced since last summer, do it now before the heat hits. Takes 20 minutes and saves you from finding out the hard way in July.",
    replies: [
      { author: "walid", body: "Booked, thanks for the reminder" },
      { author: "nadia", body: "Same, mine's been making a weird noise for weeks" },
    ],
  },
  {
    author: "ines",
    body: "Tried making couscous completely from scratch for the first time — rolling the semolina by hand, the whole process. 6 hours later: worth it, but never again on a weeknight.",
    images: [
      "https://images.unsplash.com/photo-1512058564366-18510be2db19",
    ],
    replies: [
      { author: "hedi", body: "This is basically a full-time job, respect" },
    ],
  },
  {
    author: "sami",
    body: "New PR on deadlift today — 180kg, finally past the plateau I've been stuck at since March. Small wins, but they add up.",
    replies: [
      { author: "omar", body: "Numbers? Don't be shy" },
      { author: "yasmine", body: "Insane, congrats" },
    ],
  },
  {
    author: "rania",
    body: "Booking up fast for wedding season — if you're getting married this summer, reach out now, not in June. Last year I had to turn people away in May.",
  },
  {
    author: "walid",
    body: "Does anyone know a good place to get a phone screen fixed same-day around Sousse? Dropped mine on tile and it's not pretty.",
    replies: [
      { author: "yasmine", body: "There's a place near the medina, I'll send you the pin" },
      { author: "salma", body: "Same one Yasmine means, they fixed mine in an hour" },
    ],
  },
  {
    author: "nadia",
    body: "Gentle reminder from your local dentist: 'I'll floss tomorrow' is not a long-term strategy. That's it, that's the post.",
    replies: [
      { author: "ines", body: "Personally attacked" },
      { author: "walid", body: "This is directed at me specifically isn't it" },
    ],
  },
  {
    author: "marwa",
    body: "Finished a full living room redesign this week — swapped heavy curtains for sheer linen and the whole room feels twice as big. Sometimes it really is just about the light.",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
    ],
    replies: [
      { author: "rania", body: "Need you in my apartment immediately" },
    ],
  },
  {
    author: "hedi",
    body: "Just got back from a 4-day desert trip to Douz — stargazing in the dunes with zero light pollution is genuinely one of the best things you can do in this country. Booking the next group now.",
    images: [
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35",
    ],
    replies: [
      { author: "sami", body: "How's the trip for someone with zero camping experience?" },
      { author: "hedi", body: "Totally fine, we handle all the gear — just bring layers, desert nights get cold" },
    ],
  },
  {
    author: "salma",
    body: "The tomatoes this week are actually incredible, first good batch since winter. Stock's limited though, don't wait until Saturday.",
  },
  {
    author: "yasmine",
    body: "Experimenting with film again after years of shooting fully digital. Slower, more expensive, and somehow more fun — forces you to actually think before pressing the shutter.",
  },
  {
    author: "omar",
    body: "Reminder that 'it's just a small oil leak' is how every big repair bill starts. Come get it looked at before it becomes a Saturday-ruining problem.",
  },
];

const SEED_FOLLOWS: [string, string][] = [
  ["yasmine", "ines"],
  ["ines", "yasmine"],
  ["ines", "rania"],
  ["sami", "omar"],
  ["omar", "walid"],
  ["walid", "yasmine"],
  ["rania", "ines"],
  ["yasmine", "sami"],
  ["nadia", "ines"],
  ["nadia", "sami"],
  ["marwa", "yasmine"],
  ["marwa", "rania"],
  ["hedi", "yasmine"],
  ["hedi", "omar"],
  ["salma", "ines"],
  ["salma", "nadia"],
  ["walid", "nadia"],
  ["sami", "marwa"],
];

const SEED_LIKES: [string, number][] = [
  // [username, index into the flattened thread list they liked]
  ["ines", 0],
  ["sami", 0],
  ["marwa", 0],
  ["walid", 1],
  ["nadia", 1],
  ["yasmine", 2],
  ["hedi", 2],
  ["omar", 3],
  ["yasmine", 3],
  ["ines", 4],
  ["sami", 5],
  ["salma", 5],
  ["ines", 6],
  ["walid", 6],
  ["rania", 7],
  ["sami", 8],
  ["walid", 8],
  ["omar", 10],
];

// [businessUsername, reviewerUsername, rating, body]. Never the business's
// own owner, matching `upsertReviewAction`'s server-side rule.
const SEED_REVIEWS: [string, string, number, string][] = [
  ["ineskitchen", "yasmine", 5, "Loved the couscous, super fast delivery too. Already ordered twice more this month."],
  ["ineskitchen", "sami", 4, "Great food, portions could be a touch bigger for the price."],
  ["ineskitchen", "walid", 5, "Best home-cooked food I've had delivered in Hammamet, full stop."],
  ["belhadjauto", "sami", 5, "Fixed my AC in 20 minutes flat, exactly as advertised. Fair price too."],
  ["belhadjauto", "hedi", 4, "Solid, honest mechanic. A bit of a wait on a Saturday morning."],
  ["yasminestudio", "ines", 5, "Yasmine shot our engagement photos and they're breathtaking. Worth every dinar."],
  ["yasminestudio", "marwa", 5, "Incredibly professional and made everyone comfortable in front of the camera."],
  ["raniabeauty", "ines", 5, "My go-to for haircuts now, never disappointed."],
  ["raniabeauty", "marwa", 4, "Great color work, booking can be tricky during wedding season."],
  ["nadiadental", "walid", 5, "Genuinely the least stressful dentist visit I've ever had."],
  ["nadiadental", "salma", 5, "Very gentle, explained everything clearly before doing anything."],
  ["marwainteriors", "sami", 5, "Redesigned my living room and it feels like a completely different apartment."],
  ["heditravel", "sami", 5, "The Douz desert trip was unforgettable, incredibly well organized."],
  ["heditravel", "walid", 4, "Great trip overall, would've liked a bit more free time on day two."],
  ["soussemarket", "nadia", 4, "Good produce, reliably fresh. Delivery window could be tighter."],
];

async function seed() {
  // Full reset every run, not an upsert — every table gets wiped and
  // reseeded from scratch, in FK-safe order (children before `users`,
  // though `CASCADE` would handle it anyway). This is a dev/demo seed
  // script, not a migration: idempotency here means "always the same
  // clean state", not "never touch existing rows".
  console.log("Clearing existing data…");
  for (const table of [
    schema.threadLikes,
    schema.threads,
    schema.reports,
    schema.follows,
    schema.businessReviews,
    schema.businessBlocks,
    schema.sessions,
    schema.accounts,
    schema.verifications,
    schema.users,
  ]) {
    await db.execute(sql.raw(`TRUNCATE TABLE "${getTableName(table)}" CASCADE`));
  }

  console.log("Seeding users…");
  const passwordHash = await hash(SEED_PASSWORD, ARGON2_OPTIONS);

  const users = await Promise.all(
    SEED_USERS.map(async (u) => {
      const [row] = await db
        .insert(schema.users)
        .values({
          name: u.name,
          username: u.username,
          email: u.email,
          bio: u.bio,
          emailVerified: true,
          status: "active",
        })
        .returning();
      return row;
    }),
  );
  const userByUsername = new Map(users.map((u) => [u.username, u]));

  console.log("Seeding credential accounts…");
  await db.insert(schema.accounts).values(
    users.map((u) => ({
      userId: u.id,
      accountId: u.id,
      providerId: "credential",
      password: passwordHash,
    })),
  );

  console.log("Seeding businesses…");
  const businesses = await Promise.all(
    SEED_BUSINESSES.map(async (b) => {
      const [row] = await db
        .insert(schema.users)
        .values({
          name: b.name,
          username: b.username,
          bio: b.bio,
          ownerId: userByUsername.get(b.owner)!.id,
          // Never sent to, never shown, and never used to look anyone up —
          // it only exists to satisfy `users.email`'s NOT NULL UNIQUE
          // constraint, same as `lib/business/actions/create.ts`.
          email: `business+${randomUUID()}@business.internal.qura`,
          emailVerified: true,
          status: "active",
        })
        .returning();
      return row;
    }),
  );
  const businessByUsername = new Map(businesses.map((b) => [b.username, b]));

  console.log("Seeding business blocks…");
  await db.insert(schema.businessBlocks).values(
    SEED_BUSINESSES.map((b, i) => ({
      businessId: businesses[i].id,
      category: b.block.category,
      data: b.block.data,
    })),
  );

  console.log("Seeding business reviews…");
  await db.insert(schema.businessReviews).values(
    SEED_REVIEWS.map(([businessUsername, reviewerUsername, rating, body]) => ({
      businessId: businessByUsername.get(businessUsername)!.id,
      authorId: userByUsername.get(reviewerUsername)!.id,
      rating,
      body,
    })),
  );

  console.log("Seeding follows…");
  await db.insert(schema.follows).values(
    SEED_FOLLOWS.map(([follower, following]) => ({
      followerId: userByUsername.get(follower)!.id,
      followingId: userByUsername.get(following)!.id,
    })),
  );

  console.log("Seeding threads and replies…");
  const flatThreads: { id: string }[] = [];
  for (const t of SEED_THREADS) {
    const [thread] = await db
      .insert(schema.threads)
      .values({
        authorId: userByUsername.get(t.author)!.id,
        body: t.body,
        images: t.images ?? [],
      })
      .returning();
    flatThreads.push(thread);

    for (const reply of t.replies ?? []) {
      await db.insert(schema.threads).values({
        authorId: userByUsername.get(reply.author)!.id,
        parentId: thread.id,
        body: reply.body,
      });
    }
  }

  console.log("Seeding likes…");
  await db.insert(schema.threadLikes).values(
    SEED_LIKES.map(([username, threadIndex]) => ({
      userId: userByUsername.get(username)!.id,
      threadId: flatThreads[threadIndex].id,
    })),
  );

  console.log(
    `\nDone. ${users.length} users, ${businesses.length} businesses, ${SEED_THREADS.length} threads, and ${SEED_REVIEWS.length} reviews seeded. User password: ${SEED_PASSWORD}`,
  );
  console.log("Sign in with any seeded email, e.g. yasmine@qura.dev.");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
