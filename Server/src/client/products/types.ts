export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
}

export interface ProductQuery {
  search?: string;
  category_id?: string;
  page?: number;
  limit?: number;
  sort?: string;
  price_min?: string;
  price_max?: string;
}
