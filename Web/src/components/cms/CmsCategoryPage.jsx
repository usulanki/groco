import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import PageLoader from '../PageLoader'
import { getCategoryLayout } from '../../lib/cmsCache'
import { categoriesApi, productsApi } from '../../lib/api'
import ProductCard from '../ProductCard'
import CmsBanner from './CmsBanner'
import CmsProductGrid from './CmsProductGrid'
import CmsBannerStrip from './CmsBannerStrip'
import CmsDealGrid from './CmsDealGrid'
import CmsSlidingBanner from './CmsSlidingBanner'
import CmsTestimonial from './CmsTestimonial'
import CmsNewsletter from './CmsNewsletter'
import CmsMarquee from './CmsMarquee'
import { AnnouncementBarDisplay } from './CmsAnnouncementBar'
import CategoryGrid from '../CategoryGrid'
import CmsProductListing from './CmsProductListing'

// ─── Subcategory left-sidebar layout (Zepto-style) ───────────────────────────

function toCardShape(p) {
  const price     = p.prices?.find(pr => pr.variant_id == null) ?? p.prices?.[0]
  const sellPrice = price ? Number(price.final_price ?? price.price) : 0
  const origPrice = price?.compare_at_price ? Number(price.compare_at_price) : sellPrice
  const primary   = p.images?.find(i => i.ProductMedia?.is_primary) ?? p.images?.[0]
  const img       = primary?.path
    ? `${MEDIA_BASE}${primary.path}`
    : `https://placehold.co/300x300/e2e8f0/94a3b8?text=${encodeURIComponent(p.name)}`
  return {
    id:            p.id,
    slug:          p.slug,
    name:          p.name,
    category:      p.Category?.name ?? '',
    price:         sellPrice,
    originalPrice: origPrice,
    rating:        4,
    reviews:       0,
    badge:         null,
    img,
    variantCount:  Number(p.variant_count ?? 0),
  }
}

function SubcategoryProducts({ category }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!category?.id) { setLoading(false); return }
    setLoading(true)
    setProducts([])
    productsApi
      .list({ category_id: category.id, limit: 60, sort: 'newest' })
      .then(data => setProducts(data.rows ?? []))
      .catch(err => console.error('SubcategoryProducts fetch failed:', err))
      .finally(() => setLoading(false))
  }, [category?.id])

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  )

  if (products.length === 0) return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm text-gray-500">No products in this category</p>
    </div>
  )

  return (
    <div>
      <p className="text-sm font-bold text-gray-800 mb-3">{category?.name}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-4 sm:gap-4">
        {products.map(p => <ProductCard key={p.id} product={toCardShape(p)} />)}
      </div>
    </div>
  )
}

function SubcategoryLayout({ category, subcategories }) {
  const [selectedSub, setSelectedSub] = useState(subcategories[0] ?? null)

  return (
    <div>
      {/* Header with breadcrumb */}
      <div className="bg-gray-100 py-3 pr-6 border-b border-gray-200" style={{ paddingLeft: 124 }}>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Link to="/" className="hover:text-gray-600 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{category?.name}</span>
        </div>
        <h1 className="text-base font-bold text-gray-800 mt-0.5">{category?.name}</h1>
      </div>

    <div className="flex">
      {/* Left sidebar */}
      <div
        className="shrink-0 bg-gray-50 border-r border-gray-100 overflow-y-auto sticky top-16"
        style={{ width: 88, height: 'calc(100vh - 64px)', alignSelf: 'flex-start', marginLeft: 100 }}
      >
        {subcategories.map(sub => {
          const isActive = sub.id === selectedSub?.id
          const imgSrc   = sub.media?.path ? `${MEDIA_BASE}${sub.media.path}` : null
          return (
            <button
              key={sub.id}
              onClick={() => setSelectedSub(sub)}
              className={`w-full flex flex-col items-center gap-1.5 py-3 px-1 border-l-[3px] transition-colors text-left ${
                isActive ? 'border-l-green-600 bg-white' : 'border-l-transparent hover:bg-gray-100'
              }`}
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center shrink-0">
                {imgSrc
                  ? <img src={imgSrc} alt={sub.name} className="w-full h-full object-cover" />
                  : <span className="text-xl">🏷️</span>
                }
              </div>
              <span className={`text-[10px] text-center leading-tight w-full ${
                isActive ? 'font-semibold text-gray-900' : 'text-gray-500'
              }`}>
                {sub.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Right - products */}
      <div className="flex-1 min-w-0 px-4 py-4 sm:px-6 sm:py-5">
        <SubcategoryProducts category={selectedSub} />
      </div>
    </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

const RENDERERS = {
  'banner':           (comp) => <CmsBanner          key={comp.id} config={comp.config} />,
  'category-grid':    (comp) => <CategoryGrid        key={comp.id} cmsConfig={comp.config} />,
  'product-grid':     (comp) => <CmsProductGrid      key={comp.id} config={comp.config} />,
  'banner-strip':     (comp) => <CmsBannerStrip      key={comp.id} config={comp.config} />,
  'deal-grid':        (comp) => <CmsDealGrid         key={comp.id} config={comp.config} />,
  'sliding-banner':   (comp) => <CmsSlidingBanner    key={comp.id} config={comp.config} />,
  'testimonial':      (comp) => <CmsTestimonial      key={comp.id} config={comp.config} />,
  'newsletter':       (comp) => <CmsNewsletter       key={comp.id} config={comp.config} />,
  'marquee':          (comp) => <CmsMarquee          key={comp.id} config={comp.config} />,
  'announcement-bar': (comp) => comp.config?.position === 'in-page'
    ? <AnnouncementBarDisplay key={comp.id} config={comp.config} dismissId={comp.id} />
    : null,
}

const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE

const PY   = { sm: 'py-2',  md: 'py-3',  lg: 'py-4'  }
const GAP  = { sm: 'gap-2', md: 'gap-3', lg: 'gap-4'  }
const FONT = { xs: 'text-[10px]', sm: 'text-xs', md: 'text-sm' }

function SubCategoryBar({ config, subcategories, parentSlug }) {
  if (!config || !subcategories?.length) return null

  const rMap  = { sm: '4px', md: '8px', lg: '12px', full: '9999px' }
  const align = config.align === 'center' ? 'justify-center' : config.align === 'right' ? 'justify-end' : 'justify-start'
  const wt    = config.name_bold ? 'font-bold' : 'font-medium'
  const py    = PY[config.padding_y]   || 'py-3'
  const gap   = GAP[config.item_gap]   || 'gap-3'
  const font  = FONT[config.font_size] || 'text-[10px]'

  const items = config.show_all_tab
    ? [{ slug: null, name: config.all_tab_label || 'All', media: null }, ...subcategories]
    : subcategories

  return (
    <div
      className={`px-4 overflow-hidden ${py} ${config.sticky ? 'sticky top-0 z-10' : ''}`}
      style={{
        backgroundColor: config.bg_color || '#ffffff',
        borderBottom: config.border_bottom ? `1px solid ${config.border_color || '#e2e8f0'}` : 'none',
      }}
    >
      <div className={`flex ${gap} ${align} ${config.scrollable ? 'overflow-x-auto' : 'flex-wrap'} pb-0.5`}>
        {items.map((item) => {
          const isActive  = item.slug === null // "All" is active when viewing the parent category
          const href      = item.slug ? `/category/${item.slug}` : `/category/${parentSlug}`
          const imgSrc    = item.media?.path ? `${MEDIA_BASE}${item.media.path}` : null
          const nameStyle = { color: isActive ? config.active_name_color : config.name_color }

          if (config.layout === 'circle') return (
            <Link key={item.name} to={href} className={`flex flex-col items-center gap-1.5 shrink-0 ${font} ${wt}`} style={{ textDecoration: 'none' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden text-lg"
                style={{ backgroundColor: isActive ? config.active_icon_bg_color : config.icon_bg_color }}>
                {imgSrc ? <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" /> : '🏷️'}
              </div>
              <span className="text-center leading-tight whitespace-nowrap" style={nameStyle}>{item.name}</span>
              {isActive && <span className="w-1 h-1 rounded-full" style={{ backgroundColor: config.active_indicator_color }} />}
            </Link>
          )

          if (config.layout === 'card') return (
            <Link key={item.name} to={href}
              className="flex flex-col items-center gap-0.5 rounded-xl overflow-hidden border shrink-0 w-14"
              style={{
                textDecoration: 'none',
                borderColor: isActive ? config.active_indicator_color : (config.border_color || '#e2e8f0'),
                backgroundColor: isActive ? config.active_bg_color : config.icon_bg_color,
              }}>
              <div className="w-full flex items-center justify-center h-10 text-xl overflow-hidden">
                {imgSrc ? <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" /> : '🏷️'}
              </div>
              <div className="px-1 pb-1.5 text-center">
                <span className={`leading-tight block whitespace-nowrap ${font} ${wt}`} style={nameStyle}>{item.name}</span>
              </div>
            </Link>
          )

          if (config.layout === 'pill') return (
            <Link key={item.name} to={href}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 shrink-0 ${config.pill_radius === 'full' ? 'rounded-full' : config.pill_radius === 'lg' ? 'rounded-lg' : config.pill_radius === 'sm' ? 'rounded' : 'rounded-md'} ${font} ${wt}`}
              style={{
                textDecoration: 'none',
                color: isActive ? config.active_name_color : config.name_color,
                backgroundColor: isActive ? config.active_bg_color : 'transparent',
                border: `1px solid ${isActive ? config.active_indicator_color : (config.border_color || '#e2e8f0')}`,
              }}>
              {imgSrc && <img src={imgSrc} alt="" className="w-4 h-4 rounded-full object-cover" />}
              {item.name}
            </Link>
          )

          if (config.layout === 'minimal') return (
            <Link key={item.name} to={href}
              className={`flex flex-col items-center gap-1 shrink-0 px-1 rounded-xl ${font} ${wt}`}
              style={{ textDecoration: 'none', backgroundColor: isActive ? config.active_bg_color : 'transparent' }}>
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xl"
                style={{ backgroundColor: isActive ? config.active_icon_bg_color : config.icon_bg_color }}>
                {imgSrc ? <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" /> : '🏷️'}
              </div>
              <span className="text-center leading-tight whitespace-nowrap" style={nameStyle}>{item.name}</span>
            </Link>
          )

          if (config.layout === 'text') return (
            <Link key={item.name} to={href}
              className={`inline-flex items-center px-3 py-1 border whitespace-nowrap shrink-0 ${font} ${wt}`}
              style={{
                textDecoration: 'none',
                borderRadius: rMap[config.text_border_radius] || '9999px',
                borderColor: isActive ? config.active_indicator_color : (config.text_border_color || '#e2e8f0'),
                color: isActive ? config.active_name_color : config.name_color,
                backgroundColor: isActive ? config.active_bg_color : 'transparent',
              }}>
              {item.name}
            </Link>
          )

          if (config.layout === 'tabs') return (
            <Link key={item.name} to={href}
              className={`whitespace-nowrap px-3 pb-2.5 border-b-2 shrink-0 transition-colors ${font} ${wt}`}
              style={{
                textDecoration: 'none',
                color: isActive ? config.active_name_color : config.name_color,
                borderBottomColor: isActive ? config.active_indicator_color : 'transparent',
              }}>
              {item.name}
            </Link>
          )

          // underline (default)
          return (
            <Link key={item.name} to={href}
              className={`whitespace-nowrap pb-2 border-b-2 shrink-0 transition-colors ${font} ${wt}`}
              style={{
                textDecoration: 'none',
                color: isActive ? config.active_name_color : config.name_color,
                borderBottomColor: isActive ? config.active_indicator_color : 'transparent',
              }}>
              {item.name}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default function CmsCategoryPage() {
  const { slug } = useParams()
  const [loading,       setLoading]       = useState(true)
  const [components,    setComponents]    = useState([])
  const [subCatConfig,  setSubCatConfig]  = useState(null)
  const [subcategories, setSubcategories] = useState([])
  const [category,      setCategory]      = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)
    setComponents([])
    setSubCatConfig(null)
    setSubcategories([])
    setCategory(null)

    Promise.all([
      getCategoryLayout(slug),   // slug-specific layout
      getCategoryLayout(null),   // base category layout (fallback)
      categoriesApi.getBySlug(slug).catch(() => null),
    ]).then(([slugLayout, baseLayout, cat]) => {
      // Slug-specific takes priority; fall back to base for missing pieces
      setComponents(slugLayout?.components ?? baseLayout?.components ?? [])
      setSubCatConfig(slugLayout?.subcategory_bar ?? baseLayout?.subcategory_bar ?? null)
      setSubcategories(cat?.children ?? [])
      setCategory(cat ?? null)
    }).finally(() => setLoading(false))
  }, [slug])

  if (loading) return <PageLoader />

  if (subcategories.length > 0 && category) {
    return <SubcategoryLayout category={category} subcategories={subcategories} />
  }

  return (
    <>
      <SubCategoryBar
        config={subCatConfig}
        subcategories={subcategories}
        parentSlug={slug}
      />
      {components.map((comp) => RENDERERS[comp.type]?.(comp))}
      <CmsProductListing category={category} />
    </>
  )
}
