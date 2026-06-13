export type PrState = 'ORDERED' | 'PARTIAL_GRN' | 'GRN_DONE' | 'CANCELLED';
export type ItemType = 'P' | 'M';

export interface PurchaseItemDto {
  type: ItemType;
  ref_id: number;
  variant_id?: number | null;
  sku?: string | null;
  qty: number;
  item_price: number;
  tax_amount?: number;
}

export interface CreatePurchaseDto {
  store_id: number;
  outlet_id?: number | null;
  vendor_id?: number | null;
  order_date?: string | null;
  created_by: number;
  items: PurchaseItemDto[];
}

export interface UpdatePurchaseDto {
  vendor_id?: number | null;
  pr_state?: PrState;
  order_date?: string | null;
  grn_date?: string | null;
  grn_by?: number | null;
  status?: boolean;
}

export interface CreateGrnDto {
  item_ids: number[];
  grn_by: number;
  outlet_id?: number | null;
}

export type SortBy    = 'created_ts' | 'order_date';
export type SortOrder = 'ASC' | 'DESC';

export interface ListPurchasesParams {
  page?: number;
  limit?: number;
  search?: string;
  pr_state?: PrState;
  item_type?: ItemType;
  vendor_id?: number;
  category_id?: number;
  subcategory_id?: number;
  sort_by?: SortBy;
  sort_order?: SortOrder;
  outlet_id?: number | null;
}
