import type { LucideIcon } from 'lucide-react-native';
import {
  Baby,
  Banknote,
  Bike,
  BookOpen,
  Camera,
  CarFront,
  CookingPot,
  CreditCard,
  Crown,
  Dumbbell,
  Footprints,
  Gamepad2,
  Gem,
  GraduationCap,
  Headphones,
  House,
  Lamp,
  Laptop,
  PackageCheck,
  Plane,
  Printer,
  SprayCan,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sofa,
  Sparkles,
  Tablet,
  Ticket,
  ToyBrick,
  Trophy,
  Tv,
  WashingMachine,
  Watch,
  Wrench,
} from 'lucide-react-native';

export type ProductCategoryKey =
  | 'home-living'
  | 'umrah'
  | 'education'
  | 'cars'
  | 'bikes'
  | 'mobiles'
  | 'laptops'
  | 'tablets'
  | 'smartwatches'
  | 'gaming'
  | 'tvs'
  | 'audio'
  | 'cameras'
  | 'home-appliances'
  | 'kitchen-appliances'
  | 'furniture'
  | 'home-decor'
  | 'fashion'
  | 'shoes'
  | 'watches'
  | 'perfumes'
  | 'beauty'
  | 'jewelry'
  | 'fitness'
  | 'sports'
  | 'travel'
  | 'gift-cards'
  | 'vouchers'
  | 'cash-prizes'
  | 'grocery'
  | 'baby'
  | 'kids-toys'
  | 'books'
  | 'office'
  | 'tools'
  | 'luxury';

export type CategorySelection = 'all' | ProductCategoryKey;

export type ProductCategory = {
  key: ProductCategoryKey;
  label: string;
  group: CategoryGroupKey;
  icon: LucideIcon;
  keywords: RegExp;
};

export type CategoryGroupKey =
  | 'electronics'
  | 'vehicles'
  | 'home'
  | 'fashion'
  | 'experiences'
  | 'sports'
  | 'family'
  | 'rewards'
  | 'premium';

export const CATEGORY_GROUP_LABELS: Record<CategoryGroupKey, string> = {
  electronics: 'Electronics',
  vehicles: 'Vehicles',
  home: 'Home & Living',
  fashion: 'Fashion & Beauty',
  experiences: 'Travel & Experiences',
  sports: 'Sports & Fitness',
  family: 'Family',
  rewards: 'Rewards',
  premium: 'Premium',
};

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { key: 'mobiles', label: 'Mobiles', group: 'electronics', icon: Smartphone, keywords: /(mobile|phone|iphone|samsung galaxy|pixel|oppo|vivo|infinix|tecno|realme)/i },
  { key: 'laptops', label: 'Laptops', group: 'electronics', icon: Laptop, keywords: /(laptop|macbook|notebook|chromebook)/i },
  { key: 'tablets', label: 'Tablets', group: 'electronics', icon: Tablet, keywords: /(tablet|ipad|galaxy tab)/i },
  { key: 'smartwatches', label: 'Smartwatches', group: 'electronics', icon: Watch, keywords: /(smartwatch|smart watch|apple watch|galaxy watch|fitness band)/i },
  { key: 'gaming', label: 'Gaming Consoles', group: 'electronics', icon: Gamepad2, keywords: /(gaming console|playstation|ps5|ps4|xbox|nintendo|steam deck)/i },
  { key: 'tvs', label: 'TVs', group: 'electronics', icon: Tv, keywords: /(\btv\b|television|smart tv|led tv|oled|qled)/i },
  { key: 'audio', label: 'Audio', group: 'electronics', icon: Headphones, keywords: /(speaker|headphone|earphone|earbuds|airpods|soundbar|audio)/i },
  { key: 'cameras', label: 'Cameras', group: 'electronics', icon: Camera, keywords: /(camera|dslr|mirrorless|gopro|action cam)/i },

  { key: 'cars', label: 'Cars', group: 'vehicles', icon: CarFront, keywords: /(\bcar\b|toyota|honda civic|honda city|suzuki alto|kia|hyundai|changan|mg hs)/i },
  { key: 'bikes', label: 'Bikes', group: 'vehicles', icon: Bike, keywords: /(bike|motorcycle|honda cg|honda cd|yamaha|suzuki gs|scooter)/i },

  { key: 'home-living', label: 'Home & Living', group: 'home', icon: House, keywords: /(home & living|home and living|household|home essentials)/i },
  { key: 'home-appliances', label: 'Home Appliances', group: 'home', icon: WashingMachine, keywords: /(washing machine|refrigerator|fridge|air conditioner|\bac\b|vacuum|iron|water dispenser|home appliance)/i },
  { key: 'kitchen-appliances', label: 'Kitchen Appliances', group: 'home', icon: CookingPot, keywords: /(kitchen|microwave|air fryer|blender|juicer|oven|coffee maker|toaster|food processor)/i },
  { key: 'furniture', label: 'Furniture', group: 'home', icon: Sofa, keywords: /(furniture|sofa|bed set|dining table|wardrobe|chair|desk)/i },
  { key: 'home-decor', label: 'Home Décor', group: 'home', icon: Lamp, keywords: /(home decor|home décor|lamp|wall art|rug|carpet|curtain|decoration)/i },
  { key: 'grocery', label: 'Grocery Items', group: 'home', icon: ShoppingBasket, keywords: /(grocery|ration|food hamper|monthly groceries|household supplies)/i },
  { key: 'tools', label: 'Tools', group: 'home', icon: Wrench, keywords: /(tool kit|tools|drill machine|hardware|workshop)/i },

  { key: 'fashion', label: 'Fashion', group: 'fashion', icon: Shirt, keywords: /(fashion|clothing|dress|suit|shalwar|kurta|jacket|handbag)/i },
  { key: 'shoes', label: 'Shoes', group: 'fashion', icon: Footprints, keywords: /(shoe|sneaker|footwear|sandals|boots)/i },
  { key: 'watches', label: 'Watches', group: 'fashion', icon: Watch, keywords: /(\bwatch\b|wristwatch|rolex|timepiece)/i },
  { key: 'perfumes', label: 'Perfumes', group: 'fashion', icon: SprayCan, keywords: /(perfume|fragrance|cologne|attar)/i },
  { key: 'beauty', label: 'Beauty Products', group: 'fashion', icon: Sparkles, keywords: /(beauty|makeup|skincare|cosmetic|salon)/i },
  { key: 'jewelry', label: 'Jewelry', group: 'fashion', icon: Gem, keywords: /(jewelry|jewellery|gold set|diamond|necklace|bracelet|ring)/i },

  { key: 'umrah', label: 'Umrah Packages', group: 'experiences', icon: PackageCheck, keywords: /(umrah|makkah|madinah|pilgrimage)/i },
  { key: 'travel', label: 'Travel Packages', group: 'experiences', icon: Plane, keywords: /(travel|tour package|holiday package|trip to|flight ticket|vacation)/i },
  { key: 'education', label: 'Courses & Education', group: 'experiences', icon: GraduationCap, keywords: /(course|education|training|scholarship|tuition|certification)/i },

  { key: 'fitness', label: 'Fitness Equipment', group: 'sports', icon: Dumbbell, keywords: /(fitness|gym|treadmill|exercise bike|dumbbell|workout)/i },
  { key: 'sports', label: 'Sports Items', group: 'sports', icon: Trophy, keywords: /(sports|cricket|football|badminton|racket|sports kit)/i },

  { key: 'baby', label: 'Baby Products', group: 'family', icon: Baby, keywords: /(baby|stroller|diaper|feeding|infant)/i },
  { key: 'kids-toys', label: 'Kids Toys', group: 'family', icon: ToyBrick, keywords: /(toy|kids|children|lego|doll|remote control car)/i },
  { key: 'books', label: 'Books', group: 'family', icon: BookOpen, keywords: /(book|novel|encyclopedia|reading set)/i },

  { key: 'gift-cards', label: 'Gift Cards', group: 'rewards', icon: CreditCard, keywords: /(gift card|amazon card|google play card|apple card|steam card)/i },
  { key: 'vouchers', label: 'Vouchers', group: 'rewards', icon: Ticket, keywords: /(voucher|coupon|shopping credit)/i },
  { key: 'cash-prizes', label: 'Cash Prizes', group: 'rewards', icon: Banknote, keywords: /(cash prize|cash reward|\brs\.?\s?[\d,]+\s?cash\b)/i },

  { key: 'office', label: 'Office Equipment', group: 'premium', icon: Printer, keywords: /(office|printer|scanner|projector|photocopier|office chair)/i },
  { key: 'luxury', label: 'Premium Luxury Items', group: 'premium', icon: Crown, keywords: /(premium|luxury|designer|limited edition)/i },
];

export const QUICK_CATEGORY_KEYS = [
  'all',
  'mobiles',
  'cars',
  'bikes',
  'home-living',
  'fashion',
  'cash-prizes',
] as const satisfies readonly CategorySelection[];

export function getCategoryByKey(key: CategorySelection) {
  return key === 'all'
    ? null
    : PRODUCT_CATEGORIES.find((category) => category.key === key) || null;
}

export function getProductCategory(name: string): ProductCategoryKey | null {
  return PRODUCT_CATEGORIES.find((category) => category.keywords.test(name))?.key || null;
}
