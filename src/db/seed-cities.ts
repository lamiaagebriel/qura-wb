// Seed data for every city beyond the original Aswan/Luxor set (plus a
// few extra Aswan/Luxor businesses to cover the categories those two
// didn't have yet). Plain data only — `seed.ts` does all the inserting.
// Kept in its own file purely so `seed.ts` stays readable.
//
// Everything here references users by `username`, same as `seed.ts`.
// Threads carry their own saves/votes (`savedBy`/`upvotedBy`/
// `downvotedBy`) instead of indexing into a flattened list, so adding or
// reordering a thread never silently shifts someone else's vote.

import type { BusinessCategory } from "@/db/schema/business-blocks";
import type { CityId } from "@/db/schema/cities";
import type { ClaimConflictStatus } from "@/db/schema/google-place-claims";
import type { ThreadCategory } from "@/db/schema/threads";

export type SeedUser = {
  name: string;
  username: string;
  email: string;
  bio: string | null;
};

export type SeedBusiness = {
  owner: string;
  name: string;
  username: string;
  bio: string;
  block: {
    category: BusinessCategory;
    city: CityId;
    googlePlaceId?: string;
    data: Record<string, unknown>;
  };
};

export type SeedThread = {
  author: string;
  body: string;
  images?: string[];
  replies?: { author: string; body: string }[];
  // Omitted = "aswan" (the column default).
  city?: CityId;
  // Omitted = "general" (the column default).
  category?: ThreadCategory;
  savedBy?: string[];
  upvotedBy?: string[];
  downvotedBy?: string[];
};

export type SeedGooglePlace = {
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
  reviews: {
    rating: number;
    text?: string;
    authorName: string;
    relativePublishTimeDescription: string;
    publishTime: string;
  }[];
};

// Every seeded place id starts with this — it's also how `seed.ts` finds
// (and clears) its own `google_places` cache rows on a re-run without
// touching places real users' businesses are connected to.
export const SEED_PLACE_ID_PREFIX = "ChIJqura_";

const IMG = {
  wedding: "https://images.unsplash.com/photo-1519741497674-611481863552",
  table: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6",
  food: "https://images.unsplash.com/photo-1512058564366-18510be2db19",
  livingRoom: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
  interior: "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
  desert: "https://images.unsplash.com/photo-1509316785289-025f5b846b35",
};

// ---------------------------------------------------------------------------
// Google places (fake ids, cached data only — never sent to Google)
// ---------------------------------------------------------------------------

const PLACE = {
  zamalekHub: `${SEED_PLACE_ID_PREFIX}zamalek_hub_cairo`,
  downtownNights: `${SEED_PLACE_ID_PREFIX}downtown_nights_cairo`,
  anwarSeafood: `${SEED_PLACE_ID_PREFIX}anwar_seafood_alex`,
  stanleyYoga: `${SEED_PLACE_ID_PREFIX}stanley_yoga_alex`,
  morsyPharmacy: `${SEED_PLACE_ID_PREFIX}morsy_pharmacy_qena`,
  redSeaDivers: `${SEED_PLACE_ID_PREFIX}red_sea_divers_hurghada`,
  dahar: `${SEED_PLACE_ID_PREFIX}dahar_grill_hurghada`,
  naamaBeach: `${SEED_PLACE_ID_PREFIX}naama_beach_sharm`,
  akhmimTextiles: `${SEED_PLACE_ID_PREFIX}akhmim_textiles_sohag`,
  abuDabbab: `${SEED_PLACE_ID_PREFIX}abu_dabbab_marsa_alam`,
  ironTemple: `${SEED_PLACE_ID_PREFIX}iron_temple_gym_aswan`,
};

function hours(open: string, close: string, closedOn: string[] = []) {
  return [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ].map((day) =>
    closedOn.includes(day) ? `${day}: Closed` : `${day}: ${open} – ${close}`,
  );
}

function place(
  p: Omit<SeedGooglePlace, "businessStatus" | "openingHours"> & {
    weekdayDescriptions?: string[];
    openNow?: boolean;
  },
): SeedGooglePlace {
  const { weekdayDescriptions, openNow, ...rest } = p;
  return {
    ...rest,
    businessStatus: "OPERATIONAL",
    openingHours: weekdayDescriptions
      ? { openNow: openNow ?? true, weekdayDescriptions }
      : null,
  };
}

export const SEED_GOOGLE_PLACES_MORE: SeedGooglePlace[] = [
  place({
    placeId: PLACE.zamalekHub,
    name: "Zamalek Hub Coworking",
    address: "26th of July St, Zamalek, Cairo, Egypt",
    latitude: 30.0626,
    longitude: 31.2197,
    types: ["coworking_space", "point_of_interest"],
    rating: 4.7,
    userRatingCount: 389,
    phone: "+20 2 2735 1100",
    website: "https://zamalekhub.example.com",
    weekdayDescriptions: hours("8:00 AM", "12:00 AM"),
    reviews: [
      {
        rating: 5,
        text: "Fast wifi, real chairs, and the balcony desks overlook the Nile. My office now.",
        authorName: "Karim E.",
        relativePublishTimeDescription: "a week ago",
        publishTime: "2026-09-20T10:00:00.000Z",
      },
      {
        rating: 4,
        text: "Gets loud after 6pm when the events start. Phone booths save the day.",
        authorName: "Julia W.",
        relativePublishTimeDescription: "a month ago",
        publishTime: "2026-08-25T10:00:00.000Z",
      },
    ],
  }),
  place({
    placeId: PLACE.downtownNights,
    name: "Downtown Cairo Nights",
    address: "Talaat Harb Square, Downtown, Cairo, Egypt",
    latitude: 30.0478,
    longitude: 31.2386,
    types: ["event_venue", "night_club", "point_of_interest"],
    rating: 4.5,
    userRatingCount: 1204,
    phone: "+20 10 7788 1200",
    website: null,
    weekdayDescriptions: hours("7:00 PM", "2:00 AM", ["Monday"]),
    openNow: false,
    reviews: [
      {
        rating: 5,
        text: "The oud night on Thursday was magic. Get there early for a table.",
        authorName: "Mona G.",
        relativePublishTimeDescription: "2 weeks ago",
        publishTime: "2026-09-12T20:00:00.000Z",
      },
      {
        rating: 4,
        text: "Great lineup, the sound system could be better near the back.",
        authorName: "Pierre L.",
        relativePublishTimeDescription: "a month ago",
        publishTime: "2026-08-22T20:00:00.000Z",
      },
    ],
  }),
  place({
    placeId: PLACE.anwarSeafood,
    name: "Anwar Seafood",
    address: "Anfoushi, El Gomrok, Alexandria, Egypt",
    latitude: 31.2135,
    longitude: 29.885,
    types: ["restaurant", "seafood_restaurant", "food"],
    rating: 4.6,
    userRatingCount: 2310,
    phone: "+20 3 480 2211",
    website: null,
    weekdayDescriptions: hours("12:00 PM", "1:00 AM"),
    reviews: [
      {
        rating: 5,
        text: "Pick your fish at the counter, they grill it in front of you. Sayadeya rice is perfect.",
        authorName: "Hossam R.",
        relativePublishTimeDescription: "3 days ago",
        publishTime: "2026-09-25T14:00:00.000Z",
      },
      {
        rating: 4,
        text: "Busy on Fridays, but worth the wait for the sea view upstairs.",
        authorName: "Anna K.",
        relativePublishTimeDescription: "a month ago",
        publishTime: "2026-08-28T14:00:00.000Z",
      },
    ],
  }),
  place({
    placeId: PLACE.stanleyYoga,
    name: "Stanley Yoga Studio",
    address: "Stanley Bridge Corniche, Alexandria, Egypt",
    latitude: 31.2335,
    longitude: 29.9489,
    types: ["gym", "health", "point_of_interest"],
    rating: 4.9,
    userRatingCount: 142,
    phone: "+20 12 2233 9900",
    website: "https://stanleyyoga.example.com",
    weekdayDescriptions: hours("6:30 AM", "9:00 PM", ["Friday"]),
    reviews: [
      {
        rating: 5,
        text: "Sunrise class facing the sea is the best start to any day.",
        authorName: "Nourhan S.",
        relativePublishTimeDescription: "2 weeks ago",
        publishTime: "2026-09-13T06:30:00.000Z",
      },
    ],
  }),
  place({
    placeId: PLACE.morsyPharmacy,
    name: "Morsy 24h Pharmacy",
    address: "El Gomhoreya St, Qena, Egypt",
    latitude: 26.164,
    longitude: 32.727,
    types: ["pharmacy", "health", "store"],
    rating: 4.4,
    userRatingCount: 318,
    phone: "+20 96 533 4400",
    website: null,
    weekdayDescriptions: hours("", "").map((d) =>
      d.replace(/: .*/, ": Open 24 hours"),
    ),
    reviews: [
      {
        rating: 5,
        text: "Only place open at 3am when my son had a fever. Pharmacist was calm and helpful.",
        authorName: "Mohamed T.",
        relativePublishTimeDescription: "a month ago",
        publishTime: "2026-08-30T03:00:00.000Z",
      },
    ],
  }),
  place({
    placeId: PLACE.redSeaDivers,
    name: "Red Sea Divers Hurghada",
    address: "Sheraton Road, Sakkala, Hurghada, Egypt",
    latitude: 27.232,
    longitude: 33.842,
    types: ["travel_agency", "tourist_attraction", "point_of_interest"],
    rating: 4.8,
    userRatingCount: 876,
    phone: "+20 10 9090 3344",
    website: "https://redseadivers.example.com",
    weekdayDescriptions: hours("7:00 AM", "6:00 PM"),
    reviews: [
      {
        rating: 5,
        text: "Did my PADI Open Water here. Instructors were patient and the reefs at Giftun are unreal.",
        authorName: "Lukas M.",
        relativePublishTimeDescription: "2 weeks ago",
        publishTime: "2026-09-14T09:00:00.000Z",
      },
      {
        rating: 5,
        text: "Well-maintained gear and small groups. Saw a turtle on the second dive!",
        authorName: "Sofia P.",
        relativePublishTimeDescription: "a month ago",
        publishTime: "2026-08-19T09:00:00.000Z",
      },
    ],
  }),
  place({
    placeId: PLACE.dahar,
    name: "El Dahar Fish Grill",
    address: "El Dahar Market St, Hurghada, Egypt",
    latitude: 27.264,
    longitude: 33.812,
    types: ["restaurant", "food"],
    rating: 4.5,
    userRatingCount: 654,
    phone: "+20 65 354 7788",
    website: null,
    weekdayDescriptions: hours("1:00 PM", "12:00 AM"),
    reviews: [
      {
        rating: 5,
        text: "Local prices, huge portions, fish straight from the market next door.",
        authorName: "Omar F.",
        relativePublishTimeDescription: "a week ago",
        publishTime: "2026-09-21T19:00:00.000Z",
      },
    ],
  }),
  place({
    placeId: PLACE.naamaBeach,
    name: "Naama Bay Beach Club",
    address: "Naama Bay Promenade, Sharm El Sheikh, Egypt",
    latitude: 27.9135,
    longitude: 34.329,
    types: ["beach", "bar", "point_of_interest"],
    rating: 4.3,
    userRatingCount: 1502,
    phone: "+20 69 360 1122",
    website: "https://naamabeachclub.example.com",
    weekdayDescriptions: hours("9:00 AM", "11:00 PM"),
    reviews: [
      {
        rating: 4,
        text: "Clean sunbeds, decent cocktails, snorkeling right off the jetty.",
        authorName: "Emma H.",
        relativePublishTimeDescription: "3 weeks ago",
        publishTime: "2026-09-06T12:00:00.000Z",
      },
    ],
  }),
  place({
    placeId: PLACE.akhmimTextiles,
    name: "Reem Tailoring & Akhmim Textiles",
    address: "Akhmim, Sohag, Egypt",
    latitude: 26.563,
    longitude: 31.745,
    types: ["clothing_store", "store"],
    rating: 4.8,
    userRatingCount: 97,
    phone: "+20 11 4455 2211",
    website: null,
    weekdayDescriptions: hours("10:00 AM", "9:00 PM", ["Friday"]),
    reviews: [
      {
        rating: 5,
        text: "Hand-woven Akhmim cotton, and she tailored a galabeya for me in two days.",
        authorName: "Fatma A.",
        relativePublishTimeDescription: "a month ago",
        publishTime: "2026-08-26T11:00:00.000Z",
      },
    ],
  }),
  place({
    placeId: PLACE.abuDabbab,
    name: "Abu Dabbab Snorkel Trips",
    address: "Abu Dabbab Bay, Marsa Alam, Egypt",
    latitude: 25.338,
    longitude: 34.738,
    types: ["tourist_attraction", "travel_agency"],
    rating: 4.9,
    userRatingCount: 733,
    phone: "+20 12 8877 6655",
    website: null,
    weekdayDescriptions: hours("7:30 AM", "4:00 PM"),
    reviews: [
      {
        rating: 5,
        text: "Swam next to a dugong. A DUGONG. Guides know exactly where to look.",
        authorName: "Mia T.",
        relativePublishTimeDescription: "2 weeks ago",
        publishTime: "2026-09-15T08:00:00.000Z",
      },
      {
        rating: 5,
        text: "Green turtles everywhere, and they handled the kids really well.",
        authorName: "David C.",
        relativePublishTimeDescription: "a month ago",
        publishTime: "2026-08-24T08:00:00.000Z",
      },
    ],
  }),
  place({
    placeId: PLACE.ironTemple,
    name: "Iron Temple Gym",
    address: "Abtal El Tahrir St, Aswan, Egypt",
    latitude: 24.0935,
    longitude: 32.9032,
    types: ["gym", "health", "point_of_interest"],
    rating: 4.6,
    userRatingCount: 188,
    phone: "+20 10 1500 4321",
    website: null,
    weekdayDescriptions: hours("5:00 AM", "11:00 PM"),
    reviews: [
      {
        rating: 5,
        text: "Real barbells, real chalk, no mirrors-and-selfies vibe. Love it.",
        authorName: "Youssef H.",
        relativePublishTimeDescription: "a week ago",
        publishTime: "2026-09-21T05:00:00.000Z",
      },
    ],
  }),
];

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

export const SEED_USERS_MORE: SeedUser[] = [
  // Cairo
  {
    name: "Laila Mahmoud",
    username: "laila",
    email: "laila@qura.dev",
    bio: "Product designer, coworking evangelist, and full-time Zamalek resident. Coffee first, meetings later.",
  },
  {
    name: "Hazem Tawfik",
    username: "hazem",
    email: "hazem@qura.dev",
    bio: "English teacher for 11 years. IELTS, conversation clubs, and way too many grammar memes.",
  },
  {
    name: "Mariam Soliman",
    username: "mariam",
    email: "mariam@qura.dev",
    bio: "بساعد الناس تلاقي شقة في القاهرة من غير وجع دماغ. التجمع، مدينة نصر، والمعادي.",
  },
  {
    name: "Tarek Gamal",
    username: "tarek",
    email: "tarek@qura.dev",
    bio: "Booking live music in downtown Cairo. If there's an oud involved, I'm probably there.",
  },
  // Alexandria
  {
    name: "Sherif Anwar",
    username: "sherif",
    email: "sherif@qura.dev",
    bio: "صياد ابن صياد، وفاتح مطعم سمك في الأنفوشي. السمك النهاردة طازة، زي كل يوم.",
  },
  {
    name: "Aya Mostafa",
    username: "aya",
    email: "aya@qura.dev",
    bio: "Yoga teacher on the Stanley Corniche. Breathe in the sea air, breathe out the traffic.",
  },
  {
    name: "Bassem Wahba",
    username: "bassem",
    email: "bassem@qura.dev",
    bio: "Organizing beach cleanups and a Friday second-hand market. Alexandria deserves clean beaches.",
  },
  // Qena
  {
    name: "Hany Morsy",
    username: "hany",
    email: "hany@qura.dev",
    bio: "صيدلي في قنا، الصيدلية فاتحة 24 ساعة. اسألني قبل ما تاخد أي دوا.",
  },
  {
    name: "Eman Ragab",
    username: "eman",
    email: "eman@qura.dev",
    bio: "Teacher and potter near Dendera. Mud on my hands most afternoons.",
  },
  // Hurghada
  {
    name: "Rami Fouad",
    username: "rami",
    email: "rami@qura.dev",
    bio: "PADI instructor, 2,000+ dives in the Red Sea and still not bored of it.",
  },
  {
    name: "Sara Halim",
    username: "sara",
    email: "sara@qura.dev",
    bio: "Running my dad's fish grill in El Dahar and renting apartments near the marina on the side.",
  },
  // Sharm El Sheikh
  {
    name: "Khaled Samir",
    username: "khaled",
    email: "khaled@qura.dev",
    bio: "Paramedic and first-aid trainer in Sharm. If you're hiking Sinai, talk to me first.",
  },
  {
    name: "Lina Barakat",
    username: "lina",
    email: "lina@qura.dev",
    bio: "Beach club manager in Naama Bay. Sunsets are part of the job description.",
  },
  // Sohag
  {
    name: "Mahmoud Saad",
    username: "mahmoud",
    email: "mahmoud@qura.dev",
    bio: "ميكانيكي وكاوتش في سوهاج من 20 سنة. العربية بتاعتك في أمان.",
  },
  {
    name: "Reem Adel",
    username: "reem",
    email: "reem@qura.dev",
    bio: "Tailor and textile lover from Akhmim. Every thread has a story.",
  },
  // Marsa Alam
  {
    name: "Ziad Noureldin",
    username: "ziad",
    email: "ziad@qura.dev",
    bio: "Running an eco lodge south of Marsa Alam. Solar power, desert silence, zero plastic.",
  },
  {
    name: "Hala Emad",
    username: "hala",
    email: "hala@qura.dev",
    bio: "Marine biologist turned snorkel guide. Ask me anything about dugongs.",
  },
];

// ---------------------------------------------------------------------------
// Businesses
// ---------------------------------------------------------------------------

export const SEED_BUSINESSES_MORE: SeedBusiness[] = [
  // Aswan — categories the original set didn't cover
  {
    owner: "walid",
    name: "Walid Web Studio",
    username: "walidweb",
    bio: "Websites, online menus, and booking pages for Aswan's small businesses.",
    block: {
      category: "professional-services",
      city: "aswan",
      data: {
        details:
          "Simple, fast websites for local businesses — menus, booking forms, and Google Maps setup included. Fixed prices, no monthly surprises.",
        location: { description: "Remote, meetings anywhere in central Aswan." },
        phones: ["+20 10 1777 8899"],
        socialLinks: ["https://github.com/walidweb", "https://walidweb.example.com"],
      },
    },
  },
  {
    owner: "sami",
    name: "Iron Temple Gym",
    username: "irontemple",
    bio: "Barbells, chalk, and coaches who actually watch your form.",
    block: {
      category: "lifestyle",
      city: "aswan",
      googlePlaceId: PLACE.ironTemple,
      data: {
        details:
          "Powerlifting platforms, free weights, and small-group strength classes. Women-only hours daily 10am–1pm. Day passes available.",
        location: {
          description: "Abtal El Tahrir St, above the bank, Aswan.",
          lat: 24.0935,
          lng: 32.9032,
        },
        phones: ["+20 10 1500 4321"],
        socialLinks: ["https://instagram.com/irontemplegym"],
      },
    },
  },
  {
    owner: "nadia",
    name: "Aswan Night Emergency Line",
    username: "aswanemergency",
    bio: "Volunteer-run list of night pharmacies, ambulance numbers, and on-call doctors in Aswan.",
    block: {
      category: "emergency",
      city: "aswan",
      data: {
        details:
          "Ambulance: 123. Police: 122. Fire: 180. We keep an updated list of pharmacies open overnight and on-call clinics — call or WhatsApp us anytime.",
        location: { description: "Citywide, Aswan." },
        phones: ["123", "+20 10 1999 0000"],
      },
    },
  },
  {
    owner: "yasmine",
    name: "Aswan Photo Walks",
    username: "aswanphotowalks",
    bio: "Monthly photography walks through Aswan — all levels, all cameras (phones too).",
    block: {
      category: "events",
      city: "aswan",
      data: {
        details:
          "First Friday of every month: a two-hour golden-hour walk from the Corniche to the Nubian village, with tips along the way. Free for beginners.",
        location: {
          description: "Meeting point: Corniche El Nil, in front of the Old Cataract.",
          lat: 24.0799,
          lng: 32.8889,
        },
      },
    },
  },
  // Luxor
  {
    owner: "nour",
    name: "Luxor English & French Club",
    username: "luxorlanguages",
    bio: "Conversation classes for guides, drivers, and anyone working with visitors.",
    block: {
      category: "education",
      city: "luxor",
      data: {
        details:
          "Evening conversation groups in English and French, small classes, practical vocabulary for tourism work. New groups start every month.",
        location: {
          description: "Television St, Luxor — second floor above the bookshop.",
          lat: 25.6963,
          lng: 32.6421,
        },
        phones: ["+20 10 8765 4321"],
      },
    },
  },
  {
    owner: "youssef",
    name: "Luxor Community Food Bank",
    username: "luxorfoodbank",
    bio: "بنجمع تبرعات أكل ونوزعها على الأسر اللي محتاجة في الأقصر كل أسبوع.",
    block: {
      category: "community",
      city: "luxor",
      data: {
        details:
          "توزيع أسبوعي يوم الخميس. محتاجين متطوعين للتعبئة والتوصيل — أي مساعدة بتفرق.",
        location: { description: "شارع المحطة، الأقصر — جنب مدرسة الصنايع." },
        phones: ["+20 10 1122 9988"],
      },
    },
  },
  // Cairo
  {
    owner: "laila",
    name: "Zamalek Hub Coworking",
    username: "zamalekhub",
    bio: "Desks, meeting rooms, and a Nile-view balcony in the heart of Zamalek.",
    block: {
      category: "professional-services",
      city: "cairo",
      googlePlaceId: PLACE.zamalekHub,
      data: {
        details:
          "Hot desks, dedicated desks, and private offices. 1Gbps fiber, backup power, phone booths, and free coffee. Day passes from 250 EGP.",
        location: {
          description: "26th of July St, Zamalek — 4th floor.",
          lat: 30.0626,
          lng: 31.2197,
        },
        phones: ["+20 2 2735 1100"],
        socialLinks: [
          "https://instagram.com/zamalekhub",
          "https://linkedin.com/company/zamalekhub",
        ],
      },
    },
  },
  {
    owner: "laila",
    name: "Cairo Tech Jobs",
    username: "cairotechjobs",
    bio: "Hand-picked tech and design jobs in Cairo, posted every Sunday.",
    block: {
      category: "jobs",
      city: "cairo",
      data: {
        details:
          "Hiring? Send us the role and we'll post it for free if it lists a salary range. Currently featuring: 3 frontend roles, 2 product designers, 1 data analyst.",
        location: { description: "Online — Cairo-based roles only." },
        socialLinks: ["https://linkedin.com/company/cairotechjobs"],
      },
    },
  },
  {
    owner: "hazem",
    name: "Hazem English Academy",
    username: "hazemenglish",
    bio: "IELTS prep, business English, and conversation clubs in Heliopolis.",
    block: {
      category: "education",
      city: "cairo",
      data: {
        details:
          "Small groups (max 8), placement test on day one, and weekly speaking clubs. IELTS average band improvement: 1.5 in 8 weeks.",
        location: {
          description: "Heliopolis, near Korba — Baghdad St.",
          lat: 30.0911,
          lng: 31.3222,
        },
        phones: ["+20 11 2233 4455"],
        socialLinks: ["https://facebook.com/hazemenglish"],
      },
    },
  },
  {
    owner: "mariam",
    name: "Soliman Homes",
    username: "solimanhomes",
    bio: "شقق للإيجار والبيع في التجمع ومدينة نصر والمعادي — كل الإعلانات متشافة بنفسنا.",
    block: {
      category: "real-estate",
      city: "cairo",
      data: {
        details:
          "إيجار وتمليك، مفروش وفاضي. كل شقة بنعاينها بنفسنا قبل ما ننزلها، ومن غير عمولة مخفية.",
        location: {
          description: "التجمع الخامس، شارع التسعين الشمالي.",
          lat: 30.0074,
          lng: 31.4913,
        },
        phones: ["+20 10 3030 4040"],
      },
    },
  },
  {
    owner: "tarek",
    name: "Downtown Cairo Nights",
    username: "downtownnights",
    bio: "Live oud, jazz, and indie bands — five nights a week off Talaat Harb.",
    block: {
      category: "events",
      city: "cairo",
      googlePlaceId: PLACE.downtownNights,
      data: {
        details:
          "Tue: open mic. Wed: jazz trio. Thu: oud night. Fri–Sat: local indie bands. Doors at 7pm, shows at 9pm. Tickets at the door or on Instagram.",
        location: {
          description: "Talaat Harb Square, Downtown — the green door next to the bookstore.",
          lat: 30.0478,
          lng: 31.2386,
        },
        phones: ["+20 10 7788 1200"],
        socialLinks: ["https://instagram.com/downtowncaironights"],
      },
    },
  },
  // Alexandria
  {
    owner: "sherif",
    name: "Anwar Seafood",
    username: "anwarseafood",
    bio: "سمك طازة كل يوم من المينا، مشوي أو مقلي أو صيادية، قدام البحر.",
    block: {
      category: "food-drinks",
      city: "alexandria",
      googlePlaceId: PLACE.anwarSeafood,
      data: {
        cuisine: "Alexandrian seafood",
        priceRange: "$$",
        workingHours: {
          mon: [{ open: "12:00", close: "23:59" }],
          tue: [{ open: "12:00", close: "23:59" }],
          wed: [{ open: "12:00", close: "23:59" }],
          thu: [{ open: "12:00", close: "23:59" }],
          fri: [{ open: "12:00", close: "23:59" }],
          sat: [{ open: "12:00", close: "23:59" }],
          sun: [{ open: "12:00", close: "23:59" }],
        },
        deliveryAvailable: false,
        reservationsAvailable: true,
        location: {
          description: "الأنفوشي، قدام القلعة — الدور التاني فيه ترابيزات على البحر.",
          lat: 31.2135,
          lng: 29.885,
        },
        phones: ["+20 3 480 2211"],
      },
    },
  },
  {
    owner: "aya",
    name: "Stanley Yoga Studio",
    username: "stanleyyoga",
    bio: "Sea-view yoga classes for every level, right on the Stanley Corniche.",
    block: {
      category: "lifestyle",
      city: "alexandria",
      googlePlaceId: PLACE.stanleyYoga,
      data: {
        details:
          "Sunrise vinyasa, lunchtime stretch, evening yin. Mats provided. First class free — just show up 10 minutes early.",
        location: {
          description: "Stanley Corniche, next to the bridge — rooftop studio.",
          lat: 31.2335,
          lng: 29.9489,
        },
        phones: ["+20 12 2233 9900"],
        socialLinks: ["https://instagram.com/stanleyyoga"],
      },
    },
  },
  {
    owner: "bassem",
    name: "Alex Beach Cleanup Crew",
    username: "alexcleanup",
    bio: "Volunteers cleaning Alexandria's beaches every other Saturday. Gloves and bags provided.",
    block: {
      category: "community",
      city: "alexandria",
      data: {
        details:
          "Every other Saturday, 8–11am. We rotate beaches — Sidi Bishr, Miami, Mamoura. Families welcome, certificates for students.",
        location: { description: "Rotating beaches — check our latest post for the spot." },
        socialLinks: ["https://facebook.com/alexcleanupcrew"],
      },
    },
  },
  {
    owner: "bassem",
    name: "Mansheya Friday Market",
    username: "mansheyamarket",
    bio: "Second-hand books, vinyl, furniture, and vintage finds every Friday morning.",
    block: {
      category: "marketplace",
      city: "alexandria",
      data: {
        details:
          "Around 60 stalls every Friday 9am–2pm. Want a stall? Message us by Wednesday — 100 EGP, proceeds fund the beach cleanups.",
        location: {
          description: "Mansheya Square, behind the Unknown Soldier memorial.",
          lat: 31.1985,
          lng: 29.896,
        },
      },
    },
  },
  // Qena
  {
    owner: "hany",
    name: "Morsy 24h Pharmacy",
    username: "morsypharmacy",
    bio: "صيدلية فاتحة 24 ساعة في قنا، وبنوصل للبيت.",
    block: {
      category: "health",
      city: "qena",
      googlePlaceId: PLACE.morsyPharmacy,
      data: {
        specialty: "Community pharmacy",
        clinicAddress: "شارع الجمهورية، قنا",
        workingHours: {
          mon: [{ open: "00:00", close: "23:59" }],
          tue: [{ open: "00:00", close: "23:59" }],
          wed: [{ open: "00:00", close: "23:59" }],
          thu: [{ open: "00:00", close: "23:59" }],
          fri: [{ open: "00:00", close: "23:59" }],
          sat: [{ open: "00:00", close: "23:59" }],
          sun: [{ open: "00:00", close: "23:59" }],
        },
        acceptsInsurance: true,
        appointmentPhone: "+20 96 533 4400",
        location: {
          description: "شارع الجمهورية، قنا — قصاد البنك الأهلي.",
          lat: 26.164,
          lng: 32.727,
        },
        phones: ["+20 96 533 4400"],
      },
    },
  },
  {
    owner: "eman",
    name: "Dendera Pottery Workshop",
    username: "denderapottery",
    bio: "Hand-thrown pottery and weekend wheel classes near Dendera Temple.",
    block: {
      category: "creative",
      city: "qena",
      data: {
        details:
          "Saturday wheel classes for adults and kids, plus handmade plates, mugs, and qullas for sale. Custom orders take about two weeks.",
        location: {
          description: "Dendera village, 5 minutes from the temple entrance.",
          lat: 26.1418,
          lng: 32.67,
        },
        phones: ["+20 10 6655 4433"],
      },
    },
  },
  {
    owner: "eman",
    name: "Qena Paperwork Guide",
    username: "qenapaperwork",
    bio: "Free volunteer guide to government paperwork in Qena — IDs, certificates, and licenses.",
    block: {
      category: "government",
      city: "qena",
      data: {
        details:
          "Which office, which documents, and which days — plain-language checklists for national ID renewal, birth certificates, and driving licenses. Not an official government service.",
        location: { description: "Online, Qena governorate." },
      },
    },
  },
  // Hurghada
  {
    owner: "rami",
    name: "Red Sea Divers Hurghada",
    username: "redseadivers",
    bio: "PADI courses and daily dive trips to Giftun, Abu Ramada, and El Fanadir.",
    block: {
      category: "tourism",
      city: "hurghada",
      googlePlaceId: PLACE.redSeaDivers,
      data: {
        details:
          "Daily boat trips with 2 dives, lunch on board. Open Water in 4 days. Max 4 divers per guide. Nitrox available.",
        location: {
          description: "Sheraton Road, Sakkala — next to the marina entrance.",
          lat: 27.232,
          lng: 33.842,
        },
        phones: ["+20 10 9090 3344"],
        socialLinks: [
          "https://instagram.com/redseadivershrg",
          "https://wa.me/201090903344",
        ],
      },
    },
  },
  {
    owner: "sara",
    name: "El Dahar Fish Grill",
    username: "dahargrill",
    bio: "Family fish grill in old Hurghada since 1994 — the locals' seafood spot.",
    block: {
      category: "food-drinks",
      city: "hurghada",
      googlePlaceId: PLACE.dahar,
      data: {
        cuisine: "Red Sea grilled fish",
        priceRange: "$",
        deliveryAvailable: true,
        reservationsAvailable: false,
        location: {
          description: "El Dahar market street, Hurghada.",
          lat: 27.264,
          lng: 33.812,
        },
        phones: ["+20 65 354 7788"],
      },
    },
  },
  {
    owner: "sara",
    name: "Hurghada Marina Apartments",
    username: "marinaapartments",
    bio: "Furnished monthly rentals within walking distance of the marina.",
    block: {
      category: "real-estate",
      city: "hurghada",
      data: {
        details:
          "Studios and 1–2 bedroom apartments, monthly or longer. Wifi and AC in every unit, no agency fee for stays over 3 months.",
        location: {
          description: "Sheraton Road, 5 minutes' walk to Hurghada Marina.",
          lat: 27.2295,
          lng: 33.8435,
        },
        phones: ["+20 12 4545 6767"],
      },
    },
  },
  // Sharm El Sheikh
  {
    owner: "khaled",
    name: "Sharm Rescue & First Aid",
    username: "sharmrescue",
    bio: "First-aid courses and emergency guidance for divers, hikers, and hotels in Sharm.",
    block: {
      category: "emergency",
      city: "sharm-el-sheikh",
      data: {
        details:
          "Ambulance: 123. Hyperbaric chamber on call for divers. We run first-aid and CPR courses for hotel staff and dive centers every month.",
        location: {
          description: "Near Sharm International Hospital, Hay El Nour.",
          lat: 27.912,
          lng: 34.329,
        },
        phones: ["123", "+20 10 5050 1234"],
      },
    },
  },
  {
    owner: "lina",
    name: "Naama Bay Beach Club",
    username: "naamabeach",
    bio: "Sunbeds, snorkeling from the jetty, and sunset music on Naama Bay.",
    block: {
      category: "lifestyle",
      city: "sharm-el-sheikh",
      googlePlaceId: PLACE.naamaBeach,
      data: {
        details:
          "Day passes include a sunbed, towel, and one drink. Snorkel gear for rent. DJ sunset sessions Thursday to Saturday.",
        location: {
          description: "Naama Bay promenade, Sharm El Sheikh.",
          lat: 27.9135,
          lng: 34.329,
        },
        phones: ["+20 69 360 1122"],
        socialLinks: ["https://instagram.com/naamabeachclub"],
      },
    },
  },
  {
    owner: "lina",
    name: "Sinai Desert Safari",
    username: "sinaisafari",
    bio: "Quad bikes, Bedouin dinners, and stargazing in the Sinai desert.",
    block: {
      category: "tourism",
      city: "sharm-el-sheikh",
      data: {
        details:
          "Sunset quad tours, camel rides, and a Bedouin dinner under the stars. Hotel pickup from Naama Bay and Sharm El Maya.",
        location: { description: "Desert camp, 20 minutes from Naama Bay — pickup included." },
        phones: ["+20 10 6060 7070"],
      },
    },
  },
  // Sohag
  {
    owner: "mahmoud",
    name: "Saad Tire & Auto",
    username: "saadauto",
    bio: "كاوتش، زيت، وميكانيكا عامة في سوهاج — أسعار واضحة من الأول.",
    block: {
      category: "automotive",
      city: "sohag",
      data: {
        details:
          "تغيير كاوتش وزيت، ضبط زوايا، وكشف كمبيوتر. شغالين من 8 الصبح لحد 10 بالليل ما عدا الجمعة.",
        location: {
          description: "طريق سوهاج – أخميم، جنب محطة البنزين.",
          lat: 26.556,
          lng: 31.695,
        },
        phones: ["+20 10 2020 3030"],
      },
    },
  },
  {
    owner: "reem",
    name: "Reem Tailoring & Akhmim Textiles",
    username: "akhmimtextiles",
    bio: "Hand-woven Akhmim cotton and made-to-measure tailoring.",
    block: {
      category: "shopping",
      city: "sohag",
      googlePlaceId: PLACE.akhmimTextiles,
      data: {
        details:
          "Hand-woven tablecloths, scarves, and fabric by the meter from Akhmim's looms. Tailoring for galabeyas, dresses, and suits.",
        location: {
          description: "Akhmim old market, Sohag.",
          lat: 26.563,
          lng: 31.745,
        },
        phones: ["+20 11 4455 2211"],
        socialLinks: ["https://instagram.com/akhmimtextiles"],
      },
    },
  },
  {
    owner: "reem",
    name: "Sohag Tutoring Center",
    username: "sohagtutoring",
    bio: "Thanaweya Amma tutoring in math, physics, and English.",
    block: {
      category: "education",
      city: "sohag",
      data: {
        details:
          "Evening groups for secondary school students, max 12 per class. Monthly mock exams with full solutions.",
        location: {
          description: "Downtown Sohag, near the university gate.",
          lat: 26.5591,
          lng: 31.6957,
        },
        phones: ["+20 10 8080 9090"],
      },
    },
  },
  // Marsa Alam
  {
    owner: "hala",
    name: "Abu Dabbab Snorkel Trips",
    username: "abudabbab",
    bio: "Guided snorkeling with turtles and (if you're lucky) dugongs at Abu Dabbab Bay.",
    block: {
      category: "tourism",
      city: "marsa-alam",
      googlePlaceId: PLACE.abuDabbab,
      data: {
        details:
          "Morning trips with a marine biologist guide, small groups, reef-safe sunscreen only. Kids 8+ welcome.",
        location: {
          description: "Abu Dabbab Bay beach entrance, north of Marsa Alam.",
          lat: 25.338,
          lng: 34.738,
        },
        phones: ["+20 12 8877 6655"],
      },
    },
  },
  {
    owner: "ziad",
    name: "Wadi Gimal Eco Lodge",
    username: "wadigimallodge",
    bio: "Solar-powered desert lodge between the mountains and the sea.",
    block: {
      category: "lifestyle",
      city: "marsa-alam",
      data: {
        details:
          "12 stone huts, solar power, and zero single-use plastic. Stargazing nights, desert hikes, and a house reef 10 minutes away.",
        location: {
          description: "Wadi El Gemal road, 45 km south of Marsa Alam.",
          lat: 24.6765,
          lng: 35.0931,
        },
        phones: ["+20 10 3131 4141"],
      },
    },
  },
  {
    owner: "ziad",
    name: "Marsa Alam Resort Jobs",
    username: "marsaalamjobs",
    bio: "Hospitality, diving, and kitchen jobs at resorts along the southern Red Sea coast.",
    block: {
      category: "jobs",
      city: "marsa-alam",
      data: {
        details:
          "Now hiring: 2 dive guides, 1 sous chef, 3 front desk agents (English + German a plus). Accommodation and meals included.",
        location: { description: "Resorts between Port Ghalib and Hamata." },
        phones: ["+20 10 3131 4142"],
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Threads
// ---------------------------------------------------------------------------

export const SEED_THREADS_MORE: SeedThread[] = [
  // Aswan extras
  {
    author: "yasmine",
    body: "Photo walk this Friday at golden hour — meeting in front of the Old Cataract at 5pm. Phones welcome, no fancy camera needed. Who's in?",
    category: "together",
    images: [IMG.desert],
    replies: [
      { author: "ines", body: "In! Bringing my sister too" },
      { author: "marwa", body: "Count me in, finally testing my new lens" },
      { author: "fady", body: "I can take the group across to the Nubian village after, sunset from the water is the best angle" },
    ],
    savedBy: ["ines", "marwa", "salma"],
    upvotedBy: ["ines", "marwa", "fady", "adel"],
  },
  {
    author: "nadia",
    body: "Heat alert: 46°C expected tomorrow. Stay out of direct sun 12–4pm, drink water before you're thirsty, and check on older neighbors. Night pharmacies list is on @aswanemergency.",
    category: "alert",
    savedBy: ["walid", "salma", "rania"],
    upvotedBy: ["walid", "salma", "rania", "yasmine", "omar", "sami"],
    replies: [{ author: "omar", body: "And please don't leave kids or pets in parked cars, not even for 5 minutes" }],
  },
  {
    author: "sami",
    body: "Iron Temple is opening women-only hours every day 10am–1pm starting next week, with a female coach. First week free for new members.",
    category: "announcement",
    upvotedBy: ["rania", "nadia", "ines"],
    replies: [{ author: "rania", body: "Finally!! Sending this to all my clients" }],
  },
  {
    author: "walid",
    body: "Offering free websites for 3 small Aswan businesses this month — menu, map, and a WhatsApp button. Just reply with your business name.",
    category: "offer",
    savedBy: ["salma", "ines"],
    upvotedBy: ["salma", "ines", "fady"],
    replies: [
      { author: "salma", body: "Aswan Corner Market would love one!" },
      { author: "fady", body: "Philae Docks Boat Co. please 🙏" },
    ],
  },
  // Luxor extras
  {
    author: "youssef",
    body: "بنك الطعام محتاج 10 متطوعين يوم الخميس الجاي للتعبئة من 4 لـ 7 المغرب. اللي يقدر يكتب هنا.",
    city: "luxor",
    category: "together",
    savedBy: ["nour", "karim"],
    upvotedBy: ["nour", "karim", "mostafa", "dina"],
    replies: [
      { author: "nour", body: "أنا وصاحبتي جايين" },
      { author: "karim", body: "هاجي بعد الرحلة الأخيرة، حوالي 5" },
    ],
  },
  {
    author: "nour",
    body: "New French conversation group for guides starts Sunday — 8 spots left. Tuesdays and Sundays, 7pm.",
    city: "luxor",
    category: "announcement",
    upvotedBy: ["mostafa", "heba"],
  },
  // Cairo
  {
    author: "laila",
    body: "Zamalek Hub is 3 years old today 🎉 Free day passes for anyone who drops by this Thursday, plus cake at 5pm on the balcony.",
    city: "cairo",
    category: "announcement",
    images: [IMG.interior],
    savedBy: ["hazem", "tarek"],
    upvotedBy: ["hazem", "tarek", "mariam"],
    replies: [
      { author: "tarek", body: "Happy birthday! I'll bring the band for a short set" },
      { author: "hazem", body: "Coming with my whole IELTS group, sorry in advance" },
    ],
  },
  {
    author: "mariam",
    body: "حد يعرف مكان كويس يصلح تكييف في مدينة نصر؟ التكييف بقاله يومين بيطلع هوا سخن.",
    city: "cairo",
    category: "question",
    replies: [
      { author: "laila", body: "في واحد اسمه عم صلاح في عباس العقاد، هبعتلك رقمه" },
      { author: "tarek", body: "اتأكدي إنهم يشحنوا فريون قدامك، في ناس بتضحك على الزباين" },
    ],
    upvotedBy: ["laila"],
  },
  {
    author: "tarek",
    body: "Oud night this Thursday at Downtown Cairo Nights — three players, one stage, no microphones for the first set. 9pm sharp.",
    city: "cairo",
    category: "offer",
    images: [IMG.table],
    savedBy: ["laila", "mariam"],
    upvotedBy: ["laila", "mariam", "hazem"],
  },
  {
    author: "hazem",
    body: "Traffic alert: Ring Road near Autostrad is completely blocked after an accident. Use Salah Salem if you're heading to Heliopolis.",
    city: "cairo",
    category: "alert",
    upvotedBy: ["laila", "mariam", "tarek"],
    replies: [{ author: "mariam", body: "Thanks, just rerouted. Salah Salem is moving slowly but moving" }],
  },
  {
    author: "laila",
    body: "Finally tried koshary at the place behind Tahrir everyone keeps talking about. Crispy onions on point, the daqqa is dangerously good.",
    city: "cairo",
    category: "experience",
    images: [IMG.food],
    upvotedBy: ["tarek"],
  },
  // Alexandria
  {
    author: "bassem",
    body: "Beach cleanup this Saturday at Sidi Bishr, 8–11am. Last time we collected 140 kg of plastic in three hours. Gloves and bags on us.",
    city: "alexandria",
    category: "together",
    images: [IMG.desert],
    savedBy: ["aya", "sherif"],
    upvotedBy: ["aya", "sherif"],
    replies: [
      { author: "aya", body: "I'll run a free stretching session for everyone after 🧘" },
      { author: "sherif", body: "Fish lunch on me for the volunteers after" },
    ],
  },
  {
    author: "sherif",
    body: "النهاردة جالنا دنيس وبوري طازة من المينا الصبح. الصيادية جاهزة من الساعة 1.",
    city: "alexandria",
    category: "offer",
    images: [IMG.food],
    upvotedBy: ["bassem", "aya"],
  },
  {
    author: "aya",
    body: "Winter storm warning (نوة) expected this weekend — waves over the Corniche wall near Stanley. Please don't stand at the edge for photos.",
    city: "alexandria",
    category: "alert",
    upvotedBy: ["bassem", "sherif"],
    savedBy: ["bassem"],
  },
  {
    author: "bassem",
    body: "Found at the Friday market today: a 1970s Umm Kulthum vinyl in perfect condition for 150 EGP. This is why I get up early.",
    city: "alexandria",
    category: "experience",
    replies: [{ author: "aya", body: "Jealous!! Save me the next one" }],
  },
  // Qena
  {
    author: "hany",
    body: "تنبيه: في دوا ضغط مغشوش بيتباع في بعض الأماكن. اتأكد من رقم التشغيلة والكرتونة قبل ما تشتري، ولو شاكك تعالى الصيدلية نشوفه معاك.",
    city: "qena",
    category: "alert",
    savedBy: ["eman"],
    upvotedBy: ["eman"],
  },
  {
    author: "eman",
    body: "Kids' pottery class this Saturday at the workshop near Dendera — they take home what they make. 6 spots left.",
    city: "qena",
    category: "offer",
    images: [IMG.table],
    replies: [{ author: "hany", body: "حجزت لبنتي، شكراً" }],
  },
  {
    author: "eman",
    body: "Visited Dendera Temple at opening time — had the Hathor ceiling almost to myself. The colors are still unbelievable.",
    city: "qena",
    category: "experience",
    upvotedBy: ["hany"],
  },
  // Hurghada
  {
    author: "rami",
    body: "Visibility at Giftun was 30m+ this morning, and we had a pod of dolphins follow the boat back. Two spots left on tomorrow's trip.",
    city: "hurghada",
    category: "offer",
    images: [IMG.desert],
    savedBy: ["sara"],
    upvotedBy: ["sara"],
    replies: [{ author: "sara", body: "Booking my cousin, he's visiting from Cairo!" }],
  },
  {
    author: "sara",
    body: "Anyone know a reliable AC technician in Hurghada? Two of our apartments need servicing before the new tenants arrive.",
    city: "hurghada",
    category: "question",
    replies: [{ author: "rami", body: "The guy who does our dive center is great, sending you his number" }],
  },
  {
    author: "rami",
    body: "Strong wind warning: port authority closed the harbor for small boats today. All trips moved to tomorrow, refunds available.",
    city: "hurghada",
    category: "alert",
    upvotedBy: ["sara"],
  },
  // Sharm El Sheikh
  {
    author: "khaled",
    body: "Free first-aid & CPR session for dive center and hotel staff next Tuesday, 6pm. Certificates included. Share with your team.",
    city: "sharm-el-sheikh",
    category: "announcement",
    savedBy: ["lina"],
    upvotedBy: ["lina"],
    replies: [{ author: "lina", body: "Signing up our whole beach team" }],
  },
  {
    author: "lina",
    body: "Sunset over Tiran from the jetty tonight was ridiculous. This job has its perks.",
    city: "sharm-el-sheikh",
    category: "experience",
    images: [IMG.wedding],
    upvotedBy: ["khaled"],
  },
  {
    author: "khaled",
    body: "Hiking Mount Sinai for sunrise? Bring a real jacket — it's close to 0°C at the top even when Sharm is 30°C.",
    city: "sharm-el-sheikh",
    category: "alert",
    savedBy: ["lina"],
  },
  // Sohag
  {
    author: "mahmoud",
    body: "قبل ما تسافر بالعربية في الحر، افحص ضغط الكاوتش وهو بارد. الكاوتش اللي ضغطه واطي هو أكتر حاجة بتفرقع على الطريق الصحراوي.",
    city: "sohag",
    category: "alert",
    upvotedBy: ["reem"],
  },
  {
    author: "reem",
    body: "New Akhmim tablecloths just came off the loom — natural cotton, hand-woven patterns. Three colors, limited pieces.",
    city: "sohag",
    category: "offer",
    images: [IMG.livingRoom],
    savedBy: ["mahmoud"],
    replies: [{ author: "mahmoud", body: "مراتي عايزة الأزرق، هعدي بكرة" }],
  },
  {
    author: "reem",
    body: "Is the Red Monastery open for visitors on Fridays? Planning a trip with some friends from Cairo.",
    city: "sohag",
    category: "question",
    replies: [{ author: "mahmoud", body: "أيوه مفتوح، بس روحوا بدري قبل الزحمة" }],
  },
  // Marsa Alam
  {
    author: "hala",
    body: "Dugong sighting at Abu Dabbab this morning! Please keep 5+ meters away, don't chase it, and never touch the seagrass.",
    city: "marsa-alam",
    category: "experience",
    images: [IMG.desert],
    savedBy: ["ziad"],
    upvotedBy: ["ziad"],
    replies: [{ author: "ziad", body: "Best news all week" }],
  },
  {
    author: "ziad",
    body: "We're hiring 2 dive guides and a sous chef for the season — housing and meals included. DM @marsaalamjobs.",
    city: "marsa-alam",
    category: "announcement",
    upvotedBy: ["hala"],
  },
  {
    author: "hala",
    body: "Stargazing night at the eco lodge this Saturday — no moon, Milky Way from horizon to horizon. Carpooling from Marsa Alam at 7pm.",
    city: "marsa-alam",
    category: "together",
    savedBy: ["ziad"],
  },
  {
    // A deliberately off-topic post, downvoted into the "marked
    // unhelpful" state in a city other than Aswan too.
    author: "ziad",
    body: "Monday again. Why.",
    city: "marsa-alam",
    downvotedBy: ["hala", "rami", "khaled", "lina"],
    upvotedBy: ["sara"],
  },
];

// ---------------------------------------------------------------------------
// Follows, reviews, reports, claim conflicts
// ---------------------------------------------------------------------------

export const SEED_FOLLOWS_MORE: [string, string][] = [
  ["laila", "tarek"],
  ["tarek", "laila"],
  ["hazem", "laila"],
  ["mariam", "laila"],
  ["mariam", "hazem"],
  ["aya", "bassem"],
  ["bassem", "aya"],
  ["sherif", "bassem"],
  ["eman", "hany"],
  ["hany", "eman"],
  ["sara", "rami"],
  ["rami", "sara"],
  ["lina", "khaled"],
  ["khaled", "lina"],
  ["reem", "mahmoud"],
  ["mahmoud", "reem"],
  ["hala", "ziad"],
  ["ziad", "hala"],
  // Cross-city — people follow friends and travel
  ["yasmine", "laila"],
  ["laila", "yasmine"],
  ["adel", "rami"],
  ["rami", "hala"],
  ["hala", "rami"],
  ["heba", "lina"],
  ["mostafa", "eman"],
  ["walid", "laila"],
  ["tarek", "bassem"],
  ["sami", "aya"],
];

// [businessUsername, reviewerUsername, rating, body] — never the owner.
export const SEED_REVIEWS_MORE: [string, string, number, string][] = [
  ["walidweb", "salma", 5, "Built our shop's page in two days and taught me how to update prices myself."],
  ["walidweb", "fady", 4, "Great work, took an extra week because of my own delays."],
  ["irontemple", "omar", 5, "Proper strength gym. Coaches fixed my squat in one session."],
  ["irontemple", "rania", 5, "Women-only hours are a game changer."],
  ["irontemple", "walid", 4, "Great equipment, gets crowded at 6pm."],
  ["aswanemergency", "salma", 5, "Found an open pharmacy at 2am thanks to their list."],
  ["aswanphotowalks", "ines", 5, "Learned more in two hours than in a year of YouTube tutorials."],
  ["aswanphotowalks", "marwa", 5, "Such a lovely group, and the sunset spot was perfect."],
  ["luxorlanguages", "mostafa", 5, "My French finally sounds like French. Tourists noticed!"],
  ["luxorlanguages", "karim", 4, "Good teacher, I wish there were morning groups too."],
  ["luxorfoodbank", "dina", 5, "ناس محترمة وشغالين بجد، بتبرع كل شهر."],
  ["zamalekhub", "hazem", 5, "Quiet mornings, reliable internet, and the balcony is unbeatable."],
  ["zamalekhub", "tarek", 4, "Good space, coffee machine could use an upgrade."],
  ["zamalekhub", "yasmine", 5, "Worked from here during a Cairo shoot, felt like home."],
  ["cairotechjobs", "mariam", 4, "Found my brother his first frontend job through them."],
  ["hazemenglish", "laila", 5, "Went from IELTS 6 to 7.5 in two months. Hazem is a legend."],
  ["hazemenglish", "mariam", 5, "Speaking club is fun and not scary at all."],
  ["solimanhomes", "laila", 4, "لقيت شقة في المعادي في أسبوع، والإعلان كان مطابق للحقيقة."],
  ["solimanhomes", "hazem", 5, "No hidden fees, exactly as promised."],
  ["downtownnights", "laila", 5, "Oud night gave me chills. Best night out in Cairo."],
  ["downtownnights", "mariam", 4, "Great music, a bit hot inside in summer."],
  ["anwarseafood", "bassem", 5, "أحسن صيادية في إسكندرية، ومن غير نقاش."],
  ["anwarseafood", "aya", 4, "Delicious grilled fish, long wait on Friday."],
  ["anwarseafood", "ines", 5, "Came all the way from Aswan and it was worth the trip."],
  ["stanleyyoga", "bassem", 5, "Aya is patient with beginners. Sunrise class is magic."],
  ["stanleyyoga", "sami", 4, "Good stretch after heavy lifting week. Recommended."],
  ["alexcleanup", "aya", 5, "Well organized, and you actually see the difference after."],
  ["mansheyamarket", "sherif", 5, "بلاقي كتب قديمة بأسعار مش ممكنة."],
  ["morsypharmacy", "eman", 5, "Always open, always helpful. They even deliver at night."],
  ["denderapottery", "hany", 5, "بنتي عملت كوباية بنفسها وفرحانة بيها جداً."],
  ["qenapaperwork", "hany", 4, "Saved me two trips to the registry office. Very clear checklists."],
  ["redseadivers", "sara", 5, "Rami is the most careful instructor in Hurghada."],
  ["redseadivers", "adel", 5, "Took my tour group here — everyone came back smiling."],
  ["redseadivers", "hala", 4, "Solid operation, good briefings. Boats get busy in August."],
  ["dahargrill", "rami", 5, "Where the dive crews eat after a long day. Cheap and fresh."],
  ["marinaapartments", "rami", 4, "Clean apartment, fast wifi. Street noise on weekends."],
  ["sharmrescue", "lina", 5, "Trained our whole team, clear and practical."],
  ["naamabeach", "khaled", 4, "Nice spot, pricey drinks, great snorkeling off the jetty."],
  ["naamabeach", "heba", 5, "Perfect day off from the balloons."],
  ["sinaisafari", "khaled", 5, "Guides are careful and the Bedouin dinner is excellent."],
  ["saadauto", "reem", 5, "Honest prices, fixed my tire in 15 minutes."],
  ["akhmimtextiles", "mahmoud", 5, "القماش تحفة والتفصيل مظبوط."],
  ["akhmimtextiles", "marwa", 5, "Used her tablecloths for a client project — gorgeous."],
  ["sohagtutoring", "mahmoud", 4, "ابني جاب درجات أحسن في الفيزيا."],
  ["abudabbab", "ziad", 5, "Hala knows every turtle by name. Truly."],
  ["abudabbab", "rami", 5, "Best snorkel operator in the south. Respectful of the reef."],
  ["wadigimallodge", "hala", 5, "Silence, stars, and the best falafel breakfast."],
  ["wadigimallodge", "lina", 4, "Magical place. Bring a warm layer for the nights."],
  ["marsaalamjobs", "hala", 4, "Honest listings, housing details were accurate."],
];

// [username, message] — what the "Report a problem" form stores.
export const SEED_REPORTS: [string, string][] = [
  ["walid", "The map in search doesn't load on my old Android phone — just a grey box."],
  ["mariam", "لما بغير اللغة للعربي، زرار الرجوع في صفحة البحث بيبقى في الجهة الغلط."],
  ["rami", "Uploaded 4 photos to a post but only 3 showed up after publishing."],
  ["ines", "I get two notifications when someone replies to my thread."],
  ["hala", "Can you add Marsa Alam's southern villages as a location? Hamata isn't on the list."],
];

// Google place claim conflicts in states other than the default
// "conflict" — so the admin view has resolved/dismissed history to show.
export const SEED_CLAIM_CONFLICTS_MORE: {
  googlePlaceId: string;
  attemptingBusiness: string;
  attemptingOwner: string;
  existingBusiness: string;
  existingOwner: string;
  status: ClaimConflictStatus;
}[] = [
  {
    googlePlaceId: PLACE.zamalekHub,
    attemptingBusiness: "downtownnights",
    attemptingOwner: "tarek",
    existingBusiness: "zamalekhub",
    existingOwner: "laila",
    status: "resolved",
  },
  {
    googlePlaceId: PLACE.redSeaDivers,
    attemptingBusiness: "marinaapartments",
    attemptingOwner: "sara",
    existingBusiness: "redseadivers",
    existingOwner: "rami",
    status: "dismissed",
  },
];
