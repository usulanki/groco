import { z } from "zod";

export const registerSchema = z.object({
  fname:    z.string().min(2, "First name must be at least 2 characters"),
  lname:    z.string().min(2, "Last name must be at least 2 characters"),
  email:    z.string().email("Invalid email address"),
  password: z.string()
              .min(8, "Password must be at least 8 characters")
              .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
              .regex(/[0-9]/, "Password must contain at least one number")
              .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  phone:    z.string().regex(/^\+?[0-9\s\-().]{7,20}$/, "Enter a valid phone number").optional(),
});

export const loginSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const googleLoginSchema = z.object({
  access_token: z.string().min(1, "Access token is required"),
});

export const facebookLoginSchema = z.object({
  access_token: z.string().min(1, "Access token is required"),
});

export const appleLoginSchema = z.object({
  id_token: z.string().min(1, "ID token is required"),
  fname: z.string().optional(),
  lname: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  email:    z.string().email("Invalid email address"),
  otp:      z.string().length(6, "OTP must be 6 digits"),
  password: z.string()
              .min(8, "Password must be at least 8 characters")
              .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
              .regex(/[0-9]/, "Password must contain at least one number")
              .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export type RegisterDto        = z.infer<typeof registerSchema>;
export type LoginDto           = z.infer<typeof loginSchema>;
export type GoogleLoginDto     = z.infer<typeof googleLoginSchema>;
export type FacebookLoginDto   = z.infer<typeof facebookLoginSchema>;
export type AppleLoginDto      = z.infer<typeof appleLoginSchema>;
export type ForgotPasswordDto  = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto   = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  fname: z.string().min(1, "First name is required").optional(),
  lname: z.string().min(1, "Last name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().regex(/^\+?[0-9\s\-().]{7,20}$/, "Enter a valid phone number").optional().nullable(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export interface AuthUser {
  id: number;
  fname: string;
  lname: string;
  email: string;
  phone?: string | null;
}

export interface AuthTokens {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}
