export interface CreateMaterialDto {
  store_id: number;
  name: string;
  value: string;
  uom_id?: number | null;
  category_id?: number | null;
  subcategory_id?: number | null;
  hsn_code?: string | null;
  price?: number | null;
  short_desc?: string | null;
  allow_inventory?: boolean;
  created_by: number;
}

export interface UpdateMaterialDto {
  name?: string;
  value?: string;
  uom_id?: number | null;
  category_id?: number | null;
  subcategory_id?: number | null;
  hsn_code?: string | null;
  price?: number | null;
  short_desc?: string | null;
  allow_inventory?: boolean;
  status?: boolean;
}
