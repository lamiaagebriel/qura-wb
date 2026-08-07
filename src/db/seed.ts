import { hash } from "@node-rs/argon2";
import { inArray } from "drizzle-orm";

import { db, schema } from "@/db";

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
    name: "Mira Ben Salah",
    username: "mira",
    email: "mira@qura.dev",
    bio: "Coffee first, everything else second. Sousse 🇹🇳",
  },
  {
    name: "Youssef Trabelsi",
    username: "youssef",
    email: "youssef@qura.dev",
    bio: "Building things in Hammamet. Ex-chef, current dev.",
  },
  {
    name: "Nour Hammami",
    username: "nour",
    email: "nour@qura.dev",
    bio: "Local events, live music, and way too many recommendations.",
  },
  {
    name: "Amine Chaabane",
    username: "amine",
    email: "amine@qura.dev",
    bio: "Apartment hunting so you don't have to.",
  },
  {
    name: "Salma Jendoubi",
    username: "salma",
    email: "salma@qura.dev",
    bio: null,
  },
  {
    name: "Karim Ferjani",
    username: "karim",
    email: "karim@qura.dev",
    bio: "Runs the food truck by the marina.",
  },
] as const;

const SEED_THREADS: {
  author: string;
  body: string;
  images?: string[];
  replies?: { author: string; body: string }[];
}[] = [
  {
    author: "mira",
    body: "New place opened up near the medina — best cortado I've had in Sousse, full stop.",
    images: [
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
    ],
    replies: [
      { author: "nour", body: "Which one?? I need this in my life." },
      { author: "amine", body: "Second this, been going every morning." },
    ],
  },
  {
    author: "youssef",
    body: "Six months into building the new menu system for the truck. Turns out the hard part was never the food.",
    replies: [{ author: "karim", body: "Ha, felt this in my soul." }],
  },
  {
    author: "nour",
    body: "Reminder: open-air concert at the marina this Friday, 8pm. Bring a jacket, it gets windy.",
  },
  {
    author: "amine",
    body: "PSA for anyone apartment hunting in Hammamet right now — prices are up ~15% from last season. Start early.",
    replies: [
      { author: "salma", body: "Painfully accurate. Took me 3 weeks." },
    ],
  },
  {
    author: "karim",
    body: "Grilled halloumi wrap is back on the truck menu this week. Come say hi.",
  },
  {
    author: "salma",
    body: "Does anyone actually like the new tram schedule or is it just me",
  },
];

const SEED_FOLLOWS: [string, string][] = [
  ["mira", "nour"],
  ["mira", "youssef"],
  ["nour", "mira"],
  ["nour", "karim"],
  ["amine", "mira"],
  ["amine", "salma"],
  ["salma", "amine"],
  ["karim", "youssef"],
  ["youssef", "karim"],
];

const SEED_LIKES: [string, number][] = [
  // [username, index into the flattened thread list they liked]
  ["nour", 0],
  ["amine", 0],
  ["salma", 1],
  ["karim", 2],
  ["mira", 3],
  ["youssef", 4],
  ["nour", 4],
];

async function seed() {
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
        .onConflictDoUpdate({
          target: schema.users.email,
          set: { name: u.name, bio: u.bio },
        })
        .returning();
      return row;
    }),
  );
  const userByUsername = new Map(users.map((u) => [u.username, u]));

  console.log("Seeding credential accounts…");
  await db
    .insert(schema.accounts)
    .values(
      users.map((u) => ({
        userId: u.id,
        accountId: u.id,
        providerId: "credential",
        password: passwordHash,
      })),
    )
    .onConflictDoNothing({
      target: [schema.accounts.providerId, schema.accounts.accountId],
    });

  console.log("Seeding follows…");
  await db
    .insert(schema.follows)
    .values(
      SEED_FOLLOWS.map(([follower, following]) => ({
        followerId: userByUsername.get(follower)!.id,
        followingId: userByUsername.get(following)!.id,
      })),
    )
    .onConflictDoNothing({
      target: [schema.follows.followerId, schema.follows.followingId],
    });

  // Re-runnable without piling up duplicate content: clear out this seed's
  // own threads (cascades to their replies and likes) before reinserting.
  console.log("Clearing previously seeded threads…");
  await db.delete(schema.threads).where(
    inArray(
      schema.threads.authorId,
      users.map((u) => u.id),
    ),
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
  await db
    .insert(schema.threadLikes)
    .values(
      SEED_LIKES.map(([username, threadIndex]) => ({
        userId: userByUsername.get(username)!.id,
        threadId: flatThreads[threadIndex].id,
      })),
    )
    .onConflictDoNothing({
      target: [schema.threadLikes.userId, schema.threadLikes.threadId],
    });

  console.log(
    `\nDone. ${users.length} users seeded, all with password: ${SEED_PASSWORD}`,
  );
  console.log("Sign in with any seeded email, e.g. mira@qura.dev.");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
