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
  fr: string,
  children?: readonly CategoryNode[],
) => ({ slug, name: { en, ar, fr }, children }) as const;

const TREE = [
  {
    slug: "restaurant",
    icon: Restaurant01Icon,
    name: { en: "Restaurant", ar: "مطعم", fr: "Restaurant" },
    children: [
      n("traditional", "Egyptian food", "أكل مصري", "Cuisine égyptienne"),
      n("grill", "Grill", "مشويات", "Grillades"),
      n("seafood", "Seafood", "مأكولات بحرية", "Fruits de mer"),
      n("pizza", "Pizza", "بيتزا", "Pizza"),
      n("fast-food", "Fast food", "وجبات سريعة", "Restauration rapide"),
    ],
  },
  {
    slug: "cafe",
    icon: Coffee01Icon,
    name: { en: "Café", ar: "مقهى", fr: "Café" },
    children: [
      n("coffee-shop", "Coffee shop", "كافيه", "Coffee shop"),
      n("juice-bar", "Juice bar", "عصائر", "Bar à jus"),
      n("bakery", "Bakery & sweets", "مخبز وحلويات", "Boulangerie et pâtisserie"),
    ],
  },
  {
    slug: "hotel",
    icon: Hotel01Icon,
    name: { en: "Hotel", ar: "فندق", fr: "Hôtel" },
    children: [
      n("resort", "Resort", "منتجع", "Complexe hôtelier"),
      n("apartments", "Holiday apartments", "شقق فندقية", "Appartements de vacances"),
      n("hostel", "Hostel", "نُزل", "Auberge"),
    ],
  },
  {
    slug: "tourism",
    icon: Airplane01Icon,
    name: { en: "Tours & travel", ar: "سياحة وسفر", fr: "Tourisme et voyages" },
    children: [
      n("travel-agency", "Travel agency", "شركة سياحة", "Agence de voyages"),
      n("nile-cruise", "Nile cruise", "رحلات نيلية", "Croisière sur le Nil"),
      n("tour-guide", "Tour guide", "مرشد سياحي", "Guide touristique"),
    ],
  },
  {
    slug: "grocery",
    icon: ShoppingBasket01Icon,
    name: { en: "Grocery", ar: "بقالة وسوبر ماركت", fr: "Épicerie" },
    children: [
      n("supermarket", "Supermarket", "سوبر ماركت", "Supermarché"),
      n("butcher", "Butcher", "جزارة", "Boucherie"),
      n("produce", "Fruit & vegetables", "خضار وفاكهة", "Fruits et légumes"),
    ],
  },
  {
    slug: "shop",
    icon: Store01Icon,
    name: { en: "Shop", ar: "متجر", fr: "Boutique" },
    children: [
      n("electronics", "Electronics", "إلكترونيات", "Électronique"),
      n("phones", "Mobile phones", "موبايلات", "Téléphones"),
      n("furniture", "Furniture", "أثاث", "Meubles"),
      n("gifts", "Gifts", "هدايا", "Cadeaux"),
      n("bookstore", "Bookstore", "مكتبة", "Librairie"),
    ],
  },
  {
    slug: "fashion",
    icon: Shirt01Icon,
    name: { en: "Clothing & fashion", ar: "ملابس وأزياء", fr: "Mode et vêtements" },
    children: [
      n("womens", "Women's clothing", "ملابس حريمي", "Mode femme"),
      n("mens", "Men's clothing", "ملابس رجالي", "Mode homme"),
      n("kids", "Kids' clothing", "ملابس أطفال", "Mode enfant"),
      n("shoes", "Shoes & bags", "أحذية وشنط", "Chaussures et sacs"),
    ],
  },
  {
    slug: "pharmacy",
    icon: Medicine02Icon,
    name: { en: "Pharmacy", ar: "صيدلية", fr: "Pharmacie" },
  },
  {
    slug: "health",
    icon: Stethoscope02Icon,
    name: { en: "Clinic & health", ar: "عيادة وصحة", fr: "Clinique et santé" },
    children: [
      n("clinic", "Clinic", "عيادة", "Cabinet médical", [
        n("dentist", "Dentist", "أسنان", "Dentiste"),
        n("pediatrics", "Pediatrics", "أطفال", "Pédiatrie"),
        n("dermatology", "Dermatology", "جلدية", "Dermatologie"),
        n("gynecology", "Gynecology", "نساء وتوليد", "Gynécologie"),
      ]),
      n("lab", "Medical lab", "معمل تحاليل", "Laboratoire"),
      n("optician", "Optician", "نظارات", "Opticien"),
      n("physio", "Physiotherapy", "علاج طبيعي", "Kinésithérapie"),
    ],
  },
  {
    slug: "beauty",
    icon: Scissor01Icon,
    name: { en: "Beauty & salon", ar: "تجميل وصالون", fr: "Beauté et salon" },
    children: [
      n("salon", "Salon", "صالون", "Salon", [
        n("hair", "Hair salon", "تصفيف شعر", "Coiffure"),
        n("nails", "Nails", "أظافر", "Onglerie"),
        n("spa", "Spa & massage", "سبا ومساج", "Spa et massage"),
        n("barber", "Barber", "حلاق", "Barbier"),
        n("makeup", "Make-up", "مكياج", "Maquillage"),
      ]),
      n("cosmetics", "Cosmetics shop", "مستحضرات تجميل", "Cosmétiques"),
    ],
  },
  {
    slug: "fitness",
    icon: Dumbbell01Icon,
    name: { en: "Gym & fitness", ar: "صالة رياضية", fr: "Salle de sport" },
    children: [
      n("gym", "Gym", "جيم", "Salle de musculation"),
      n("yoga", "Yoga & pilates", "يوجا وبيلاتس", "Yoga et pilates"),
      n("martial-arts", "Martial arts", "فنون قتالية", "Arts martiaux"),
      n("swimming", "Swimming", "سباحة", "Natation"),
    ],
  },
  {
    slug: "education",
    icon: Mortarboard01Icon,
    name: { en: "Education", ar: "تعليم", fr: "Éducation" },
    children: [
      n("school", "School", "مدرسة", "École"),
      n("nursery", "Nursery", "حضانة", "Crèche"),
      n("tutoring", "Tutoring", "دروس خصوصية", "Soutien scolaire"),
      n("languages", "Language center", "مركز لغات", "Centre de langues"),
    ],
  },
  {
    slug: "real-estate",
    icon: Building03Icon,
    name: { en: "Real estate", ar: "عقارات", fr: "Immobilier" },
  },
  {
    slug: "transport",
    icon: Car01Icon,
    name: { en: "Transport", ar: "نقل ومواصلات", fr: "Transport" },
    children: [
      n("car-rental", "Car rental", "تأجير سيارات", "Location de voitures"),
      n("taxi", "Taxi", "تاكسي", "Taxi"),
      n("delivery", "Delivery", "توصيل", "Livraison"),
    ],
  },
  {
    slug: "services",
    icon: Wrench01Icon,
    name: { en: "Repairs & services", ar: "صيانة وخدمات", fr: "Réparations et services" },
    children: [
      n("car-repair", "Car repair", "صيانة سيارات", "Garage auto"),
      n("plumbing", "Plumbing", "سباكة", "Plomberie"),
      n("electrician", "Electrician", "كهربائي", "Électricien"),
      n("phone-repair", "Phone repair", "صيانة موبايلات", "Réparation de téléphones"),
      n("cleaning", "Cleaning", "تنظيف", "Nettoyage"),
    ],
  },
  {
    slug: "entertainment",
    icon: Ticket01Icon,
    name: { en: "Events & entertainment", ar: "فعاليات وترفيه", fr: "Événements et loisirs" },
    children: [
      n("venue", "Event venue", "قاعة مناسبات", "Salle de réception"),
      n("kids-play", "Kids' play area", "ملاهي أطفال", "Aire de jeux"),
      n("photography", "Photography", "تصوير", "Photographie"),
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
