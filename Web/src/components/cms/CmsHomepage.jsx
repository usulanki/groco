import { useState, useEffect } from 'react'
import { getCmsLayout } from '../../lib/cmsCache'
import PageLoader from '../PageLoader'
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

// Default page shown when no CMS layout has been saved yet
import HeroBanner from '../HeroBanner'
import NewArrivals from '../NewArrivals'
import PromoBanners from '../PromoBanners'
import BestSellers from '../BestSellers'
import TrendingProducts from '../TrendingProducts'

const RENDERERS = {
  'banner':         (comp) => <CmsBanner        key={comp.id} config={comp.config} />,
  'category-grid':  (comp) => <CategoryGrid     key={comp.id} cmsConfig={comp.config} />,
  'product-grid':   (comp) => <CmsProductGrid   key={comp.id} config={comp.config} />,
  'banner-strip':   (comp) => <CmsBannerStrip   key={comp.id} config={comp.config} />,
  'deal-grid':      (comp) => <CmsDealGrid      key={comp.id} config={comp.config} />,
  'sliding-banner': (comp) => <CmsSlidingBanner key={comp.id} config={comp.config} />,
  'testimonial':    (comp) => <CmsTestimonial   key={comp.id} config={comp.config} />,
  'newsletter':     (comp) => <CmsNewsletter    key={comp.id} config={comp.config} />,
  'marquee':        (comp) => <CmsMarquee       key={comp.id} config={comp.config} />,
  // Only render in-page; above-nav variant is handled by CmsAnnouncementBar in App.jsx
  'announcement-bar': (comp) => comp.config?.position === 'in-page'
    ? <AnnouncementBarDisplay key={comp.id} config={comp.config} dismissId={comp.id} />
    : null,
}

function DefaultHomepage() {
  return (
    <>
      <HeroBanner />
      <CategoryGrid />
      <NewArrivals />
      <PromoBanners />
      <BestSellers />
      <TrendingProducts />
    </>
  )
}

export default function CmsHomepage() {
  const [layout, setLayout] = useState(undefined) // undefined = loading

  useEffect(() => {
    getCmsLayout().then(setLayout)
  }, [])

  // Still fetching
  if (layout === undefined) return <PageLoader />

  // No layout saved — show the default hardcoded homepage
  if (!layout) return <DefaultHomepage />

  return (
    <>
      {layout.map((comp) => RENDERERS[comp.type]?.(comp))}
    </>
  )
}
