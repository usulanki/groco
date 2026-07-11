import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import {
  cmsApi,
  DEFAULT_HEADER_CONFIG,
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_PRODUCT_DETAIL_CONFIG,
  type HomeComponent,
  type AppHeaderConfig,
  type AppFooterConfig,
  type ProductDetailConfig,
} from '@/lib/api'

type CmsContextType = {
  components:          HomeComponent[]
  headerConfig:        AppHeaderConfig
  footerConfig:        AppFooterConfig
  productDetailConfig: ProductDetailConfig
  loading:             boolean
}

const CmsContext = createContext<CmsContextType>({
  components:          [],
  headerConfig:        DEFAULT_HEADER_CONFIG,
  footerConfig:        DEFAULT_FOOTER_CONFIG,
  productDetailConfig: DEFAULT_PRODUCT_DETAIL_CONFIG,
  loading:             true,
})

const KNOWN_TYPES = new Set(['slider', 'category', 'products'])

export function CmsProvider({ children }: { children: ReactNode }) {
  const [components,          setComponents]          = useState<HomeComponent[]>([])
  const [headerConfig,        setHeaderConfig]        = useState<AppHeaderConfig>(DEFAULT_HEADER_CONFIG)
  const [footerConfig,        setFooterConfig]        = useState<AppFooterConfig>(DEFAULT_FOOTER_CONFIG)
  const [productDetailConfig, setProductDetailConfig] = useState<ProductDetailConfig>(DEFAULT_PRODUCT_DETAIL_CONFIG)
  const [loading,             setLoading]             = useState(true)

  useEffect(() => {
    Promise.all([
      cmsApi.getHomepage().then(data => {
        const known = (data?.components ?? []).filter(c => KNOWN_TYPES.has(c.type)) as HomeComponent[]
        setComponents(known)
      }).catch(() => {}),

      cmsApi.getAppHeader().then(data => {
        if (data?.config) setHeaderConfig(data.config)
      }).catch(() => {}),

      cmsApi.getAppFooter().then(data => {
        if (data?.config) setFooterConfig(data.config)
      }).catch(() => {}),

      cmsApi.getAppProductDetail().then(data => {
        if (data?.config) setProductDetailConfig(data.config)
      }).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, []) // single fetch per app session

  return (
    <CmsContext.Provider value={{ components, headerConfig, footerConfig, productDetailConfig, loading }}>
      {children}
    </CmsContext.Provider>
  )
}

export function useCms() {
  return useContext(CmsContext)
}
