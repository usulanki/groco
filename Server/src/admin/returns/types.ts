export type ReturnType      = 'PURCHASE_RETURN' | 'ORDER_RETURN';
export type ReturnSortBy    = 'created_ts' | 'cn_amount';
export type ReturnSortOrder = 'ASC' | 'DESC';

export interface ListReturnsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: ReturnType;
  sort_by?: ReturnSortBy;
  sort_order?: ReturnSortOrder;
}

export interface CreatePurchaseReturnLineItem {
  purchase_item_id: number;
  type: 'P' | 'M';
  ref_id: number;
  variant_id?: number | null;
  sku?: string | null;
  qty: number;
  item_price: number;
  amount: number;
}

export interface CreatePurchaseReturnPayload {
  grn_id: number;
  outlet_id: number;
  vendor_id: number;
  cn_amount: number;
  items: CreatePurchaseReturnLineItem[];
}
