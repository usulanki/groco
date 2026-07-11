import sequelize from "../config/database";
import "../models/index";
import Category from "../models/category.model";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const GROCERY_CATEGORIES: Array<{ name: string; subcategories: string[] }> = [
  {
    name: "Fruits & Vegetables",
    subcategories: [
      "Fresh Fruits",
      "Fresh Vegetables",
      "Exotic & Organic",
      "Herbs & Seasonings",
      "Cut & Ready to Cook",
    ],
  },
  {
    name: "Dairy, Bread & Eggs",
    subcategories: [
      "Milk",
      "Curd & Yogurt",
      "Butter & Ghee",
      "Paneer & Tofu",
      "Cheese",
      "Eggs",
      "Bread & Pav",
    ],
  },
  {
    name: "Atta, Rice & Dal",
    subcategories: [
      "Wheat Flour (Atta)",
      "Rice",
      "Pulses & Lentils",
      "Quinoa & Millets",
      "Semolina & Flours",
    ],
  },
  {
    name: "Masala, Oil & Spices",
    subcategories: [
      "Cooking Oil",
      "Whole Spices",
      "Ground Spices",
      "Salt & Sugar",
      "Vinegar & Preservatives",
      "Condiments",
    ],
  },
  {
    name: "Snacks & Munchies",
    subcategories: [
      "Chips & Crisps",
      "Namkeen & Bhujia",
      "Popcorn",
      "Peanuts & Seeds",
      "Protein Bars",
      "Crackers",
    ],
  },
  {
    name: "Beverages",
    subcategories: [
      "Cold Drinks & Sodas",
      "Juices & Nectars",
      "Water & Sparkling",
      "Energy Drinks",
      "Milkshakes & Smoothies",
    ],
  },
  {
    name: "Tea, Coffee & Health Drinks",
    subcategories: [
      "Tea",
      "Coffee",
      "Health & Nutrition Drinks",
      "Green Tea & Herbal",
      "Cocoa & Malted Drinks",
    ],
  },
  {
    name: "Breakfast & Cereals",
    subcategories: [
      "Oats & Cornflakes",
      "Muesli & Granola",
      "Porridge",
      "Instant Breakfast Mixes",
      "Honey & Spreads",
    ],
  },
  {
    name: "Bakery & Biscuits",
    subcategories: [
      "Cookies & Biscuits",
      "Cakes & Pastries",
      "Rusk & Toast",
      "Muffins & Donuts",
      "Waffles & Pancake Mix",
    ],
  },
  {
    name: "Frozen & Packaged Food",
    subcategories: [
      "Frozen Vegetables",
      "Frozen Snacks",
      "Ready to Eat Meals",
      "Noodles & Pasta",
      "Soups & Broths",
      "Frozen Desserts",
    ],
  },
  {
    name: "Chicken, Meat & Fish",
    subcategories: [
      "Fresh Chicken",
      "Mutton & Lamb",
      "Fish & Seafood",
      "Cold Cuts & Sausages",
      "Marinated & Ready to Cook",
    ],
  },
  {
    name: "Dry Fruits & Nuts",
    subcategories: [
      "Almonds",
      "Cashews",
      "Walnuts & Pistachios",
      "Raisins & Dates",
      "Mixed Nuts",
      "Seeds & Trail Mix",
    ],
  },
  {
    name: "Sweets & Chocolates",
    subcategories: [
      "Chocolates",
      "Indian Sweets (Mithai)",
      "Candies & Gummies",
      "Ice Creams",
      "Dessert Mixes",
    ],
  },
  {
    name: "Sauces, Spreads & More",
    subcategories: [
      "Ketchup & Sauces",
      "Jams & Jellies",
      "Pickles & Chutneys",
      "Peanut Butter",
      "Dips & Dressings",
    ],
  },
  {
    name: "Baby Care",
    subcategories: [
      "Baby Food & Formula",
      "Diapers & Wipes",
      "Baby Skincare",
      "Baby Accessories",
      "Feeding Essentials",
    ],
  },
  {
    name: "Health & Wellness",
    subcategories: [
      "Vitamins & Supplements",
      "OTC Medicines",
      "Protein & Fitness",
      "Ayurvedic & Herbal",
      "First Aid",
    ],
  },
  {
    name: "Home & Cleaning",
    subcategories: [
      "Detergents & Fabric Care",
      "Dishwash",
      "Floor & Toilet Cleaners",
      "Fresheners & Repellents",
      "Garbage Bags & Foils",
    ],
  },
  {
    name: "Personal Care & Beauty",
    subcategories: [
      "Skincare",
      "Haircare",
      "Bath & Body",
      "Oral Care",
      "Feminine Hygiene",
      "Mens Grooming",
    ],
  },
];

async function seedGroceryCategories() {
  await sequelize.authenticate();

  console.log("Seeding grocery categories as global (store_id = null)\n");

  let l1Created = 0;
  let l1Skipped = 0;
  let l2Created = 0;
  let l2Skipped = 0;

  for (const cat of GROCERY_CATEGORIES) {
    const parentSlug = toSlug(cat.name);

    const [parent, parentWasCreated] = await Category.findOrCreate({
      where: { slug: parentSlug },
      defaults: {
        name:       cat.name,
        slug:       parentSlug,
        parent_id:  null,
        media_id:   null,
        store_id:   null,
        outlet_id:  null,
        status:     true,
        is_deleted: false,
      },
    });

    if (parentWasCreated) {
      console.log(`  ✓ [L1] ${cat.name}`);
      l1Created++;
    } else {
      console.log(`  – [L1] ${cat.name} (already exists)`);
      l1Skipped++;
    }

    for (const subName of cat.subcategories) {
      const subSlug = `${parentSlug}-${toSlug(subName)}`;

      const [, subWasCreated] = await Category.findOrCreate({
        where: { slug: subSlug },
        defaults: {
          name:       subName,
          slug:       subSlug,
          parent_id:  parent.id,
          media_id:   null,
          store_id:   null,
          outlet_id:  null,
          status:     true,
          is_deleted: false,
        },
      });

      if (subWasCreated) {
        console.log(`      ✓ [L2] ${subName}`);
        l2Created++;
      } else {
        console.log(`      – [L2] ${subName} (already exists)`);
        l2Skipped++;
      }
    }
  }

  console.log(
    `\nDone — L1: ${l1Created} created, ${l1Skipped} skipped` +
    ` | L2: ${l2Created} created, ${l2Skipped} skipped` +
    ` | Total: ${l1Created + l2Created} rows inserted.`
  );

  await sequelize.close();
}

seedGroceryCategories().catch((err) => {
  console.error("Seeder failed:", err);
  process.exit(1);
});
