// Business categories: what a business profile is ("Café", "Nails"…), as a
// tree of any depth. A business picks one category at any level (a
// full-service salon picks "salon", a nail bar "nails"); browsing a
// category shows its whole subtree. Slugs are unique across the tree and
// stored (never rename one — it's saved data); `name` is shown in the app
// language. A child without an `icon` uses its parent's. Client-safe.

import {
  Airplane01Icon,
  Building03Icon,
  Car01Icon,
  Coffee01Icon,
  Dumbbell01Icon,
  Hotel01Icon,
  Medicine02Icon,
  Mortarboard01Icon,
  Restaurant01Icon,
  Scissor01Icon,
  Shirt01Icon,
  ShoppingBasket01Icon,
  Stethoscope02Icon,
  Store01Icon,
  Ticket01Icon,
  Wrench01Icon,
  type IconSvgElement,
} from "@/components/icons";
import type { Locale } from "@/lib/i18n/config";

type CategoryNode = {
  slug: string;
  icon?: IconSvgElement;
  name: Record<Locale, string>;
  children?: readonly CategoryNode[];
};

/** A category with its place in the tree resolved. */
export type Category = {
  slug: string;
  icon: IconSvgElement;
  name: Record<Locale, string>;
  /** Parent slug; `null` at the top. */
  parent: string | null;
  children: Category[];
};

const n = (
  slug: string,
  en: string,
  ar: string,
  children?: readonly CategoryNode[],
) => ({ slug, name: { en, ar }, children }) as const;

const TREE = [
  {
    slug: "restaurant",
    icon: Restaurant01Icon,
    name: { en: "Restaurant", ar: "مطعم" },
    children: [
      n("traditional", "Egyptian food", "أكل مصري"),
      n("grill", "Grill", "مشويات"),
      n("seafood", "Seafood", "مأكولات بحرية"),
      n("pizza", "Pizza", "بيتزا"),
      n("fast-food", "Fast food", "وجبات سريعة"),
    ],
  },
  {
    slug: "cafe",
    icon: Coffee01Icon,
    name: { en: "Café", ar: "مقهى" },
    children: [
      n("coffee-shop", "Coffee shop", "كافيه"),
      n("juice-bar", "Juice bar", "عصائر"),
      n("bakery", "Bakery & sweets", "مخبز وحلويات"),
    ],
  },
  {
    slug: "hotel",
    icon: Hotel01Icon,
    name: { en: "Hotel", ar: "فندق" },
    children: [
      n("resort", "Resort", "منتجع"),
      n("apartments", "Holiday apartments", "شقق فندقية"),
      n("hostel", "Hostel", "نُزل"),
    ],
  },
  {
    slug: "tourism",
    icon: Airplane01Icon,
    name: { en: "Tours & travel", ar: "سياحة وسفر" },
    children: [
      n("travel-agency", "Travel agency", "شركة سياحة"),
      n("nile-cruise", "Nile cruise", "رحلات نيلية"),
      n("tour-guide", "Tour guide", "مرشد سياحي"),
    ],
  },
  {
    slug: "grocery",
    icon: ShoppingBasket01Icon,
    name: { en: "Grocery", ar: "بقالة وسوبر ماركت" },
    children: [
      n("supermarket", "Supermarket", "سوبر ماركت"),
      n("butcher", "Butcher", "جزارة"),
      n("produce", "Fruit & vegetables", "خضار وفاكهة"),
    ],
  },
  {
    slug: "shop",
    icon: Store01Icon,
    name: { en: "Shop", ar: "متجر" },
    children: [
      n("electronics", "Electronics", "إلكترونيات"),
      n("phones", "Mobile phones", "موبايلات"),
      n("furniture", "Furniture", "أثاث"),
      n("gifts", "Gifts", "هدايا"),
      n("bookstore", "Bookstore", "مكتبة"),
    ],
  },
  {
    slug: "fashion",
    icon: Shirt01Icon,
    name: { en: "Clothing & fashion", ar: "ملابس وأزياء" },
    children: [
      n("womens", "Women's clothing", "ملابس حريمي"),
      n("mens", "Men's clothing", "ملابس رجالي"),
      n("kids", "Kids' clothing", "ملابس أطفال"),
      n("shoes", "Shoes & bags", "أحذية وشنط"),
    ],
  },
  {
    slug: "pharmacy",
    icon: Medicine02Icon,
    name: { en: "Pharmacy", ar: "صيدلية" },
  },
  {
    slug: "health",
    icon: Stethoscope02Icon,
    name: { en: "Clinic & health", ar: "عيادة وصحة" },
    children: [
      n("clinic", "Clinic", "عيادة", [
        n("dentist", "Dentist", "أسنان"),
        n("pediatrics", "Pediatrics", "أطفال"),
        n("dermatology", "Dermatology", "جلدية"),
        n("gynecology", "Gynecology", "نساء وتوليد"),
      ]),
      n("lab", "Medical lab", "معمل تحاليل"),
      n("optician", "Optician", "نظارات"),
      n("physio", "Physiotherapy", "علاج طبيعي"),
    ],
  },
  {
    slug: "beauty",
    icon: Scissor01Icon,
    name: { en: "Beauty & salon", ar: "تجميل وصالون" },
    children: [
      n("salon", "Salon", "صالون", [
        n("hair", "Hair salon", "تصفيف شعر"),
        n("nails", "Nails", "أظافر"),
        n("spa", "Spa & massage", "سبا ومساج"),
        n("barber", "Barber", "حلاق"),
        n("makeup", "Make-up", "مكياج"),
      ]),
      n("cosmetics", "Cosmetics shop", "مستحضرات تجميل"),
    ],
  },
  {
    slug: "fitness",
    icon: Dumbbell01Icon,
    name: { en: "Gym & fitness", ar: "صالة رياضية" },
    children: [
      n("gym", "Gym", "جيم"),
      n("yoga", "Yoga & pilates", "يوجا وبيلاتس"),
      n("martial-arts", "Martial arts", "فنون قتالية"),
      n("swimming", "Swimming", "سباحة"),
    ],
  },
  {
    slug: "education",
    icon: Mortarboard01Icon,
    name: { en: "Education", ar: "تعليم" },
    children: [
      n("school", "School", "مدرسة"),
      n("nursery", "Nursery", "حضانة"),
      n("tutoring", "Tutoring", "دروس خصوصية"),
      n("languages", "Language center", "مركز لغات"),
    ],
  },
  {
    slug: "real-estate",
    icon: Building03Icon,
    name: { en: "Real estate", ar: "عقارات" },
  },
  {
    slug: "transport",
    icon: Car01Icon,
    name: { en: "Transport", ar: "نقل ومواصلات" },
    children: [
      n("car-rental", "Car rental", "تأجير سيارات"),
      n("taxi", "Taxi", "تاكسي"),
      n("delivery", "Delivery", "توصيل"),
    ],
  },
  {
    slug: "services",
    icon: Wrench01Icon,
    name: { en: "Repairs & services", ar: "صيانة وخدمات" },
    children: [
      n("car-repair", "Car repair", "صيانة سيارات"),
      n("plumbing", "Plumbing", "سباكة"),
      n("electrician", "Electrician", "كهربائي"),
      n("phone-repair", "Phone repair", "صيانة موبايلات"),
      n("cleaning", "Cleaning", "تنظيف"),
    ],
  },
  {
    slug: "entertainment",
    icon: Ticket01Icon,
    name: { en: "Events & entertainment", ar: "فعاليات وترفيه" },
    children: [
      n("venue", "Event venue", "قاعة مناسبات"),
      n("kids-play", "Kids' play area", "ملاهي أطفال"),
      n("photography", "Photography", "تصوير"),
    ],
  },
] as const satisfies readonly CategoryNode[];

/** A slug from the tree, at any depth (checked at runtime: `categoryOf`). */
export type CategorySlug = string;

const BY_SLUG = new Map<string, Category>();

function build(
  nodes: readonly CategoryNode[],
  parent: Category | null,
): Category[] {
  return nodes.map((node) => {
    if (BY_SLUG.has(node.slug)) throw new Error(`Duplicate category: ${node.slug}`);
    const category: Category = {
      slug: node.slug,
      name: node.name,
      icon: node.icon ?? parent?.icon ?? Store01Icon,
      parent: parent?.slug ?? null,
      children: [],
    };
    BY_SLUG.set(node.slug, category);
    category.children = build(node.children ?? [], category);
    return category;
  });
}

/** The top-level categories (each with its `children`). */
export const CATEGORIES: Category[] = build(TREE, null);

/** Every slug, at any depth (for validation). */
export const CATEGORY_SLUGS = [...BY_SLUG.keys()] as [string, ...string[]];

/** The category for a slug, or `undefined` for an unknown one (old data). */
export const categoryOf = (slug: string) => BY_SLUG.get(slug);

/** From the top down to `slug` itself: [Beauty, Salon, Nails]. */
export function pathOf(slug: string): Category[] {
  const path: Category[] = [];
  for (let c = categoryOf(slug); c; c = c.parent ? categoryOf(c.parent) : undefined)
    path.unshift(c);
  return path;
}

/** `slug` and every slug under it — what browsing that category shows. */
export function subtreeOf(slug: string): Set<string> {
  const slugs = new Set<string>();
  const walk = (c: Category) => {
    slugs.add(c.slug);
    c.children.forEach(walk);
  };
  const root = categoryOf(slug);
  if (root) walk(root);
  return slugs;
}

/** Every category, depth-first (parents before their children). */
export const ALL_CATEGORIES: Category[] = [...BY_SLUG.values()];
