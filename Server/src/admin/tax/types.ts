export interface CreateTaxDto {
  name: string;
  value: number;
  store_id: number;
}

export interface UpdateTaxDto {
  name?: string;
  value?: number;
  status?: boolean;
}
