import { Wishlist, Product, ProductPrice, Media, ProductMedia, Category } from "../../models/index";

export const getWishlist = async (userId: string) => {
  return Wishlist.findAll({
    where: { user_id: Number(userId), is_deleted: false },
    include: [
      {
        model: Product,
        attributes: ["id", "name", "slug"],
        include: [
          { model: ProductPrice, as: "prices", where: { is_deleted: false }, required: false },
          { model: Media, as: "images", through: { attributes: ["is_primary"] }, required: false },
          { model: Category, attributes: ["name"], required: false },
        ],
      },
    ],
  });
};

export const addToWishlist = async (userId: string, productId: string) => {
  const product = await Product.findOne({
    where: { id: Number(productId), is_deleted: false },
    attributes: ["id"],
  });
  if (!product) throw Object.assign(new Error("Product not found"), { statusCode: 404 });

  const existing = await Wishlist.findOne({
    where: { user_id: Number(userId), product_id: Number(productId) },
  });

  if (existing) {
    if (existing.is_deleted) {
      await existing.update({ is_deleted: false });
    }
  } else {
    await Wishlist.create({ user_id: Number(userId), product_id: Number(productId) });
  }

  return getWishlist(userId);
};

export const removeFromWishlist = async (userId: string, productId: string) => {
  await Wishlist.update(
    { is_deleted: true },
    { where: { user_id: Number(userId), product_id: Number(productId), is_deleted: false } }
  );
  return getWishlist(userId);
};
