import { useState, useEffect } from 'react'
import { getNavbarConfig } from '../../lib/cmsCache'
import Header from '../Header'
import CmsNavbar from './CmsNavbar'

export default function CmsNavbarShell() {
  const [navConfig, setNavConfig] = useState(undefined) // undefined = loading

  useEffect(() => {
    getNavbarConfig().then(result => setNavConfig(result ?? null))
  }, [])

  // Still loading — render nothing to avoid flash of default header
  if (navConfig === undefined) return null

  // No CMS navbar configured — use the default hardcoded header
  if (!navConfig) return <Header />

  return <CmsNavbar config={navConfig.config} />
}
