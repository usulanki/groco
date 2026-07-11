import sequelize from "../config/database";
import "../models/index";

function slugify(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base, n = 1;
  while (true) {
    const [r] = await sequelize.query("SELECT id FROM products WHERE slug=? LIMIT 1", { replacements: [slug] }) as [any[], unknown];
    if (!r.length) return slug;
    slug = `${base}-${n++}`;
  }
}

function barcode(catIdx: number, pIdx: number, vIdx: number): string {
  return `89${String(catIdx + 1).padStart(2,"0")}${String(pIdx + 1).padStart(2,"0")}${vIdx + 1}000000`.slice(0, 13);
}

interface V { value: string; price: number; compare: number; }
interface P { name: string; brand: string; }
interface Cat {
  slug: string; code: string; attribute: string;
  variants: V[]; products: P[];
}

const DATA: Cat[] = [
  // ── FRUITS & VEGETABLES ────────────────────────────────────────────────────
  {
    slug: "fruits-vegetables-fresh-fruits", code: "FRF", attribute: "Weight",
    variants: [{ value: "500g", price: 79, compare: 99 }, { value: "1kg", price: 149, compare: 189 }],
    products: [
      { name: "Fresh Bananas", brand: "Farm Fresh" },
      { name: "Royal Gala Apples", brand: "Himalayan Orchard" },
      { name: "Sweet Oranges", brand: "Nagpur Select" },
    ],
  },
  {
    slug: "fruits-vegetables-fresh-vegetables", code: "FRV", attribute: "Weight",
    variants: [{ value: "250g", price: 29, compare: 39 }, { value: "500g", price: 49, compare: 65 }],
    products: [
      { name: "Fresh Tomatoes", brand: "Farm Fresh" },
      { name: "Baby Spinach Leaves", brand: "Green Valley" },
      { name: "Carrots", brand: "Nature's Basket" },
    ],
  },
  {
    slug: "fruits-vegetables-exotic-organic", code: "EXO", attribute: "Weight",
    variants: [{ value: "250g", price: 89, compare: 119 }, { value: "500g", price: 169, compare: 219 }],
    products: [
      { name: "Organic Avocados", brand: "Organic India" },
      { name: "Dragon Fruit", brand: "Exotic Farms" },
      { name: "Organic Kale", brand: "TrueLeaf Organic" },
    ],
  },
  {
    slug: "fruits-vegetables-herbs-seasonings", code: "HRB", attribute: "Weight",
    variants: [{ value: "50g", price: 19, compare: 29 }, { value: "100g", price: 35, compare: 49 }],
    products: [
      { name: "Fresh Coriander Leaves", brand: "Green Valley" },
      { name: "Fresh Mint Leaves", brand: "Nature's Basket" },
      { name: "Curry Leaves", brand: "Farm Fresh" },
    ],
  },
  {
    slug: "fruits-vegetables-cut-ready-to-cook", code: "CRC", attribute: "Weight",
    variants: [{ value: "250g", price: 49, compare: 65 }, { value: "500g", price: 89, compare: 115 }],
    products: [
      { name: "Mixed Stir Fry Vegetables", brand: "Fresh & Ready" },
      { name: "Biryani Cut Vegetables", brand: "Chef's Choice" },
      { name: "Soup Mix Vegetables", brand: "Fresh & Ready" },
    ],
  },
  // ── DAIRY, BREAD & EGGS ───────────────────────────────────────────────────
  {
    slug: "dairy-bread-eggs-milk", code: "MLK", attribute: "Volume",
    variants: [{ value: "500mL", price: 29, compare: 32 }, { value: "1L", price: 56, compare: 62 }],
    products: [
      { name: "Full Cream Milk", brand: "Amul" },
      { name: "Toned Milk", brand: "Mother Dairy" },
      { name: "Double Toned Milk", brand: "Nandini" },
    ],
  },
  {
    slug: "dairy-bread-eggs-curd-yogurt", code: "CYG", attribute: "Weight",
    variants: [{ value: "400g", price: 45, compare: 55 }, { value: "1kg", price: 99, compare: 120 }],
    products: [
      { name: "Fresh Dahi", brand: "Amul" },
      { name: "Mishti Doi", brand: "Srikhand" },
      { name: "Greek Yogurt", brand: "Epigamia" },
    ],
  },
  {
    slug: "dairy-bread-eggs-butter-ghee", code: "BTG", attribute: "Weight",
    variants: [{ value: "500g", price: 249, compare: 299 }, { value: "1kg", price: 479, compare: 569 }],
    products: [
      { name: "Pure Cow Ghee", brand: "Amul" },
      { name: "Unsalted Butter", brand: "Amul" },
      { name: "Desi Ghee", brand: "Patanjali" },
    ],
  },
  {
    slug: "dairy-bread-eggs-paneer-tofu", code: "PNT", attribute: "Weight",
    variants: [{ value: "200g", price: 79, compare: 95 }, { value: "500g", price: 189, compare: 225 }],
    products: [
      { name: "Fresh Paneer", brand: "Amul" },
      { name: "Malai Paneer", brand: "Mother Dairy" },
      { name: "Organic Tofu", brand: "Sofit" },
    ],
  },
  {
    slug: "dairy-bread-eggs-cheese", code: "CHS", attribute: "Weight",
    variants: [{ value: "200g", price: 119, compare: 149 }, { value: "400g", price: 225, compare: 279 }],
    products: [
      { name: "Processed Cheese Block", brand: "Amul" },
      { name: "Mozzarella Cheese", brand: "Britannia" },
      { name: "Cheddar Cheese Slices", brand: "Amul" },
    ],
  },
  {
    slug: "dairy-bread-eggs-eggs", code: "EGG", attribute: "Count",
    variants: [{ value: "6 Eggs", price: 55, compare: 65 }, { value: "12 Eggs", price: 105, compare: 125 }],
    products: [
      { name: "White Eggs", brand: "Suguna" },
      { name: "Brown Eggs", brand: "Country Hen" },
      { name: "Omega-3 Enriched Eggs", brand: "Eggoz" },
    ],
  },
  {
    slug: "dairy-bread-eggs-bread-pav", code: "BRD", attribute: "Pack Size",
    variants: [{ value: "6 Pcs", price: 35, compare: 42 }, { value: "12 Pcs", price: 65, compare: 79 }],
    products: [
      { name: "Sandwich Bread", brand: "Britannia" },
      { name: "Multigrain Bread", brand: "Harvest Gold" },
      { name: "Ladi Pav Buns", brand: "Wibs" },
    ],
  },
  // ── ATTA, RICE & DAL ──────────────────────────────────────────────────────
  {
    slug: "atta-rice-dal-wheat-flour-atta", code: "ATT", attribute: "Weight",
    variants: [{ value: "5kg", price: 229, compare: 269 }, { value: "10kg", price: 439, compare: 519 }],
    products: [
      { name: "Whole Wheat Chakki Atta", brand: "Aashirvaad" },
      { name: "Multigrain Atta", brand: "Patanjali" },
      { name: "Sharbati Wheat Atta", brand: "Nature Fresh" },
    ],
  },
  {
    slug: "atta-rice-dal-rice", code: "RCE", attribute: "Weight",
    variants: [{ value: "5kg", price: 299, compare: 359 }, { value: "10kg", price: 579, compare: 689 }],
    products: [
      { name: "Basmati Rice Extra Long", brand: "India Gate" },
      { name: "Sona Masoori Rice", brand: "24 Mantra" },
      { name: "Kolam Rice", brand: "Daawat" },
    ],
  },
  {
    slug: "atta-rice-dal-pulses-lentils", code: "PLG", attribute: "Weight",
    variants: [{ value: "500g", price: 79, compare: 99 }, { value: "1kg", price: 149, compare: 189 }],
    products: [
      { name: "Yellow Moong Dal", brand: "Tata Sampann" },
      { name: "Masoor Dal Red Lentils", brand: "24 Mantra" },
      { name: "Chana Dal Split Chickpeas", brand: "Patanjali" },
    ],
  },
  {
    slug: "atta-rice-dal-quinoa-millets", code: "QNM", attribute: "Weight",
    variants: [{ value: "500g", price: 149, compare: 199 }, { value: "1kg", price: 279, compare: 369 }],
    products: [
      { name: "White Quinoa", brand: "Organic India" },
      { name: "Foxtail Millet", brand: "24 Mantra" },
      { name: "Pearl Millet Bajra", brand: "Patanjali" },
    ],
  },
  {
    slug: "atta-rice-dal-semolina-flours", code: "SML", attribute: "Weight",
    variants: [{ value: "500g", price: 49, compare: 65 }, { value: "1kg", price: 89, compare: 119 }],
    products: [
      { name: "Semolina Rava Fine", brand: "Aashirvaad" },
      { name: "Besan Chickpea Flour", brand: "Tata Sampann" },
      { name: "Rice Flour", brand: "24 Mantra" },
    ],
  },
  // ── MASALA, OIL & SPICES ─────────────────────────────────────────────────
  {
    slug: "masala-oil-spices-cooking-oil", code: "OIL", attribute: "Volume",
    variants: [{ value: "1L", price: 139, compare: 169 }, { value: "5L", price: 649, compare: 799 }],
    products: [
      { name: "Sunflower Refined Oil", brand: "Saffola" },
      { name: "Mustard Oil Kachi Ghani", brand: "Patanjali" },
      { name: "Groundnut Oil", brand: "Fortune" },
    ],
  },
  {
    slug: "masala-oil-spices-whole-spices", code: "WSP", attribute: "Weight",
    variants: [{ value: "100g", price: 49, compare: 65 }, { value: "200g", price: 89, compare: 119 }],
    products: [
      { name: "Whole Black Pepper", brand: "Everest" },
      { name: "Whole Cloves Laung", brand: "MDH" },
      { name: "Green Cardamom Elaichi", brand: "Catch" },
    ],
  },
  {
    slug: "masala-oil-spices-ground-spices", code: "GSP", attribute: "Weight",
    variants: [{ value: "100g", price: 45, compare: 59 }, { value: "200g", price: 85, compare: 109 }],
    products: [
      { name: "Red Chilli Powder", brand: "Everest" },
      { name: "Turmeric Powder Haldi", brand: "MDH" },
      { name: "Coriander Powder Dhaniya", brand: "Catch" },
    ],
  },
  {
    slug: "masala-oil-spices-salt-sugar", code: "SLT", attribute: "Weight",
    variants: [{ value: "1kg", price: 25, compare: 30 }, { value: "5kg", price: 115, compare: 139 }],
    products: [
      { name: "Iodised Rock Salt", brand: "Tata Salt" },
      { name: "Refined Sugar", brand: "Dhampure" },
      { name: "Pink Himalayan Salt", brand: "Catch" },
    ],
  },
  {
    slug: "masala-oil-spices-vinegar-preservatives", code: "VNP", attribute: "Volume",
    variants: [{ value: "500mL", price: 79, compare: 99 }, { value: "1L", price: 139, compare: 175 }],
    products: [
      { name: "White Vinegar", brand: "Heinz" },
      { name: "Apple Cider Vinegar", brand: "Bragg" },
      { name: "Balsamic Vinegar", brand: "Urban Platter" },
    ],
  },
  {
    slug: "masala-oil-spices-condiments", code: "CDM", attribute: "Weight",
    variants: [{ value: "200g", price: 79, compare: 99 }, { value: "400g", price: 149, compare: 189 }],
    products: [
      { name: "Chaat Masala", brand: "Everest" },
      { name: "Garam Masala Powder", brand: "MDH" },
      { name: "Kitchen King Masala", brand: "MDH" },
    ],
  },
  // ── SNACKS & MUNCHIES ─────────────────────────────────────────────────────
  {
    slug: "snacks-munchies-chips-crisps", code: "CHP", attribute: "Weight",
    variants: [{ value: "50g", price: 20, compare: 25 }, { value: "200g", price: 75, compare: 95 }],
    products: [
      { name: "Classic Salted Potato Chips", brand: "Lays" },
      { name: "Magic Masala Chips", brand: "Lays" },
      { name: "Baked Multigrain Crisps", brand: "Bingo" },
    ],
  },
  {
    slug: "snacks-munchies-namkeen-bhujia", code: "NMK", attribute: "Weight",
    variants: [{ value: "200g", price: 69, compare: 85 }, { value: "500g", price: 159, compare: 199 }],
    products: [
      { name: "Aloo Bhujia", brand: "Haldirams" },
      { name: "Moong Dal Namkeen", brand: "Haldirams" },
      { name: "Mixed Farsan", brand: "Bikaji" },
    ],
  },
  {
    slug: "snacks-munchies-popcorn", code: "PPC", attribute: "Weight",
    variants: [{ value: "50g", price: 29, compare: 39 }, { value: "150g", price: 79, compare: 99 }],
    products: [
      { name: "Butter Popcorn", brand: "Acts II" },
      { name: "Classic Salted Popcorn", brand: "Bingo" },
      { name: "Cheese Popcorn", brand: "Crax" },
    ],
  },
  {
    slug: "snacks-munchies-peanuts-seeds", code: "PNS", attribute: "Weight",
    variants: [{ value: "200g", price: 49, compare: 65 }, { value: "500g", price: 119, compare: 149 }],
    products: [
      { name: "Roasted Salted Peanuts", brand: "Haldirams" },
      { name: "Chilli Peanuts", brand: "Too Yumm" },
      { name: "Mixed Seeds", brand: "Happilo" },
    ],
  },
  {
    slug: "snacks-munchies-protein-bars", code: "PRB", attribute: "Weight",
    variants: [{ value: "50g", price: 89, compare: 110 }, { value: "200g", price: 329, compare: 399 }],
    products: [
      { name: "Chocolate Fudge Protein Bar", brand: "RiteBite" },
      { name: "Peanut Butter Crunch Bar", brand: "Yoga Bar" },
      { name: "Dark Chocolate Almond Bar", brand: "Probar" },
    ],
  },
  {
    slug: "snacks-munchies-crackers", code: "CRK", attribute: "Weight",
    variants: [{ value: "100g", price: 35, compare: 45 }, { value: "200g", price: 65, compare: 85 }],
    products: [
      { name: "Multigrain Crackers", brand: "Britannia" },
      { name: "Digestive Crackers", brand: "McVities" },
      { name: "Wheat Crackers", brand: "Parle" },
    ],
  },
  // ── BEVERAGES ─────────────────────────────────────────────────────────────
  {
    slug: "beverages-cold-drinks-sodas", code: "CLD", attribute: "Volume",
    variants: [{ value: "330mL", price: 40, compare: 45 }, { value: "2L", price: 95, compare: 115 }],
    products: [
      { name: "Cola Classic", brand: "Coca Cola" },
      { name: "Lemon Lime Soda", brand: "Sprite" },
      { name: "Orange Fizz", brand: "Fanta" },
    ],
  },
  {
    slug: "beverages-juices-nectars", code: "JUC", attribute: "Volume",
    variants: [{ value: "200mL", price: 25, compare: 30 }, { value: "1L", price: 99, compare: 125 }],
    products: [
      { name: "Mixed Fruit Juice", brand: "Real" },
      { name: "Mango Nectar", brand: "Tropicana" },
      { name: "Apple Juice", brand: "B Natural" },
    ],
  },
  {
    slug: "beverages-water-sparkling", code: "WAT", attribute: "Volume",
    variants: [{ value: "500mL", price: 20, compare: 25 }, { value: "1L", price: 35, compare: 45 }],
    products: [
      { name: "Natural Mineral Water", brand: "Bisleri" },
      { name: "Sparkling Water", brand: "Perrier" },
      { name: "Packaged Drinking Water", brand: "Aquafina" },
    ],
  },
  {
    slug: "beverages-energy-drinks", code: "ENR", attribute: "Volume",
    variants: [{ value: "250mL", price: 115, compare: 135 }, { value: "330mL", price: 149, compare: 175 }],
    products: [
      { name: "Energy Drink Original", brand: "Red Bull" },
      { name: "Monster Energy", brand: "Monster" },
      { name: "Sting Energy Drink", brand: "PepsiCo" },
    ],
  },
  {
    slug: "beverages-milkshakes-smoothies", code: "MKS", attribute: "Volume",
    variants: [{ value: "200mL", price: 45, compare: 55 }, { value: "500mL", price: 99, compare: 125 }],
    products: [
      { name: "Chocolate Milkshake", brand: "Amul" },
      { name: "Mango Smoothie", brand: "Tropicana" },
      { name: "Strawberry Milk Shake", brand: "Mother Dairy" },
    ],
  },
  // ── TEA, COFFEE & HEALTH DRINKS ──────────────────────────────────────────
  {
    slug: "tea-coffee-health-drinks-tea", code: "TEA", attribute: "Weight",
    variants: [{ value: "250g", price: 119, compare: 149 }, { value: "500g", price: 229, compare: 285 }],
    products: [
      { name: "Premium Assam Tea", brand: "Tata Tea" },
      { name: "Gold Blend Tea", brand: "Brooke Bond" },
      { name: "Elaichi Chai Masala Tea", brand: "Wagh Bakri" },
    ],
  },
  {
    slug: "tea-coffee-health-drinks-coffee", code: "COF", attribute: "Weight",
    variants: [{ value: "100g", price: 149, compare: 185 }, { value: "200g", price: 279, compare: 349 }],
    products: [
      { name: "Classic Instant Coffee", brand: "Nescafe" },
      { name: "100% Arabica Ground Coffee", brand: "Bru" },
      { name: "Dark Roast Filter Coffee", brand: "Continental" },
    ],
  },
  {
    slug: "tea-coffee-health-drinks-health-nutrition-drinks", code: "HND", attribute: "Weight",
    variants: [{ value: "400g", price: 259, compare: 319 }, { value: "1kg", price: 579, compare: 699 }],
    products: [
      { name: "Chocolate Health Drink", brand: "Bournvita" },
      { name: "Vanilla Nutrition Drink", brand: "Horlicks" },
      { name: "Malt Based Health Drink", brand: "Complan" },
    ],
  },
  {
    slug: "tea-coffee-health-drinks-green-tea-herbal", code: "GRT", attribute: "Pack Size",
    variants: [{ value: "20 Pcs", price: 99, compare: 125 }, { value: "30 Pcs", price: 139, compare: 175 }],
    products: [
      { name: "Pure Green Tea Bags", brand: "Tetley" },
      { name: "Tulsi Green Tea", brand: "Organic India" },
      { name: "Chamomile Herbal Tea", brand: "Lipton" },
    ],
  },
  {
    slug: "tea-coffee-health-drinks-cocoa-malted-drinks", code: "CCM", attribute: "Weight",
    variants: [{ value: "400g", price: 199, compare: 249 }, { value: "1kg", price: 449, compare: 549 }],
    products: [
      { name: "Drinking Chocolate Powder", brand: "Cadbury" },
      { name: "Cocoa Powder", brand: "Weikfield" },
      { name: "Malted Milk Powder", brand: "Ovaltine" },
    ],
  },
  // ── BREAKFAST & CEREALS ───────────────────────────────────────────────────
  {
    slug: "breakfast-cereals-oats-cornflakes", code: "OAT", attribute: "Weight",
    variants: [{ value: "500g", price: 119, compare: 149 }, { value: "1kg", price: 219, compare: 275 }],
    products: [
      { name: "Rolled Oats", brand: "Quaker" },
      { name: "Honey Nut Cornflakes", brand: "Kelloggs" },
      { name: "Instant Oats Masala", brand: "Saffola" },
    ],
  },
  {
    slug: "breakfast-cereals-muesli-granola", code: "MUG", attribute: "Weight",
    variants: [{ value: "400g", price: 199, compare: 249 }, { value: "750g", price: 349, compare: 429 }],
    products: [
      { name: "Fruits & Nuts Muesli", brand: "Kelloggs" },
      { name: "Crunchy Granola", brand: "Yoga Bar" },
      { name: "Swiss Style Muesli", brand: "Dorset" },
    ],
  },
  {
    slug: "breakfast-cereals-porridge", code: "POR", attribute: "Weight",
    variants: [{ value: "400g", price: 89, compare: 115 }, { value: "1kg", price: 199, compare: 249 }],
    products: [
      { name: "Oat Porridge Mix", brand: "Quaker" },
      { name: "Daliya Broken Wheat", brand: "Aashirvaad" },
      { name: "Multigrain Porridge", brand: "Saffola" },
    ],
  },
  {
    slug: "breakfast-cereals-instant-breakfast-mixes", code: "IBM", attribute: "Weight",
    variants: [{ value: "200g", price: 79, compare: 99 }, { value: "500g", price: 179, compare: 225 }],
    products: [
      { name: "Instant Idli Mix", brand: "MTR" },
      { name: "Instant Upma Mix", brand: "MTR" },
      { name: "Dosa Mix Instant", brand: "Aashirvaad" },
    ],
  },
  {
    slug: "breakfast-cereals-honey-spreads", code: "HNY", attribute: "Weight",
    variants: [{ value: "250g", price: 119, compare: 149 }, { value: "500g", price: 219, compare: 269 }],
    products: [
      { name: "Pure Natural Honey", brand: "Dabur" },
      { name: "Strawberry Jam", brand: "Kissan" },
      { name: "Mixed Fruit Jam", brand: "Kissan" },
    ],
  },
  // ── BAKERY & BISCUITS ────────────────────────────────────────────────────
  {
    slug: "bakery-biscuits-cookies-biscuits", code: "CKB", attribute: "Weight",
    variants: [{ value: "100g", price: 30, compare: 40 }, { value: "200g", price: 55, compare: 75 }],
    products: [
      { name: "Marie Gold Biscuits", brand: "Britannia" },
      { name: "Good Day Butter Cookies", brand: "Britannia" },
      { name: "Milk Bikis Biscuits", brand: "Britannia" },
    ],
  },
  {
    slug: "bakery-biscuits-cakes-pastries", code: "CKP", attribute: "Weight",
    variants: [{ value: "250g", price: 99, compare: 125 }, { value: "500g", price: 189, compare: 239 }],
    products: [
      { name: "Chocolate Cake", brand: "Britannia" },
      { name: "Mawa Cake Slice", brand: "Modern" },
      { name: "Fruit Cake", brand: "Harvest Gold" },
    ],
  },
  {
    slug: "bakery-biscuits-rusk-toast", code: "RSK", attribute: "Weight",
    variants: [{ value: "200g", price: 45, compare: 59 }, { value: "400g", price: 85, compare: 109 }],
    products: [
      { name: "Elaichi Rusk", brand: "Britannia" },
      { name: "Whole Wheat Rusk", brand: "Parle" },
      { name: "Melba Toast", brand: "Wasa" },
    ],
  },
  {
    slug: "bakery-biscuits-muffins-donuts", code: "MFN", attribute: "Pack Size",
    variants: [{ value: "4 Pcs", price: 89, compare: 110 }, { value: "6 Pcs", price: 129, compare: 159 }],
    products: [
      { name: "Blueberry Muffins", brand: "Country Style" },
      { name: "Chocolate Muffins", brand: "Theobroma" },
      { name: "Classic Glazed Donuts", brand: "Dunkin" },
    ],
  },
  {
    slug: "bakery-biscuits-waffles-pancake-mix", code: "WFL", attribute: "Weight",
    variants: [{ value: "200g", price: 129, compare: 159 }, { value: "400g", price: 239, compare: 299 }],
    products: [
      { name: "Complete Pancake Mix", brand: "Del Monte" },
      { name: "Belgian Waffle Mix", brand: "Dr Oetker" },
      { name: "Buttermilk Pancake Mix", brand: "Pillsbury" },
    ],
  },
  // ── FROZEN & PACKAGED FOOD ────────────────────────────────────────────────
  {
    slug: "frozen-packaged-food-frozen-vegetables", code: "FZV", attribute: "Weight",
    variants: [{ value: "500g", price: 79, compare: 99 }, { value: "1kg", price: 149, compare: 185 }],
    products: [
      { name: "Frozen Sweet Corn", brand: "McCain" },
      { name: "Frozen Mixed Vegetables", brand: "McCain" },
      { name: "Frozen Green Peas", brand: "Safal" },
    ],
  },
  {
    slug: "frozen-packaged-food-frozen-snacks", code: "FZS", attribute: "Weight",
    variants: [{ value: "400g", price: 119, compare: 149 }, { value: "750g", price: 219, compare: 269 }],
    products: [
      { name: "Aloo Tikki", brand: "McCain" },
      { name: "Corn Nuggets", brand: "Sumeru" },
      { name: "Veg Cheese Burger Patty", brand: "Venky's" },
    ],
  },
  {
    slug: "frozen-packaged-food-ready-to-eat-meals", code: "REM", attribute: "Weight",
    variants: [{ value: "250g", price: 99, compare: 125 }, { value: "400g", price: 149, compare: 185 }],
    products: [
      { name: "Dal Makhani Ready Meal", brand: "MTR" },
      { name: "Palak Paneer Ready Meal", brand: "Haldirams" },
      { name: "Chana Masala Ready Meal", brand: "MTR" },
    ],
  },
  {
    slug: "frozen-packaged-food-noodles-pasta", code: "NDL", attribute: "Weight",
    variants: [{ value: "200g", price: 29, compare: 39 }, { value: "500g", price: 65, compare: 85 }],
    products: [
      { name: "Masala Instant Noodles", brand: "Maggi" },
      { name: "Penne Pasta", brand: "Barilla" },
      { name: "Whole Wheat Noodles", brand: "Sunfeast" },
    ],
  },
  {
    slug: "frozen-packaged-food-soups-broths", code: "SPB", attribute: "Weight",
    variants: [{ value: "50g", price: 25, compare: 35 }, { value: "400g", price: 149, compare: 185 }],
    products: [
      { name: "Tomato Soup Instant", brand: "Knorr" },
      { name: "Sweet Corn Vegetable Soup", brand: "Maggi" },
      { name: "Cream of Mushroom Soup", brand: "Campbell's" },
    ],
  },
  {
    slug: "frozen-packaged-food-frozen-desserts", code: "FZD", attribute: "Weight",
    variants: [{ value: "500g", price: 139, compare: 175 }, { value: "1kg", price: 259, compare: 319 }],
    products: [
      { name: "Vanilla Ice Cream Tub", brand: "Amul" },
      { name: "Chocolate Brownie Ice Cream", brand: "Kwality Walls" },
      { name: "Butterscotch Ice Cream", brand: "Mother Dairy" },
    ],
  },
  // ── CHICKEN, MEAT & FISH ──────────────────────────────────────────────────
  {
    slug: "chicken-meat-fish-fresh-chicken", code: "FCK", attribute: "Weight",
    variants: [{ value: "500g", price: 149, compare: 179 }, { value: "1kg", price: 289, compare: 349 }],
    products: [
      { name: "Chicken Curry Cut", brand: "Licious" },
      { name: "Chicken Breast Boneless", brand: "Licious" },
      { name: "Whole Chicken Cleaned", brand: "Suguna" },
    ],
  },
  {
    slug: "chicken-meat-fish-mutton-lamb", code: "MTN", attribute: "Weight",
    variants: [{ value: "500g", price: 399, compare: 469 }, { value: "1kg", price: 779, compare: 919 }],
    products: [
      { name: "Mutton Curry Cut", brand: "Licious" },
      { name: "Lamb Keema Minced", brand: "FreshToHome" },
      { name: "Mutton Chops", brand: "Licious" },
    ],
  },
  {
    slug: "chicken-meat-fish-fish-seafood", code: "FSH", attribute: "Weight",
    variants: [{ value: "500g", price: 199, compare: 249 }, { value: "1kg", price: 389, compare: 479 }],
    products: [
      { name: "Rohu Fish Curry Cut", brand: "FreshToHome" },
      { name: "Prawns Medium Cleaned", brand: "Licious" },
      { name: "Pomfret Fish Whole", brand: "FreshToHome" },
    ],
  },
  {
    slug: "chicken-meat-fish-cold-cuts-sausages", code: "CCS", attribute: "Weight",
    variants: [{ value: "200g", price: 149, compare: 185 }, { value: "500g", price: 349, compare: 429 }],
    products: [
      { name: "Chicken Salami", brand: "Venky's" },
      { name: "Chicken Frankfurters", brand: "Godrej Yummiez" },
      { name: "Turkey Ham Slices", brand: "Licious" },
    ],
  },
  {
    slug: "chicken-meat-fish-marinated-ready-to-cook", code: "MRC", attribute: "Weight",
    variants: [{ value: "250g", price: 179, compare: 219 }, { value: "500g", price: 339, compare: 419 }],
    products: [
      { name: "Tandoori Chicken Marinated", brand: "Licious" },
      { name: "Butter Garlic Prawns", brand: "FreshToHome" },
      { name: "Peri Peri Chicken Wings", brand: "Licious" },
    ],
  },
  // ── DRY FRUITS & NUTS ─────────────────────────────────────────────────────
  {
    slug: "dry-fruits-nuts-almonds", code: "ALM", attribute: "Weight",
    variants: [{ value: "250g", price: 199, compare: 249 }, { value: "500g", price: 379, compare: 469 }],
    products: [
      { name: "California Almonds", brand: "Happilo" },
      { name: "Raw Almonds Unsalted", brand: "Nutraj" },
      { name: "Roasted Almonds Salted", brand: "Farmley" },
    ],
  },
  {
    slug: "dry-fruits-nuts-cashews", code: "CSH", attribute: "Weight",
    variants: [{ value: "250g", price: 219, compare: 269 }, { value: "500g", price: 419, compare: 519 }],
    products: [
      { name: "W320 Premium Cashews", brand: "Happilo" },
      { name: "Whole Cashew Nuts", brand: "Nutraj" },
      { name: "Roasted Cashews", brand: "Farmley" },
    ],
  },
  {
    slug: "dry-fruits-nuts-walnuts-pistachios", code: "WNT", attribute: "Weight",
    variants: [{ value: "250g", price: 249, compare: 309 }, { value: "500g", price: 479, compare: 589 }],
    products: [
      { name: "California Walnuts Kernels", brand: "Happilo" },
      { name: "Roasted Pistachios Salted", brand: "Nutraj" },
      { name: "Raw Walnut Halves", brand: "Farmley" },
    ],
  },
  {
    slug: "dry-fruits-nuts-raisins-dates", code: "RSD", attribute: "Weight",
    variants: [{ value: "250g", price: 99, compare: 125 }, { value: "500g", price: 189, compare: 235 }],
    products: [
      { name: "Golden Raisins Kishmish", brand: "Happilo" },
      { name: "Medjool Dates", brand: "Bateel" },
      { name: "Black Raisins", brand: "Nutraj" },
    ],
  },
  {
    slug: "dry-fruits-nuts-mixed-nuts", code: "MXN", attribute: "Weight",
    variants: [{ value: "200g", price: 199, compare: 249 }, { value: "500g", price: 449, compare: 549 }],
    products: [
      { name: "Premium Mixed Nuts", brand: "Happilo" },
      { name: "Trail Mix Nuts & Berries", brand: "Yoga Bar" },
      { name: "Roasted Mixed Nuts", brand: "Farmley" },
    ],
  },
  {
    slug: "dry-fruits-nuts-seeds-trail-mix", code: "SDT", attribute: "Weight",
    variants: [{ value: "200g", price: 149, compare: 185 }, { value: "500g", price: 349, compare: 429 }],
    products: [
      { name: "Chia Seeds", brand: "Organic India" },
      { name: "Sunflower Seeds Roasted", brand: "Happilo" },
      { name: "Pumpkin Seeds", brand: "Farmley" },
    ],
  },
  // ── SWEETS & CHOCOLATES ───────────────────────────────────────────────────
  {
    slug: "sweets-chocolates-chocolates", code: "CHC", attribute: "Weight",
    variants: [{ value: "50g", price: 60, compare: 75 }, { value: "200g", price: 220, compare: 275 }],
    products: [
      { name: "Dairy Milk Chocolate", brand: "Cadbury" },
      { name: "Dark Chocolate 70%", brand: "Lindt" },
      { name: "KitKat Crisp Wafers", brand: "Nestle" },
    ],
  },
  {
    slug: "sweets-chocolates-indian-sweets-mithai", code: "ISW", attribute: "Weight",
    variants: [{ value: "250g", price: 189, compare: 239 }, { value: "500g", price: 369, compare: 459 }],
    products: [
      { name: "Kaju Katli", brand: "Haldirams" },
      { name: "Besan Ladoo", brand: "Bikaji" },
      { name: "Rasgulla in Syrup", brand: "Haldirams" },
    ],
  },
  {
    slug: "sweets-chocolates-candies-gummies", code: "CDG", attribute: "Weight",
    variants: [{ value: "100g", price: 49, compare: 65 }, { value: "200g", price: 89, compare: 115 }],
    products: [
      { name: "Fruit Flavoured Gummies", brand: "Haribo" },
      { name: "Mango Candy", brand: "Parle" },
      { name: "Eclairs Toffees", brand: "Cadbury" },
    ],
  },
  {
    slug: "sweets-chocolates-ice-creams", code: "ICE", attribute: "Volume",
    variants: [{ value: "500mL", price: 149, compare: 185 }, { value: "1L", price: 269, compare: 329 }],
    products: [
      { name: "Vanilla Bean Ice Cream", brand: "Baskin Robbins" },
      { name: "Belgian Chocolate Ice Cream", brand: "Kwality Walls" },
      { name: "Strawberry Delight Ice Cream", brand: "Amul" },
    ],
  },
  {
    slug: "sweets-chocolates-dessert-mixes", code: "DSM", attribute: "Weight",
    variants: [{ value: "100g", price: 75, compare: 95 }, { value: "200g", price: 139, compare: 175 }],
    products: [
      { name: "Chocolate Brownie Mix", brand: "Dr Oetker" },
      { name: "Vanilla Cake Mix", brand: "Betty Crocker" },
      { name: "Jelly Crystals", brand: "Weikfield" },
    ],
  },
  // ── SAUCES, SPREADS & MORE ────────────────────────────────────────────────
  {
    slug: "sauces-spreads-more-ketchup-sauces", code: "KTC", attribute: "Weight",
    variants: [{ value: "500g", price: 89, compare: 109 }, { value: "1kg", price: 165, compare: 205 }],
    products: [
      { name: "Tomato Ketchup", brand: "Heinz" },
      { name: "Maggi Hot & Sweet Sauce", brand: "Maggi" },
      { name: "Soy Sauce", brand: "Ching's" },
    ],
  },
  {
    slug: "sauces-spreads-more-jams-jellies", code: "JMJ", attribute: "Weight",
    variants: [{ value: "200g", price: 79, compare: 99 }, { value: "500g", price: 175, compare: 219 }],
    products: [
      { name: "Mixed Fruit Jam", brand: "Kissan" },
      { name: "Strawberry Preserve", brand: "Druk" },
      { name: "Mango Jam", brand: "Kissan" },
    ],
  },
  {
    slug: "sauces-spreads-more-pickles-chutneys", code: "PCK", attribute: "Weight",
    variants: [{ value: "200g", price: 65, compare: 85 }, { value: "400g", price: 120, compare: 149 }],
    products: [
      { name: "Mango Pickle Aam Ka Achaar", brand: "Priya" },
      { name: "Mixed Vegetable Pickle", brand: "Mothers Recipe" },
      { name: "Garlic Chutney", brand: "Veeba" },
    ],
  },
  {
    slug: "sauces-spreads-more-peanut-butter", code: "PNB", attribute: "Weight",
    variants: [{ value: "400g", price: 199, compare: 249 }, { value: "1kg", price: 449, compare: 549 }],
    products: [
      { name: "Crunchy Peanut Butter", brand: "Sundrop" },
      { name: "Creamy Peanut Butter", brand: "Pintola" },
      { name: "Dark Chocolate Peanut Butter", brand: "My Fitness" },
    ],
  },
  {
    slug: "sauces-spreads-more-dips-dressings", code: "DPS", attribute: "Volume",
    variants: [{ value: "250mL", price: 99, compare: 125 }, { value: "500mL", price: 185, compare: 229 }],
    products: [
      { name: "Hummus Classic", brand: "Wingreens" },
      { name: "Ranch Dressing", brand: "Hidden Valley" },
      { name: "Thousand Island Dressing", brand: "Veeba" },
    ],
  },
  // ── BABY CARE ────────────────────────────────────────────────────────────
  {
    slug: "baby-care-baby-food-formula", code: "BFF", attribute: "Weight",
    variants: [{ value: "400g", price: 499, compare: 599 }, { value: "1kg", price: 1099, compare: 1299 }],
    products: [
      { name: "Infant Formula Stage 1", brand: "Similac" },
      { name: "Follow-on Formula Stage 2", brand: "Nan" },
      { name: "Cereal with Milk & Fruits", brand: "Nestle" },
    ],
  },
  {
    slug: "baby-care-diapers-wipes", code: "DPW", attribute: "Pack Size",
    variants: [{ value: "20 Pcs", price: 249, compare: 299 }, { value: "48 Pcs", price: 549, compare: 669 }],
    products: [
      { name: "Baby Pants Diapers Size M", brand: "Pampers" },
      { name: "Baby Dry Diapers Size L", brand: "Huggies" },
      { name: "Gentle Baby Wipes", brand: "Chicco" },
    ],
  },
  {
    slug: "baby-care-baby-skincare", code: "BSK", attribute: "Volume",
    variants: [{ value: "100mL", price: 149, compare: 185 }, { value: "200mL", price: 269, compare: 329 }],
    products: [
      { name: "Baby Lotion Gentle", brand: "Johnson's" },
      { name: "Baby Shampoo No Tears", brand: "Johnson's" },
      { name: "Baby Massage Oil", brand: "Himalaya" },
    ],
  },
  {
    slug: "baby-care-baby-accessories", code: "BAC", attribute: "Pack Size",
    variants: [{ value: "1 Pc", price: 149, compare: 185 }, { value: "2 Pcs", price: 279, compare: 349 }],
    products: [
      { name: "Baby Feeding Nipple Silicone", brand: "Pigeon" },
      { name: "Baby Bath Tub", brand: "Chicco" },
      { name: "Soft Bristle Baby Brush", brand: "Farlin" },
    ],
  },
  {
    slug: "baby-care-feeding-essentials", code: "FDE", attribute: "Pack Size",
    variants: [{ value: "1 Pc", price: 299, compare: 375 }, { value: "2 Pcs", price: 549, compare: 679 }],
    products: [
      { name: "Baby Feeding Bottle 150mL", brand: "Pigeon" },
      { name: "Baby Sipper Cup", brand: "Munchkin" },
      { name: "Food Grade Silicone Spoon", brand: "Chicco" },
    ],
  },
  // ── HEALTH & WELLNESS ─────────────────────────────────────────────────────
  {
    slug: "health-wellness-vitamins-supplements", code: "VTS", attribute: "Pack Size",
    variants: [{ value: "30 Pcs", price: 349, compare: 429 }, { value: "60 Pcs", price: 649, compare: 799 }],
    products: [
      { name: "Vitamin C Tablets 500mg", brand: "Limcee" },
      { name: "Vitamin D3 Capsules", brand: "HealthKart" },
      { name: "Multivitamin Tablet Daily", brand: "Centrum" },
    ],
  },
  {
    slug: "health-wellness-otc-medicines", code: "OTC", attribute: "Pack Size",
    variants: [{ value: "10 Pcs", price: 35, compare: 45 }, { value: "20 Pcs", price: 65, compare: 85 }],
    products: [
      { name: "Paracetamol 500mg Tablets", brand: "Crocin" },
      { name: "Antacid Tablets", brand: "Eno" },
      { name: "ORS Electrolyte Sachets", brand: "Electral" },
    ],
  },
  {
    slug: "health-wellness-protein-fitness", code: "PTF", attribute: "Weight",
    variants: [{ value: "1kg", price: 1299, compare: 1599 }, { value: "2kg", price: 2399, compare: 2999 }],
    products: [
      { name: "Whey Protein Chocolate", brand: "Optimum Nutrition" },
      { name: "Plant Protein Powder", brand: "Yoga Bar" },
      { name: "Mass Gainer Vanilla", brand: "MuscleBlaze" },
    ],
  },
  {
    slug: "health-wellness-ayurvedic-herbal", code: "AYH", attribute: "Weight",
    variants: [{ value: "100g", price: 149, compare: 185 }, { value: "250g", price: 329, compare: 399 }],
    products: [
      { name: "Ashwagandha Churna", brand: "Patanjali" },
      { name: "Triphala Churna", brand: "Dabur" },
      { name: "Giloy Tablets", brand: "Organic India" },
    ],
  },
  {
    slug: "health-wellness-first-aid", code: "FAD", attribute: "Pack Size",
    variants: [{ value: "1 Pc", price: 199, compare: 249 }, { value: "2 Pcs", price: 369, compare: 459 }],
    products: [
      { name: "Antiseptic Bandage Roll", brand: "Dettol" },
      { name: "Adhesive Bandages Strip", brand: "Band-Aid" },
      { name: "Antiseptic Cream Tube", brand: "Savlon" },
    ],
  },
  // ── HOME & CLEANING ───────────────────────────────────────────────────────
  {
    slug: "home-cleaning-detergents-fabric-care", code: "DFB", attribute: "Weight",
    variants: [{ value: "1kg", price: 159, compare: 199 }, { value: "3kg", price: 429, compare: 539 }],
    products: [
      { name: "Surf Excel Easy Wash", brand: "Surf Excel" },
      { name: "Ariel Matic Front Load", brand: "Ariel" },
      { name: "Tide Plus Detergent Powder", brand: "Tide" },
    ],
  },
  {
    slug: "home-cleaning-dishwash", code: "DSH", attribute: "Weight",
    variants: [{ value: "500g", price: 79, compare: 99 }, { value: "1kg", price: 149, compare: 185 }],
    products: [
      { name: "Dishwash Bar Lemon", brand: "Vim" },
      { name: "Dish Wash Liquid", brand: "Pril" },
      { name: "Dish Wash Gel", brand: "Finish" },
    ],
  },
  {
    slug: "home-cleaning-floor-toilet-cleaners", code: "FLC", attribute: "Volume",
    variants: [{ value: "500mL", price: 89, compare: 110 }, { value: "1L", price: 159, compare: 199 }],
    products: [
      { name: "Floor Cleaner Floral", brand: "Phenyl" },
      { name: "Toilet Bowl Cleaner", brand: "Harpic" },
      { name: "Anti-Bacterial Floor Cleaner", brand: "Lizol" },
    ],
  },
  {
    slug: "home-cleaning-fresheners-repellents", code: "FRP", attribute: "Volume",
    variants: [{ value: "250mL", price: 89, compare: 110 }, { value: "500mL", price: 159, compare: 199 }],
    products: [
      { name: "Air Freshener Spray", brand: "Air Wick" },
      { name: "Room Freshener Lavender", brand: "Febreze" },
      { name: "Mosquito Repellent Spray", brand: "All Out" },
    ],
  },
  {
    slug: "home-cleaning-garbage-bags-foils", code: "GBF", attribute: "Pack Size",
    variants: [{ value: "30 Pcs", price: 99, compare: 125 }, { value: "48 Pcs", price: 149, compare: 185 }],
    products: [
      { name: "Garbage Bags Large Black", brand: "Ezee" },
      { name: "Aluminium Foil Roll", brand: "Tata" },
      { name: "Cling Wrap Film", brand: "Glad" },
    ],
  },
  // ── PERSONAL CARE & BEAUTY ────────────────────────────────────────────────
  {
    slug: "personal-care-beauty-skincare", code: "SCR", attribute: "Volume",
    variants: [{ value: "50mL", price: 199, compare: 249 }, { value: "100mL", price: 369, compare: 459 }],
    products: [
      { name: "SPF 50 Sunscreen Lotion", brand: "Lotus Herbals" },
      { name: "Vitamin C Face Serum", brand: "Minimalist" },
      { name: "Moisturising Face Cream", brand: "Nivea" },
    ],
  },
  {
    slug: "personal-care-beauty-haircare", code: "HRC", attribute: "Volume",
    variants: [{ value: "200mL", price: 149, compare: 185 }, { value: "400mL", price: 269, compare: 339 }],
    products: [
      { name: "Anti-Dandruff Shampoo", brand: "Head & Shoulders" },
      { name: "Damage Repair Conditioner", brand: "Dove" },
      { name: "Keratin Hair Serum", brand: "Garnier" },
    ],
  },
  {
    slug: "personal-care-beauty-bath-body", code: "BTB", attribute: "Volume",
    variants: [{ value: "200mL", price: 99, compare: 125 }, { value: "500mL", price: 219, compare: 275 }],
    products: [
      { name: "Neem & Tulsi Body Wash", brand: "Himalaya" },
      { name: "Moisturising Body Lotion", brand: "Vaseline" },
      { name: "Refreshing Shower Gel", brand: "Fiama" },
    ],
  },
  {
    slug: "personal-care-beauty-oral-care", code: "ORC", attribute: "Weight",
    variants: [{ value: "75g", price: 75, compare: 95 }, { value: "150g", price: 139, compare: 175 }],
    products: [
      { name: "Fluoride Toothpaste", brand: "Colgate" },
      { name: "Whitening Toothpaste", brand: "Pepsodent" },
      { name: "Herbal Toothpaste", brand: "Patanjali" },
    ],
  },
  {
    slug: "personal-care-beauty-feminine-hygiene", code: "FMH", attribute: "Pack Size",
    variants: [{ value: "8 Pcs", price: 79, compare: 99 }, { value: "20 Pcs", price: 179, compare: 225 }],
    products: [
      { name: "Sanitary Pads Regular", brand: "Whisper" },
      { name: "Sanitary Pads XL Wings", brand: "Stayfree" },
      { name: "Menstrual Cup", brand: "Sirona" },
    ],
  },
  {
    slug: "personal-care-beauty-mens-grooming", code: "MGR", attribute: "Volume",
    variants: [{ value: "100mL", price: 149, compare: 185 }, { value: "200mL", price: 269, compare: 335 }],
    products: [
      { name: "Shaving Gel Sensitive", brand: "Gillette" },
      { name: "After Shave Lotion", brand: "Old Spice" },
      { name: "Beard Oil Nourishing", brand: "Beardo" },
    ],
  },
];

async function run() {
  await sequelize.authenticate();

  const [stores] = await sequelize.query(
    "SELECT id FROM stores ORDER BY id ASC LIMIT 1"
  ) as [Array<{ id: number }>, unknown];
  const storeId = stores[0]?.id;
  if (!storeId) { console.error("No store found."); process.exit(1); }

  const [admins] = await sequelize.query(
    "SELECT id FROM admins WHERE is_deleted=0 ORDER BY id ASC LIMIT 1"
  ) as [Array<{ id: number }>, unknown];
  const createdBy = admins[0]?.id ?? 1;

  const [outlets] = await sequelize.query(
    "SELECT id FROM outlets WHERE store_id=? AND is_deleted=0", { replacements: [storeId] }
  ) as [Array<{ id: number }>, unknown];
  const outletIds = outlets.map(o => o.id);

  console.log(`Store: ${storeId} | Admin: ${createdBy} | Outlets: ${outletIds.length}\n`);

  // ── Load all variant attribute values into a map key="{attrName}:{value}" ──
  const [attrVals] = await sequelize.query(`
    SELECT va.name as attr_name, vav.id, vav.value, vav.attribute_id
    FROM variant_attribute_values vav
    JOIN variant_attributes va ON va.id = vav.attribute_id
    WHERE va.store_id = ? AND va.is_deleted = 0
  `, { replacements: [storeId] }) as [Array<{ attr_name: string; id: number; value: string; attribute_id: number }>, unknown];

  const valMap = new Map<string, number>();
  const attrIdMap = new Map<string, number>();
  for (const r of attrVals) {
    valMap.set(`${r.attr_name}:${r.value}`, r.id);
    attrIdMap.set(r.attr_name, r.attribute_id);
  }

  // Helper: get or create attribute value
  async function getOrCreateAttrVal(attrName: string, value: string): Promise<number> {
    const key = `${attrName}:${value}`;
    if (valMap.has(key)) return valMap.get(key)!;

    // Get or create the attribute
    let attrId = attrIdMap.get(attrName);
    if (!attrId) {
      await sequelize.query(
        "INSERT INTO variant_attributes (name, store_id, status, is_deleted, created_ts, updated_ts) VALUES (?,?,1,0,NOW(),NOW())",
        { replacements: [attrName, storeId] }
      );
      const [r] = await sequelize.query(
        "SELECT id FROM variant_attributes WHERE name=? AND store_id=? LIMIT 1",
        { replacements: [attrName, storeId] }
      ) as [Array<{ id: number }>, unknown];
      attrId = r[0]!.id;
      attrIdMap.set(attrName, attrId);
      console.log(`  + Attribute created: ${attrName} (id=${attrId})`);
    }

    await sequelize.query(
      "INSERT INTO variant_attribute_values (attribute_id, value, sort_order, created_ts, updated_ts) VALUES (?,?,0,NOW(),NOW())",
      { replacements: [attrId, value] }
    );
    const [r] = await sequelize.query(
      "SELECT id FROM variant_attribute_values WHERE attribute_id=? AND value=? LIMIT 1",
      { replacements: [attrId, value] }
    ) as [Array<{ id: number }>, unknown];
    const newId = r[0]!.id;
    valMap.set(key, newId);
    console.log(`  + Value created: ${attrName}:${value} (id=${newId})`);
    return newId;
  }

  let totalProducts = 0, totalVariants = 0, skipped = 0;

  for (let catIdx = 0; catIdx < DATA.length; catIdx++) {
    const cat = DATA[catIdx]!;

    // Look up category id by slug
    const [catRows] = await sequelize.query(
      "SELECT id FROM categories WHERE slug=? LIMIT 1", { replacements: [cat.slug] }
    ) as [Array<{ id: number }>, unknown];

    if (!catRows.length) {
      console.log(`\n  [SKIP] category slug not found: ${cat.slug}`);
      continue;
    }
    const categoryId = catRows[0]!.id;
    console.log(`\n── ${cat.slug} (cat_id=${categoryId})`);

    // Pre-resolve all attribute value ids for this category
    const variantAttrValIds: number[] = [];
    for (const v of cat.variants) {
      const id = await getOrCreateAttrVal(cat.attribute, v.value);
      variantAttrValIds.push(id);
    }

    for (let pIdx = 0; pIdx < cat.products.length; pIdx++) {
      const p = cat.products[pIdx]!;
      const productCode = `GR${cat.code}${String(pIdx + 1).padStart(2, "0")}`;
      const productName = `${p.brand} ${p.name}`;

      // Skip if already seeded
      const [existing] = await sequelize.query(
        "SELECT id FROM products WHERE product_code=? LIMIT 1", { replacements: [productCode] }
      ) as [Array<{ id: number }>, unknown];
      if (existing.length) {
        console.log(`  [SKIP] ${productCode} already exists`);
        skipped++;
        continue;
      }

      const slug = await uniqueSlug(slugify(productName));
      const desc = `${productName}. Quality ${cat.slug.split("-").slice(-2).join(" ")} product.`;

      await sequelize.query(
        `INSERT INTO products
           (product_code, name, description, category_id, store_id, is_stockable,
            slug, status, is_draft, is_deleted, created_by, created_ts, updated_ts)
         VALUES (?,?,?,?,?,1,?,1,0,0,?,NOW(),NOW())`,
        { replacements: [productCode, productName, desc, categoryId, storeId, slug, createdBy] }
      );

      const [prodRow] = await sequelize.query(
        "SELECT id FROM products WHERE product_code=? LIMIT 1", { replacements: [productCode] }
      ) as [Array<{ id: number }>, unknown];
      const productId = prodRow[0]!.id;

      // Link to outlets
      for (const outletId of outletIds) {
        await sequelize.query(
          "INSERT IGNORE INTO product_outlets (product_id, outlet_id) VALUES (?,?)",
          { replacements: [productId, outletId] }
        );
      }

      // Insert variants
      for (let vIdx = 0; vIdx < cat.variants.length; vIdx++) {
        const v = cat.variants[vIdx]!;
        const sku = `${productCode}-V${vIdx + 1}`;
        const bc  = barcode(catIdx, pIdx, vIdx);
        const attrValId = variantAttrValIds[vIdx]!;

        await sequelize.query(
          `INSERT INTO product_variants (product_id, sku, barcode, status, is_deleted, created_ts, updated_ts)
           VALUES (?,?,?,1,0,NOW(),NOW())`,
          { replacements: [productId, sku, bc] }
        );

        const [varRow] = await sequelize.query(
          "SELECT id FROM product_variants WHERE sku=? LIMIT 1", { replacements: [sku] }
        ) as [Array<{ id: number }>, unknown];
        const variantId = varRow[0]!.id;

        await sequelize.query(
          "INSERT INTO product_variant_options (variant_id, attribute_value_id) VALUES (?,?)",
          { replacements: [variantId, attrValId] }
        );

        await sequelize.query(
          `INSERT INTO product_prices
             (product_id, variant_id, price, compare_at_price, created_ts, updated_ts)
           VALUES (?,?,?,?,NOW(),NOW())`,
          { replacements: [productId, variantId, v.price, v.compare] }
        );

        totalVariants++;
      }

      console.log(`  [NEW] ${productCode} "${productName}" (id=${productId}) — ${cat.variants.length} variants`);
      totalProducts++;
    }
  }

  console.log(`\nDone — ${totalProducts} products, ${totalVariants} variants inserted. ${skipped} skipped.`);
  await sequelize.close();
}

run().catch(err => { console.error("Seed failed:", err.message); process.exit(1); });
