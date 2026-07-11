import sequelize from "../config/database";
import "../models/index";
import Vendor from "../models/vendor.model";
import Store from "../models/store.model";

const VENDORS = [
  // ── India ─────────────────────────────────────────────────────────────────
  {
    vendor_code: "VND-IND-001",
    company_name: "Gujarat Cooperative Milk Marketing Federation Ltd (Amul)",
    owner_name: "R. S. Sodhi",
    owner_email: "procurement@amul.coop",
    owner_phone: "+91 2692 258506",
    owner_address: "Amul Dairy Road, Anand, Gujarat 388 001, India",
    gst_no: "24AABCG1234A1Z5",
    country: "India",
  },
  {
    vendor_code: "VND-IND-002",
    company_name: "MDH Spices Pvt Ltd",
    owner_name: "Prem Sagar Kohli",
    owner_email: "orders@mdhspices.com",
    owner_phone: "+91 11 25451941",
    owner_address: "9/2, Kirti Nagar Industrial Area, New Delhi 110 015, India",
    gst_no: "07AAACM1234B1ZK",
    country: "India",
  },
  {
    vendor_code: "VND-IND-003",
    company_name: "Patanjali Ayurved Ltd",
    owner_name: "Acharya Balkrishna",
    owner_email: "vendor@patanjali.net",
    owner_phone: "+91 1334 244107",
    owner_address: "Patanjali Food & Herbal Park, Haridwar, Uttarakhand 249 401, India",
    gst_no: "05AABCP1234C1Z9",
    country: "India",
  },
  {
    vendor_code: "VND-IND-004",
    company_name: "Britannia Industries Ltd",
    owner_name: "Varun Berry",
    owner_email: "supply@britannia.co.in",
    owner_phone: "+91 80 22212020",
    owner_address: "5/1A, Hungerford Street, Kolkata, West Bengal 700 017, India",
    gst_no: "29AAACB1234D1ZQ",
    country: "India",
  },
  {
    vendor_code: "VND-IND-005",
    company_name: "Haldiram Snacks Pvt Ltd",
    owner_name: "Madhusudan Agarwal",
    owner_email: "procurement@haldirams.com",
    owner_phone: "+91 11 47063000",
    owner_address: "1, Central Market, Lajpat Nagar II, New Delhi 110 024, India",
    gst_no: "07AAACH1234E1ZR",
    country: "India",
  },
  {
    vendor_code: "VND-IND-006",
    company_name: "ITC Ltd – Foods Division",
    owner_name: "Sanjiv Puri",
    owner_email: "foods.supply@itc.in",
    owner_phone: "+91 33 22889371",
    owner_address: "Virginia House, 37 Chittaranjan Avenue, Kolkata, West Bengal 700 071, India",
    gst_no: "19AAACI1234F1ZS",
    country: "India",
  },
  {
    vendor_code: "VND-IND-007",
    company_name: "Marico Ltd",
    owner_name: "Saugata Gupta",
    owner_email: "vendor@marico.com",
    owner_phone: "+91 22 66480480",
    owner_address: "7th Floor, Grande Palladium, 175 CST Road, Santacruz East, Mumbai 400 098, India",
    gst_no: "27AABCM1234G1ZT",
    country: "India",
  },
  {
    vendor_code: "VND-IND-008",
    company_name: "Dabur India Ltd",
    owner_name: "Mohit Malhotra",
    owner_email: "procurement@dabur.com",
    owner_phone: "+91 120 3944444",
    owner_address: "Dabur Tower, Kaushambi, Ghaziabad, Uttar Pradesh 201 010, India",
    gst_no: "09AAACD1234H1ZU",
    country: "India",
  },
  {
    vendor_code: "VND-IND-009",
    company_name: "Mother Dairy Fruit & Vegetable Pvt Ltd",
    owner_name: "Manish Bandlish",
    owner_email: "supply@motherdairy.com",
    owner_phone: "+91 11 30516149",
    owner_address: "Mother Dairy Fruit & Vegetable Plant, Patparganj, New Delhi 110 092, India",
    gst_no: "07AABCM5678I1ZV",
    country: "India",
  },
  {
    vendor_code: "VND-IND-010",
    company_name: "Tata Consumer Products Ltd",
    owner_name: "Sunil D'Souza",
    owner_email: "vendor@tataconsumer.com",
    owner_phone: "+91 33 22882880",
    owner_address: "1, Bishop Lefroy Road, Kolkata, West Bengal 700 020, India",
    gst_no: "27AAACT1234J1ZW",
    country: "India",
  },

  // ── USA ───────────────────────────────────────────────────────────────────
  {
    vendor_code: "VND-USA-001",
    company_name: "General Mills Inc",
    owner_name: "Jeff Harmening",
    owner_email: "procurement@generalmills.com",
    owner_phone: "+1 763-764-7600",
    owner_address: "Number One General Mills Boulevard, Golden Valley, MN 55426, USA",
    gst_no: "EIN 41-0642889",
    country: "USA",
  },
  {
    vendor_code: "VND-USA-002",
    company_name: "The Kraft Heinz Company",
    owner_name: "Miguel Patricio",
    owner_email: "supply@kraftheinzcompany.com",
    owner_phone: "+1 412-456-5700",
    owner_address: "One PPG Place, Pittsburgh, PA 15222, USA",
    gst_no: "EIN 46-2078182",
    country: "USA",
  },
  {
    vendor_code: "VND-USA-003",
    company_name: "ConAgra Brands Inc",
    owner_name: "Sean Connolly",
    owner_email: "vendor@conagrabrands.com",
    owner_phone: "+1 312-549-5000",
    owner_address: "222 W Merchandise Mart Plaza, Suite 1300, Chicago, IL 60654, USA",
    gst_no: "EIN 47-0248710",
    country: "USA",
  },
  {
    vendor_code: "VND-USA-004",
    company_name: "McCormick & Company Inc",
    owner_name: "Lawrence Kurzius",
    owner_email: "orders@mccormick.com",
    owner_phone: "+1 410-771-7301",
    owner_address: "24 Schilling Road, Suite 1, Hunt Valley, MD 21031, USA",
    gst_no: "EIN 52-0408290",
    country: "USA",
  },
  {
    vendor_code: "VND-USA-005",
    company_name: "Bob's Red Mill Natural Foods",
    owner_name: "Dennis Gilliam",
    owner_email: "wholesale@bobsredmill.com",
    owner_phone: "+1 503-654-3215",
    owner_address: "5000 SE International Way, Milwaukie, OR 97222, USA",
    gst_no: "EIN 93-0847156",
    country: "USA",
  },
  {
    vendor_code: "VND-USA-006",
    company_name: "Del Monte Foods Inc",
    owner_name: "Greg Longstreet",
    owner_email: "supply@delmonte.com",
    owner_phone: "+1 415-247-3000",
    owner_address: "3003 Oak Road, Suite 1100, Walnut Creek, CA 94597, USA",
    gst_no: "EIN 94-2718748",
    country: "USA",
  },
  {
    vendor_code: "VND-USA-007",
    company_name: "Campbell Soup Company",
    owner_name: "Mark Clouse",
    owner_email: "procurement@campbells.com",
    owner_phone: "+1 856-342-4800",
    owner_address: "1 Campbell Place, Camden, NJ 08103, USA",
    gst_no: "EIN 21-0419870",
    country: "USA",
  },
  {
    vendor_code: "VND-USA-008",
    company_name: "Dole Food Company Inc",
    owner_name: "Johan Linden",
    owner_email: "vendor@dole.com",
    owner_phone: "+1 818-879-6600",
    owner_address: "1 Dole Drive, Westlake Village, CA 91362, USA",
    gst_no: "EIN 99-0239123",
    country: "USA",
  },

  // ── UK ────────────────────────────────────────────────────────────────────
  {
    vendor_code: "VND-UK-001",
    company_name: "Warburtons Ltd",
    owner_name: "Jonathan Warburton",
    owner_email: "trade@warburtons.co.uk",
    owner_phone: "+44 1204 556600",
    owner_address: "Back o' th' Bank House, Hereford Street, Bolton, Lancashire BL1 8JB, UK",
    gst_no: "GB 788 123456",
    country: "UK",
  },
  {
    vendor_code: "VND-UK-002",
    company_name: "Premier Foods Group Ltd",
    owner_name: "Alex Whitehouse",
    owner_email: "supply@premierfoods.co.uk",
    owner_phone: "+44 1727 815850",
    owner_address: "Premier House, Centrium Business Park, Griffiths Way, St Albans AL1 2RE, UK",
    gst_no: "GB 829 234567",
    country: "UK",
  },
  {
    vendor_code: "VND-UK-003",
    company_name: "Associated British Foods PLC",
    owner_name: "George Weston",
    owner_email: "vendor@abf.co.uk",
    owner_phone: "+44 20 7399 6500",
    owner_address: "Weston Centre, 10 Grosvenor Street, London W1K 4QY, UK",
    gst_no: "GB 561 345678",
    country: "UK",
  },
  {
    vendor_code: "VND-UK-004",
    company_name: "Tate & Lyle PLC",
    owner_name: "Nick Hampton",
    owner_email: "orders@tateandlyle.com",
    owner_phone: "+44 20 7257 2100",
    owner_address: "1 Kingsway, London WC2B 6AT, UK",
    gst_no: "GB 472 456789",
    country: "UK",
  },
  {
    vendor_code: "VND-UK-005",
    company_name: "Kellogg's Company of Great Britain Ltd",
    owner_name: "Chris Hood",
    owner_email: "ukprocurement@kellogg.com",
    owner_phone: "+44 1925 523000",
    owner_address: "The Kellogg Building, Talbot Road, Manchester M16 0PU, UK",
    gst_no: "GB 383 567890",
    country: "UK",
  },
  {
    vendor_code: "VND-UK-006",
    company_name: "Birds Eye Ltd",
    owner_name: "Steve Murrells",
    owner_email: "supply@birdseye.co.uk",
    owner_phone: "+44 1234 261313",
    owner_address: "Birdseye House, Station Road, Feltham, Middlesex TW14 8NX, UK",
    gst_no: "GB 294 678901",
    country: "UK",
  },
  {
    vendor_code: "VND-UK-007",
    company_name: "Unilever UK & Ireland Ltd",
    owner_name: "Alan Jope",
    owner_email: "vendor@unilever.com",
    owner_phone: "+44 20 7822 5252",
    owner_address: "100 Victoria Embankment, Blackfriars, London EC4Y 0DY, UK",
    gst_no: "GB 205 789012",
    country: "UK",
  },
];

async function seedGroceryVendors() {
  await sequelize.authenticate();

  // Resolve the main store to link vendors
  const [stores] = await sequelize.query(
    "SELECT id FROM stores WHERE name = 'Groco Main Store' LIMIT 1"
  ) as [Array<{ id: number }>, unknown];

  const storeId = stores[0]?.id ?? null;
  if (storeId) {
    console.log(`Linking vendors to store id=${storeId}`);
  } else {
    console.log("No store found — vendors will be created without a store link");
  }

  let created = 0;
  let skipped = 0;

  for (const v of VENDORS) {
    const [, wasCreated] = await Vendor.findOrCreate({
      where: { vendor_code: v.vendor_code },
      defaults: {
        store_id:     storeId,
        vendor_code:  v.vendor_code,
        company_name: v.company_name,
        owner_name:   v.owner_name,
        owner_email:  v.owner_email,
        owner_phone:  v.owner_phone,
        owner_address: v.owner_address,
        gst_no:       v.gst_no,
        status:       true,
        is_deleted:   false,
      },
    });
    if (wasCreated) {
      console.log(`  ✓ Created  [${v.vendor_code}] ${v.company_name}`);
      created++;
    } else {
      console.log(`  – Skipped  [${v.vendor_code}] ${v.company_name} (already exists)`);
      skipped++;
    }
  }

  console.log(`\nDone — ${created} created, ${skipped} already existed.`);
  await sequelize.close();
}

seedGroceryVendors().catch((err) => {
  console.error("Seeder failed:", err);
  process.exit(1);
});
