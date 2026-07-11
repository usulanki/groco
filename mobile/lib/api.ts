import { Platform } from 'react-native'

const rawUrl =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000')

const SERVER_URL =
  Platform.OS === 'android' ? rawUrl.replace('localhost', '10.0.2.2') : rawUrl

const BASE_URL = SERVER_URL + '/api'

let _accessToken: string | null = null

export function setAccessToken(token: string | null) {
  _accessToken = token
}

export function mediaUrl(path: string): string {
  return `${SERVER_URL}/uploads/${path}`
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((json as { message?: string }).message || `Request failed: ${res.status}`)
  return (json as { data: T }).data
}

async function patch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((json as { message?: string }).message || `Request failed: ${res.status}`)
  return (json as { data: T }).data
}

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`
  const query = params
    ? '?' + Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&')
    : ''
  const res = await fetch(`${BASE_URL}${path}${query}`, { headers })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((json as { message?: string }).message || `Request failed: ${res.status}`)
  return (json as { data: T }).data
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number
  fname: string
  lname: string
  email: string
  phone?: string | null
}

export interface AuthTokens {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export const authApi = {
  login:          (data: { email: string; password: string }) =>
    post<AuthTokens>('/auth/login', data),

  register:       (data: { fname: string; lname: string; email: string; password: string; phone?: string }) =>
    post<AuthTokens>('/auth/register', data),

  googleLogin:    (data: { access_token: string }) =>
    post<AuthTokens>('/auth/google', data),

  forgotPassword: (data: { email: string }) =>
    post<null>('/auth/forgot-password', data),

  resetPassword:  (data: { email: string; otp: string; password: string }) =>
    post<null>('/auth/reset-password', data),

  me:            () => get<AuthUser>('/auth/me'),

  updateProfile: (data: { fname?: string; lname?: string; email?: string; phone?: string | null }) =>
    patch<AuthUser>('/auth/me', data as Record<string, unknown>),

  changePassword: (data: { current_password: string; new_password: string }) =>
    post<null>('/auth/change-password', data as Record<string, unknown>),
}

// ─── CMS ──────────────────────────────────────────────────────────────────────

export type HeaderLayout = 'full' | 'compact' | 'logo-only'

export interface AppHeaderConfig {
  layout: HeaderLayout
  bg_color: string
  bg_opacity: number
  show_location_row: boolean
  delivery_label: string
  delivery_label_color: string
  delivery_label_size: number
  location_name: string
  location_name_color: string
  location_name_size: number
  location_icon_color: string
  show_search: boolean
  search_bg: string
  search_placeholder: string
  search_placeholder_color: string
  search_text_size: number
  show_bell: boolean
  show_heart: boolean
  show_profile: boolean
  show_cart: boolean
  icon_color: string
}

export const DEFAULT_HEADER_CONFIG: AppHeaderConfig = {
  layout: 'full',
  bg_color: '#ffffff',
  bg_opacity: 100,
  show_location_row: true,
  delivery_label: 'Delivery in 8 minutes',
  delivery_label_color: '#888888',
  delivery_label_size: 13,
  location_name: 'Add your location',
  location_name_color: '#1a1a1a',
  location_name_size: 13,
  location_icon_color: '#ffcc01',
  show_search: true,
  search_bg: '#ffffff',
  search_placeholder: 'Search products, brands and categories...',
  search_placeholder_color: '#9ca3af',
  search_text_size: 13,
  show_bell: false,
  show_heart: false,
  show_profile: true,
  show_cart: true,
  icon_color: '#374151',
}

export interface SliderImage {
  id: string
  url: string
  media_path: string
}

export interface AppSliderConfig {
  images: SliderImage[]
  show_count: '1' | '1.5'
  auto_scroll: boolean
  auto_scroll_interval: number
  loop: boolean
  show_dots: boolean
  dot_color: string
  dot_active_color: string
  image_radius: number
  image_height: number
  gap: number
  side_padding: number
}

export interface AppCategoryConfig {
  layout: 'scroll' | 'grid'
  columns: number
  icon_shape: 'none' | 'circle' | 'rounded' | 'square'
  icon_radius: number
  icon_size: number
  icon_bg_color: string
  icon_bg_opacity: number
  icon_border_color: string
  icon_border_width: number
  show_label: boolean
  label_color: string
  label_size: number
  label_bold: boolean
  show_section_title: boolean
  section_title: string
  section_title_color: string
  section_title_size: number
  bg_color: string
}

export interface AppProductConfig {
  source: string
  category_id: number | null
  manual_product_ids: number[]
  show_heading: boolean
  heading: string
  heading_color: string
  heading_size: number
  show_view_all: boolean
  view_all_text: string
  view_all_color: string
  columns: 1 | 2 | 3
  product_count: number
  bg_color: string
  card_bg: string
  card_radius: number
  image_radius: number
  name_color: string
  name_size: number
  price_color: string
  show_original_price: boolean
  original_price_color: string
  show_discount_badge: boolean
  discount_badge_bg: string
  discount_badge_color: string
  show_rating: boolean
  show_add_to_cart: boolean
  add_to_cart_bg: string
  add_to_cart_color: string
}

export type HomeComponent =
  | { id: string; type: 'slider';   config: AppSliderConfig   }
  | { id: string; type: 'category'; config: AppCategoryConfig }
  | { id: string; type: 'products'; config: AppProductConfig  }

export interface AppFooterConfig {
  show_footer:        boolean
  bg_color:           string
  border_color:       string
  icon_color:         string
  active_color:       string
  label_color:        string
  active_label_color: string
  label_size:         number
  show_home:          boolean
  show_cart:          boolean
  show_orders:        boolean
  show_search:        boolean
  show_bar:           boolean
  home_label:         string
  cart_label:         string
  orders_label:       string
  search_label:       string
  bar_label:          string
}

export const DEFAULT_FOOTER_CONFIG: AppFooterConfig = {
  show_footer:        true,
  bg_color:           '#ffffff',
  border_color:       '#f0f0f0',
  icon_color:         '#aaaaaa',
  active_color:       '#ffcc01',
  label_color:        '#aaaaaa',
  active_label_color: '#ffcc01',
  label_size:         10,
  show_home:          true,
  show_cart:          true,
  show_orders:        true,
  show_search:        false,
  show_bar:           false,
  home_label:         'Home',
  cart_label:         'Cart',
  orders_label:       'Orders',
  search_label:       'Search',
  bar_label:          'More',
}

export interface ProductDetailConfig {
  bg_color:                 string
  card_bg:                  string
  image_height:             number
  image_bg:                 string
  show_image_dots:          boolean
  dot_color:                string
  dot_active_color:         string
  show_wishlist_btn:        boolean
  wishlist_bg:              string
  wishlist_color:           string
  show_breadcrumb:          boolean
  breadcrumb_color:         string
  name_color:               string
  name_size:                number
  show_rating:              boolean
  rating_color:             string
  price_color:              string
  show_original_price:      boolean
  original_price_color:     string
  show_discount_badge:      boolean
  discount_badge_bg:        string
  discount_badge_color:     string
  show_variants:            boolean
  variant_label_color:      string
  variant_chip_bg:          string
  variant_chip_text:        string
  variant_chip_border:      string
  variant_chip_active_bg:   string
  variant_chip_active_text: string
  variant_chip_radius:      number
  qty_btn_bg:               string
  qty_btn_color:            string
  show_description:         boolean
  description_color:        string
  add_to_cart_bg:           string
  add_to_cart_color:        string
  btn_radius:               number
  show_reviews:             boolean
  review_heading_color:     string
  review_card_bg:           string
  show_related_products:    boolean
  related_heading_color:    string
}

export const DEFAULT_PRODUCT_DETAIL_CONFIG: ProductDetailConfig = {
  bg_color:                 '#f9fafb',
  card_bg:                  '#ffffff',
  image_height:             220,
  image_bg:                 '#f1f5f9',
  show_image_dots:          true,
  dot_color:                '#d1d5db',
  dot_active_color:         '#f97316',
  show_wishlist_btn:        true,
  wishlist_bg:              '#ffffff',
  wishlist_color:           '#ef4444',
  show_breadcrumb:          true,
  breadcrumb_color:         '#6b7280',
  name_color:               '#1a1a1a',
  name_size:                16,
  show_rating:              true,
  rating_color:             '#f59e0b',
  price_color:              '#1a1a1a',
  show_original_price:      true,
  original_price_color:     '#9ca3af',
  show_discount_badge:      true,
  discount_badge_bg:        '#e0f2fe',
  discount_badge_color:     '#0369a1',
  show_variants:            true,
  variant_label_color:      '#374151',
  variant_chip_bg:          '#f3f4f6',
  variant_chip_text:        '#374151',
  variant_chip_border:      '#e5e7eb',
  variant_chip_active_bg:   '#1a1a1a',
  variant_chip_active_text: '#ffffff',
  variant_chip_radius:      8,
  qty_btn_bg:               '#f3f4f6',
  qty_btn_color:            '#1a1a1a',
  show_description:         true,
  description_color:        '#6b7280',
  add_to_cart_bg:           '#ffcc01',
  add_to_cart_color:        '#1a1a1a',
  btn_radius:               12,
  show_reviews:             true,
  review_heading_color:     '#1a1a1a',
  review_card_bg:           '#ffffff',
  show_related_products:    true,
  related_heading_color:    '#1a1a1a',
}

export interface PaymentScreenConfig {
  bg_color:              string
  card_bg:               string
  divider_color:         string
  show_order_summary:    boolean
  summary_heading_color: string
  summary_label_color:   string
  summary_value_color:   string
  total_color:           string
  show_delivery_address: boolean
  address_heading_color: string
  address_text_color:    string
  address_edit_color:    string
  gateway_heading_color: string
  active_gateway_bg:     string
  active_gateway_border: string
  active_dot_color:      string
  inactive_dot_color:    string
  gateway_label_color:   string
  gateway_mode_color:    string
  gateway_razorpay:      boolean
  gateway_stripe:        boolean
  gateway_payu:          boolean
  gateway_cashfree:      boolean
  gateway_paytm:         boolean
  gateway_phonepe:       boolean
  pay_bg:                string
  pay_color:             string
  pay_radius:            number
  pay_label:             string
}

export const DEFAULT_PAYMENT_CONFIG: PaymentScreenConfig = {
  bg_color:              '#f9fafb',
  card_bg:               '#ffffff',
  divider_color:         '#f1f5f9',
  show_order_summary:    true,
  summary_heading_color: '#1a1a1a',
  summary_label_color:   '#6b7280',
  summary_value_color:   '#1a1a1a',
  total_color:           '#1a1a1a',
  show_delivery_address: true,
  address_heading_color: '#1a1a1a',
  address_text_color:    '#6b7280',
  address_edit_color:    '#3b82f6',
  gateway_heading_color: '#1a1a1a',
  active_gateway_bg:     '#eff6ff',
  active_gateway_border: '#bfdbfe',
  active_dot_color:      '#3b82f6',
  inactive_dot_color:    '#d1d5db',
  gateway_label_color:   '#1a1a1a',
  gateway_mode_color:    '#6b7280',
  gateway_razorpay:      true,
  gateway_stripe:        false,
  gateway_payu:          false,
  gateway_cashfree:      false,
  gateway_paytm:         false,
  gateway_phonepe:       false,
  pay_bg:                '#ffcc01',
  pay_color:             '#1a1a1a',
  pay_radius:            14,
  pay_label:             'Pay Now',
}

export const cmsApi = {
  getHomepage:          () => get<{ components: HomeComponent[] }>('/cms/homepage',                  { _t: Date.now() }),
  getAppHeader:         () => get<{ config: AppHeaderConfig | null }>('/cms/app/header',              { _t: Date.now() }),
  getAppFooter:         () => get<{ config: AppFooterConfig | null }>('/cms/app/footer',              { _t: Date.now() }),
  getAppProductDetail:  () => get<{ config: ProductDetailConfig | null }>('/cms/app/product-detail',  { _t: Date.now() }),
  getAppPaymentScreen:  () => get<{ config: PaymentScreenConfig | null }>('/cms/app/payment-screen',  { _t: Date.now() }),
}

// ─── Address ──────────────────────────────────────────────────────────────────

export interface UserAddress {
  id:       number
  address1: string
  address2: string | null
  pincode:  string
  City?:    { id: number; name: string }
  State?:   { id: number; name: string }
}

export interface StateOption { id: number; name: string }
export interface CityOption  { id: number; name: string; state_id: number }

async function del(path: string): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`
  await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers })
}

export const addressApi = {
  getAll: () => get<UserAddress[]>('/addresses'),

  create: (data: {
    address1:  string
    address2?: string
    city_id:   number
    state_id:  number
    pincode:   string
  }) => post<UserAddress>('/addresses', data as unknown as Record<string, unknown>),

  delete: (id: number) => del(`/addresses/${id}`),
}

export const locationsApi = {
  getStates: () => get<StateOption[]>('/locations/states'),
  getCities: (state_id: number) => get<CityOption[]>('/locations/cities', { state_id }),
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface PlacedOrderOutlet {
  id:        number
  name:      string
  latitude:  number | null
  longitude: number | null
  address1:  string | null
  city:      string | null
}

export interface PlacedOrderItem {
  id:         number
  quantity:   number
  product_id: number
  price:      number
  total:      number
  Product?:   { id: number; name: string }
}

export interface PlacedOrder {
  id:              number
  order_no:        string
  order_status:    string
  order_amount:    number
  delivery_charge: number
  total:           number
  outlet_id:       number
  created_ts:      string
  Outlet?:         PlacedOrderOutlet
  OrderItems?:     PlacedOrderItem[]
}

export interface DeliveryEstimate {
  outlet_id:       number | null
  distance_km:     number | null
  delivery_charge: number
}

export interface OrderRequestItem {
  product_id: number
  variant_id?: number | null
  quantity:   number
}

export const ordersApi = {
  create: (params: {
    items:      OrderRequestItem[]
    addressId?: number
    latitude?:  number
    longitude?: number
  }) =>
    post<PlacedOrder[]>('/orders', {
      items: params.items,
      ...(params.addressId != null && { address_id: params.addressId }),
      ...(params.latitude  != null && { latitude:   params.latitude  }),
      ...(params.longitude != null && { longitude:  params.longitude }),
    }),
  getAll:  () => get<PlacedOrder[]>('/orders'),
  getById: (id: number) => get<PlacedOrder>(`/orders/${id}`),
}

// ─── Outlets ──────────────────────────────────────────────────────────────────

export const outletsApi = {
  deliveryEstimate: (lat: number, lng: number) =>
    get<DeliveryEstimate>('/outlets/delivery-estimate', { lat, lng }),
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export interface RazorpayOrderResult {
  orderId:         number
  razorpayOrderId: string
  amount:          number
  keyId:           string
}

export interface RazorpayVerifyResult {
  orderId: number
  status:  string
}

export const paymentsApi = {
  createRazorpayOrder: (data?: { addressId?: number }) =>
    post<RazorpayOrderResult>('/payments/razorpay-create', data ?? {}),

  verifyRazorpayPayment: (data: {
    orderId:              number
    razorpay_payment_id:  string
    razorpay_order_id:    string
    razorpay_signature:   string
  }) => post<RazorpayVerifyResult>('/payments/razorpay-verify', data as unknown as Record<string, unknown>),
}

// ─── Categories ───────────────────────────────────────────────────────────────

export interface Category {
  id: number
  name: string
  slug: string
  media?: { id: number; path: string; filename: string } | null
  children?: Category[]
}

export const categoriesApi = {
  getAll:     () => get<Category[]>('/categories'),
  getBySlug:  (slug: string) => get<Category>(`/categories/${encodeURIComponent(slug)}`),
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface ProductImage {
  id: number
  path: string
}

export interface Product {
  id: number
  name: string
  is_stockable?: boolean
  stock_qty?: number | null  // null = not tracked; 0 = out of stock; >0 = available
  images?: ProductImage[]
  prices?: { price: number; compare_at_price?: number | null; original_price?: number | null }[]
  variants?: ProductVariant[]
}

export interface VariantAttributeValue {
  id:        number
  value:     string
  attribute: { id: number; name: string }
}

export interface ProductVariant {
  id:              number
  stock_qty?:      number | null  // null = not tracked; 0 = out of stock; >0 = available
  attributeValues: VariantAttributeValue[]
  prices?:         { id: number; price: number; compare_at_price: number | null; final_price: number }[]
}

export interface ProductDetail {
  id:                number
  name:              string
  slug?:             string
  description?:      string | null
  short_description?: string | null
  images?:           ProductImage[]
  prices?:           { id: number; price: number; compare_at_price: number | null; final_price: number }[]
  variants?:         ProductVariant[]
  Category?:         { id: number; name: string; slug: string } | null
}

export const productsApi = {
  getList: (params: { limit?: number; category_id?: number; sort?: string; search?: string; outlet_ids?: number[] }) => {
    const { outlet_ids, ...rest } = params
    return get<{ rows: Product[]; count: number }>('/products', {
      ...rest,
      ...(outlet_ids?.length ? { outlet_ids: outlet_ids.join(',') } : {}),
    })
  },
  getById: (id: number) => get<ProductDetail>(`/products/${id}`),
}

// ─── Outlets ──────────────────────────────────────────────────────────────────

export interface NearbyOutlet {
  id: number
  name: string
  store_id: number
  distance_km: number
}

export interface NearbyResult {
  serviceable: boolean
  outlets: NearbyOutlet[]
}

export const outletsApi = {
  nearby: (lat: number, lng: number) =>
    get<NearbyResult>('/outlets/nearby', { lat, lng }),
}
