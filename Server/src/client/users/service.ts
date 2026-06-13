import { User } from "../../models/index";
import type { UserProfile, UpdateProfileDto } from "./types";

export const getProfile = async (userId: string): Promise<UserProfile | null> => {
  const user = await User.findByPk(Number(userId), {
    attributes: ["id", "fname", "lname", "email", "phone"],
  });
  if (!user) return null;
  return { id: String(user.id), fname: user.fname, lname: user.lname, email: user.email, phone: user.phone };
};

export const updateProfile = async (userId: string, data: UpdateProfileDto): Promise<UserProfile | null> => {
  const user = await User.findByPk(Number(userId));
  if (!user) return null;
  await user.update(data);
  return { id: String(user.id), fname: user.fname, lname: user.lname, email: user.email, phone: user.phone };
};
