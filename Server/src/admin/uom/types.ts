export interface CreateUomDto {
  name: string;
  short_name: string;
  store_id: number;
  created_by: number;
}

export interface UpdateUomDto {
  name?: string;
  short_name?: string;
  status?: boolean;
}
