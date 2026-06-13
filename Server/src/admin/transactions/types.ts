export type TransactionType      = 'VENDOR' | 'CUSTOMER';
export type TransactionSortBy    = 'created_ts' | 'amount' | 'payment_date';
export type TransactionSortOrder = 'ASC' | 'DESC';

export interface ListTransactionsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: TransactionType;
  sort_by?: TransactionSortBy;
  sort_order?: TransactionSortOrder;
}
