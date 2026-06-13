import sequelize from '../config/database'

async function run() {
  await sequelize.query(
    'ALTER TABLE products ADD FULLTEXT INDEX ft_products_search (name, short_description)'
  )
  console.log('FULLTEXT index added to products(name, short_description).')
  process.exit(0)
}

run().catch(e => { console.error(e); process.exit(1) })
