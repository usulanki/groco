export interface CreateCategoryDto {
  name: string;
  slug: string;
  parent_id?: number;
  media_id?: number;
  store_id?: number;
  outlet_id?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  parent_id?: number | null;
  media_id?: number | null;
  store_id?: number | null;
  outlet_id?: number | null;
  status?: boolean;
}
