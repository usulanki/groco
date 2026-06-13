import type { DiscountType } from "../../models/discount.model";
import type { ApplicabilityType } from "../../models/discountApplicability.model";

export interface CreateDiscountDto {
  code: string;
  name?: string;
  description?: string;
  type: DiscountType;
  value: number;
  min_order_amount?: number;
  max_discount_cap?: number;
  usage_limit?: number;
  usage_per_user?: number;
  valid_from?: string;
  valid_to?: string;
  is_first_order?: boolean;
  free_shipping?: boolean;
  stackable?: boolean;
  auto_apply?: boolean;
  exclude_sale?: boolean;
  store_id: number;
  applicability?: { type: ApplicabilityType; ref_id: number }[];
}

export interface UpdateDiscountDto {
  name?: string;
  description?: string;
  value?: number;
  min_order_amount?: number;
  max_discount_cap?: number;
  usage_limit?: number;
  usage_per_user?: number;
  valid_from?: string;
  valid_to?: string;
  is_first_order?: boolean;
  free_shipping?: boolean;
  stackable?: boolean;
  auto_apply?: boolean;
  exclude_sale?: boolean;
  status?: boolean;
  applicability?: { type: ApplicabilityType; ref_id: number }[];
}
