export type InventorySortBy    = 'saleable_qty' | 'non_saleable_qty' | 'created_ts' | 'updated_ts';
export type InventorySortOrder = 'ASC' | 'DESC';
export type InventoryItemType  = 'P' | 'M';   // P = products, M = materials

export interface ListInventoryParams {
  page?: number;
  limit?: number;
  search?: string;            // by product/material name, code, or SKU
  outlet_id?: number;
  item_type?: InventoryItemType;  // filter to products-only or materials-only
  low_stock?: boolean;            // saleable_qty <= low_stock_threshold (threshold must be set)
  no_inventory?: boolean;         // saleable_qty = 0
  sort_by?: InventorySortBy;
  sort_order?: InventorySortOrder;
}
