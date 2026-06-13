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

export type RegisterDto      = z.infer<typeof registerSchema>;
export type LoginDto         = z.infer<typeof loginSchema>;
export type GoogleLoginDto   = z.infer<typeof googleLoginSchema>;
export type FacebookLoginDto = z.infer<typeof facebookLoginSchema>;
export type AppleLoginDto    = z.infer<typeof appleLoginSchema>;

export interface AuthUser {
  id: number;
  fname: string;
  lname: string;
  email: string;
}

export interface AuthTokens {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}
