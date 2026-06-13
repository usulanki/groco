import sequelize from "../config/database";

const PARTNERS = [
  { name: "Shiprocket",  slug: "shiprocket",  description: "Pan-India shipping with 17,000+ pin codes covered",  logo_url: null },
  { name: "Delhivery",   slug: "delhivery",   description: "Express & surface delivery across India",            logo_url: null },
  { name: "Dunzo",       slug: "dunzo",       description: "Same-day hyperlocal delivery",                       logo_url: null },
  { name: "Blue Dart",   slug: "blue-dart",   description: "Premium courier with real-time tracking",            logo_url: null },
  { name: "Shadowfax",   slug: "shadowfax",   description: "Flexible last-mile delivery partner",               logo_url: null },
];

(async () => {
  await sequelize.authenticate();
  for (const p of PARTNERS) {
    await sequelize.query(
      `INSERT IGNORE INTO \`delivery_partners\` (\`name\`, \`slug\`, \`description\`, \`logo_url\`, \`status\`, \`is_deleted\`, \`created_ts\`, \`updated_ts\`)
       VALUES (?, ?, ?, ?, 1, 0, NOW(), NOW())`,
      { replacements: [p.name, p.slug, p.description, p.logo_url] },
    );
    console.log(`Seeded: ${p.name}`);
  }
  console.log("Delivery partners seeded.");
  await sequelize.close();
})().catch(err => { console.error(err.message); process.exit(1); });
