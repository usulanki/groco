import sequelize from '../config/database'

async function run() {
  // Drop all duplicate product_code_N and slug_N indexes, keeping the originals
  const [rows] = await sequelize.query('SHOW INDEX FROM products') as [any[], unknown]

  const toDrop = (rows as any[])
    .map((r: any) => r.Key_name)
    .filter((name: string) => /^(product_code|slug)_\d+$/.test(name))

  if (toDrop.length === 0) {
    console.log('No duplicate indexes found.')
  } else {
    console.log(`Dropping ${toDrop.length} duplicate indexes: ${toDrop.join(', ')}`)
    for (const idx of toDrop) {
      await sequelize.query(`ALTER TABLE products DROP INDEX \`${idx}\``)
      console.log(`  Dropped: ${idx}`)
    }
  }

  // Add the FULLTEXT index
  await sequelize.query(
    'ALTER TABLE products ADD FULLTEXT INDEX ft_products_search (name, short_description)'
  )
  console.log('FULLTEXT index ft_products_search added.')
  process.exit(0)
}

run().catch(e => { console.error(e.message); process.exit(1) })
