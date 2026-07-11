import { newArrivals } from '../data/products'
import ProductCard from './ProductCard'

export default function NewArrivals() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
          <p className="text-sm text-gray-500 mt-0.5">Fresh picks just landed</p>
        </div>
        <a href="#" className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition">
          See All &rarr;
        </a>
      </div>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible sm:pb-0">
        {newArrivals.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
