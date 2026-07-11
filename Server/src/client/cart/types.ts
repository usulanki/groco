export interface CartItem {
  productId: string;
  quantity: number;
  variantId?: number | null;
}

export interface Cart {
  items: CartItem[];
  total: number;
}
