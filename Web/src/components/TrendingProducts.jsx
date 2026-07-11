import { trending } from '../data/products'
import ProductCard from './ProductCard'

export default function TrendingProducts() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trending Now</h2>
          <p className="text-sm text-gray-500 mt-0.5">What everyone is buying right now</p>
        </div>
        <a href="#" className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition">
          View All &rarr;
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {trending.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
