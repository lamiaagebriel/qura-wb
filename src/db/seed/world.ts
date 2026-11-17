// A larger, realistic sample world for local development — loaded by
// `pnpm db:seed` (src/db/seed.ts) after the base samples, never in
// production. It lives in places of its own (Cairo, Giza, Alexandria,
// Fayoum, Hurghada, Mansoura and the places inside them), so the e2e tests'
// Aswan / Luxor data stays exactly as they expect. Deterministic (a seeded
// PRNG) and written once: skipped when Cairo already exists.
//
// Everything is hand-written to read like the real thing: businesses with
// Arabic and English names, streets, bios, hours that fit the trade and
// several links; people with Egyptian names; posts per type with details;
// reviews whose words match their stars. For now only the super admin
// answers requests and reports (NOTEPAD Step A), so the tickets here are
// waiting for them or answered by them.

import { eq } from "drizzle-orm";

import type { Tx } from "@/lib/actions/run";
import type { OpeningHours } from "@/lib/business";
import type { AnyPostData, PostType } from "@/lib/posts";
import type { SocialLink } from "@/lib/socials";
import type { TicketType } from "@/lib/tickets/types";

import {
  businessFollows,
  businessLocations,
  businessReviews,
  businesses,
  history,
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
const rand = random(20261019);
const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
const chance = (p: number) => rand() < p;
const some = <T>(list: readonly T[], count: number) =>
  [...list].sort(() => rand() - 0.5).slice(0, count);
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;
/** Spread over the last `days` days (so the dashboard's trends have a shape). */
const ago = (days: number) => new Date(Date.now() - rand() * days * DAY);
const isoDay = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);

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
  { slug: "downtown-cairo", parent: "cairo", type: "Neighborhood", name: { en: "Downtown", ar: "وسط البلد" }, at: [30.0478, 31.2394] },
  { slug: "maadi", parent: "cairo", type: "Neighborhood", name: { en: "Maadi", ar: "المعادي" }, at: [29.9602, 31.2569] },
  { slug: "degla", parent: "maadi", type: "Neighborhood", name: { en: "Degla", ar: "دجلة" }, at: [29.9619, 31.2795] },
  { slug: "sarayat", parent: "maadi", type: "Neighborhood", name: { en: "Sarayat", ar: "السرايات" }, at: [29.9581, 31.2531] },
  { slug: "zamalek", parent: "cairo", type: "Neighborhood", name: { en: "Zamalek", ar: "الزمالك" }, at: [30.0609, 31.2197] },
  { slug: "heliopolis", parent: "cairo", type: "Neighborhood", name: { en: "Heliopolis", ar: "مصر الجديدة" }, at: [30.0911, 31.3225] },
  { slug: "korba", parent: "heliopolis", type: "Neighborhood", name: { en: "Korba", ar: "الكوربة" }, at: [30.0889, 31.3236] },
  { slug: "nasr-city", parent: "cairo", type: "Neighborhood", name: { en: "Nasr City", ar: "مدينة نصر" }, at: [30.0511, 31.3656] },
  { slug: "new-cairo", parent: "cairo", type: "Neighborhood", name: { en: "New Cairo", ar: "القاهرة الجديدة" }, at: [30.0074, 31.4913] },
  { slug: "fifth-settlement", parent: "new-cairo", type: "Neighborhood", name: { en: "Fifth Settlement", ar: "التجمع الخامس" }, at: [30.0084, 31.4286] },
  { slug: "shubra", parent: "cairo", type: "Neighborhood", name: { en: "Shubra", ar: "شبرا" }, at: [30.0848, 31.2441] },
  { slug: "giza", parent: null, type: "City", name: { en: "Giza", ar: "الجيزة" }, at: [30.0131, 31.2089] },
  { slug: "dokki", parent: "giza", type: "Neighborhood", name: { en: "Dokki", ar: "الدقي" }, at: [30.0385, 31.2123] },
  { slug: "mohandessin", parent: "giza", type: "Neighborhood", name: { en: "Mohandessin", ar: "المهندسين" }, at: [30.0561, 31.2001] },
  { slug: "haram", parent: "giza", type: "Neighborhood", name: { en: "Haram", ar: "الهرم" }, at: [29.9915, 31.1586] },
  { slug: "sheikh-zayed", parent: "giza", type: "City", name: { en: "Sheikh Zayed", ar: "الشيخ زايد" }, at: [30.0444, 30.9789] },
  { slug: "alexandria", parent: null, type: "City", name: { en: "Alexandria", ar: "الإسكندرية" }, at: [31.2001, 29.9187] },
  { slug: "smouha", parent: "alexandria", type: "Neighborhood", name: { en: "Smouha", ar: "سموحة" }, at: [31.2156, 29.9469] },
  { slug: "sidi-gaber", parent: "alexandria", type: "Neighborhood", name: { en: "Sidi Gaber", ar: "سيدي جابر" }, at: [31.2189, 29.9425] },
  { slug: "miami-alex", parent: "alexandria", type: "Neighborhood", name: { en: "Miami", ar: "ميامي" }, at: [31.2667, 30.0047] },
  { slug: "gleem", parent: "alexandria", type: "Neighborhood", name: { en: "Gleem", ar: "جليم" }, at: [31.2425, 29.9661] },
  { slug: "mansheya", parent: "alexandria", type: "Neighborhood", name: { en: "Mansheya", ar: "المنشية" }, at: [31.1997, 29.8947] },
  { slug: "fayoum", parent: null, type: "City", name: { en: "Fayoum", ar: "الفيوم" }, at: [29.3084, 30.8428] },
  { slug: "tunis-village", parent: "fayoum", type: "Village", name: { en: "Tunis Village", ar: "قرية تونس" }, at: [29.4083, 30.6697] },
  { slug: "ibshaway", parent: "fayoum", type: "Markaz", name: { en: "Ibshaway", ar: "إبشواي" }, at: [29.3594, 30.6811] },
  { slug: "hurghada", parent: null, type: "City", name: { en: "Hurghada", ar: "الغردقة" }, at: [27.2579, 33.8116] },
  { slug: "el-dahar", parent: "hurghada", type: "Neighborhood", name: { en: "El Dahar", ar: "الدهار" }, at: [27.2306, 33.8436] },
  { slug: "sakkala", parent: "hurghada", type: "Neighborhood", name: { en: "Sakkala", ar: "السقالة" }, at: [27.2253, 33.8417] },
  { slug: "mansoura", parent: null, type: "City", name: { en: "Mansoura", ar: "المنصورة" }, at: [31.0409, 31.3785] },
  { slug: "toriel", parent: "mansoura", type: "Neighborhood", name: { en: "Toriel", ar: "توريل" }, at: [31.0436, 31.3906] },
  { slug: "gomhoreya-mansoura", parent: "mansoura", type: "Neighborhood", name: { en: "El Gomhoreya St", ar: "شارع الجمهورية" }, at: [31.0447, 31.3664] },
  { slug: "talkha", parent: "mansoura", type: "Markaz", name: { en: "Talkha", ar: "طلخا" }, at: [31.0539, 31.3779] },
];

/** A street in each place, for addresses (English, Arabic). */
const STREETS: Record<string, [string, string][]> = {
  "downtown-cairo": [["Talaat Harb St", "شارع طلعت حرب"], ["Kasr El Nil St", "شارع قصر النيل"], ["Mohamed Mahmoud St", "شارع محمد محمود"]],
  maadi: [["Road 9", "شارع 9"], ["Road 233", "شارع 233"], ["El Nasr St", "شارع النصر"]],
  degla: [["Road 250", "شارع 250"], ["Laselky St", "شارع اللاسلكي"]],
  sarayat: [["Road 82", "شارع 82"], ["Corniche El Nil", "كورنيش النيل"]],
  zamalek: [["26th of July St", "شارع 26 يوليو"], ["Brazil St", "شارع البرازيل"], ["Shagaret El Dor St", "شارع شجرة الدر"]],
  heliopolis: [["El Merghany St", "شارع الميرغني"], ["Abou Bakr El Seddik St", "شارع أبو بكر الصديق"]],
  korba: [["Baghdad St", "شارع بغداد"], ["Ibrahim El Laqany St", "شارع إبراهيم اللقاني"]],
  "nasr-city": [["Abbas El Akkad St", "شارع عباس العقاد"], ["Makram Ebeid St", "شارع مكرم عبيد"], ["Mostafa El Nahas St", "شارع مصطفى النحاس"]],
  "new-cairo": [["90th St", "شارع التسعين"], ["Teseen North", "التسعين الشمالي"]],
  "fifth-settlement": [["Mohamed Naguib Axis", "محور محمد نجيب"], ["South 90th St", "شارع التسعين الجنوبي"]],
  shubra: [["Shubra St", "شارع شبرا"], ["Khalafawy Sq", "ميدان الخلفاوي"]],
  dokki: [["Tahrir St", "شارع التحرير"], ["Mossadak St", "شارع مصدق"]],
  mohandessin: [["Gameat El Dowal St", "شارع جامعة الدول"], ["Shehab St", "شارع شهاب"], ["Syria St", "شارع سوريا"]],
  haram: [["Al Haram St", "شارع الهرم"], ["Faisal St", "شارع فيصل"]],
  "sheikh-zayed": [["Arkan Plaza", "أركان بلازا"], ["Zayed 2000 St", "شارع زايد 2000"]],
  smouha: [["Victor Emmanuel Sq", "ميدان فيكتور عمانويل"], ["Albert El Awal St", "شارع ألبرت الأول"]],
  "sidi-gaber": [["Port Said St", "شارع بورسعيد"], ["Sidi Gaber Station Sq", "ميدان محطة سيدي جابر"]],
  "miami-alex": [["Khaled Ibn El Walid St", "شارع خالد بن الوليد"], ["Gamal Abdel Nasser Rd", "طريق جمال عبد الناصر"]],
  gleem: [["El Geish Rd", "طريق الجيش"], ["Abou Quir St", "شارع أبو قير"]],
  mansheya: [["Saad Zaghloul Sq", "ميدان سعد زغلول"], ["El Nasr St", "شارع النصر"]],
  "tunis-village": [["Main Road", "الطريق الرئيسي"]],
  ibshaway: [["El Gomhoreya St", "شارع الجمهورية"]],
  fayoum: [["El Sawaky St", "شارع السواقي"], ["Saad Zaghloul St", "شارع سعد زغلول"]],
  "el-dahar": [["Sheraton Rd", "طريق شيراتون"], ["El Nasr St", "شارع النصر"]],
  sakkala: [["Sheraton St", "شارع شيراتون"], ["Marina Blvd", "ممشى المارينا"]],
  hurghada: [["Village Rd", "طريق القرى"]],
  toriel: [["Mashaya St", "شارع المشاية"], ["Ahmed Maher St", "شارع أحمد ماهر"]],
  "gomhoreya-mansoura": [["El Gomhoreya St", "شارع الجمهورية"]],
  talkha: [["El Bahr St", "شارع البحر"]],
  mansoura: [["El Mashaya El Sofleya", "المشاية السفلية"]],
  cairo: [["Ramses St", "شارع رمسيس"]],
  giza: [["Murad St", "شارع مراد"]],
  alexandria: [["Fouad St", "شارع فؤاد"]],
};

// ── People ──────────────────────────────────────────────────────────────

/** [first name, last name] — shown in Latin or Arabic script, as people type them. */
const PEOPLE: [string, string, string][] = [
  ["Ahmed", "Mostafa", "أحمد مصطفى"], ["Mohamed", "Ibrahim", "محمد إبراهيم"], ["Mahmoud", "Abdelrahman", "محمود عبد الرحمن"],
  ["Ali", "Saleh", "علي صالح"], ["Hassan", "Fouad", "حسن فؤاد"], ["Khaled", "Zaki", "خالد زكي"], ["Tarek", "Naguib", "طارق نجيب"],
  ["Amr", "Lotfy", "عمرو لطفي"], ["Mina", "Shawky", "مينا شوقي"], ["Bassem", "Ramzy", "باسم رمزي"], ["Sherif", "Hamdy", "شريف حمدي"],
  ["Hany", "Wahba", "هاني وهبة"], ["Nour", "Mansour", "نور منصور"], ["Salma", "Kamal", "سلمى كمال"], ["Yasmin", "Sabry", "ياسمين صبري"],
  ["Rana", "Galal", "رنا جلال"], ["Dina", "Adel", "دينا عادل"], ["Aya", "Samir", "آية سمير"], ["Mai", "Fathy", "مي فتحي"],
  ["Heba", "Ashraf", "هبة أشرف"], ["Farida", "Hosny", "فريدة حسني"], ["Malak", "Yousry", "ملك يسري"], ["Jana", "Emad", "جنى عماد"],
  ["Rawan", "Tamer", "روان تامر"], ["Omar", "Hegazy", "عمر حجازي"], ["Youssef", "Badawy", "يوسف بدوي"], ["Karim", "El Sayed", "كريم السيد"],
  ["Ziad", "Mekky", "زياد مكي"], ["Mostafa", "Gamal", "مصطفى جمال"], ["Islam", "Reda", "إسلام رضا"], ["Abanoub", "Fawzy", "أبانوب فوزي"],
  ["Peter", "Magdy", "بيتر مجدي"], ["Marina", "Nabil", "مارينا نبيل"], ["Mariam", "Wagdy", "مريم وجدي"], ["Nada", "Helmy", "ندى حلمي"],
  ["Shahd", "Osman", "شهد عثمان"], ["Habiba", "Sherif", "حبيبة شريف"], ["Laila", "Anwar", "ليلى أنور"], ["Esraa", "Mahmoud", "إسراء محمود"],
  ["Doaa", "Rashad", "دعاء رشاد"], ["Ehab", "Soliman", "إيهاب سليمان"], ["Wael", "Abdallah", "وائل عبدالله"], ["Hossam", "Tawfik", "حسام توفيق"],
  ["Sameh", "Zaghloul", "سامح زغلول"], ["Ramy", "Khalil", "رامي خليل"], ["Adham", "Farouk", "أدهم فاروق"], ["Seif", "Eldin", "سيف الدين"],
  ["Hamza", "Nour", "حمزة نور"], ["Menna", "Allah", "منة الله"], ["Reem", "Hassan", "ريم حسن"], ["Sara", "Tharwat", "سارة ثروت"],
  ["Noha", "Atef", "نهى عاطف"], ["Ghada", "Morsy", "غادة مرسي"], ["Amira", "Selim", "أميرة سليم"], ["Hagar", "Ismail", "هاجر إسماعيل"],
  ["Basma", "Fekry", "بسمة فكري"], ["Yara", "Hafez", "يارا حافظ"], ["Lina", "Raafat", "لينا رأفت"], ["Nadine", "Kamel", "نادين كامل"],
  ["Ahmed", "Hesham", "أحمد هشام"], ["Mohamed", "Salah", "محمد صلاح"], ["Abdallah", "Fathallah", "عبدالله فتح الله"], ["Ibrahim", "Moussa", "إبراهيم موسى"],
  ["Ayman", "Hussein", "أيمن حسين"], ["Mahmoud", "Shaker", "محمود شاكر"], ["Fady", "Ayad", "فادي عياد"], ["George", "Michel", "جورج ميشيل"],
  ["Kerolos", "Adly", "كيرلس عدلي"], ["Bishoy", "Nashed", "بيشوي ناشد"], ["Rania", "Yehia", "رانيا يحيى"], ["Eman", "Abdelaziz", "إيمان عبد العزيز"],
  ["Asmaa", "Gaber", "أسماء جابر"], ["Mona", "Zakaria", "منى زكريا"], ["Hend", "Elshamy", "هند الشامي"], ["Sohaila", "Khairy", "سهيلة خيري"],
  ["Tasneem", "Bakr", "تسنيم بكر"], ["Alaa", "Fahmy", "علاء فهمي"], ["Moataz", "Radwan", "معتز رضوان"], ["Hazem", "Eid", "حازم عيد"],
  ["Taha", "Elmasry", "طه المصري"], ["Yehia", "Abdelfattah", "يحيى عبد الفتاح"],
];

const BIOS = [
  "Coffee lover ☕", "Born and raised in Cairo.", "أحب مدينتي ❤️", "Runner, reader, home cook.", "Foodie 🍕 always looking for the next spot.",
  "Engineer by day, photographer by weekend 📷", "طالبة في كلية الطب", "Dad of two, Ahly fan ⚽", "Small business owner.", "بحب السفر والأكل الحلو",
  "Architecture student.", "Yoga teacher in Maadi 🧘", "", "", "",
];

// ── Businesses ──────────────────────────────────────────────────────────

/** How a trade keeps its hours: [open, close], Fridays, and a Friday-noon start. */
const HOURS: Record<string, { open: string; close: string; friday?: "closed" | "afternoon" }> = {
  cafe: { open: "08:00", close: "24:00" },
  bakery: { open: "07:00", close: "23:00" },
  food: { open: "12:00", close: "24:00" },
  late: { open: "13:00", close: "02:00" },
  shop: { open: "10:00", close: "22:00", friday: "afternoon" },
  pharmacy: { open: "00:00", close: "24:00" },
  clinic: { open: "16:00", close: "22:00", friday: "closed" },
  office: { open: "09:00", close: "17:00", friday: "closed" },
  gym: { open: "06:00", close: "23:00" },
  salon: { open: "11:00", close: "22:00" },
  service: { open: "09:00", close: "21:00", friday: "closed" },
  school: { open: "08:00", close: "20:00", friday: "closed" },
};

type SeedBusiness = {
  category: string;
  place: string;
  name: { en: string; ar: string };
  bio: { en: string; ar: string };
  hours: keyof typeof HOURS;
  /** Extra links besides WhatsApp. */
  links?: ("instagram" | "facebook" | "website" | "tiktok" | "phone")[];
  /** A second branch, in another place. */
  branch?: string;
};

const BUSINESSES: SeedBusiness[] = [
  // Cafés & bakeries
  { category: "coffee-shop", place: "zamalek", name: { en: "Beanstalk Coffee", ar: "بينستوك كافيه" }, bio: { en: "Specialty coffee roasted in-house. Quiet upstairs for working.", ar: "قهوة مختصة محمصة عندنا. الدور اللي فوق هادي للشغل." }, hours: "cafe", links: ["instagram", "website"] },
  { category: "coffee-shop", place: "maadi", name: { en: "Road 9 Roasters", ar: "روستري شارع 9" }, bio: { en: "Single-origin beans, V60 and the best flat white on Road 9.", ar: "بن من مصادر مختارة وأحلى فلات وايت في شارع 9." }, hours: "cafe", links: ["instagram"] },
  { category: "coffee-shop", place: "heliopolis", name: { en: "Baron Corner Café", ar: "كافيه ركن البارون" }, bio: { en: "Breakfast all day across from the Baron Palace.", ar: "فطار طول اليوم قدام قصر البارون." }, hours: "cafe", links: ["instagram", "facebook"] },
  { category: "coffee-shop", place: "smouha", name: { en: "Sea Breeze Café", ar: "كافيه نسيم البحر" }, bio: { en: "Coffee, cakes and board games. Students welcome.", ar: "قهوة وكيك وألعاب. الطلبة أهلاً بيهم." }, hours: "cafe", links: ["instagram", "tiktok"] },
  { category: "coffee-shop", place: "fifth-settlement", name: { en: "Kahwa Lab", ar: "معمل القهوة" }, bio: { en: "Cold brew on tap and a big outdoor terrace.", ar: "كولد برو وتراس كبير برا." }, hours: "cafe", links: ["instagram", "website"], branch: "sheikh-zayed" },
  { category: "coffee-shop", place: "toriel", name: { en: "Toriel Coffee House", ar: "قهوة توريل" }, bio: { en: "Mansoura's favorite study spot, open till midnight.", ar: "أشهر مكان مذاكرة في المنصورة، فاتح لحد نص الليل." }, hours: "cafe", links: ["facebook"] },
  { category: "juice-bar", place: "downtown-cairo", name: { en: "Asaf El Tahrir Juices", ar: "عصائر التحرير" }, bio: { en: "Fresh sugarcane, mango and guava since 1985.", ar: "قصب ومانجا وجوافة فريش من 1985." }, hours: "late" },
  { category: "juice-bar", place: "gleem", name: { en: "Gleem Fresh Juice", ar: "جليم فريش" }, bio: { en: "Cocktails, smoothies and fresh fruit salads by the sea.", ar: "كوكتيلات وسموزي وفروت سلاط على البحر." }, hours: "late", links: ["instagram"] },
  { category: "bakery", place: "heliopolis", name: { en: "Korba Bakehouse", ar: "مخبز الكوربة" }, bio: { en: "Sourdough, croissants and fresh baladi bread every morning.", ar: "عيش سوردو وكرواسون وعيش بلدي طازة كل صبح." }, hours: "bakery", links: ["instagram"] },
  { category: "bakery", place: "shubra", name: { en: "El Abd Sweets", ar: "حلواني العبد" }, bio: { en: "Basbousa, konafa and Eid cookies by the kilo.", ar: "بسبوسة وكنافة وكحك العيد بالكيلو." }, hours: "bakery", links: ["facebook", "phone"] },
  { category: "bakery", place: "mansheya", name: { en: "Délices Patisserie", ar: "حلواني ديليس" }, bio: { en: "Alexandria's classic French patisserie, since 1922.", ar: "حلواني فرنساوي كلاسيكي في إسكندرية من 1922." }, hours: "bakery", links: ["facebook", "website"] },
  { category: "bakery", place: "toriel", name: { en: "Sweet Oven Mansoura", ar: "سويت أوفن المنصورة" }, bio: { en: "Custom birthday cakes — order two days ahead.", ar: "تورت أعياد ميلاد حسب الطلب — اطلب قبلها بيومين." }, hours: "bakery", links: ["instagram", "phone"] },

  // Restaurants
  { category: "traditional", place: "downtown-cairo", name: { en: "Koshary Abou Tarek", ar: "كشري أبو طارق" }, bio: { en: "The famous koshary, three floors of it. Open late.", ar: "الكشري المشهور، تلت أدوار. فاتح لوقت متأخر." }, hours: "late", links: ["facebook"] },
  { category: "traditional", place: "dokki", name: { en: "Felfela El Dokki", ar: "فلفلة الدقي" }, bio: { en: "Foul, taameya and Egyptian breakfast trays.", ar: "فول وطعمية وصواني فطار مصري." }, hours: "food", links: ["phone"] },
  { category: "traditional", place: "nasr-city", name: { en: "Zooba Nasr City", ar: "زوبا مدينة نصر" }, bio: { en: "Street food, reimagined — the beetroot taameya is a must.", ar: "أكل شارع بشكل جديد — جرب الطعمية بالبنجر." }, hours: "food", links: ["instagram", "website"], branch: "zamalek" },
  { category: "traditional", place: "fayoum", name: { en: "Fatatri El Fayoum", ar: "فطاطري الفيوم" }, bio: { en: "Sweet and savory feteer, baked in a wood oven.", ar: "فطير حلو وحادق في فرن حطب." }, hours: "food", links: ["phone"] },
  { category: "traditional", place: "gomhoreya-mansoura", name: { en: "Mansoura Liver & Sausage", ar: "كبدة وسجق المنصورة" }, bio: { en: "Alexandrian liver sandwiches, 24 hours on weekends.", ar: "سندوتشات كبدة إسكندراني، 24 ساعة في الويك إند." }, hours: "late" },
  { category: "grill", place: "mohandessin", name: { en: "Kababgy El Sheikh", ar: "كبابجي الشيخ" }, bio: { en: "Kofta and kebab by the kilo, family tables upstairs.", ar: "كفتة وكباب بالكيلو، ترابيزات عائلية فوق." }, hours: "food", links: ["phone", "facebook"] },
  { category: "grill", place: "haram", name: { en: "Hatti El Haram", ar: "حاتي الهرم" }, bio: { en: "Charcoal grills and rice with vermicelli, delivery till 2 am.", ar: "مشويات على الفحم ورز بالشعرية، ديليفري لحد 2." }, hours: "late", links: ["phone"] },
  { category: "grill", place: "smouha", name: { en: "Charcoal House", ar: "بيت الفحم" }, bio: { en: "Mixed grill platters and fresh salads.", ar: "أطباق مشويات مشكلة وسلطات طازة." }, hours: "food", links: ["instagram"] },
  { category: "seafood", place: "miami-alex", name: { en: "Abou Ashraf Seafood", ar: "أسماك أبو أشرف" }, bio: { en: "Pick your fish, we grill it. Calamari and shrimp tagine too.", ar: "اختار السمك واحنا نشويه. وكمان كاليماري وطاجن جمبري." }, hours: "food", links: ["phone", "facebook"] },
  { category: "seafood", place: "sakkala", name: { en: "Red Sea Fish Market", ar: "سوق سمك البحر الأحمر" }, bio: { en: "Today's catch from the Hurghada port, cooked your way.", ar: "صيد النهارده من ميناء الغردقة، يتطبخ زي ما تحب." }, hours: "food", links: ["instagram", "phone"] },
  { category: "seafood", place: "gleem", name: { en: "Fish Market Gleem", ar: "فيش ماركت جليم" }, bio: { en: "Seafood with a view of the Mediterranean.", ar: "مأكولات بحرية بفيو على البحر المتوسط." }, hours: "food", links: ["website"] },
  { category: "pizza", place: "maadi", name: { en: "Napoli Corner", ar: "نابولي كورنر" }, bio: { en: "Wood-fired Neapolitan pizza, 90 seconds in the oven.", ar: "بيتزا نابوليتان في فرن حطب، 90 ثانية في الفرن." }, hours: "food", links: ["instagram"] },
  { category: "pizza", place: "el-dahar", name: { en: "Pizza Station Hurghada", ar: "بيتزا ستيشن الغردقة" }, bio: { en: "Family-size pizzas and free delivery in El Dahar.", ar: "بيتزا عائلي وتوصيل مجاني في الدهار." }, hours: "late", links: ["phone"] },
  { category: "fast-food", place: "fifth-settlement", name: { en: "Smash Burger Co.", ar: "سماش برجر" }, bio: { en: "Double smash, crispy edges, secret sauce.", ar: "دبل سماش، أطراف مقرمشة، وصوص سري." }, hours: "late", links: ["instagram", "tiktok"] },
  { category: "fast-food", place: "talkha", name: { en: "Shawarma El Reem", ar: "شاورما الريم" }, bio: { en: "Syrian chicken shawarma with garlic toum.", ar: "شاورما فراخ سوري بالتومية." }, hours: "late", links: ["phone"] },

  // Hotels & tourism
  { category: "hostel", place: "downtown-cairo", name: { en: "Talaat Harb Hostel", ar: "هوستل طلعت حرب" }, bio: { en: "Rooftop with a city view, dorms and private rooms.", ar: "روف بفيو على المدينة، أسرّة مشتركة وغرف خاصة." }, hours: "pharmacy", links: ["website", "instagram"] },
  { category: "hostel", place: "tunis-village", name: { en: "Tunis Pottery Lodge", ar: "نُزل فخار تونس" }, bio: { en: "Mud-brick rooms by Lake Qarun, pottery classes on request.", ar: "غرف طوب لبن على بحيرة قارون، ودروس فخار بالطلب." }, hours: "pharmacy", links: ["website", "facebook"] },
  { category: "apartments", place: "sakkala", name: { en: "Marina View Apartments", ar: "شقق مارينا فيو" }, bio: { en: "Sea-view studios, weekly and monthly stays.", ar: "استوديوهات بفيو على البحر، إقامة أسبوعية وشهرية." }, hours: "office", links: ["website", "phone"] },
  { category: "travel-agency", place: "mohandessin", name: { en: "Safari Travel", ar: "سفاري للسياحة" }, bio: { en: "Umrah, Sharm and Dahab packages. Visa help.", ar: "رحلات عمرة وشرم ودهب. مساعدة في التأشيرات." }, hours: "office", links: ["website", "facebook"] },
  { category: "tour-guide", place: "el-dahar", name: { en: "Giftun Island Trips", ar: "رحلات جزيرة الجفتون" }, bio: { en: "Snorkeling day trips with lunch on board.", ar: "رحلات سنوركل يوم كامل بالغدا على المركب." }, hours: "office", links: ["instagram", "website"] },

  // Groceries & shops
  { category: "supermarket", place: "degla", name: { en: "Degla Fresh Market", ar: "دجلة فريش ماركت" }, bio: { en: "Groceries, deli and home delivery within an hour.", ar: "بقالة وديلي وتوصيل للبيت في ساعة." }, hours: "late", links: ["phone", "facebook"] },
  { category: "supermarket", place: "korba", name: { en: "Daily Needs Heliopolis", ar: "ديلي نيدز مصر الجديدة" }, bio: { en: "Open 24/7, imported goods and fresh bakery.", ar: "فاتح 24 ساعة، منتجات مستوردة ومخبوزات طازة." }, hours: "pharmacy", links: ["phone"] },
  { category: "butcher", place: "nasr-city", name: { en: "El Tahan Butchery", ar: "جزارة الطحان" }, bio: { en: "Fresh baladi meat, minced on the spot.", ar: "لحمة بلدي طازة، بتتفرم قدامك." }, hours: "shop", links: ["phone"] },
  { category: "produce", place: "ibshaway", name: { en: "Fayoum Farm Basket", ar: "سلة مزرعة الفيوم" }, bio: { en: "Vegetables and fruit straight from our farm.", ar: "خضار وفاكهة من مزرعتنا على طول." }, hours: "shop", links: ["facebook"] },
  { category: "phones", place: "downtown-cairo", name: { en: "Mobile Hub", ar: "موبايل هب" }, bio: { en: "New and used phones, original accessories, installments.", ar: "موبايلات جديدة ومستعملة، اكسسوارات أصلية، تقسيط." }, hours: "shop", links: ["facebook", "phone"] },
  { category: "electronics", place: "sidi-gaber", name: { en: "Tech Corner Alex", ar: "تك كورنر إسكندرية" }, bio: { en: "Laptops, TVs and home appliances with warranty.", ar: "لابتوبات وشاشات وأجهزة منزلية بالضمان." }, hours: "shop", links: ["website", "facebook"] },
  { category: "bookstore", place: "zamalek", name: { en: "Diwan Zamalek", ar: "ديوان الزمالك" }, bio: { en: "Arabic and English books, a café and a kids' corner.", ar: "كتب عربي وإنجليزي، كافيه وركن للأطفال." }, hours: "shop", links: ["instagram", "website"] },
  { category: "bookstore", place: "gomhoreya-mansoura", name: { en: "Dar El Kalam", ar: "دار القلم" }, bio: { en: "School books, stationery and photocopying.", ar: "كتب مدرسية وأدوات مكتبية وتصوير." }, hours: "shop", links: ["phone"] },
  { category: "gifts", place: "korba", name: { en: "Wrapped Gifts", ar: "رابد للهدايا" }, bio: { en: "Gift boxes, balloons and same-day delivery.", ar: "بوكسات هدايا وبالونات وتوصيل في نفس اليوم." }, hours: "shop", links: ["instagram", "tiktok"] },
  { category: "furniture", place: "sheikh-zayed", name: { en: "Oak & Linen", ar: "أوك آند لينين" }, bio: { en: "Locally made wooden furniture, custom sizes.", ar: "موبيليا خشب صناعة محلية، مقاسات حسب الطلب." }, hours: "shop", links: ["instagram", "website"] },
  { category: "womens", place: "mohandessin", name: { en: "Lamar Boutique", ar: "لمار بوتيك" }, bio: { en: "Modest fashion and evening dresses.", ar: "ملابس محتشمة وفساتين سواريه." }, hours: "shop", links: ["instagram", "tiktok"] },
  { category: "mens", place: "smouha", name: { en: "Gentleman's Closet", ar: "جنتلمان كلوزت" }, bio: { en: "Suits, shirts and tailoring in three days.", ar: "بدل وقمصان وتفصيل في تلات أيام." }, hours: "shop", links: ["instagram"] },
  { category: "kids", place: "nasr-city", name: { en: "Little Steps", ar: "ليتل ستبس" }, bio: { en: "Baby and kids' clothes, sizes 0–12.", ar: "ملابس بيبي وأطفال، مقاسات من 0 لـ 12." }, hours: "shop", links: ["facebook"] },
  { category: "shoes", place: "toriel", name: { en: "Step In Shoes", ar: "ستيب إن للأحذية" }, bio: { en: "Leather shoes and bags made in Egypt.", ar: "جزم وشنط جلد صناعة مصرية." }, hours: "shop", links: ["facebook", "instagram"] },

  // Health
  { category: "pharmacy", place: "maadi", name: { en: "Seif Pharmacy Maadi", ar: "صيدلية سيف المعادي" }, bio: { en: "24-hour pharmacy with free delivery.", ar: "صيدلية 24 ساعة وتوصيل مجاني." }, hours: "pharmacy", links: ["phone"] },
  { category: "pharmacy", place: "haram", name: { en: "Care Pharmacy", ar: "صيدلية كير" }, bio: { en: "Prescriptions, baby care and blood-pressure checks.", ar: "روشتات ومستلزمات أطفال وقياس ضغط." }, hours: "pharmacy", links: ["phone"] },
  { category: "pharmacy", place: "gleem", name: { en: "El Ezaby Gleem", ar: "العزبي جليم" }, bio: { en: "Branch of the chain, open all night.", ar: "فرع السلسلة، فاتح طول الليل." }, hours: "pharmacy", links: ["phone", "website"] },
  { category: "dentist", place: "heliopolis", name: { en: "Smile Dental Clinic", ar: "عيادة سمايل للأسنان" }, bio: { en: "Implants, braces and whitening. By appointment.", ar: "زراعة وتقويم وتبييض. بالحجز." }, hours: "clinic", links: ["website", "phone"] },
  { category: "pediatrics", place: "dokki", name: { en: "Dr. Hala's Kids Clinic", ar: "عيادة د. هالة للأطفال" }, bio: { en: "Pediatrics and vaccinations, evenings.", ar: "أطفال وتطعيمات، مواعيد مسائية." }, hours: "clinic", links: ["phone"] },
  { category: "dermatology", place: "fifth-settlement", name: { en: "Skin Lab Clinic", ar: "سكين لاب" }, bio: { en: "Dermatology, laser and skin care.", ar: "جلدية وليزر وعناية بالبشرة." }, hours: "clinic", links: ["instagram", "website"] },
  { category: "lab", place: "toriel", name: { en: "Al Borg Lab Mansoura", ar: "معامل البرج المنصورة" }, bio: { en: "Blood tests with results on WhatsApp.", ar: "تحاليل دم والنتيجة على واتساب." }, hours: "service", links: ["website", "phone"] },
  { category: "optician", place: "sidi-gaber", name: { en: "Clear Vision Optics", ar: "كلير فيجن للنظارات" }, bio: { en: "Free eye test with every pair.", ar: "كشف نظر مجاني مع كل نظارة." }, hours: "shop", links: ["facebook"] },
  { category: "physio", place: "mohandessin", name: { en: "Move Physio Center", ar: "مركز موڤ للعلاج الطبيعي" }, bio: { en: "Sports injuries and back pain programs.", ar: "إصابات ملاعب وبرامج لآلام الضهر." }, hours: "clinic", links: ["instagram", "phone"] },

  // Beauty & fitness
  { category: "hair", place: "zamalek", name: { en: "Glow Hair Studio", ar: "جلو هير ستوديو" }, bio: { en: "Cuts, color and keratin. Book on WhatsApp.", ar: "قص وصبغة وكيراتين. احجزي على واتساب." }, hours: "salon", links: ["instagram"] },
  { category: "barber", place: "nasr-city", name: { en: "Barber Bros", ar: "باربر بروز" }, bio: { en: "Fades, beard trims and hot towels.", ar: "فيد وتظبيط دقن وفوطة سخنة." }, hours: "salon", links: ["instagram", "tiktok"], branch: "heliopolis" },
  { category: "nails", place: "sheikh-zayed", name: { en: "Polished Nail Bar", ar: "بوليشد نيل بار" }, bio: { en: "Gel, extensions and nail art.", ar: "جل وتركيب ونيل آرت." }, hours: "salon", links: ["instagram"] },
  { category: "spa", place: "el-dahar", name: { en: "Coral Spa", ar: "كورال سبا" }, bio: { en: "Massage and hammam, couples' room available.", ar: "مساج وحمام مغربي، وفيه غرفة للكابلز." }, hours: "salon", links: ["website", "instagram"] },
  { category: "gym", place: "maadi", name: { en: "Iron Temple Gym", ar: "آيرون تمبل جيم" }, bio: { en: "Free weights, classes and personal training.", ar: "أوزان حرة وكلاسات وتدريب شخصي." }, hours: "gym", links: ["instagram", "facebook"] },
  { category: "gym", place: "smouha", name: { en: "Flex Fitness Alex", ar: "فلكس فيتنس إسكندرية" }, bio: { en: "Ladies' hours every morning, CrossFit evenings.", ar: "مواعيد سيدات كل صبح، وكروس فيت بالليل." }, hours: "gym", links: ["instagram"] },
  { category: "yoga", place: "degla", name: { en: "Yoga Loft Maadi", ar: "يوجا لوفت المعادي" }, bio: { en: "Yoga and pilates, beginners every Saturday.", ar: "يوجا وبيلاتس، كلاس للمبتدئين كل سبت." }, hours: "gym", links: ["instagram", "website"] },
  { category: "swimming", place: "heliopolis", name: { en: "Aqua Swim Academy", ar: "أكاديمية أكوا للسباحة" }, bio: { en: "Swimming lessons for kids from age 4.", ar: "تعليم سباحة للأطفال من سن 4." }, hours: "school", links: ["facebook", "phone"] },
  { category: "martial-arts", place: "toriel", name: { en: "Mansoura Karate Club", ar: "نادي كاراتيه المنصورة" }, bio: { en: "Karate and kickboxing, all ages.", ar: "كاراتيه وكيك بوكسينج، كل الأعمار." }, hours: "school", links: ["facebook"] },

  // Education
  { category: "languages", place: "dokki", name: { en: "Language Lab", ar: "لانجويدج لاب" }, bio: { en: "English, German and French — small groups.", ar: "إنجليزي وألماني وفرنساوي — مجموعات صغيرة." }, hours: "school", links: ["website", "facebook"] },
  { category: "tutoring", place: "nasr-city", name: { en: "Bright Minds Center", ar: "مركز برايت مايندز" }, bio: { en: "Thanaweya Amma math and physics groups.", ar: "مجموعات رياضة وفيزياء ثانوية عامة." }, hours: "school", links: ["facebook", "phone"] },
  { category: "nursery", place: "sheikh-zayed", name: { en: "Little Garden Nursery", ar: "حضانة ليتل جاردن" }, bio: { en: "Bilingual nursery, ages 1 to 4.", ar: "حضانة بلغتين، من سنة لـ 4 سنين." }, hours: "school", links: ["instagram", "phone"] },

  // Services & transport
  { category: "car-repair", place: "haram", name: { en: "Quick Fix Garage", ar: "ورشة كويك فيكس" }, bio: { en: "Mechanics, electrics and AC for all cars.", ar: "ميكانيكا وكهربا وتكييف لكل العربيات." }, hours: "service", links: ["phone"] },
  { category: "car-rental", place: "el-dahar", name: { en: "Red Sea Car Rental", ar: "تأجير سيارات البحر الأحمر" }, bio: { en: "Daily and weekly rentals, airport pickup.", ar: "إيجار يومي وأسبوعي، استلام من المطار." }, hours: "office", links: ["website", "phone"] },
  { category: "phone-repair", place: "shubra", name: { en: "Fix My Phone", ar: "فيكس ماي فون" }, bio: { en: "Screens and batteries replaced in an hour.", ar: "تغيير شاشات وبطاريات في ساعة." }, hours: "shop", links: ["phone", "facebook"] },
  { category: "plumbing", place: "maadi", name: { en: "Maadi Plumbing Services", ar: "سباكة المعادي" }, bio: { en: "Leaks, heaters and bathrooms — emergency calls.", ar: "تسريب وسخانات وحمامات — طوارئ." }, hours: "service", links: ["phone"] },
  { category: "cleaning", place: "fifth-settlement", name: { en: "Sparkle Home Cleaning", ar: "سباركل لتنظيف المنازل" }, bio: { en: "Deep cleaning and sofa washing at home.", ar: "تنظيف عميق وغسيل أنتريهات في البيت." }, hours: "service", links: ["instagram", "phone"] },
  { category: "delivery", place: "smouha", name: { en: "Alex Express Delivery", ar: "إسكندرية إكسبريس للتوصيل" }, bio: { en: "Parcels across Alexandria the same day.", ar: "توصيل طرود في إسكندرية في نفس اليوم." }, hours: "service", links: ["phone"] },
  { category: "photography", place: "zamalek", name: { en: "Studio Nour", ar: "ستوديو نور" }, bio: { en: "Weddings, engagements and passport photos.", ar: "أفراح وخطوبة وصور باسبور." }, hours: "shop", links: ["instagram", "website"] },
  { category: "venue", place: "new-cairo", name: { en: "The Garden Hall", ar: "قاعة الحديقة" }, bio: { en: "Outdoor venue for weddings and parties up to 400.", ar: "قاعة مفتوحة للأفراح والحفلات لحد 400." }, hours: "office", links: ["website", "instagram"] },
  { category: "kids-play", place: "nasr-city", name: { en: "Jumpy Kids Zone", ar: "جامبي كيدز زون" }, bio: { en: "Trampolines and birthday parties.", ar: "ترامبولين وحفلات أعياد ميلاد." }, hours: "late", links: ["instagram", "facebook"] },
];

// ── Posts ───────────────────────────────────────────────────────────────

const TEXTS: Record<PostType, readonly string[]> = {
  general: [
    "The Corniche walk at sunset was packed today, but still beautiful 🌅",
    "They finally fixed the street lights on our road. Small things matter.",
    "الجو النهارده تحفة، أحسن يوم للخروج",
    "The new metro station opened this morning — the ride to downtown is 15 minutes now.",
    "Shoutout to the guys cleaning the garden by the mosque every Friday 👏",
    "مين لسه بيروح السينما؟ القاعات بقت فاضية خالص",
    "Ramadan lanterns are already up in the market. Feels early this year!",
  ],
  question: [
    "Can anyone recommend a good plumber nearby? Kitchen sink leaking since yesterday.",
    "Looking for a pediatrician who answers on WhatsApp. Any suggestions?",
    "فين أحسن مكان للفطار يوم الجمعة؟",
    "Is there a pharmacy around here that's open after 2 am?",
    "Where can I print large posters (A1) the same day?",
    "حد يعرف مدرس كيميا شاطر لتالتة ثانوي؟",
    "Which internet provider works best in this area? My connection keeps dropping.",
    "Any vet that does home visits? My cat won't get in the carrier 😅",
  ],
  together: [
    "Football every Friday at 5 pm, we're missing two players ⚽",
    "Morning running group, 6 am from the club gate. All levels welcome!",
    "حد عايز يشترك معانا في رحلة الفيوم الجمعة الجاية؟",
    "Starting a book club — first book is Palace Walk. Who's in?",
    "Looking for a padel partner, intermediate level, weekday evenings.",
    "عاملين جروب نضف الشارع يوم السبت الصبح، اللي يقدر ينزل يكلمني",
  ],
  experience: [
    "Tried the new koshary place — honestly better than the famous one, and cheaper.",
    "Had my car fixed in two hours, fair price and they showed me the old part. Rare!",
    "تجربة رائعة في المخبز الجديد، الكرواسون طازة جدًا",
    "Ordered a cake for my daughter's birthday, it looked exactly like the photo 🎂",
    "Waited 40 minutes for a table even though I booked. Food was good but plan ahead.",
    "روحت عيادة الأسنان اللي الناس رشحتها هنا، دكتور محترم جدًا وما وجعنيش خالص",
  ],
  event: [
    "Book fair at the cultural center this weekend, 10 am to 9 pm.",
    "Live oud night on Thursday at 8 — free entry 🎶",
    "معرض فني لطلبة الفنون الجميلة يوم السبت",
    "Kids' painting workshop on Friday morning, materials included.",
    "Open-air movie screening in the garden, bring your own chair 🎬",
    "بازار منتجات يدوية الجمعة الجاية من 4 العصر",
  ],
  offer: [
    "20% off everything this week — just show this post.",
    "Buy one, get one free on all pizzas every Tuesday 🍕",
    "خصم خاص للطلبة بالكارنيه طول الشهر",
    "Free delivery on orders over 300 EGP this weekend.",
    "Family meal for 4 — 450 EGP instead of 600.",
    "عرض الصيف: الشهر بسعر ٣ أسابيع في الجيم",
  ],
  announcement: [
    "We're now open on Fridays from 1 pm.",
    "Our second branch opens next month — stay tuned!",
    "مواعيدنا الجديدة في رمضان: من بعد الفطار لحد السحور",
    "We now accept Instapay and all cards.",
    "Closed tomorrow for maintenance, back on Saturday.",
    "تقدروا تحجزوا على واتساب من النهارده",
  ],
  job: [
    "Hiring a part-time cashier, evening shift, near the metro.",
    "We need a delivery rider with his own motorcycle. Good pay + tips.",
    "مطلوب مساعد صيدلي، خبرة سنة على الأقل",
    "Looking for a barista — we'll train the right person.",
    "Hiring a receptionist for a dental clinic, English required.",
    "مطلوب مدرس رياضيات لمركز دروس، مواعيد مسائية",
  ],
  housing: [
    "2-bedroom apartment for rent, furnished, 3rd floor with elevator. 12,000 EGP/month.",
    "Looking for a female roommate, close to the university.",
    "شقة للإيجار قريبة من النادي، ٣ غرف وصالة",
    "Studio for rent, ideal for a student, bills included.",
    "Selling my apartment, 140 m², finished, no brokers please.",
    "مطلوب شقة صغيرة إيجار قديم أو جديد قريبة من المحطة",
  ],
  lost_found: [
    "Lost a black leather wallet near the bakery yesterday evening. Reward 🙏",
    "Found a set of car keys with a red keychain at the bus stop.",
    "قطة ضايعة لونها أبيض وفيها بقعة سودة على ودنها، اسمها لولا",
    "Found a kid's school bag on the bench by the club gate.",
    "Lost my national ID somewhere on the main street, please message me if found.",
  ],
  alert: [
    "Water cut tomorrow from 9 am to 1 pm for pipe works.",
    "Road works on the main street all week — use the side road.",
    "تحذير: زحمة شديدة عند الكوبري بسبب حادثة",
    "Power outage planned on Saturday morning, 8 to 11.",
    "Be careful: someone is going door to door pretending to be from the gas company.",
    "الشارع مقفول بكرة بسبب ماراثون الصبح",
  ],
};

const REPLIES = [
  "Thanks for sharing!", "I'd recommend the one near the club, they're quick.", "شكرًا جدًا", "Same here, good to know.",
  "Try calling them first, they get busy.", "تمام، هجرب", "Sent you a message 👍", "Is this still available?",
  "ربنا يسهل", "Count me in!", "Happened to me too last week.", "ممكن رقم التليفون؟",
] as const;

/** Review words that match the stars (1 → 5). */
const REVIEWS: Record<1 | 2 | 3 | 4 | 5, readonly string[]> = {
  5: [
    "Excellent from start to finish. Will definitely be back!", "Best in the area, and the staff remember you.", "ممتاز جدًا، ومعاملة محترمة",
    "Fair prices and real quality. Highly recommend.", "Exactly what they promised, on time.", "من أحسن الأماكن اللي جربتها",
    "Clean, friendly and fast. Five stars.", "",
  ],
  4: [
    "Very good, only a bit crowded on weekends.", "Great quality, slightly pricey but worth it.", "حلو جدًا بس الانتظار كان طويل شوية",
    "Good service, parking is the only problem.", "Would be five stars with faster delivery.", "",
  ],
  3: [
    "Okay, nothing special.", "Good some days, average on others.", "مقبول، الأسعار عالية شوية على الجودة",
    "Fine for the price.", "",
  ],
  2: [
    "Slow service and they forgot part of my order.", "Not as good as it used to be.", "الخدمة بطيئة والمكان محتاج نضافة",
    "Prices went up and quality went down.",
  ],
  1: [
    "Very disappointing, won't come back.", "Rude staff and a long wait.", "تجربة سيئة جدًا ومحدش رد على الشكوى",
  ],
};
const RATINGS = [5, 5, 5, 5, 4, 4, 4, 3, 3, 2, 1] as const;

/** A week of opening hours, Sunday first, the way the trade keeps them. */
function weekOf(kind: keyof typeof HOURS): (OpeningHours | null)[] {
  const { open, close, friday } = HOURS[kind];
  return Array.from({ length: 7 }, (_, day) => {
    if (day !== 5 || !friday) return { open, close };
    return friday === "closed" ? null : { open: "13:00", close };
  });
}

const phone = () => `+2010${between(10000000, 99999999)}`;

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
        createdAt: ago(90),
      })
      .returning({ id: places.id });
    placeId.set(p.slug, row.id);
  }
  const placeOf = (slug: string) => PLACES.find((p) => p.slug === slug)!;
  const slugs = PLACES.map((p) => p.slug);

  // People: joined over the last three months; two suspended. Some type
  // their name in Arabic.
  const SUSPENDED = new Set([9, 41]);
  const people = PEOPLE.map(([first, last, arabic], i) => {
    const username = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "") + (i % 3 === 0 ? `${between(1, 99)}` : "");
    return {
      name: i % 4 === 1 ? arabic : `${first} ${last}`,
      username: `${username}.${i}`.slice(0, 30),
      email: `${username}.${i}@seed.qura.test`,
      emailVerified: true,
      status: SUSPENDED.has(i) ? ("suspended" as const) : ("active" as const),
      bio: pick(BIOS) || null,
      createdAt: ago(90),
    };
  });
  const personIds = (await tx.insert(users).values(people).returning({ id: users.id })).map((r) => r.id);
  const activeIds = personIds.filter((_, i) => !SUSPENDED.has(i));

  // Businesses: as written above; a few pending, suspended or closed; some
  // verified; some added for someone else (no owner yet).
  const made: { id: string; place: string; ownerId: string | null; category: string; status: string }[] = [];
  const usernames = new Set<string>();
  for (const [n, b] of BUSINESSES.entries()) {
    const status = n % 19 === 7 ? "pending" : n % 23 === 11 ? "suspended" : n % 17 === 13 ? "closed" : "active";
    const ownerless = n % 7 === 3;
    const ownerId = ownerless ? null : pick(activeIds);
    let username = b.name.en.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "").slice(0, 26);
    if (usernames.has(username)) username = `${username}.${placeOf(b.place).slug.split("-")[0]}`.slice(0, 30);
    usernames.add(username);
    const links: SocialLink[] = [
      { platform: "whatsapp", url: `https://wa.me/${phone().slice(1)}` },
      ...(b.links ?? []).map((platform): SocialLink => {
        const handle = username.replace(/\./g, "_");
        if (platform === "phone") return { platform, url: `tel:${phone()}` };
        if (platform === "website") return { platform, url: `https://${username.replace(/\./g, "")}.com` };
        if (platform === "facebook") return { platform, url: `https://facebook.com/${handle}` };
        if (platform === "tiktok") return { platform, url: `https://tiktok.com/@${handle}` };
        return { platform, url: `https://instagram.com/${handle}` };
      }),
    ];
    const [row] = await tx
      .insert(businesses)
      .values({
        username,
        name: b.name,
        bio: b.bio,
        category: b.category,
        timeZone: "Africa/Cairo",
        ownerId,
        createdById: ownerId ?? pick(activeIds),
        verified: status === "active" && chance(0.4),
        status,
        links,
        hours: weekOf(b.hours),
        createdAt: ago(80),
      })
      .returning({ id: businesses.id });
    made.push({ id: row.id, place: b.place, ownerId, category: b.category, status });

    // Its branch(es): a street in the place, the pin a little off its center.
    await tx.insert(businessLocations).values(
      [b.place, ...(b.branch ? [b.branch] : [])].map((slug, position) => {
        const p = placeOf(slug);
        const [streetEn, streetAr] = pick(STREETS[slug] ?? STREETS[p.parent ?? slug] ?? [["Main St", "الشارع الرئيسي"]]);
        const number = between(1, 140);
        return {
          businessId: row.id,
          position,
          address: { en: `${number} ${streetEn}, ${p.name.en}`, ar: `${number} ${streetAr}، ${p.name.ar}` },
          lat: p.at[0] + (rand() - 0.5) / 120,
          lng: p.at[1] + (rand() - 0.5) / 120,
          placeId: placeId.get(slug)!,
        };
      }),
    );
  }
  const live = made.filter((b) => b.status === "active");

  // Posts: every type, more in the big cities, by people and by businesses
  // (offers and announcements are a business's).
  const postRows: { id: string; placeId: string; type: string; createdById: string }[] = [];
  const TYPES = Object.keys(TEXTS) as PostType[];
  const asBusiness = new Set<PostType>(["offer", "announcement"]);
  const BIG = new Set(["cairo", "maadi", "zamalek", "nasr-city", "giza", "mohandessin", "alexandria", "smouha", "mansoura", "toriel", "hurghada"]);
  for (const slug of slugs) {
    const count = BIG.has(slug) ? between(12, 18) : between(3, 7);
    // A business here, or under it (a post in Maadi can come from Degla).
    const local = live.filter((b) => b.ownerId && (b.place === slug || placeOf(b.place).parent === slug));
    for (let i = 0; i < count; i++) {
      const type = TYPES[(i * 3 + slug.length) % TYPES.length];
      const business = asBusiness.has(type) ? (local.length ? pick(local) : null) : chance(0.12) && local.length ? pick(local) : null;
      if (asBusiness.has(type) && !business) continue;
      const createdAt = ago(30);
      const [row] = await tx
        .insert(posts)
        .values({
          createdById: business?.ownerId ?? pick(activeIds),
          businessId: business?.id ?? null,
          type,
          body: pick(TEXTS[type]),
          placeId: placeId.get(slug)!,
          data: (type === "offer"
            ? { price: pick(["20% off", "450 EGP", "2 for 1", "Free delivery", "30% off"]), endsOn: isoDay(between(-3, 21)) }
            : {}) as AnyPostData,
          createdAt,
          updatedAt: createdAt,
        })
        .returning({ id: posts.id, placeId: posts.placeId, type: posts.type, createdById: posts.createdById });
      postRows.push(row);
    }
  }

  // Replies, votes and saves (never on your own post).
  for (const post of postRows) {
    const replies = post.type === "question" ? between(1, 5) : between(0, 3);
    for (let r = 0; r < replies; r++) {
      const at = ago(10);
      await tx.insert(posts).values({ parentId: post.id, type: post.type as PostType, placeId: post.placeId, body: pick(REPLIES), createdById: pick(activeIds), createdAt: at, updatedAt: at });
    }
    const voters = some(activeIds, between(0, 14)).filter((id) => id !== post.createdById);
    if (voters.length) await tx.insert(postVotes).values(voters.map((userId) => ({ userId, postId: post.id, value: chance(0.85) ? 1 : -1 })));
    const savers = some(activeIds, between(0, 4));
    if (savers.length) await tx.insert(postSaves).values(savers.map((userId) => ({ userId, postId: post.id })));
  }

  // Follows and reviews — never by its owner or whoever added it.
  for (const business of made) {
    const [{ createdById }] = await tx.select({ createdById: businesses.createdById }).from(businesses).where(eq(businesses.id, business.id));
    const outsiders = activeIds.filter((id) => id !== business.ownerId && id !== createdById);
    const fans = some(outsiders, between(2, 25));
    if (fans.length) await tx.insert(businessFollows).values(fans.map((userId) => ({ userId, businessId: business.id, createdAt: ago(60) })));
    if (business.status === "pending") continue;
    const critics = some(outsiders, between(0, 12));
    if (critics.length)
      await tx.insert(businessReviews).values(
        critics.map((authorId) => {
          const rating = pick(RATINGS);
          const at = ago(60);
          return { businessId: business.id, authorId, rating, text: pick(REVIEWS[rating]), createdAt: at, updatedAt: at };
        }),
      );
  }

  // Tickets: what people asked for and reported. Waiting ones hold their
  // `openKey` (one per sender and subject, like `openTicket`); answered
  // ones get their answer in history, by the super admin.
  const [superAdmin] = await tx.select({ id: users.id }).from(users).where(eq(users.role, "super_admin")).limit(1);
  const ticket = async (
    type: TicketType,
    createdById: string,
    refs: TicketRef[],
    data: Record<string, unknown>,
    createdAt: Date,
    answer?: { status: "approved" | "rejected" | "dismissed"; note?: string; at: Date },
  ) => {
    const extra = type === "new_place" ? String((data.name as { en?: string }).en ?? "").toLowerCase() : "";
    const key = [type, createdById, ...refs.map((ref) => `${ref.table}:${ref.id}`), extra].filter(Boolean).join(":");
    // Answered only when there's a super admin to have answered it.
    const status = answer && superAdmin ? answer.status : "open";
    const [row] = await tx
      .insert(tickets)
      .values({ type, status, createdById, refs, data, createdAt, openKey: status === "open" ? key : null })
      .returning({ id: tickets.id });
    if (answer && superAdmin) {
      const action = answer.status === "approved" ? "ticket.approve" : answer.status === "rejected" ? "ticket.reject" : "ticket.dismiss";
      await tx.insert(history).values({ entry: "action", actorId: superAdmin.id, source: "seed", action, input: { ticketId: row.id }, note: answer.note ?? null, at: answer.at });
    }
    return row.id;
  };
  const place = (slug: string): TicketRef => ({ table: "places", id: placeId.get(slug)! });
  const person = (i: number): TicketRef => ({ table: "users", id: personIds[i] });
  const neighborhood = typeId("Neighborhood");

  // New places: waiting (two asking for the same one), one rejected with a reason.
  await ticket("new_place", personIds[10], [place("cairo")], { name: { en: "Garden City", ar: "جاردن سيتي" }, typeId: neighborhood, reason: "Lots of offices and cafés here." }, ago(5));
  await ticket("new_place", personIds[11], [place("cairo")], { name: { en: "Garden City" }, typeId: neighborhood, reason: "I live here." }, ago(3));
  await ticket("new_place", personIds[12], [place("giza")], { name: { en: "6th of October", ar: "6 أكتوبر" }, typeId: typeId("City"), reason: "Big city, no page yet." }, ago(4));
  await ticket("new_place", personIds[13], [place("maadi")], { name: { en: "Zahraa El Maadi", ar: "زهراء المعادي" }, customType: "Compound", reason: "" }, ago(2));
  await ticket("new_place", personIds[15], [place("hurghada")], { name: { en: "El Kawthar", ar: "الكوثر" }, typeId: neighborhood, reason: "Most of the new apartments are here." }, ago(1));
  await ticket("new_place", personIds[14], [place("alexandria")], { name: { en: "Stanley", ar: "ستانلي" }, typeId: neighborhood, reason: "" }, ago(9), {
    status: "rejected",
    note: "Part of Gleem for now — pick Gleem.",
    at: ago(1),
  });

  // "It closed" reports about live businesses.
  for (const [i, business] of live.filter((b) => b.ownerId).slice(0, 3).entries()) {
    await ticket("close_business", activeIds[(i + 20) % activeIds.length], [{ table: "businesses", id: business.id }], { note: i === 0 ? "Shutters down for two weeks." : "" }, ago(4));
  }

  // Reports: open ones on posts (some more reported than others), a post
  // already hidden, one hidden then edited (waiting), business reports, a
  // review and a person.
  const reported = postRows.filter((p) => p.type !== "offer" && p.type !== "announcement").slice(0, 6);
  for (const [i, post] of reported.slice(0, 4).entries()) {
    for (let j = 0; j <= i; j++) {
      const reporterId = activeIds[(i * 3 + j + 25) % activeIds.length];
      if (reporterId === post.createdById) continue;
      const reason = (["spam", "offensive", "not_for_qura", "wrong_place"] as const)[(i + j) % 4];
      await ticket("report_post", reporterId, [{ table: "posts", id: post.id }], { reason, note: j === 0 && i === 1 ? "Rude language." : "" }, ago(3));
    }
  }
  if (superAdmin) {
    const hide = async (post: (typeof reported)[number], note: string, status: "hidden" | "under_review", at: Date) => {
      await tx.update(posts).set({ status }).where(eq(posts.id, post.id));
      await tx.insert(history).values({ entry: "action", actorId: superAdmin.id, source: "seed", action: "post.hide", input: { postId: post.id }, note, at });
    };
    await hide(reported[4], "Please remove the phone number.", "hidden", ago(5));
    await hide(reported[5], "This belongs in Jobs.", "under_review", ago(6));
  }
  await ticket("report_business", activeIds[30], [{ table: "businesses", id: live[2].id }], { reason: "fake", note: "Phone number doesn't work." }, ago(2));
  await ticket("report_business", activeIds[31], [{ table: "businesses", id: live[5].id }], { reason: "wrong_info", note: "Hours are wrong on Fridays." }, ago(4));
  await ticket("report_business", activeIds[32], [{ table: "businesses", id: live[9].id }], { reason: "offensive", note: "" }, ago(6), { status: "dismissed", at: ago(2) });
  const [someReview] = await tx.select({ id: businessReviews.id, authorId: businessReviews.authorId }).from(businessReviews).where(eq(businessReviews.rating, 1)).limit(1);
  if (someReview) {
    const reporter = activeIds.find((id) => id !== someReview.authorId)!;
    await ticket("report_review", reporter, [{ table: "business_reviews", id: someReview.id }], { reason: "fake", note: "They never went there." }, ago(2));
  }
  await ticket("report_user", activeIds[33], [person(24)], { reason: "spam", note: "Posts the same ad everywhere." }, ago(2));

  return { places: PLACES.length, people: people.length, businesses: made.length, posts: postRows.length };
}
