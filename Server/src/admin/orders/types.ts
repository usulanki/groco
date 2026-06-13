export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type PaymentMode = "cod" | "online" | "wallet" | "card" | "upi";

export interface CreateOrderItemDto {
  product_id: number;
  variant_id?: number | null;
  quantity: number;
  price: number;
  tax?: number;  // absolute tax amount for the line
}

export interface CreateOrderDto {
  user_id: number;
  address_id?: number | null;
  outlet_id?: number | null;
  auto_assign?: boolean;
  payment_mode: PaymentMode;
  payment_reference?: string | null;
  coupon_code?: string | null;
  notes?: string | null;
  items: CreateOrderItemDto[];
}

export interface ChangeOrderStatusDto {
  order_status: OrderStatus;
}
