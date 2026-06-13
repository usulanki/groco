import { Cart, Product, ProductPrice } from "../../models/index";
import type { CartItem as CartItemDto } from "./types";

export const getCart = async (userId: string) => {
  return Cart.findAll({
    where: { user_id: Number(userId), is_removed: false },
    include: [
      {
        model: Product,
        attributes: ["id", "name", "slug", "max_cart"],
        include: [{ model: ProductPrice, as: "prices", where: { is_deleted: false }, required: false }],
      },
    ],
  });
};

export const addToCart = async (userId: string, item: CartItemDto) => {
  const product = await Product.findOne({
    where: { id: Number(item.productId), is_deleted: false },
    attributes: ["id", "max_cart"],
  });
  if (!product) throw Object.assign(new Error("Product not found"), { statusCode: 404 });

  const existing = await Cart.findOne({
    where: { user_id: Number(userId), product_id: Number(item.productId), is_removed: false },
  });

  const currentQty = existing ? existing.quantity : 0;
  const newQty = currentQty + item.quantity;

  if (product.max_cart !== null && product.max_cart > 0 && newQty > product.max_cart) {
    throw Object.assign(
      new Error(`You can only add up to ${product.max_cart} of this item`),
      { statusCode: 400 }
    );
  }

  if (existing) {
    await existing.update({ quantity: newQty });
  } else {
    await Cart.create({
      user_id: Number(userId),
      product_id: Number(item.productId),
      quantity: item.quantity,
    });
  }
  return getCart(userId);
};

export const removeFromCart = async (userId: string, productId: string) => {
  await Cart.update(
    { is_removed: true },
    { where: { user_id: Number(userId), product_id: Number(productId), is_removed: false } }
  );
  return getCart(userId);
};

export const decrementFromCart = async (userId: string, productId: string) => {
  const existing = await Cart.findOne({
    where: { user_id: Number(userId), product_id: Number(productId), is_removed: false },
  });
  if (!existing) return getCart(userId);
  if (existing.quantity <= 1) {
    await existing.update({ is_removed: true });
  } else {
    await existing.update({ quantity: existing.quantity - 1 });
  }
  return getCart(userId);
};
