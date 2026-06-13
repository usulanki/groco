export interface CreateProductDto {
  name: string;
  description: string;
  short_description?: string;
  category_id: number;
  store_id: number | null;
  created_by: number;
  is_stockable?: boolean;
  status?: boolean;
  is_draft?: boolean;
  outlet_ids?: number[];
  meta_title?: string;
  meta_description?: string;
  seo_tags?: string[];
  return_timeline?: number;
  return_allowed?: boolean;
  max_cart?: number | null;
  gender?: string;
  hsn_code?: string;
  tax_id?: number;
  brand_id?: number | null;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  short_description?: string;
  category_id?: number;
  outlet_ids?: number[];
  meta_title?: string;
  meta_description?: string;
  seo_tags?: string[];
  status?: boolean;
  is_draft?: boolean;
  return_timeline?: number;
  return_allowed?: boolean;
  max_cart?: number | null;
  gender?: string;
  hsn_code?: string;
  tax_id?: number;
  brand_id?: number | null;
}
