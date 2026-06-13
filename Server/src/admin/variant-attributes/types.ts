export interface CreateVariantAttributeDto {
  name: string;
  store_id: number;
  values?: CreateAttributeValueDto[];
}

export interface UpdateVariantAttributeDto {
  name?: string;
  status?: boolean;
}

export interface CreateAttributeValueDto {
  value: string;
  sort_order?: number;
}

export interface UpdateAttributeValueDto {
  value?: string;
  sort_order?: number;
}
