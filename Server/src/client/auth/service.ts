import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../../models/index";
import { env } from "../../config/env";
import appleSignin from "apple-signin-auth";
import type { RegisterDto, LoginDto, GoogleLoginDto, FacebookLoginDto, AppleLoginDto, AuthTokens, AuthUser } from "./types";
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
      const email = profile.email ?? `fb_${profile.id}@noemail.karto`;
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
  const email   = payload.email ?? `apple_${appleId}@noemail.karto`;

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
