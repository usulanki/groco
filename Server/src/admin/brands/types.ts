import type { BrandType } from "../../models/brand.model";

export interface CreateBrandDto {
  name: string;
  slug: string;
  type: BrandType;
  store_id: number | null;
  created_by: number | null;
}

export interface UpdateBrandDto {
  name?: string;
  slug?: string;
  type?: BrandType;
  status?: boolean;
}
