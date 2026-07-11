import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../../models/index";
import { env } from "../../config/env";
import appleSignin from "apple-signin-auth";
import { sendMail } from "../../shared/utils/mailer";
import type { RegisterDto, LoginDto, GoogleLoginDto, FacebookLoginDto, AppleLoginDto, ForgotPasswordDto, ResetPasswordDto, UpdateProfileDto, ChangePasswordDto, AuthTokens, AuthUser } from "./types";
import type { AppError } from "../../shared/middleware/error.middleware";

export const register = async (data: RegisterDto): Promise<AuthTokens> => {
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) {
    const err: AppError = Object.assign(new Error("Email already in use"), { statusCode: 409 });
    throw err;
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await User.create({
    fname: data.fname,
    lname: data.lname,
    email: data.email,
    password: hashedPassword,
    phone: data.phone ?? null,
  });

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, fname: user.fname, lname: user.lname },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "7d" }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  const authUser: AuthUser = { id: user.id, fname: user.fname, lname: user.lname, email: user.email };
  return { user: authUser, accessToken, refreshToken };
};

export const googleLogin = async (data: GoogleLoginDto): Promise<AuthTokens> => {
  // Verify access token with Google and get user profile
  const res = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${data.access_token}`);
  if (!res.ok) {
    const err: AppError = Object.assign(new Error("Invalid Google token"), { statusCode: 401 });
    throw err;
  }
  const profile = await res.json() as { sub: string; email: string; given_name: string; family_name: string; email_verified: boolean };

  // Find existing user by google_id or email
  let user = await User.findOne({ where: { google_id: profile.sub, is_deleted: false } });

  if (!user) {
    user = await User.findOne({ where: { email: profile.email, is_deleted: false } });
    if (user) {
      // Link Google account to existing email-registered user
      await user.update({ google_id: profile.sub });
    } else {
      // Create new user from Google profile
      user = await User.create({
        fname: profile.given_name,
        lname: profile.family_name,
        email: profile.email,
        google_id: profile.sub,
        password: null,
        is_email_verified: profile.email_verified ?? true,
      });
    }
  }

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, fname: user.fname, lname: user.lname },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "7d" }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  const authUser: AuthUser = { id: user.id, fname: user.fname, lname: user.lname, email: user.email };
  return { user: authUser, accessToken, refreshToken };
};

export const facebookLogin = async (data: FacebookLoginDto): Promise<AuthTokens> => {
  const res = await fetch(`https://graph.facebook.com/me?fields=id,first_name,last_name,email&access_token=${data.access_token}`);
  if (!res.ok) {
    const err: AppError = Object.assign(new Error("Invalid Facebook token"), { statusCode: 401 });
    throw err;
  }
  const profile = await res.json() as { id: string; first_name: string; last_name: string; email?: string };

  let user = await User.findOne({ where: { facebook_id: profile.id, is_deleted: false } });

  if (!user) {
    if (profile.email) {
      user = await User.findOne({ where: { email: profile.email, is_deleted: false } });
      if (user) {
        await user.update({ facebook_id: profile.id });
      }
    }
    if (!user) {
      const email = profile.email ?? `fb_${profile.id}@noemail.groco`;
      user = await User.create({
        fname: profile.first_name,
        lname: profile.last_name,
        email,
        facebook_id: profile.id,
        password: null,
        is_email_verified: !!profile.email,
      });
    }
  }

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, fname: user.fname, lname: user.lname },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "7d" }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  const authUser: AuthUser = { id: user.id, fname: user.fname, lname: user.lname, email: user.email };
  return { user: authUser, accessToken, refreshToken };
};

export const appleLogin = async (data: AppleLoginDto): Promise<AuthTokens> => {
  if (!env.APPLE_CLIENT_ID) {
    const err: AppError = Object.assign(new Error("Apple Sign In is not configured"), { statusCode: 503 });
    throw err;
  }

  let payload: { sub: string; email?: string };
  try {
    payload = await appleSignin.verifyIdToken(data.id_token, {
      audience: env.APPLE_CLIENT_ID,
      ignoreExpiration: false,
    }) as { sub: string; email?: string };
  } catch {
    const err: AppError = Object.assign(new Error("Invalid Apple token"), { statusCode: 401 });
    throw err;
  }

  const appleId = payload.sub;
  const email   = payload.email ?? `apple_${appleId}@noemail.groco`;

  let user = await User.findOne({ where: { apple_id: appleId, is_deleted: false } });

  if (!user) {
    user = await User.findOne({ where: { email: payload.email ?? '', is_deleted: false } });
    if (user) {
      await user.update({ apple_id: appleId });
    } else {
      user = await User.create({
        fname: data.fname ?? 'Apple',
        lname: data.lname ?? 'User',
        email,
        apple_id: appleId,
        password: null,
        is_email_verified: !!payload.email,
      });
    }
  }

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, fname: user.fname, lname: user.lname },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "7d" }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  const authUser: AuthUser = { id: user.id, fname: user.fname, lname: user.lname, email: user.email };
  return { user: authUser, accessToken, refreshToken };
};

export const forgotPassword = async (data: ForgotPasswordDto): Promise<void> => {
  const user = await User.findOne({ where: { email: data.email, is_deleted: false } });
  // Always respond the same way to prevent email enumeration
  if (!user) return;

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  await user.update({ otp, otp_expiry: expiry });

  await sendMail(
    data.email,
    "Groco — Password Reset OTP",
    `<p>Hi ${user.fname},</p>
     <p>Your password reset code is:</p>
     <h2 style="letter-spacing:4px">${otp}</h2>
     <p>This code expires in <strong>15 minutes</strong>. If you didn't request this, ignore this email.</p>`
  );
};

export const resetPassword = async (data: ResetPasswordDto): Promise<void> => {
  const user = await User.findOne({ where: { email: data.email, is_deleted: false } });
  const invalid: AppError = Object.assign(new Error("Invalid or expired OTP"), { statusCode: 400 });

  if (!user || !user.otp || !user.otp_expiry) throw invalid;
  if (user.otp !== data.otp) throw invalid;
  if (new Date() > user.otp_expiry) throw invalid;

  const hashed = await bcrypt.hash(data.password, 10);
  await user.update({ password: hashed, otp: null, otp_expiry: null });
};

export const getMe = async (id: number): Promise<AuthUser> => {
  const user = await User.findOne({ where: { id, is_deleted: false } });
  if (!user) {
    const err: AppError = Object.assign(new Error("User not found"), { statusCode: 404 });
    throw err;
  }
  return { id: user.id, fname: user.fname, lname: user.lname, email: user.email, phone: user.phone };
};

export const updateProfile = async (id: number, data: UpdateProfileDto): Promise<AuthUser> => {
  const user = await User.findOne({ where: { id, is_deleted: false } });
  if (!user) {
    const err: AppError = Object.assign(new Error("User not found"), { statusCode: 404 });
    throw err;
  }
  if (data.email && data.email !== user.email) {
    const taken = await User.findOne({ where: { email: data.email } });
    if (taken) {
      const err: AppError = Object.assign(new Error("Email already in use"), { statusCode: 409 });
      throw err;
    }
  }
  if (data.phone && data.phone !== user.phone) {
    const taken = await User.findOne({ where: { phone: data.phone } });
    if (taken) {
      const err: AppError = Object.assign(new Error("Phone number already in use"), { statusCode: 409 });
      throw err;
    }
  }
  await user.update({
    ...(data.fname != null && { fname: data.fname }),
    ...(data.lname != null && { lname: data.lname }),
    ...(data.email != null && { email: data.email }),
    ...(data.phone !== undefined && { phone: data.phone }),
  });
  return { id: user.id, fname: user.fname, lname: user.lname, email: user.email, phone: user.phone };
};

export const changePassword = async (id: number, data: ChangePasswordDto): Promise<void> => {
  const user = await User.findOne({ where: { id, is_deleted: false } });
  if (!user) {
    const err: AppError = Object.assign(new Error("User not found"), { statusCode: 404 });
    throw err;
  }
  if (!user.password) {
    const err: AppError = Object.assign(new Error("Password change not available for social login accounts"), { statusCode: 400 });
    throw err;
  }
  const valid = await bcrypt.compare(data.current_password, user.password);
  if (!valid) {
    const err: AppError = Object.assign(new Error("Current password is incorrect"), { statusCode: 400 });
    throw err;
  }
  const hashed = await bcrypt.hash(data.new_password, 10);
  await user.update({ password: hashed });
};

export const login = async (data: LoginDto): Promise<AuthTokens> => {
  const invalidError: AppError = Object.assign(new Error("Invalid credentials"), { statusCode: 401 });

  const user = await User.findOne({ where: { email: data.email, is_deleted: false, status: true } });
  if (!user) throw invalidError;

  if (!user.password) throw invalidError; // Google-only account
  const passwordMatch = await bcrypt.compare(data.password, user.password);
  if (!passwordMatch) throw invalidError;

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, fname: user.fname, lname: user.lname },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "7d" }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  const authUser: AuthUser = { id: user.id, fname: user.fname, lname: user.lname, email: user.email };
  return { user: authUser, accessToken, refreshToken };
};
