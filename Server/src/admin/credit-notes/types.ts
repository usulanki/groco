export interface CreateCreditNoteDto {
  return_id: number;
  outlet_id: number | null;
  grn_code: string;
  purchase_code: string;
}
