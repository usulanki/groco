import { useState, useEffect } from 'react'

const slides = [
  {
    id: 1,
    tag: 'Summer Sale',
    title: 'Up to 50% Off Electronics',
    subtitle: 'Shop the latest gadgets, headphones, TVs and more — deals end Sunday.',
    cta: 'Shop Electronics',
    bg: 'from-blue-600 to-blue-900',
    imgBg: 'bg-blue-100',
    emoji: '💻',
  },
  {
    id: 2,
    tag: 'New Collection',
    title: 'Refresh Your Wardrobe',
    subtitle: 'Discover the latest trends in fashion — curated styles for every occasion.',
    cta: 'Explore Fashion',
    bg: 'from-rose-500 to-pink-800',
    imgBg: 'bg-pink-100',
    emoji: '👗',
  },
  {
    id: 3,
    tag: 'Home & Living',
    title: 'Elevate Your Living Space',
    subtitle: 'Premium furniture and decor at prices you\'ll love. Free delivery on all orders.',
    cta: 'Shop Furniture',
    bg: 'from-amber-500 to-orange-700',
    imgBg: 'bg-amber-100',
    emoji: '🛋️',
  },
]

export default function HeroBanner() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const slide = slides[current]

  return (
    <section className="relative overflow-hidden">
      <div className={`bg-gradient-to-r ${slide.bg} transition-all duration-700`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col md:flex-row items-center gap-8">
          {/* Text */}
          <div className="flex-1 text-white text-center md:text-left">
            <span className="inline-block bg-white/20 text-white text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              {slide.tag}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              {slide.title}
            </h1>
            <p className="text-white/80 text-base md:text-lg mb-8 max-w-md mx-auto md:mx-0">
              {slide.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <button className="bg-white text-gray-900 font-bold px-7 py-3 rounded-full hover:bg-gray-100 transition shadow-lg">
                {slide.cta}
              </button>
              <button className="border border-white/50 text-white font-semibold px-7 py-3 rounded-full hover:bg-white/10 transition">
                View All Deals
              </button>
            </div>
          </div>

          {/* Illustration placeholder */}
          <div className={`flex-shrink-0 w-48 h-48 sm:w-64 sm:h-64 ${slide.imgBg} rounded-3xl flex items-center justify-center shadow-2xl`}>
            <span className="text-8xl sm:text-9xl">{slide.emoji}</span>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-white w-6' : 'bg-white/50'}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
