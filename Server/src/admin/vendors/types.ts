import { z } from "zod";

export const createVendorSchema = z.object({
  company_name:  z.string().min(2, "Company name must be at least 2 characters"),
  owner_name:    z.string().min(2, "Owner name must be at least 2 characters"),
  owner_email:   z.string().email("Invalid email address").optional().or(z.literal("")),
  owner_phone:   z.string().regex(/^\+?[0-9\s\-().]{7,20}$/, "Enter a valid phone number"),
  owner_address: z.string().max(500).optional(),
  gst_no:        z.string().max(20).optional(),
});

export const updateVendorSchema = createVendorSchema.partial();

export type CreateVendorDto = z.infer<typeof createVendorSchema>;
export type UpdateVendorDto = z.infer<typeof updateVendorSchema>;
