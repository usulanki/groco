export interface CreateCustomerGroupDto {
  code: string;
  name: string;
  store_id: number;
}

export interface UpdateCustomerGroupDto {
  name?: string;
  status?: boolean;
}
