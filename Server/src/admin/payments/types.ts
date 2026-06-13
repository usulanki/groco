export type PaymentType        = 'VENDOR' | 'CUSTOMER';
export type PaymentChannel     = 'ADMIN' | 'WEBSITE' | 'IOS_APP' | 'ANDROID_APP';
export type PaymentDirectionType = 'Paid' | 'Received' | 'Adjust';
export type PaymentSortBy    = 'created_ts' | 'amount' | 'payment_date';
export type PaymentSortOrder = 'ASC' | 'DESC';

export interface ListPaymentsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: PaymentType;
  vendor_id?: number;
  sort_by?: PaymentSortBy;
  sort_order?: PaymentSortOrder;
}

export interface CreateVendorPaymentDto {
  vendor_id: number;
  outlet_id?: number | null;
  amount: number;
  payment_mode: string;
  channel: PaymentChannel;
  ref_no?: string | null;
  payment_date: string;     // YYYY-MM-DD
  notes?: string | null;
  credit_note_ids?: number[];
  grn_ids?: number[];       // GRN ids selected (for reference / future use)
}
