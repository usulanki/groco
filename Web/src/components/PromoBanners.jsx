const banners = [
  {
    id: 1,
    tag: 'Free Delivery',
    title: 'Free Shipping on Orders $50+',
    desc: 'No minimum on select items. Fast, reliable delivery nationwide.',
    cta: 'Learn More',
    bg: 'from-violet-500 to-purple-700',
    emoji: '🚚',
  },
  {
    id: 2,
    tag: 'New Launch',
    title: 'Latest Electronics Have Arrived',
    desc: 'From laptops to smart home — explore cutting-edge tech.',
    cta: 'Shop Electronics',
    bg: 'from-blue-500 to-cyan-600',
    emoji: '📱',
  },
  {
    id: 3,
    tag: 'Summer Edit',
    title: 'Summer Fashion Collection',
    desc: 'Beat the heat in style. New arrivals weekly in fashion.',
    cta: 'Shop Fashion',
    bg: 'from-brand-500 to-rose-500',
    emoji: '☀️',
  },
]

export default function PromoBanners() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {banners.map((b) => (
          <div key={b.id} className={`bg-gradient-to-br ${b.bg} rounded-2xl p-6 text-white flex items-center gap-4 hover:scale-[1.02] transition-transform duration-200 shadow-sm`}>
            <span className="text-5xl flex-shrink-0">{b.emoji}</span>
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest opacity-75">{b.tag}</span>
              <h3 className="font-bold text-base leading-snug mt-1 mb-1">{b.title}</h3>
              <p className="text-xs text-white/70 mb-3">{b.desc}</p>
              <button className="text-xs font-bold bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full transition">
                {b.cta}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
