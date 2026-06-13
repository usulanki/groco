import { z } from "zod";

export const createAdminSchema = z.object({
  fname:    z.string().min(2, "First name must be at least 2 characters"),
  lname:    z.string().min(2, "Last name must be at least 2 characters"),
  email:    z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters")
              .regex(/^[a-z0-9._]+$/, "Username may only contain lowercase letters, numbers, dots"),
  password: z.string()
              .min(8, "Password must be at least 8 characters")
              .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
              .regex(/[0-9]/, "Password must contain at least one number")
              .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  role_id:  z.number().int().positive("Please select a valid role"),
  phone:    z.string().regex(/^\+?[0-9\s\-().]{7,20}$/, "Enter a valid phone number"),
});

export type CreateAdminDto = z.infer<typeof createAdminSchema>;

export const updateAdminSchema = z.object({
  fname:     z.string().min(2, "First name must be at least 2 characters").optional(),
  lname:     z.string().min(2, "Last name must be at least 2 characters").optional(),
  email:     z.string().email("Invalid email address").optional(),
  username:  z.string().min(3, "Username must be at least 3 characters")
               .regex(/^[a-z0-9._]+$/, "Username may only contain lowercase letters, numbers, dots").optional(),
  phone:     z.string().regex(/^\+?[0-9\s\-().]{7,20}$/, "Enter a valid phone number").optional(),
  role_id:   z.number().int().positive("Please select a valid role").optional(),
  outlet_id: z.number().int().positive().nullable().optional(),
});

export type UpdateAdminDto = z.infer<typeof updateAdminSchema>;
