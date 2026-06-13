export type GrnSortBy    = 'created_ts' | 'created_date';
export type GrnSortOrder = 'ASC' | 'DESC';

export interface ListGrnsParams {
  page?: number;
  limit?: number;
  search?: string;          // by GRN code or purchase code
  is_partial?: boolean;     // undefined = all, true = partial only, false = full only
  vendor_id?: number;
  sort_by?: GrnSortBy;
  sort_order?: GrnSortOrder;
  outlet_id?: number | null;
}
