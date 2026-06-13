import bcrypt from "bcryptjs";
import { User, Wishlist, Product, Order, OrderItem, Address, City, State, Cart, Payment, DiscountUsage, Discount } from "../../models/index";
import type { AppError } from "../../shared/middleware/error.middleware";
import type { CreateUserDto, CreateAddressDto } from "./types";

const SAFE_ATTRS = { exclude: ["password"] };

function generateUserCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "USR";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function uniqueUserCode(): Promise<string> {
  let attempts = 0;
  do {
    const code = generateUserCode();
    const exists = await User.findOne({ where: { code } });
    if (!exists) return code;
    attempts++;
  } while (attempts < 10);
  throw Object.assign(new Error("Failed to generate unique user code"), { statusCode: 500 });
}

export const getAllUsers = async () => {
  return User.findAll({ attributes: SAFE_ATTRS });
};

export const getUserById = async (id: string) => {
  return User.findByPk(Number(id), { attributes: SAFE_ATTRS });
};

export const createUser = async (data: CreateUserDto) => {
  const emailTaken = await User.findOne({ where: { email: data.email, is_deleted: false } });
  if (emailTaken) {
    throw Object.assign(new Error("Email is already in use"), { statusCode: 409 }) as AppError;
  }

  const hashed = await bcrypt.hash(data.password, 10);
  const code   = await uniqueUserCode();

  const user = await User.create({
    fname:    data.fname,
    lname:    data.lname,
    email:    data.email,
    password: hashed,
    phone:    data.phone ?? null,
    code,
  });

  return User.findByPk(user.id, { attributes: SAFE_ATTRS });
};

export const deleteUser = async (id: string, deletedBy: number): Promise<void> => {
  await User.update({ is_deleted: true, deleted_by: deletedBy }, { where: { id: Number(id) } });
};

export const restoreUser = async (id: string): Promise<void> => {
  const user = await User.findOne({ where: { id: Number(id), is_deleted: true } });
  if (!user) throw Object.assign(new Error("Customer not found in trash"), { statusCode: 404 });
  await user.update({ is_deleted: false });
};

export const getUserWishlist = async (id: string) => {
  return Wishlist.findAll({
    where: { user_id: Number(id), is_deleted: false },
    include: [{ model: Product }],
  });
};

export const getUserOrders = async (id: string) => {
  return Order.findAll({
    where: { user_id: Number(id) },
    include: [
      { model: OrderItem, include: [{ model: Product, attributes: ["id", "name"] }] },
    ],
    order: [["created_ts", "DESC"]],
  });
};

export const getUserAddresses = async (id: string) => {
  return Address.findAll({
    where: { user_id: Number(id) },
    include: [
      { model: City, attributes: ["id", "name"] },
      { model: State, attributes: ["id", "name"] },
    ],
  });
};

export const createUserAddress = async (id: string, data: CreateAddressDto) => {
  const address = await Address.create({
    user_id:  Number(id),
    address1: data.address1,
    address2: data.address2 ?? null,
    city_id:  data.city_id,
    state_id: data.state_id,
    pincode:  data.pincode,
  });
  return Address.findByPk(address.id, {
    include: [
      { model: City,  attributes: ["id", "name"] },
      { model: State, attributes: ["id", "name"] },
    ],
  });
};

export const getUserCart = async (id: string) => {
  return Cart.findAll({
    where: { user_id: Number(id), is_removed: false },
    include: [{ model: Product, attributes: ["id", "name", "product_code"] }],
  });
};

export const getUserPayments = async (id: string) => {
  return Payment.findAll({
    include: [{
      model: Order,
      where: { user_id: Number(id) },
      required: true,
      attributes: ["id", "order_no", "total"],
    }],
    order: [["created_ts", "DESC"]],
  });
};

export const getUserDiscountUsages = async (id: string) => {
  return DiscountUsage.findAll({
    where: { user_id: Number(id) },
    include: [{ model: Discount }],
    order: [["used_at", "DESC"]],
  });
};
