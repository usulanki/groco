export interface CreatePaymentDto {
  orderId: string;
  method: "card" | "paypal";
}

export interface PaymentResult {
  id: string;
  status: "success" | "failed" | "pending";
}
