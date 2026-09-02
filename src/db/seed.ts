import { randomUUID } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { getTableName, sql } from "drizzle-orm";

import { db, schema } from "@/db";
import type { CityId } from "@/db/schema/cities";
import type { ThreadCategory } from "@/db/schema/threads";
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
    name: "Yasmine Mansour",
    username: "yasmine",
    email: "yasmine@qura.dev",
    bio: "Photographer chasing golden hour along the Nile in Aswan. Weddings, portraits, the occasional stray cat.",
  },
  {
    name: "Omar Fahmy",
    username: "omar",
    email: "omar@qura.dev",
    bio: "Car guy. Currently restoring a '98 Golf that's eaten more weekends than I'd like to admit.",
  },
  {
    name: "Ines Adly",
    username: "ines",
    email: "ines@qura.dev",
    bio: "Eating my way through Aswan, one review at a time. Cooking the rest of it myself.",
  },
  {
    name: "Sami Younes",
    username: "sami",
    email: "sami@qura.dev",
    bio: "5am gym, questionable life choices after. PR or it didn't happen.",
  },
  {
    name: "Rania Farouk",
    username: "rania",
    email: "rania@qura.dev",
    bio: "Hair today, gone tomorrow — I mean that as a compliment to my clients, not a warning.",
  },
  {
    name: "Walid Hassan",
    username: "walid",
    email: "walid@qura.dev",
    bio: "Building the boring parts of the internet so other people don't have to.",
  },
  {
    name: "Nadia Kamal",
    username: "nadia",
    email: "nadia@qura.dev",
    bio: "Dentist by day. Still afraid of my own dentist, ironically.",
  },
  {
    name: "Marwa Nabil",
    username: "marwa",
    email: "marwa@qura.dev",
    bio: "Interior designer. Will judge your lighting choices silently, then fix them.",
  },
  {
    name: "Adel Shafik",
    username: "adel",
    email: "adel@qura.dev",
    bio: "Planning other people's vacations so well I forget to plan my own.",
  },
  {
    name: "Salma Ibrahim",
    username: "salma",
    email: "salma@qura.dev",
    bio: null,
  },
  {
    name: "Fady Nabil",
    username: "fady",
    email: "fady@qura.dev",
    bio: "Second-generation felucca captain working the Philae dock. Ask about the sunset run.",
  },
] as const;

// Luxor's own set of accounts — kept separate from `SEED_USERS` (Aswan)
// only for readability; both get inserted into the same `users` table.
// Bios deliberately mix Arabic and English, same as `SEED_THREADS_LUXOR`
// below — a real Egyptian city's feed is never one language only.
const SEED_USERS_LUXOR = [
  {
    name: "Mostafa Aly",
    username: "mostafa",
    email: "mostafa@qura.dev",
    bio: "مرشد سياحي في الأقصر، متخصص في وادي الملوك والبر الغربي. بحب أوصّل تاريخ مصر لأي حد مهتم يسمع.",
  },
  {
    name: "Heba Zaki",
    username: "heba",
    email: "heba@qura.dev",
    bio: "Hot air balloon pilot over Luxor's West Bank. Best office view in Egypt, hands down.",
  },
  {
    name: "Karim Naguib",
    username: "karim",
    email: "karim@qura.dev",
    bio: "قبطان فلوكة على النيل قدام الكرنك من سنة 2010. الجولة بالليل أحلى من بالنهار وهقنعك بيها.",
  },
  {
    name: "Dina Fathy",
    username: "dina",
    email: "dina@qura.dev",
    bio: "Alabaster and handicrafts, made the traditional way on the West Bank. Third generation in the family workshop.",
  },
  {
    name: "Ahmed Reda",
    username: "ahmedr",
    email: "ahmedr@qura.dev",
    bio: "كشري وأكل بلدي في وسط الأقصر. الوصفة من جدتي، مش هغيرها لحد ما تقنعني بحاجة أحسن.",
  },
  {
    name: "Nour Samy",
    username: "nour",
    email: "nour@qura.dev",
    bio: "Luxor local, night-shift enthusiast. Ask me about the Karnak sound and light show.",
  },
  {
    name: "Youssef Adel",
    username: "youssef",
    email: "youssef@qura.dev",
    bio: "بشتغل في التموين، بعرف كل مكان في الأقصر يبيع بسعر كويس.",
  },
] as const;

// Google Places integration (Phases 1–23) — fake but plausible place ids,
// never validated against the real Google API (this seed never calls it;
// see `SEED_GOOGLE_PLACES` below, which is what actually backs these with
// display data). `PLACE_PHILAE_DOCK` is deliberately shared by two
// businesses (`adeltours` + `philaeboats`, added below) to seed a real
// example of Phase 5's "multiple Qura businesses may connect to one
// Google Place" grouping, plus the admin-visible conflict record that
// creates (`SEED_GOOGLE_PLACE_CONFLICTS`).
const PLACE_INES_KITCHEN = "ChIJqura_ines_kitchen_aswan";
const PLACE_NADIA_DENTAL = "ChIJqura_nadia_dental_aswan";
const PLACE_PHILAE_DOCK = "ChIJqura_philae_dock_aswan";
const PLACE_LUXOR_VALLEY_TOURS = "ChIJqura_luxor_valley_tours";
const PLACE_NILE_SKY_BALLOONS = "ChIJqura_nile_sky_balloons";

// Business rows are `users` rows with `ownerId` set — never logged into
// directly, same as `lib/business/actions/create.ts`. `owner` here is a
// username from `SEED_USERS`, resolved to an id after users are inserted.
const SEED_BUSINESSES = [
  {
    owner: "ines",
    name: "Ines' Nubian Kitchen",
    username: "ineskitchen",
    bio: "Home-cooked Nubian & Egyptian classics, delivered across Aswan. Family recipes, no shortcuts.",
    block: {
      category: "food-drinks" as const,
      googlePlaceId: PLACE_INES_KITCHEN,
      data: {
        cuisine: "Nubian & Egyptian home cooking",
        priceRange: "$$",
        workingHours: KITCHEN_HOURS,
        deliveryAvailable: true,
        reservationsAvailable: true,
        menuUrl: "https://ineskitchen.example.com/menu",
        location: {
          description: "Aswan, near the Nubian Museum — delivery-only, no walk-in counter.",
        },
        phones: ["+20 10 1112 2223"],
      },
    },
  },
  {
    owner: "omar",
    name: "Fahmy Auto Garage",
    username: "fahmyauto",
    bio: "Mechanics, tires, and honest quotes. Aswan industrial zone, since 2015.",
    block: {
      category: "automotive" as const,
      data: {
        details:
          "General mechanics, tire changes, oil service, and full diagnostics. Walk-ins welcome, no appointment needed — though for anything major, a quick call ahead saves you a wait.",
        location: {
          description: "Aswan industrial zone, gate 4.",
          lat: 24.1041,
          lng: 32.9092,
        },
        phones: ["+20 97 230 0111", "+20 10 1300 1112"],
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
          "Portrait sessions, weddings, and product shoots for small businesses. Studio in central Aswan, on-location shoots available anywhere along the Nile.",
        location: {
          description: "Central Aswan, near the Corniche El Nil",
        },
        phones: ["+20 10 1045 6789"],
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
          lat: 24.091,
          lng: 32.8975,
        },
        phones: ["+20 10 1098 7654"],
        socialLinks: [
          "https://instagram.com/raniabeauty",
          "https://tiktok.com/@raniabeauty",
          "https://wa.me/201010987654",
        ],
      },
    },
  },
  {
    owner: "nadia",
    name: "Dr. Nadia Kamal — Dental Clinic",
    username: "nadiadental",
    bio: "General and cosmetic dentistry. Gentle with nervous patients — promise.",
    block: {
      category: "health" as const,
      googlePlaceId: PLACE_NADIA_DENTAL,
      data: {
        specialty: "General & Cosmetic Dentistry",
        clinicAddress: "12 Corniche El Nil, Aswan",
        workingHours: CLINIC_HOURS,
        acceptsInsurance: true,
        appointmentPhone: "+20 97 231 0145",
        consultationFee: "700 EGP",
        location: {
          description: "12 Corniche El Nil, Aswan — 3rd floor, elevator available.",
          lat: 24.0865,
          lng: 32.892,
        },
        phones: ["+20 97 231 0145"],
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
          description: "Home visits across Aswan",
        },
        phones: ["+20 10 1211 1333"],
      },
    },
  },
  {
    owner: "adel",
    name: "Adel Nile Tours",
    username: "adeltours",
    bio: "Felucca rides, Abu Simbel day trips, and Nubian village tours.",
    block: {
      category: "tourism" as const,
      googlePlaceId: PLACE_PHILAE_DOCK,
      data: {
        details:
          "Custom multi-day itineraries, Abu Simbel and Philae Temple day trips, felucca sailing on the Nile, and Nubian village visits. Small groups only, Arabic/English/French guiding.",
        location: {
          description: "Office on the Nile Corniche, next to the felucca dock.",
          lat: 24.0865,
          lng: 32.883,
        },
        phones: ["+20 10 1122 2444", "+20 10 1022 2444"],
      },
    },
  },
  {
    owner: "fady",
    name: "Philae Docks Boat Co.",
    username: "philaeboats",
    bio: "Second boat operator at the same public dock as Adel Nile Tours — different crew, same great sunset run.",
    block: {
      category: "tourism" as const,
      googlePlaceId: PLACE_PHILAE_DOCK,
      data: {
        details:
          "Felucca and motorboat rides to Philae Temple and around Elephantine Island. Walk-up bookings welcome at the dock, or reserve ahead for sunset.",
        location: {
          description: "Philae Temple public dock, Nile Corniche, Aswan.",
          lat: 24.0863,
          lng: 32.8828,
        },
        phones: ["+20 10 4455 6677"],
      },
    },
  },
  {
    owner: "salma",
    name: "Aswan Corner Market",
    username: "aswanmarket",
    bio: "Neighborhood grocery, fresh produce delivered daily.",
    block: {
      category: "shopping" as const,
      data: {
        details:
          "Fresh produce, bakery, and pantry staples. Local delivery within Aswan for orders over 200 EGP.",
        workingHours: MARKET_HOURS,
        location: {
          description: "Downtown Aswan, near Souk Street",
        },
        phones: ["+20 97 235 5666"],
      },
    },
  },
] as const;

// Luxor's businesses — every block explicitly sets `city: "luxor"` (the
// column defaults to `"aswan"`, so this is the only thing that actually
// puts these in Luxor's directory instead of Aswan's).
const SEED_BUSINESSES_LUXOR = [
  {
    owner: "mostafa",
    name: "Luxor Valley Tours",
    username: "luxorvalleytours",
    bio: "جولات خاصة في وادي الملوك، دير البحري، ومعابد البر الغربي. مجموعات صغيرة بس.",
    block: {
      category: "tourism" as const,
      city: "luxor" as const,
      googlePlaceId: PLACE_LUXOR_VALLEY_TOURS,
      data: {
        details:
          "جولات خاصة ونصف خاصة لوادي الملوك، معبد حتشبسوت، ووادي الملكات. الحجز قبل يوم على الأقل، والانطلاق من الفندق بيتم ترتيبه.",
        location: {
          description: "البر الغربي، الأقصر — بجوار شباك تذاكر وادي الملوك.",
          lat: 25.7402,
          lng: 32.6014,
        },
        phones: ["+20 10 5566 7788"],
      },
    },
  },
  {
    owner: "heba",
    name: "Nile Sky Balloons",
    username: "nileskyballoons",
    bio: "Sunrise hot air balloon flights over Luxor's West Bank. Licensed pilots, small baskets, big views.",
    block: {
      category: "tourism" as const,
      city: "luxor" as const,
      googlePlaceId: PLACE_NILE_SKY_BALLOONS,
      data: {
        details:
          "45-minute sunrise flights over the Valley of the Kings and Hatshepsut's temple. Hotel pickup included, weather-dependent — we call the night before to confirm.",
        location: {
          description: "Launch site, West Bank, Luxor — hotel pickup provided.",
          lat: 25.7188,
          lng: 32.6089,
        },
        phones: ["+20 10 2233 4455"],
        socialLinks: ["https://instagram.com/nileskyballoons"],
      },
    },
  },
  {
    owner: "karim",
    name: "Karnak Felucca Rides",
    username: "karnakfelucca",
    bio: "رحلات فلوكة على النيل قدام الكرنك، بالنهار أو بالليل تحت القمر.",
    block: {
      category: "tourism" as const,
      city: "luxor" as const,
      data: {
        details:
          "رحلات فلوكة من ساعة لحد ثلاث ساعات، بالنهار أو بالليل. مفيش صوت محرك، بس هدوء النيل وإنت واقف قدام الكرنك.",
        location: {
          description: "رصيف الفلايك، كورنيش النيل، مقابل معبد الكرنك.",
        },
        phones: ["+20 10 9988 7766"],
      },
    },
  },
  {
    owner: "dina",
    name: "Luxor Alabaster House",
    username: "luxoralabaster",
    bio: "Hand-carved alabaster lamps, vases, and statues — made in our West Bank workshop, third generation.",
    block: {
      category: "shopping" as const,
      city: "luxor" as const,
      data: {
        details:
          "Every piece carved and polished by hand on-site — come watch the process, not just buy the result. Shipping arranged worldwide.",
        location: {
          description: "West Bank alabaster workshop district, Luxor.",
          lat: 25.7295,
          lng: 32.6103,
        },
        phones: ["+20 10 3344 5566"],
        socialLinks: ["https://instagram.com/luxoralabaster"],
      },
    },
  },
  {
    owner: "ahmedr",
    name: "Reda's Koshary Corner",
    username: "redaskoshary",
    bio: "كشري بلدي في وسط الأقصر، من غير أي حاجة جاهزة أو مجمدة.",
    block: {
      category: "food-drinks" as const,
      city: "luxor" as const,
      data: {
        cuisine: "كشري وأكل مصري بلدي",
        priceRange: "$",
        workingHours: KITCHEN_HOURS,
        deliveryAvailable: true,
        reservationsAvailable: false,
        location: {
          description: "شارع المحطة، وسط الأقصر — جنب المسجد الكبير.",
        },
        phones: ["+20 10 6677 8899"],
      },
    },
  },
] as const;

type SeedThread = {
  author: string;
  body: string;
  images?: string[];
  replies?: { author: string; body: string }[];
  // Omitted = "aswan" (the column default) — only `SEED_THREADS_LUXOR`
  // below sets this explicitly.
  city?: "aswan" | "luxor";
  // Omitted = "general" (the column default).
  category?: ThreadCategory;
};

const SEED_THREADS: SeedThread[] = [
  {
    author: "yasmine",
    body: "Shot a wedding on the Corniche this weekend — the light right before sunset over the Nile was unreal. Twelve years doing this and it still gets me every time.",
    category: "experience",
    images: [
      "https://images.unsplash.com/photo-1519741497674-611481863552",
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6",
    ],
    replies: [
      { author: "ines", body: "Okay this is stunning, send me the full gallery" },
      { author: "sami", body: "The Corniche really is unbeatable at that hour" },
      { author: "marwa", body: "The color grading on these is so good" },
    ],
  },
  {
    author: "omar",
    body: "PSA: if your AC hasn't been serviced since last summer, do it now before the heat hits. Takes 20 minutes and saves you from finding out the hard way in July.",
    category: "alert",
    replies: [
      { author: "walid", body: "Booked, thanks for the reminder" },
      { author: "nadia", body: "Same, mine's been making a weird noise for weeks" },
    ],
  },
  {
    author: "ines",
    body: "Tried making molokhia completely from scratch for the first time — chopping it by hand, the whole process. 6 hours later: worth it, but never again on a weeknight.",
    category: "experience",
    images: [
      "https://images.unsplash.com/photo-1512058564366-18510be2db19",
    ],
    replies: [
      { author: "adel", body: "This is basically a full-time job, respect" },
    ],
  },
  {
    author: "sami",
    body: "New PR on deadlift today — 180kg, finally past the plateau I've been stuck at since March. Small wins, but they add up.",
    category: "experience",
    replies: [
      { author: "omar", body: "Numbers? Don't be shy" },
      { author: "yasmine", body: "Insane, congrats" },
    ],
  },
  {
    author: "rania",
    body: "Booking up fast for wedding season — if you're getting married this summer, reach out now, not in June. Last year I had to turn people away in May.",
    category: "announcement",
  },
  {
    author: "walid",
    body: "Does anyone know a good place to get a phone screen fixed same-day around Aswan? Dropped mine on tile and it's not pretty.",
    category: "question",
    replies: [
      { author: "yasmine", body: "There's a place near Souk Street, I'll send you the pin" },
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
    category: "experience",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
    ],
    replies: [
      { author: "rania", body: "Need you in my apartment immediately" },
    ],
  },
  {
    author: "adel",
    body: "Just got back from a 2-day Abu Simbel and felucca trip — sailing the Nile at sunset with zero engine noise is genuinely one of the best things you can do in this country. Booking the next group now.",
    category: "together",
    images: [
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35",
    ],
    replies: [
      { author: "sami", body: "How's the trip for someone with zero sailing experience?" },
      { author: "adel", body: "Totally fine, we handle everything — just bring sun protection, the reflection off the water is intense" },
    ],
  },
  {
    author: "salma",
    body: "The tomatoes this week are actually incredible, first good batch since winter. Stock's limited though, don't wait until Saturday.",
    category: "offer",
  },
  {
    author: "yasmine",
    body: "Experimenting with film again after years of shooting fully digital. Slower, more expensive, and somehow more fun — forces you to actually think before pressing the shutter.",
    category: "experience",
  },
  {
    author: "omar",
    body: "Reminder that 'it's just a small oil leak' is how every big repair bill starts. Come get it looked at before it becomes a Saturday-ruining problem.",
    category: "alert",
  },
  {
    // Deliberately not city-relevant — this is here specifically to get
    // downvoted into `markedUnhelpful` (see `SEED_VOTES` below), the
    // canonical "I'm tired today" example of a post Qura's voting exists
    // to flag: fine on a general social feed, no reason for it to sit
    // undifferentiated next to "does anyone know a good plumber."
    author: "sami",
    body: "I'm so tired today 😭",
  },
];

// Appended to `flatThreads` right after `SEED_THREADS` in `seed()`, so
// these land at indices 13+ — `SEED_SAVES_LUXOR`/`SEED_VOTES_LUXOR`
// below index into that combined list the same way the Aswan ones index
// into `SEED_THREADS` alone.
const SEED_THREADS_LUXOR: SeedThread[] = [
  {
    author: "mostafa",
    body: "زرت وادي الملوك النهاردة الساعة 6 الصبح عشان أتجنب الزحمة والحر — تجربة تستاهل تتعاد، بس لازم تحجز جولة بدري قبل ما التذاكر تخلص.",
    city: "luxor",
    category: "experience",
    replies: [
      { author: "youssef", body: "بالظبط كده، الساعة 6 قرار صح جداً" },
      { author: "nour", body: "أي جولة تنصح بيها؟ حابة أروح الأسبوع الجاي" },
    ],
  },
  {
    author: "heba",
    body: "Sunrise balloon ride over the West Bank this morning — Hatshepsut's temple from above is something else. Fully booked through next week, but taking names for the week after.",
    city: "luxor",
    category: "offer",
    images: ["https://images.unsplash.com/photo-1509316785289-025f5b846b35"],
    replies: [{ author: "dina", body: "This never gets old, every single time" }],
  },
  {
    author: "karim",
    body: "مين عايز يجرب رحلة فلوكة بالليل على النيل قدام معبد الكرنك؟ الجو الليلة هادي جداً وقمر كامل.",
    city: "luxor",
    category: "together",
    replies: [{ author: "ahmedr", body: "أنا معاك، احجزلي مكان" }],
  },
  {
    author: "dina",
    body: "New batch of hand-carved alabaster lamps just arrived from our West Bank workshop — the honey-colored ones are already almost sold out.",
    city: "luxor",
    category: "offer",
    images: ["https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6"],
  },
  {
    author: "ahmedr",
    body: "كشري بلدي حقيقي في وسط الأقصر، من غير مبالغة أحسن كشري جربته من القاهرة لحد هنا.",
    city: "luxor",
    category: "experience",
    replies: [{ author: "nour", body: "موافقة تماماً، بروح كل أسبوع" }],
  },
  {
    author: "nour",
    body: "Karnak at night with the sound and light show is criminally underrated — way fewer crowds than the daytime visit.",
    city: "luxor",
    category: "experience",
  },
  {
    author: "youssef",
    body: "حد عنده رقم سباك كويس في الأقصر؟ عندي تسريب مياه من امبارح والصنابير مش بتساعد.",
    city: "luxor",
    category: "question",
    replies: [{ author: "mostafa", body: "هبعتلك رقم واحد بيشتغل عندنا في المكتب" }],
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
  ["adel", "yasmine"],
  ["adel", "omar"],
  ["salma", "ines"],
  ["salma", "nadia"],
  ["walid", "nadia"],
  ["sami", "marwa"],
  ["fady", "adel"],
  ["adel", "fady"],
  ["rania", "fady"],
];

const SEED_FOLLOWS_LUXOR: [string, string][] = [
  ["nour", "mostafa"],
  ["youssef", "karim"],
  ["dina", "heba"],
  ["heba", "dina"],
  ["mostafa", "ahmedr"],
  ["karim", "nour"],
];

const SEED_SAVES: [string, number][] = [
  // [username, index into the flattened thread list they saved]
  ["ines", 0],
  ["sami", 0],
  ["marwa", 0],
  ["walid", 1],
  ["nadia", 1],
  ["yasmine", 2],
  ["adel", 2],
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

// Same indexing note as `SEED_THREADS_LUXOR` — 13 is `mostafa`'s Valley
// of the Kings post, 14 is `heba`'s balloon post, and so on in order.
const SEED_SAVES_LUXOR: [string, number][] = [
  ["youssef", 14],
  ["nour", 16],
  ["dina", 13],
];

// [username, index into the flattened thread list, 1 = helpful / -1 =
// not helpful]. Thread 12 ("I'm so tired today 😭") gets 4 downvotes
// against 1 upvote — 5 total, 80% down — crossing
// `THREAD_UNHELPFUL_MIN_VOTES`/`THREAD_UNHELPFUL_DOWN_RATIO`
// (`lib/threads/queries.ts`), so it renders behind the "marked
// unhelpful" interstitial. Threads 5 and 7 (genuinely
// city-relevant asks) get a few real upvotes instead, for contrast.
const SEED_VOTES: [string, number, 1 | -1][] = [
  ["ines", 12, -1],
  ["nadia", 12, -1],
  ["marwa", 12, -1],
  ["adel", 12, -1],
  ["omar", 12, 1],
  ["yasmine", 5, 1],
  ["salma", 5, 1],
  ["nadia", 7, 1],
  ["sami", 7, 1],
];

const SEED_VOTES_LUXOR: [string, number, 1 | -1][] = [
  ["nour", 13, 1],
  ["youssef", 13, 1],
  ["dina", 15, 1],
  ["heba", 17, 1],
];

// [businessUsername, reviewerUsername, rating, body]. Never the business's
// own owner, matching `upsertReviewAction`'s server-side rule.
const SEED_REVIEWS: [string, string, number, string][] = [
  ["ineskitchen", "yasmine", 5, "Loved the molokhia, super fast delivery too. Already ordered twice more this month."],
  ["ineskitchen", "sami", 4, "Great food, portions could be a touch bigger for the price."],
  ["ineskitchen", "walid", 5, "Best home-cooked food I've had delivered in Aswan, full stop."],
  ["fahmyauto", "sami", 5, "Fixed my AC in 20 minutes flat, exactly as advertised. Fair price too."],
  ["fahmyauto", "adel", 4, "Solid, honest mechanic. A bit of a wait on a Saturday morning."],
  ["yasminestudio", "ines", 5, "Yasmine shot our engagement photos and they're breathtaking. Worth every pound."],
  ["yasminestudio", "marwa", 5, "Incredibly professional and made everyone comfortable in front of the camera."],
  ["raniabeauty", "ines", 5, "My go-to for haircuts now, never disappointed."],
  ["raniabeauty", "marwa", 4, "Great color work, booking can be tricky during wedding season."],
  ["nadiadental", "walid", 5, "Genuinely the least stressful dentist visit I've ever had."],
  ["nadiadental", "salma", 5, "Very gentle, explained everything clearly before doing anything."],
  ["marwainteriors", "sami", 5, "Redesigned my living room and it feels like a completely different apartment."],
  ["adeltours", "sami", 5, "The Abu Simbel and felucca trip was unforgettable, incredibly well organized."],
  ["adeltours", "walid", 4, "Great trip overall, would've liked a bit more free time on day two."],
  ["aswanmarket", "nadia", 4, "Good produce, reliably fresh. Delivery window could be tighter."],
  ["philaeboats", "rania", 5, "Flagged them down right at the dock, no booking needed. Sunset run was gorgeous."],
  ["philaeboats", "marwa", 4, "Good ride, boat was a little crowded on a Friday evening."],
];

// Google Places integration — pre-populated `google_places` cache rows so
// every connected business above renders real-looking Google info
// (rating, phone, opening hours) without this seed ever calling the live
// API (`GOOGLE_PLACES_API_KEY` isn't required to run this script, same as
// every `evaluate-*.ts` harness's stubbed approach — this just persists
// the equivalent data instead of stubbing `fetch`). `fetchedAt`/
// `updatedAt` are set to "now" at insert time (see `seed()` below), so
// `getCachedGooglePlace` serves these as `"fresh"` immediately — no
// Google Details call happens just from browsing a freshly seeded app.
const SEED_GOOGLE_PLACES: {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  types: string[];
  rating: number;
  userRatingCount: number;
  businessStatus: string;
  phone: string | null;
  website: string | null;
  openingHours: { openNow?: boolean; weekdayDescriptions?: string[] } | null;
}[] = [
  {
    placeId: PLACE_INES_KITCHEN,
    name: "Ines' Nubian Kitchen",
    address: "Nubian Museum Road, Aswan, Egypt",
    latitude: 24.0838,
    longitude: 32.8998,
    types: ["restaurant", "food", "point_of_interest"],
    rating: 4.6,
    userRatingCount: 214,
    businessStatus: "OPERATIONAL",
    phone: "+20 10 1112 2223",
    website: "https://ineskitchen.example.com",
    openingHours: {
      openNow: true,
      weekdayDescriptions: [
        "Monday: 9:00 AM – 3:00 PM, 6:00 PM – 11:00 PM",
        "Tuesday: 9:00 AM – 3:00 PM, 6:00 PM – 11:00 PM",
        "Wednesday: 9:00 AM – 3:00 PM, 6:00 PM – 11:00 PM",
        "Thursday: 9:00 AM – 3:00 PM, 6:00 PM – 11:00 PM",
        "Friday: 9:00 AM – 3:00 PM, 6:00 PM – 11:00 PM",
        "Saturday: 9:00 AM – 3:00 PM, 6:00 PM – 11:00 PM",
        "Sunday: Closed",
      ],
    },
  },
  {
    placeId: PLACE_NADIA_DENTAL,
    name: "Dr. Nadia Kamal — Dental Clinic",
    address: "12 Corniche El Nil, Aswan, Egypt",
    latitude: 24.0865,
    longitude: 32.892,
    types: ["dentist", "health", "point_of_interest"],
    rating: 4.9,
    userRatingCount: 87,
    businessStatus: "OPERATIONAL",
    phone: "+20 97 231 0145",
    website: null,
    openingHours: {
      openNow: false,
      weekdayDescriptions: [
        "Monday: 9:00 AM – 5:00 PM",
        "Tuesday: 9:00 AM – 5:00 PM",
        "Wednesday: 9:00 AM – 5:00 PM",
        "Thursday: 9:00 AM – 5:00 PM",
        "Friday: 9:00 AM – 5:00 PM",
        "Saturday: 9:00 AM – 1:00 PM",
        "Sunday: Closed",
      ],
    },
  },
  {
    placeId: PLACE_PHILAE_DOCK,
    name: "Philae Temple Public Dock",
    address: "Nile Corniche, near Philae Temple boarding point, Aswan, Egypt",
    latitude: 24.0863,
    longitude: 32.8828,
    types: ["tourist_attraction", "travel_agency", "point_of_interest"],
    rating: 4.7,
    userRatingCount: 340,
    businessStatus: "OPERATIONAL",
    phone: null,
    website: null,
    openingHours: null,
  },
  {
    placeId: PLACE_LUXOR_VALLEY_TOURS,
    name: "Luxor Valley Tours",
    address: "West Bank, Valley of the Kings Road, Luxor, Egypt",
    latitude: 25.7402,
    longitude: 32.6014,
    types: ["travel_agency", "tourist_attraction", "point_of_interest"],
    rating: 4.8,
    userRatingCount: 156,
    businessStatus: "OPERATIONAL",
    phone: "+20 10 5566 7788",
    website: null,
    openingHours: {
      openNow: true,
      weekdayDescriptions: [
        "Monday: 6:00 AM – 8:00 PM",
        "Tuesday: 6:00 AM – 8:00 PM",
        "Wednesday: 6:00 AM – 8:00 PM",
        "Thursday: 6:00 AM – 8:00 PM",
        "Friday: 6:00 AM – 8:00 PM",
        "Saturday: 6:00 AM – 8:00 PM",
        "Sunday: 6:00 AM – 8:00 PM",
      ],
    },
  },
  {
    placeId: PLACE_NILE_SKY_BALLOONS,
    name: "Nile Sky Balloons",
    address: "West Bank Launch Site, Luxor, Egypt",
    latitude: 25.7188,
    longitude: 32.6089,
    types: ["tourist_attraction", "travel_agency", "point_of_interest"],
    rating: 4.9,
    userRatingCount: 502,
    businessStatus: "OPERATIONAL",
    phone: "+20 10 2233 4455",
    website: "https://nileskyballoons.example.com",
    openingHours: {
      openNow: false,
      weekdayDescriptions: [
        "Monday: 4:30 AM – 8:00 AM",
        "Tuesday: 4:30 AM – 8:00 AM",
        "Wednesday: 4:30 AM – 8:00 AM",
        "Thursday: 4:30 AM – 8:00 AM",
        "Friday: 4:30 AM – 8:00 AM",
        "Saturday: 4:30 AM – 8:00 AM",
        "Sunday: 4:30 AM – 8:00 AM",
      ],
    },
  },
];

const SEED_REVIEWS_LUXOR: [string, string, number, string][] = [
  ["luxorvalleytours", "nour", 5, "مصطفى شرح كل حاجة بالتفصيل، جولة تستاهل فعلاً."],
  ["luxorvalleytours", "youssef", 4, "كويسة بس كانت طويلة شوية، خدوا مياه معاكم."],
  ["nileskyballoons", "youssef", 5, "Worth waking up at 4am for. Unreal views."],
  ["karnakfelucca", "dina", 5, "الرحلة بالليل كانت من أحلى حاجات عملتها في الأقصر."],
  ["luxoralabaster", "nour", 5, "The lamps are even better in person. Shipped mine home with zero issues."],
  ["redaskoshary", "heba", 4, "Solid koshary, generous portions for the price."],
];

async function seed() {
  // Full reset every run, not an upsert — every table gets wiped and
  // reseeded from scratch, in FK-safe order (children before `users`,
  // though `CASCADE` would handle it anyway). This is a dev/demo seed
  // script, not a migration: idempotency here means "always the same
  // clean state", not "never touch existing rows".
  console.log("Clearing existing data…");
  for (const table of [
    schema.threadSaves,
    schema.threadVotes,
    schema.threads,
    schema.reports,
    schema.follows,
    schema.businessReviews,
    schema.businessBlocks,
    // Independent of `users`/`business_blocks` (keyed by Google's own
    // `placeId`, not a FK — see its schema comment), so a `users` TRUNCATE
    // CASCADE never reaches it. Must be cleared explicitly, or a second
    // `db:seed` run collides on `SEED_GOOGLE_PLACES`' fixed place ids.
    schema.googlePlacesCache,
    schema.sessions,
    schema.accounts,
    schema.verifications,
    schema.users,
  ]) {
    await db.execute(sql.raw(`TRUNCATE TABLE "${getTableName(table)}" CASCADE`));
  }

  // Aswan + Luxor combined from here on — one list of users, businesses,
  // etc., each already carrying its own `city` (explicit on the Luxor
  // entries, defaulted to `"aswan"` on the original ones).
  const allUsers = [...SEED_USERS, ...SEED_USERS_LUXOR];
  const allBusinesses = [...SEED_BUSINESSES, ...SEED_BUSINESSES_LUXOR];
  const allFollows = [...SEED_FOLLOWS, ...SEED_FOLLOWS_LUXOR];
  const allThreads = [...SEED_THREADS, ...SEED_THREADS_LUXOR];
  const allSaves = [...SEED_SAVES, ...SEED_SAVES_LUXOR];
  const allVotes = [...SEED_VOTES, ...SEED_VOTES_LUXOR];
  const allReviews = [...SEED_REVIEWS, ...SEED_REVIEWS_LUXOR];

  console.log("Seeding users…");
  const passwordHash = await hash(SEED_PASSWORD, ARGON2_OPTIONS);

  const users = await Promise.all(
    allUsers.map(async (u) => {
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
    allBusinesses.map(async (b) => {
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
    allBusinesses.map((b, i) => ({
      businessId: businesses[i].id,
      category: b.block.category,
      city: ("city" in b.block ? b.block.city : "aswan") as CityId,
      data: b.block.data,
    })),
  );

  console.log("Seeding Google Place connections…");
  const googlePlaceConnections = allBusinesses
    .map((b, i) => ({
      businessId: businesses[i].id,
      googlePlaceId: "googlePlaceId" in b.block ? b.block.googlePlaceId : null,
    }))
    .filter((row) => row.googlePlaceId !== null)
    .map((row) => ({ businessId: row.businessId, googlePlaceId: row.googlePlaceId as string }));
  await db.insert(schema.businessGooglePlaces).values(googlePlaceConnections);

  console.log("Seeding Google Places cache…");
  const now = new Date();
  await db.insert(schema.googlePlacesCache).values(
    SEED_GOOGLE_PLACES.map((p) => ({ ...p, fetchedAt: now, updatedAt: now })),
  );

  console.log("Seeding Google place claim conflicts…");
  await db.insert(schema.googlePlaceClaimConflicts).values({
    googlePlaceId: PLACE_PHILAE_DOCK,
    attemptingBusinessId: businessByUsername.get("philaeboats")!.id,
    attemptingOwnerId: userByUsername.get("fady")!.id,
    existingBusinessId: businessByUsername.get("adeltours")!.id,
    existingOwnerId: userByUsername.get("adel")!.id,
  });

  console.log("Seeding business reviews…");
  await db.insert(schema.businessReviews).values(
    allReviews.map(([businessUsername, reviewerUsername, rating, body]) => ({
      businessId: businessByUsername.get(businessUsername)!.id,
      authorId: userByUsername.get(reviewerUsername)!.id,
      rating,
      body,
    })),
  );

  console.log("Seeding follows…");
  await db.insert(schema.follows).values(
    allFollows.map(([follower, following]) => ({
      followerId: userByUsername.get(follower)!.id,
      followingId: userByUsername.get(following)!.id,
    })),
  );

  console.log("Seeding threads and replies…");
  const flatThreads: { id: string }[] = [];
  for (const t of allThreads) {
    const [thread] = await db
      .insert(schema.threads)
      .values({
        authorId: userByUsername.get(t.author)!.id,
        body: t.body,
        images: t.images ?? [],
        city: t.city ?? "aswan",
        category: t.category ?? "general",
      })
      .returning();
    flatThreads.push(thread);

    for (const reply of t.replies ?? []) {
      await db.insert(schema.threads).values({
        authorId: userByUsername.get(reply.author)!.id,
        parentId: thread.id,
        body: reply.body,
        city: t.city ?? "aswan",
      });
    }
  }

  console.log("Seeding saves…");
  await db.insert(schema.threadSaves).values(
    allSaves.map(([username, threadIndex]) => ({
      userId: userByUsername.get(username)!.id,
      threadId: flatThreads[threadIndex].id,
    })),
  );

  console.log("Seeding votes…");
  await db.insert(schema.threadVotes).values(
    allVotes.map(([username, threadIndex, value]) => ({
      userId: userByUsername.get(username)!.id,
      threadId: flatThreads[threadIndex].id,
      value,
    })),
  );

  console.log(
    `\nDone. ${users.length} users, ${businesses.length} businesses (${SEED_GOOGLE_PLACES.length} connected to a cached Google Place), ${allThreads.length} threads, and ${allReviews.length} reviews seeded across Aswan and Luxor. User password: ${SEED_PASSWORD}`,
  );
  console.log("Sign in with any seeded email, e.g. yasmine@qura.dev or mostafa@qura.dev.");
  console.log(
    "@adeltours and @philaeboats both connect to the same Google Place (Philae dock) — visit /profile/adeltours or search 'Philae' in a category page to see the grouped result.",
  );
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
